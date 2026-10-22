import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, EmptyState, Field, InlineNotice, SectionLabel } from '@/components/ui';
import {
  changeKeys,
  createChangeRequest,
  listChangeRequests,
  type ChangeRequest,
  type ChangeRequestStatus,
} from '@/features/changes';
import { findProjectById, projectKeys } from '@/features/projects';
import { ApiError } from '@/lib/api';
import { colors, radii, spacing, typography } from '@/theme';

const statusLabels: Record<ChangeRequestStatus, string> = {
  REQUESTED: 'Diminta',
  PROPOSED: 'Ada usulan',
  ACCEPTED: 'Disetujui',
  REJECTED: 'Ditolak',
};

export default function ChangesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = Array.isArray(id) ? id[0] : id;
  const [reason, setReason] = useState('');
  const [showForm, setShowForm] = useState(false);
  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => findProjectById(projectId!),
    enabled: Boolean(projectId),
  });
  const requestsQuery = useInfiniteQuery({
    queryKey: changeKeys.list(projectId ?? ''),
    queryFn: ({ pageParam }) => listChangeRequests(projectId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(projectId),
  });
  const createMutation = useMutation({
    mutationFn: () => createChangeRequest(projectId!, {
      reason: reason.trim(),
      expectedActiveVersionId: projectQuery.data!.activeAgreementVersionId!,
    }),
    async onSuccess() {
      setReason('');
      setShowForm(false);
      await queryClient.invalidateQueries({ queryKey: changeKeys.list(projectId!) });
    },
  });
  const requests = requestsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const error = projectQuery.error ?? requestsQuery.error ?? createMutation.error;
  const errorMessage = error instanceof ApiError ? error.message : error ? 'Permintaan perubahan belum bisa dimuat.' : null;
  const canRequest = projectQuery.data?.role === 'CLIENT' && Boolean(projectQuery.data.activeAgreementVersionId);

  if (projectQuery.isPending || requestsQuery.isPending) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={styles.title}>Perubahan proyek</Text>
          <Text style={styles.description}>Catat perubahan setelah kesepakatan aktif agar versi lama dan usulannya tetap jelas.</Text>
        </View>

        {errorMessage ? <InlineNotice tone="error">{errorMessage}</InlineNotice> : null}
        {projectQuery.data?.role === 'CLIENT' && !projectQuery.data.activeAgreementVersionId ? (
          <InlineNotice>Permintaan perubahan tersedia setelah ada kesepakatan aktif.</InlineNotice>
        ) : null}

        {canRequest && !showForm ? (
          <ActionButton label="Minta perubahan" onPress={() => setShowForm(true)} />
        ) : null}
        {showForm ? (
          <Card style={styles.formCard}>
            <SectionLabel>PERMINTAAN BARU</SectionLabel>
            <Field
              error={reason.length > 0 && reason.trim().length < 3 ? 'Alasan minimal 3 karakter' : undefined}
              label="Apa yang perlu diubah?"
              multiline
              onChangeText={setReason}
              placeholder="Jelaskan perubahan ruang lingkup, nilai, atau tenggat"
              value={reason}
            />
            <ActionButton
              disabled={reason.trim().length < 3}
              label={createMutation.isPending ? 'Mengirim...' : 'Kirim permintaan'}
              loading={createMutation.isPending}
              onPress={() => createMutation.mutate()}
            />
            <ActionButton label="Batal" onPress={() => { setShowForm(false); setReason(''); }} variant="secondary" />
          </Card>
        ) : null}

        {requests.length === 0 ? (
          <EmptyState title="Belum ada perubahan" description="Permintaan perubahan proyek akan tersimpan di sini." />
        ) : (
          <View style={styles.list}>
            {requests.map((request) => (
              <ChangeCard
                key={request.id}
                onPropose={() => router.push({
                  pathname: '/(app)/projects/[id]/agreement',
                  params: { id: projectId!, changeRequestId: request.id },
                })}
                projectRole={projectQuery.data?.role}
                request={request}
              />
            ))}
          </View>
        )}

        {requestsQuery.hasNextPage ? (
          <ActionButton
            label={requestsQuery.isFetchingNextPage ? 'Memuat...' : 'Muat lainnya'}
            loading={requestsQuery.isFetchingNextPage}
            onPress={() => void requestsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function ChangeCard({
  onPropose,
  projectRole,
  request,
}: {
  onPropose: () => void;
  projectRole?: 'FREELANCER' | 'CLIENT';
  request: ChangeRequest;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <SectionLabel>PERMINTAAN PERUBAHAN</SectionLabel>
          <Text style={styles.date}>{new Date(request.createdAt).toLocaleString('id-ID')}</Text>
        </View>
        <View style={[styles.badge, badgeStyle(request.status)]}>
          <Text style={styles.badgeText}>{statusLabels[request.status]}</Text>
        </View>
      </View>
      <Text style={styles.reason}>{request.reason}</Text>
      {request.comparison ? (
        <View style={styles.comparison}>
          <SectionLabel>PERBANDINGAN USULAN</SectionLabel>
          <ComparisonRow
            label="Nilai proyek"
            before={`Rp${Number(request.comparison.amountRupiah.before).toLocaleString('id-ID')}`}
            after={`Rp${Number(request.comparison.amountRupiah.after).toLocaleString('id-ID')}`}
          />
          <ComparisonRow
            label="Deadline"
            before={request.comparison.deadline.before}
            after={request.comparison.deadline.after}
          />
        </View>
      ) : null}
      {projectRole === 'FREELANCER' && request.status === 'REQUESTED' ? (
        <ActionButton label="Buat usulan versi" onPress={onPropose} />
      ) : null}
    </Card>
  );
}

function ComparisonRow({ label, before, after }: { label: string; before: string; after: string }) {
  return (
    <View style={styles.comparisonRow}>
      <Text style={styles.comparisonLabel}>{label}</Text>
      <Text style={styles.before}>{before}</Text>
      <Text style={styles.arrow}>→</Text>
      <Text style={styles.after}>{after}</Text>
    </View>
  );
}

function badgeStyle(status: ChangeRequestStatus) {
  if (status === 'ACCEPTED') return { backgroundColor: colors.successSurface };
  if (status === 'REJECTED') return { backgroundColor: colors.dangerSurface };
  if (status === 'PROPOSED') return { backgroundColor: colors.infoSurface };
  return { backgroundColor: colors.warningSurface };
}

function LoadingState() {
  return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.description}>Memuat perubahan...</Text></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },
  heading: { gap: spacing.xs },
  title: { color: colors.ink, ...typography.title },
  description: { color: colors.textMuted, ...typography.body },
  formCard: { gap: spacing.lg },
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  date: { color: colors.textSubtle, fontSize: 11, marginTop: 4 },
  badge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: colors.inkSoft, fontSize: 10, fontWeight: '800' },
  reason: { color: colors.inkSoft, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  comparison: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md, gap: spacing.sm },
  comparisonRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  comparisonLabel: { flex: 1, color: colors.textSubtle, fontSize: 11 },
  before: { color: colors.textMuted, fontSize: 11, textDecorationLine: 'line-through' },
  arrow: { color: colors.primary, fontWeight: '800' },
  after: { color: colors.inkSoft, fontSize: 11, fontWeight: '800' },
});
