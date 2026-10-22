import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentPickerAsset } from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, EmptyState, Field, InlineNotice, SectionLabel } from '@/components/ui';
import {
  acceptDelivery,
  createDelivery,
  deliveryKeys,
  listDeliveries,
  requestDeliveryRevision,
  type Delivery,
  type DeliveryStatus,
} from '@/features/deliveries';
import { downloadProjectFile, FilePickerField, formatBytes, uploadProjectFiles } from '@/features/files';
import { findProjectById, projectKeys } from '@/features/projects';
import { ApiError } from '@/lib/api';
import { colors, radii, spacing, typography } from '@/theme';

const statusLabels: Record<DeliveryStatus, string> = {
  PENDING: 'Menunggu tinjauan',
  REVISION_REQUESTED: 'Perlu revisi',
  ACCEPTED: 'Diterima',
};

export default function DeliveriesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const projectId = Array.isArray(id) ? id[0] : id;
  const [showForm, setShowForm] = useState(false);
  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => findProjectById(projectId!),
    enabled: Boolean(projectId),
  });
  const deliveriesQuery = useInfiniteQuery({
    queryKey: deliveryKeys.list(projectId ?? ''),
    queryFn: ({ pageParam }) => listDeliveries(projectId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(projectId),
  });
  const deliveries = deliveriesQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const error = projectQuery.error ?? deliveriesQuery.error;
  const errorMessage = error instanceof ApiError ? error.message : error ? 'Penyerahan belum bisa dimuat.' : null;
  const canSubmit = projectQuery.data?.role === 'FREELANCER' && Boolean(projectQuery.data.activeAgreementVersionId);

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: deliveryKeys.list(projectId!) }),
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    ]);
  }

  if (projectQuery.isPending || deliveriesQuery.isPending) return <LoadingState />;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={styles.title}>Penyerahan hasil</Text>
          <Text style={styles.description}>Kirim hasil kerja lewat file atau tautan, lalu simpan setiap putaran revisinya.</Text>
        </View>
        {errorMessage ? <InlineNotice tone="error">{errorMessage}</InlineNotice> : null}
        {projectQuery.data?.role === 'FREELANCER' && !projectQuery.data.activeAgreementVersionId ? (
          <InlineNotice>Hasil baru bisa diserahkan setelah kesepakatan aktif.</InlineNotice>
        ) : null}
        {canSubmit && !showForm ? <ActionButton label="Kirim hasil kerja" onPress={() => setShowForm(true)} /> : null}
        {showForm ? (
          <DeliveryForm
            agreementVersionId={projectQuery.data!.activeAgreementVersionId!}
            onCancel={() => setShowForm(false)}
            onSaved={async () => { setShowForm(false); await refresh(); }}
            projectId={projectId!}
          />
        ) : null}
        {deliveries.length === 0 ? (
          <EmptyState title="Belum ada penyerahan" description="Hasil kerja yang dikirim freelancer akan muncul di sini." />
        ) : (
          <View style={styles.list}>
            {deliveries.map((delivery) => (
              <DeliveryCard
                delivery={delivery}
                key={delivery.id}
                onChanged={refresh}
                projectRole={projectQuery.data?.role}
              />
            ))}
          </View>
        )}
        {deliveriesQuery.hasNextPage ? (
          <ActionButton
            label={deliveriesQuery.isFetchingNextPage ? 'Memuat...' : 'Muat lainnya'}
            loading={deliveriesQuery.isFetchingNextPage}
            onPress={() => void deliveriesQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function DeliveryForm({
  agreementVersionId,
  onCancel,
  onSaved,
  projectId,
}: {
  agreementVersionId: string;
  onCancel: () => void;
  onSaved: () => Promise<void>;
  projectId: string;
}) {
  const [note, setNote] = useState('');
  const [linksText, setLinksText] = useState('');
  const [assets, setAssets] = useState<DocumentPickerAsset[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      const links = linksText.split('\n').map((link) => link.trim()).filter(Boolean);
      if (assets.length === 0 && links.length === 0) throw new ApiError(422, 'DELIVERY_REQUIRED', 'Pilih file atau isi minimal satu tautan');
      if (links.length > 10) throw new ApiError(422, 'TOO_MANY_LINKS', 'Maksimal 10 tautan');
      if (new Set(links).size !== links.length) throw new ApiError(422, 'DUPLICATE_LINK', 'Tautan tidak boleh duplikat');
      if (links.some((link) => {
        try { new URL(link); return false; } catch { return true; }
      })) throw new ApiError(422, 'INVALID_LINK', 'Pastikan semua tautan diawali http:// atau https://');
      const uploaded = assets.length > 0 ? (await uploadProjectFiles(projectId, assets)).data : [];
      return createDelivery(projectId, {
        agreementVersionId,
        note: note.trim(),
        fileIds: uploaded.map((file) => file.id),
        links,
      });
    },
    onSuccess: onSaved,
  });
  const error = mutation.error instanceof ApiError
    ? mutation.error.message
    : mutation.error
      ? 'Hasil kerja belum bisa dikirim.'
      : validationError;

  return (
    <Card style={styles.formCard}>
      <SectionLabel>PENYERAHAN BARU</SectionLabel>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <Field label="Catatan" multiline onChangeText={setNote} placeholder="Ringkasan hasil atau petunjuk peninjauan" value={note} />
      <Field label="Tautan hasil (satu per baris)" multiline onChangeText={(text) => { setLinksText(text); setValidationError(null); }} placeholder={'https://contoh.com/hasil\nhttps://contoh.com/demo'} value={linksText} />
      <FilePickerField assets={assets} disabled={mutation.isPending} onChange={setAssets} />
      <ActionButton label={mutation.isPending ? 'Mengunggah dan mengirim...' : 'Kirim hasil'} loading={mutation.isPending} onPress={() => { setValidationError(null); mutation.mutate(); }} />
      <ActionButton label="Batal" onPress={onCancel} variant="secondary" />
    </Card>
  );
}

function DeliveryCard({
  delivery,
  onChanged,
  projectRole,
}: {
  delivery: Delivery;
  onChanged: () => Promise<void>;
  projectRole?: 'FREELANCER' | 'CLIENT';
}) {
  const [revisionReason, setRevisionReason] = useState('');
  const [showRevision, setShowRevision] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const actionMutation = useMutation({
    mutationFn: (action: 'accept' | 'revision') => action === 'accept'
      ? acceptDelivery(delivery.id)
      : requestDeliveryRevision(delivery.id, revisionReason.trim()),
    async onSuccess() {
      setShowRevision(false);
      setRevisionReason('');
      await onChanged();
    },
  });
  const actionError = actionMutation.error instanceof ApiError
    ? actionMutation.error.message
    : actionMutation.error
      ? 'Penyerahan belum bisa diproses.'
      : null;

  async function openFile(file: Delivery['files'][number]) {
    setFileError(null);
    try {
      await downloadProjectFile(file);
    } catch (error) {
      setFileError(error instanceof ApiError ? error.message : 'File belum bisa dibuka.');
    }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View>
          <SectionLabel>PENYERAHAN</SectionLabel>
          <Text style={styles.date}>{new Date(delivery.submittedAt).toLocaleString('id-ID')}</Text>
        </View>
        <View style={[styles.badge, badgeStyle(delivery.status)]}>
          <Text style={styles.badgeText}>{statusLabels[delivery.status]}</Text>
        </View>
      </View>
      {delivery.note ? <Text style={styles.note}>{delivery.note}</Text> : null}
      {delivery.files.length > 0 ? (
        <View style={styles.attachments}>
          <Text style={styles.detailLabel}>File</Text>
          {delivery.files.map((file) => (
            <Pressable key={file.id} onPress={() => void openFile(file)} style={styles.attachmentRow}>
              <View style={styles.attachmentCopy}>
                <Text numberOfLines={1} style={styles.attachmentName}>{file.originalName}</Text>
                <Text style={styles.attachmentMeta}>{formatBytes(file.size)}</Text>
              </View>
              <Text style={styles.openText}>Buka</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {delivery.links.length > 0 ? (
        <View style={styles.attachments}>
          <Text style={styles.detailLabel}>Tautan</Text>
          {delivery.links.map((link) => (
            <Pressable key={link} onPress={() => void Linking.openURL(link)}><Text numberOfLines={1} style={styles.link}>{link}</Text></Pressable>
          ))}
        </View>
      ) : null}
      {fileError ? <InlineNotice tone="error">{fileError}</InlineNotice> : null}
      {delivery.revisionRequest ? (
        <InlineNotice tone="error">Revisi {delivery.revisionRequest.roundNumber}: {delivery.revisionRequest.reason}</InlineNotice>
      ) : null}
      {actionError ? <InlineNotice tone="error">{actionError}</InlineNotice> : null}
      {projectRole === 'CLIENT' && delivery.status === 'PENDING' ? (
        <View style={styles.actions}>
          {showRevision ? <Field label="Alasan revisi" multiline onChangeText={setRevisionReason} placeholder="Jelaskan bagian yang perlu diperbaiki" value={revisionReason} /> : null}
          <ActionButton label="Terima hasil" loading={actionMutation.isPending} onPress={() => actionMutation.mutate('accept')} />
          <ActionButton
            disabled={showRevision && revisionReason.trim().length < 3}
            label={showRevision ? 'Kirim permintaan revisi' : 'Minta revisi'}
            onPress={() => showRevision ? actionMutation.mutate('revision') : setShowRevision(true)}
            variant="secondary"
          />
        </View>
      ) : null}
    </Card>
  );
}

function badgeStyle(status: DeliveryStatus) {
  if (status === 'ACCEPTED') return { backgroundColor: colors.successSurface };
  if (status === 'REVISION_REQUESTED') return { backgroundColor: colors.dangerSurface };
  return { backgroundColor: colors.warningSurface };
}

function LoadingState() {
  return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.description}>Memuat penyerahan...</Text></SafeAreaView>;
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
  note: { color: colors.inkSoft, fontSize: 14, lineHeight: 22 },
  attachments: { gap: 7, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  detailLabel: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800' },
  attachmentRow: { borderRadius: radii.md, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  attachmentCopy: { flex: 1, gap: 2 },
  attachmentName: { color: colors.inkSoft, fontSize: 12, fontWeight: '700' },
  attachmentMeta: { color: colors.textSubtle, fontSize: 10 },
  openText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  link: { color: colors.primary, fontSize: 12, lineHeight: 18, textDecorationLine: 'underline' },
  actions: { gap: spacing.sm },
});
