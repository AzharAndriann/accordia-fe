import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmationModal } from '@/components/confirmation-modal';
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
  const [confirmCreate, setConfirmCreate] = useState(false);
  const cache = useQueryClient();
  const { user } = useAuthSession();
  const project = useQuery({ queryKey: projectKeys.detail(id), queryFn: () => findProjectById(id), enabled: !!id });
  const query = useInfiniteQuery({ queryKey: requestKeys.list(id), queryFn: ({ pageParam }) => listProjectRequests(id, pageParam), initialPageParam: undefined as string | undefined, getNextPageParam: (page) => page.nextCursor ?? undefined, enabled: !!id });
  const refresh = async () => { await Promise.all([cache.invalidateQueries({ queryKey: requestKeys.list(id) }), cache.invalidateQueries({ queryKey: projectKeys.all }), cache.invalidateQueries({ queryKey: eventKeys.all })]); };
  const create = useMutation({ mutationFn: () => createProjectRequest(id, type!, reason.trim()), onSuccess: async () => { setReason(''); setType(null); await refresh(); }, onError: refresh });
  const rows = query.data?.pages.flatMap((page) => page.data) ?? [];
  const canCancel = project.data && !['COMPLETED', 'CANCELLED'].includes(project.data.status);
  return <SafeAreaView edges={['bottom']} style={styles.safeArea}><ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
    <View style={styles.heading}>
      <Text style={styles.title}>Pembatalan dan sengketa</Text>
      <Text style={styles.intro}>Pembatalan dengan dua anggota memerlukan persetujuan pihak lain. Dana tidak dipindahkan atau dikembalikan otomatis. Untuk sengketa, usulkan solusi dan minta persetujuan pihak lain; keputusan dicatat di aktivitas proyek.</Text>
    </View>
    {project.isPending || query.isPending ? <Text>Memuat...</Text> : null}
    {query.error || project.error ? <><InlineNotice tone="error">{query.error?.message ?? project.error?.message}</InlineNotice><ActionButton label="Coba lagi" onPress={() => { void query.refetch(); void project.refetch(); }} /></> : null}
    {!type ? <>
      {canCancel ? <ActionButton label="Ajukan pembatalan proyek" variant="danger" onPress={() => setType('CANCELLATION')} /> : null}
      <ActionButton label="Catat sengketa" variant="secondary" onPress={() => setType('DISPUTE')} />
    </> : <Card>
      <View style={styles.cardContent}><Text style={styles.cardTitle}>{type === 'CANCELLATION' ? 'Alasan pembatalan' : 'Masalah yang perlu diselesaikan'}</Text>
        <Field label="Alasan" multiline value={reason} onChangeText={setReason} maxLength={5000} placeholder="Minimal 10 karakter" />
        {create.error ? <InlineNotice tone="error">{create.error.message}</InlineNotice> : null}
        <ActionButton label="Kirim permintaan" loading={create.isPending} disabled={reason.trim().length < 10} onPress={() => setConfirmCreate(true)} />
        <ActionButton label="Batal" variant="secondary" disabled={create.isPending} onPress={() => setType(null)} />
      </View></Card>}
    {!query.isPending && !query.isError && !rows.length ? <EmptyState title="Belum ada permintaan" description="Pembatalan dan solusi sengketa akan tercatat di sini." /> : null}
    {rows.map((row) => <RequestCard key={row.id} row={row} userId={user?.id ?? ''} refresh={refresh} />)}
    {query.hasNextPage ? <ActionButton label="Muat sebelumnya" loading={query.isFetchingNextPage} variant="secondary" onPress={() => void query.fetchNextPage()} /> : null}
  </ScrollView>
    <ConfirmationModal
      confirmLabel="Kirim"
      description="Alasan akan tersimpan pada proyek. Pembatalan draft tanpa klien akan langsung membatalkan proyek."
      onCancel={() => setConfirmCreate(false)}
      onConfirm={() => { setConfirmCreate(false); create.mutate(); }}
      title="Kirim permintaan?"
      visible={confirmCreate}
    />
  </SafeAreaView>;
}
function RequestCard({ row, userId, refresh }: { row: ProjectRequest; userId: string; refresh: () => Promise<void> }) {
  const [reason, setReason] = useState('');
  const [pendingAction, setPendingAction] = useState<RequestAction | null>(null);
  const mutation = useMutation({ mutationFn: (action: RequestAction) => respondProjectRequest(row, action, reason.trim()), onSuccess: async () => { setReason(''); await refresh(); }, onError: refresh });
  const pending = ['OPEN', 'PROPOSED'].includes(row.status);
  const participant = [row.requestedById, row.respondentId].includes(userId);
  const author = row.type === 'CANCELLATION' ? row.requestedById : row.proposedById;
  const canDecide = participant && author && author !== userId && (row.type === 'CANCELLATION' || row.status === 'PROPOSED');
  const act = (action: RequestAction) => setPendingAction(action);
  const confirmCopy = requestConfirmationCopy(pendingAction);
  return <><Card><View style={styles.cardContent}>
    <Text style={styles.requestTitle}>{row.type === 'CANCELLATION' ? 'Pembatalan proyek' : 'Sengketa'}</Text>
    <Text style={styles.requestMeta}>{statusLabels[row.status]} · {new Date(row.createdAt).toLocaleString('id-ID')}</Text>
    <Text style={styles.requestReason}>{row.reason}</Text>
    {row.resolution ? <Text style={styles.requestReason}>Usulan solusi: {row.resolution}</Text> : null}
    {row.responseReason ? <Text style={styles.requestReason}>Tanggapan: {row.responseReason}</Text> : null}
    {mutation.error ? <InlineNotice tone="error">{mutation.error.message}</InlineNotice> : null}
    {pending && participant ? <>
      <Field label={row.type === 'DISPUTE' ? 'Usulan solusi / alasan penolakan' : 'Alasan penolakan'} multiline value={reason} onChangeText={setReason} maxLength={5000} />
      {row.type === 'DISPUTE' ? <ActionButton label="Ajukan solusi" disabled={mutation.isPending || reason.trim().length < 10} onPress={() => act('propose')} /> : null}
      {canDecide ? <><ActionButton label={row.type === 'CANCELLATION' ? 'Setujui pembatalan' : 'Setujui solusi'} loading={mutation.isPending} onPress={() => act('approve')} /><ActionButton label="Tolak" variant="danger" disabled={mutation.isPending || reason.trim().length < 3} onPress={() => act('reject')} /></> : null}
      {row.requestedById === userId ? <ActionButton label="Tarik permintaan" variant="secondary" disabled={mutation.isPending} onPress={() => act('withdraw')} /> : null}
    </> : null}
  </View></Card>
    <ConfirmationModal
      confirmLabel={confirmCopy.label}
      description={confirmCopy.description}
      onCancel={() => setPendingAction(null)}
      onConfirm={() => {
        if (!pendingAction) return;
        const action = pendingAction;
        setPendingAction(null);
        mutation.mutate(action);
      }}
      title={confirmCopy.title}
      tone={pendingAction === 'reject' ? 'danger' : 'primary'}
      visible={pendingAction !== null}
    />
  </>;
}

function requestConfirmationCopy(action: RequestAction | null) {
  if (action === 'approve') return { title: 'Setujui permintaan?', description: 'Pastikan kamu sudah membaca seluruh usulan. Keputusan ini akan dicatat di aktivitas proyek.', label: 'Setujui' };
  if (action === 'reject') return { title: 'Tolak permintaan?', description: 'Alasan penolakan dan keputusanmu akan dicatat di aktivitas proyek.', label: 'Tolak' };
  if (action === 'withdraw') return { title: 'Tarik permintaan?', description: 'Permintaan akan ditutup dan tidak dapat ditanggapi lagi.', label: 'Tarik' };
  return { title: 'Ajukan solusi?', description: 'Solusi akan dikirim kepada pihak lain untuk ditinjau dan disetujui.', label: 'Ajukan' };
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48, gap: 16 },
  heading: { gap: 8 },
  title: { color: colors.ink, fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  intro: { color: colors.text, fontSize: 14, lineHeight: 22 },
  cardContent: { gap: 12 },
  cardTitle: { color: colors.inkSoft, fontSize: 16, fontWeight: '800' },
  requestTitle: { color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: '800' },
  requestMeta: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  requestReason: { color: colors.text, fontSize: 14, lineHeight: 21 },
});
