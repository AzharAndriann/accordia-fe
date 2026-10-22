import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, EmptyState, Field, InlineNotice, SectionLabel } from '@/components/ui';
import { downloadProjectFile, FilePickerField, formatBytes, uploadProjectFiles } from '@/features/files';
import {
  confirmPayment,
  createPayment,
  listPayments,
  paymentKeys,
  rejectPayment,
  type Payment,
  type PaymentStatus,
  type PaymentSummary,
} from '@/features/payments';
import { findProjectById, projectKeys } from '@/features/projects';
import { ApiError } from '@/lib/api';
import { colors, radii, spacing, typography } from '@/theme';

const statusLabels: Record<PaymentStatus, string> = {
  PENDING: 'Menunggu konfirmasi',
  CONFIRMED: 'Terkonfirmasi',
  REJECTED: 'Ditolak',
};

export default function PaymentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const projectId = Array.isArray(id) ? id[0] : id;
  const [showForm, setShowForm] = useState(false);
  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => findProjectById(projectId!),
    enabled: Boolean(projectId),
  });
  const paymentsQuery = useInfiniteQuery({
    queryKey: paymentKeys.list(projectId ?? ''),
    queryFn: ({ pageParam }) => listPayments(projectId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(projectId),
  });
  const payments = paymentsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const summary = paymentsQuery.data?.pages[0]?.paymentSummary;
  const error = projectQuery.error ?? paymentsQuery.error;
  const errorMessage = error instanceof ApiError ? error.message : error ? 'Pembayaran belum bisa dimuat.' : null;
  const canPay = projectQuery.data?.role === 'CLIENT'
    && Boolean(projectQuery.data.activeAgreementVersionId)
    && projectQuery.data.status !== 'DRAFT'
    && projectQuery.data.status !== 'CANCELLED';

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: paymentKeys.list(projectId!) }),
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    ]);
  }

  if (projectQuery.isPending || paymentsQuery.isPending) return <LoadingState />;

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <Text style={styles.title}>Pembayaran</Text>
          <Text style={styles.description}>Catat pembayaran bertahap dan pastikan setiap bukti telah dikonfirmasi.</Text>
        </View>
        {summary ? <PaymentSummaryCard summary={summary} /> : null}
        {errorMessage ? <InlineNotice tone="error">{errorMessage}</InlineNotice> : null}
        {projectQuery.data?.role === 'CLIENT' && !canPay ? (
          <InlineNotice>Pembayaran tersedia setelah kesepakatan aktif dan proyek berjalan.</InlineNotice>
        ) : null}
        {canPay && !showForm ? <ActionButton label="Catat pembayaran" onPress={() => setShowForm(true)} /> : null}
        {showForm ? (
          <PaymentForm
            onCancel={() => setShowForm(false)}
            onSaved={async () => { setShowForm(false); await refresh(); }}
            projectId={projectId!}
          />
        ) : null}
        {payments.length === 0 ? (
          <EmptyState title="Belum ada pembayaran" description="Bukti pembayaran dan status konfirmasinya akan muncul di sini." />
        ) : (
          <View style={styles.list}>
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                onChanged={refresh}
                payment={payment}
                projectRole={projectQuery.data?.role}
              />
            ))}
          </View>
        )}
        {paymentsQuery.hasNextPage ? (
          <ActionButton
            label={paymentsQuery.isFetchingNextPage ? 'Memuat...' : 'Muat lainnya'}
            loading={paymentsQuery.isFetchingNextPage}
            onPress={() => void paymentsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function PaymentSummaryCard({ summary }: { summary: PaymentSummary }) {
  return (
    <Card style={[styles.summaryCard, summary.isPaid ? styles.summaryPaid : null]}>
      <View style={styles.summaryHeader}>
        <SectionLabel>RINGKASAN PEMBAYARAN</SectionLabel>
        <Text style={[styles.paidLabel, summary.isPaid ? styles.paidLabelDone : null]}>
          {summary.isPaid ? 'Lunas' : 'Berjalan'}
        </Text>
      </View>
      <View style={styles.summaryGrid}>
        <SummaryItem label="Nilai proyek" value={rupiah(summary.agreementAmountRupiah)} />
        <SummaryItem label="Terkonfirmasi" value={rupiah(summary.confirmedTotalRupiah)} />
        <SummaryItem label="Sisa" value={rupiah(summary.remainingRupiah)} />
        <SummaryItem label="Kelebihan" value={rupiah(summary.overpaymentRupiah)} />
      </View>
      {summary.isOverpaid ? <InlineNotice>Pembayaran melebihi nilai kesepakatan.</InlineNotice> : null}
    </Card>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return <View style={styles.summaryItem}><Text style={styles.summaryItemLabel}>{label}</Text><Text style={styles.summaryItemValue}>{value}</Text></View>;
}

function PaymentForm({
  onCancel,
  onSaved,
  projectId,
}: {
  onCancel: () => void;
  onSaved: () => Promise<void>;
  projectId: string;
}) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [assets, setAssets] = useState<DocumentPickerAsset[]>([]);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!/^\d{1,18}$/.test(amount) || BigInt(amount) <= 0n) {
        throw new ApiError(422, 'INVALID_AMOUNT', 'Nominal harus lebih dari nol dan maksimal 18 digit');
      }
      if (assets.length === 0) throw new ApiError(422, 'FILE_REQUIRED', 'Bukti pembayaran wajib dipilih');
      const files = (await uploadProjectFiles(projectId, assets)).data;
      return createPayment(projectId, {
        amountRupiah: BigInt(amount).toString(),
        fileIds: files.map((file) => file.id),
        note: note.trim(),
      });
    },
    onSuccess: onSaved,
  });
  const error = mutation.error instanceof ApiError
    ? mutation.error.message
    : mutation.error
      ? 'Pembayaran belum bisa dicatat.'
      : null;

  return (
    <Card style={styles.formCard}>
      <SectionLabel>PEMBAYARAN BARU</SectionLabel>
      {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
      <Field inputMode="numeric" label="Nominal (Rupiah)" onChangeText={(text) => setAmount(text.replace(/\D/g, '').slice(0, 18))} placeholder="1000000" value={amount} />
      <Field label="Catatan" multiline onChangeText={setNote} placeholder="Contoh: Termin pertama" value={note} />
      <FilePickerField assets={assets} disabled={mutation.isPending} label="Bukti pembayaran" onChange={setAssets} />
      <ActionButton label={mutation.isPending ? 'Mengunggah bukti...' : 'Kirim pembayaran'} loading={mutation.isPending} onPress={() => mutation.mutate()} />
      <ActionButton label="Batal" onPress={onCancel} variant="secondary" />
    </Card>
  );
}

function PaymentCard({
  onChanged,
  payment,
  projectRole,
}: {
  onChanged: () => Promise<void>;
  payment: Payment;
  projectRole?: 'FREELANCER' | 'CLIENT';
}) {
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const actionMutation = useMutation({
    mutationFn: (action: 'confirm' | 'reject') => action === 'confirm'
      ? confirmPayment(payment.id)
      : rejectPayment(payment.id, rejectReason.trim()),
    async onSuccess() {
      setShowReject(false);
      setRejectReason('');
      await onChanged();
    },
  });
  const actionError = actionMutation.error instanceof ApiError
    ? actionMutation.error.message
    : actionMutation.error
      ? 'Pembayaran belum bisa diproses.'
      : null;

  async function openFile(file: Payment['files'][number]) {
    setFileError(null);
    try { await downloadProjectFile(file); }
    catch (error) { setFileError(error instanceof ApiError ? error.message : 'Bukti belum bisa dibuka.'); }
  }

  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.amountCopy}>
          <SectionLabel>PEMBAYARAN</SectionLabel>
          <Text style={styles.amount}>{rupiah(payment.amountRupiah)}</Text>
          <Text style={styles.date}>{new Date(payment.createdAt).toLocaleString('id-ID')}</Text>
        </View>
        <View style={[styles.badge, badgeStyle(payment.status)]}>
          <Text style={styles.badgeText}>{statusLabels[payment.status]}</Text>
        </View>
      </View>
      {payment.note ? <Text style={styles.note}>{payment.note}</Text> : null}
      <View style={styles.files}>
        <Text style={styles.fileLabel}>Bukti pembayaran</Text>
        {payment.files.map((file) => (
          <Pressable key={file.id} onPress={() => void openFile(file)} style={styles.fileRow}>
            <View style={styles.fileCopy}>
              <Text numberOfLines={1} style={styles.fileName}>{file.originalName}</Text>
              <Text style={styles.fileMeta}>{formatBytes(file.size)}</Text>
            </View>
            <Text style={styles.openText}>Buka</Text>
          </Pressable>
        ))}
      </View>
      {payment.rejectionReason ? <InlineNotice tone="error">Alasan ditolak: {payment.rejectionReason}</InlineNotice> : null}
      {fileError ? <InlineNotice tone="error">{fileError}</InlineNotice> : null}
      {actionError ? <InlineNotice tone="error">{actionError}</InlineNotice> : null}
      {projectRole === 'FREELANCER' && payment.status === 'PENDING' ? (
        <View style={styles.actions}>
          {showReject ? <Field label="Alasan penolakan" multiline onChangeText={setRejectReason} placeholder="Jelaskan masalah pada pembayaran" value={rejectReason} /> : null}
          <ActionButton label="Konfirmasi pembayaran" loading={actionMutation.isPending} onPress={() => actionMutation.mutate('confirm')} />
          <ActionButton
            disabled={showReject && rejectReason.trim().length < 3}
            label={showReject ? 'Kirim penolakan' : 'Tolak pembayaran'}
            onPress={() => showReject ? actionMutation.mutate('reject') : setShowReject(true)}
            variant="danger"
          />
        </View>
      ) : null}
    </Card>
  );
}

function rupiah(value: string) {
  return `Rp${BigInt(value).toLocaleString('id-ID')}`;
}

function badgeStyle(status: PaymentStatus) {
  if (status === 'CONFIRMED') return { backgroundColor: colors.successSurface };
  if (status === 'REJECTED') return { backgroundColor: colors.dangerSurface };
  return { backgroundColor: colors.warningSurface };
}

function LoadingState() {
  return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.description}>Memuat pembayaran...</Text></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },
  heading: { gap: spacing.xs },
  title: { color: colors.ink, ...typography.title },
  description: { color: colors.textMuted, ...typography.body },
  summaryCard: { gap: spacing.md, backgroundColor: colors.primarySoft },
  summaryPaid: { backgroundColor: colors.successSurface },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  paidLabel: { color: colors.warning, fontSize: 11, fontWeight: '800' },
  paidLabelDone: { color: colors.success },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryItem: { width: '48%', gap: 3 },
  summaryItemLabel: { color: colors.textSubtle, fontSize: 10 },
  summaryItemValue: { color: colors.inkSoft, fontSize: 13, fontWeight: '800' },
  formCard: { gap: spacing.lg },
  list: { gap: spacing.md },
  card: { gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md },
  amountCopy: { flex: 1, gap: 3 },
  amount: { color: colors.inkSoft, fontSize: 21, fontWeight: '900' },
  date: { color: colors.textSubtle, fontSize: 11 },
  badge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  badgeText: { color: colors.inkSoft, fontSize: 10, fontWeight: '800' },
  note: { color: colors.text, fontSize: 13, lineHeight: 20 },
  files: { gap: 7, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  fileLabel: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800' },
  fileRow: { borderRadius: radii.md, backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  fileCopy: { flex: 1, gap: 2 },
  fileName: { color: colors.inkSoft, fontSize: 12, fontWeight: '700' },
  fileMeta: { color: colors.textSubtle, fontSize: 10 },
  openText: { color: colors.primary, fontSize: 11, fontWeight: '800' },
  actions: { gap: spacing.sm },
});
