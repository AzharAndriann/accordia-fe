import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, Card, EmptyState, Field, InlineNotice } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { createProjectRequest, listProjectRequests, requestKeys, respondProjectRequest, type ProjectRequest, type RequestAction } from '@/features/project-requests';
import { findProjectById, projectKeys } from '@/features/projects';
import { eventKeys } from '@/features/events';
import { colors } from '@/theme';

const statusLabels = { OPEN: 'Menunggu tanggapan', PROPOSED: 'Solusi diajukan', APPROVED: 'Disetujui', REJECTED: 'Ditolak', WITHDRAWN: 'Ditarik' };
export default function ProjectRequestsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [type, setType] = useState<ProjectRequest['type'] | null>(null);
  const [reason, setReason] = useState('');
  const cache = useQueryClient();
  const { user } = useAuthSession();
  const project = useQuery({ queryKey: projectKeys.detail(id), queryFn: () => findProjectById(id), enabled: !!id });
  const query = useInfiniteQuery({ queryKey: requestKeys.list(id), queryFn: ({ pageParam }) => listProjectRequests(id, pageParam), initialPageParam: undefined as string | undefined, getNextPageParam: (page) => page.nextCursor ?? undefined, enabled: !!id });
  const refresh = async () => { await Promise.all([cache.invalidateQueries({ queryKey: requestKeys.list(id) }), cache.invalidateQueries({ queryKey: projectKeys.all }), cache.invalidateQueries({ queryKey: eventKeys.all })]); };
  const create = useMutation({ mutationFn: () => createProjectRequest(id, type!, reason.trim()), onSuccess: async () => { setReason(''); setType(null); await refresh(); }, onError: refresh });
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  const canCancel = project.data && !['COMPLETED', 'CANCELLED'].includes(project.data.status);
  return <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 24, gap: 16 }} keyboardShouldPersistTaps="handled">
    <Text style={{ fontSize: 26, fontWeight: '700' }}>Pembatalan dan sengketa</Text>
    <Text>Pembatalan dengan dua anggota memerlukan persetujuan pihak lain. Dana tidak dipindahkan atau dikembalikan otomatis. Untuk sengketa, usulkan solusi dan minta persetujuan pihak lain; keputusan dicatat di aktivitas proyek.</Text>
    {project.isPending || query.isPending ? <Text>Memuat...</Text> : null}
    {query.error || project.error ? <><InlineNotice tone="error">{query.error?.message ?? project.error?.message}</InlineNotice><ActionButton label="Coba lagi" onPress={() => { void query.refetch(); void project.refetch(); }} /></> : null}
    {!type ? <>
      {canCancel ? <ActionButton label="Ajukan pembatalan proyek" variant="danger" onPress={() => setType('CANCELLATION')} /> : null}
      <ActionButton label="Catat sengketa" variant="secondary" onPress={() => setType('DISPUTE')} />
    </> : <Card>
      <View style={{ gap: 12 }}><Text>{type === 'CANCELLATION' ? 'Alasan pembatalan' : 'Masalah yang perlu diselesaikan'}</Text>
        <Field label="Alasan" multiline value={reason} onChangeText={setReason} maxLength={5000} placeholder="Minimal 10 karakter" />
        {create.error ? <InlineNotice tone="error">{create.error.message}</InlineNotice> : null}
        <ActionButton label="Kirim permintaan" loading={create.isPending} disabled={reason.trim().length < 10} onPress={() => Alert.alert('Kirim permintaan?', 'Alasan akan tersimpan pada proyek. Pembatalan draft tanpa klien langsung membatalkan proyek.', [{ text: 'Kembali', style: 'cancel' }, { text: 'Kirim', onPress: () => create.mutate() }])} />
        <ActionButton label="Batal" variant="secondary" disabled={create.isPending} onPress={() => setType(null)} />
      </View></Card>}
    {!query.isPending && !query.isError && !rows.length ? <EmptyState title="Belum ada permintaan" description="Pembatalan dan solusi sengketa akan tercatat di sini." /> : null}
    {rows.map((row) => <RequestCard key={row.id} row={row} userId={user?.id ?? ''} refresh={refresh} />)}
    {query.hasNextPage ? <ActionButton label="Muat sebelumnya" loading={query.isFetchingNextPage} variant="secondary" onPress={() => void query.fetchNextPage()} /> : null}
  </ScrollView></SafeAreaView>;
}
function RequestCard({ row, userId, refresh }: { row: ProjectRequest; userId: string; refresh: () => Promise<void> }) {
  const [reason, setReason] = useState('');
  const mutation = useMutation({ mutationFn: (action: RequestAction) => respondProjectRequest(row, action, reason.trim()), onSuccess: async () => { setReason(''); await refresh(); }, onError: refresh });
  const pending = ['OPEN', 'PROPOSED'].includes(row.status);
  const participant = [row.requestedById, row.respondentId].includes(userId);
  const author = row.type === 'CANCELLATION' ? row.requestedById : row.proposedById;
  const canDecide = participant && author && author !== userId && (row.type === 'CANCELLATION' || row.status === 'PROPOSED');
  const act = (action: RequestAction) => Alert.alert('Konfirmasi keputusan', action === 'approve' ? 'Pastikan kamu sudah membaca seluruh usulan. Keputusan ini akan dicatat.' : 'Tanggapan akan dicatat dalam aktivitas proyek.', [{ text: 'Kembali', style: 'cancel' }, { text: 'Lanjutkan', onPress: () => mutation.mutate(action) }]);
  return <Card><View style={{ gap: 12 }}>
    <Text style={{ fontSize: 19, fontWeight: '700' }}>{row.type === 'CANCELLATION' ? 'Pembatalan proyek' : 'Sengketa'}</Text>
    <Text>{statusLabels[row.status]} · {new Date(row.createdAt).toLocaleString('id-ID')}</Text>
    <Text>{row.reason}</Text>
    {row.resolution ? <Text>Usulan solusi: {row.resolution}</Text> : null}
    {row.responseReason ? <Text>Tanggapan: {row.responseReason}</Text> : null}
    {mutation.error ? <InlineNotice tone="error">{mutation.error.message}</InlineNotice> : null}
    {pending && participant ? <>
      <Field label={row.type === 'DISPUTE' ? 'Usulan solusi / alasan penolakan' : 'Alasan penolakan'} multiline value={reason} onChangeText={setReason} maxLength={5000} />
      {row.type === 'DISPUTE' ? <ActionButton label="Ajukan solusi" disabled={mutation.isPending || reason.trim().length < 10} onPress={() => act('propose')} /> : null}
      {canDecide ? <><ActionButton label={row.type === 'CANCELLATION' ? 'Setujui pembatalan' : 'Setujui solusi'} loading={mutation.isPending} onPress={() => act('approve')} /><ActionButton label="Tolak" variant="danger" disabled={mutation.isPending || reason.trim().length < 3} onPress={() => act('reject')} /></> : null}
      {row.requestedById === userId ? <ActionButton label="Tarik permintaan" variant="secondary" disabled={mutation.isPending} onPress={() => act('withdraw')} /> : null}
    </> : null}
  </View></Card>;
}
