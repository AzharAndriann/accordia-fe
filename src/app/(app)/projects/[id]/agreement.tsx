import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, EmptyState, Field, InlineNotice, SectionLabel } from '@/components/ui';
import {
  agreementFormSchema,
  agreementKeys,
  approveAgreementVersion,
  createAgreementVersion,
  listAgreementVersions,
  rejectAgreementVersion,
  submitAgreementVersion,
  updateAgreementVersion,
  type AgreementFormValues,
  type AgreementSnapshot,
  type AgreementStatus,
  type AgreementVersion,
} from '@/features/agreements';
import { findProjectById, projectKeys } from '@/features/projects';
import { ApiError } from '@/lib/api';
import { colors, radii, spacing, typography } from '@/theme';

const emptyForm: AgreementFormValues = {
  scope: '',
  deliverablesText: '',
  amountRupiah: '',
  deadline: '',
  revisionLimit: '0',
  cancellationTerms: '',
  ipTerms: '',
};

const statusLabel: Record<AgreementStatus, string> = {
  DRAFT: 'Draft',
  PENDING: 'Menunggu persetujuan',
  ACCEPTED: 'Disepakati',
  REJECTED: 'Ditolak',
  WITHDRAWN: 'Ditarik',
};

export default function AgreementScreen() {
  const params = useLocalSearchParams<{ id: string; changeRequestId?: string }>();
  const projectId = Array.isArray(params.id) ? params.id[0] : params.id;
  const changeRequestId = Array.isArray(params.changeRequestId)
    ? params.changeRequestId[0]
    : params.changeRequestId;
  const queryClient = useQueryClient();
  const [formMode, setFormMode] = useState<'closed' | 'create' | 'edit'>(changeRequestId ? 'create' : 'closed');
  const [editing, setEditing] = useState<AgreementVersion | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const projectQuery = useQuery({
    queryKey: projectKeys.detail(projectId ?? ''),
    queryFn: () => findProjectById(projectId!),
    enabled: Boolean(projectId),
  });
  const versionsQuery = useInfiniteQuery({
    queryKey: agreementKeys.list(projectId ?? ''),
    queryFn: ({ pageParam }) => listAgreementVersions(projectId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(projectId),
  });
  const versions = versionsQuery.data?.pages.flatMap((page) => page.data) ?? [];

  async function refresh() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: agreementKeys.list(projectId!) }),
      queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    ]);
  }

  const actionMutation = useMutation({
    mutationFn: async (action: { type: 'submit' | 'approve' | 'reject'; version: AgreementVersion }) => {
      if (action.type === 'submit') {
        return submitAgreementVersion(action.version.id, projectQuery.data?.activeAgreementVersionId ?? null);
      }
      if (action.type === 'approve') {
        return approveAgreementVersion(action.version.id, action.version.contentHash);
      }
      return rejectAgreementVersion(action.version.id, rejectReason.trim());
    },
    async onSuccess() {
      setRejectingId(null);
      setRejectReason('');
      await refresh();
    },
  });

  const error = versionsQuery.error ?? projectQuery.error ?? actionMutation.error;
  const errorMessage = error instanceof ApiError ? error.message : error ? 'Data kesepakatan belum bisa diproses.' : null;

  if (versionsQuery.isPending || projectQuery.isPending) {
    return <LoadingState />;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.heading}>
          <View style={styles.headingCopy}>
            <Text style={styles.title}>Kesepakatan</Text>
            <Text style={styles.description}>Setiap perubahan tersimpan sebagai versi yang bisa ditinjau kedua pihak.</Text>
          </View>
        </View>

        {projectQuery.data?.role === 'FREELANCER' && formMode === 'closed' ? (
          <ActionButton
            label="Buat draft kesepakatan"
            onPress={() => {
              setEditing(null);
              setFormMode('create');
            }}
          />
        ) : null}

        {changeRequestId && formMode === 'create' ? (
          <InlineNotice>Draft ini akan diajukan sebagai jawaban untuk permintaan perubahan.</InlineNotice>
        ) : null}
        {errorMessage ? <InlineNotice tone="error">{errorMessage}</InlineNotice> : null}

        {formMode !== 'closed' ? (
          <AgreementForm
            changeRequestId={changeRequestId}
            initialAgreement={editing}
            onCancel={() => { setEditing(null); setFormMode('closed'); }}
            onSaved={async () => {
              setEditing(null);
              setFormMode('closed');
              await refresh();
            }}
            projectId={projectId!}
          />
        ) : null}

        {versions.length === 0 && formMode === 'closed' ? (
          <EmptyState
            title="Belum ada kesepakatan"
            description={projectQuery.data?.role === 'FREELANCER'
              ? 'Buat draft pertama untuk mulai menyusun ruang lingkup proyek.'
              : 'Freelancer belum mengirimkan draft kesepakatan.'}
          />
        ) : (
          <View style={styles.list}>
            {versions.map((version) => (
              <AgreementCard
                actionPending={actionMutation.isPending}
                key={version.id}
                onApprove={() => actionMutation.mutate({ type: 'approve', version })}
                onEdit={() => { setEditing(version); setFormMode('edit'); }}
                onReject={() => {
                  if (rejectingId === version.id) {
                    actionMutation.mutate({ type: 'reject', version });
                  } else {
                    setRejectingId(version.id);
                    setRejectReason('');
                  }
                }}
                onSubmit={() => actionMutation.mutate({ type: 'submit', version })}
                projectRole={projectQuery.data?.role}
                rejectReason={rejectingId === version.id ? rejectReason : null}
                setRejectReason={setRejectReason}
                version={version}
              />
            ))}
          </View>
        )}

        {versionsQuery.hasNextPage ? (
          <ActionButton
            label={versionsQuery.isFetchingNextPage ? 'Memuat...' : 'Muat versi sebelumnya'}
            loading={versionsQuery.isFetchingNextPage}
            onPress={() => void versionsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function AgreementForm({
  changeRequestId,
  initialAgreement,
  onCancel,
  onSaved,
  projectId,
}: {
  changeRequestId?: string;
  initialAgreement: AgreementVersion | null;
  onCancel: () => void;
  onSaved: () => Promise<void>;
  projectId: string;
}) {
  const initialValues = useMemo<AgreementFormValues>(() => initialAgreement ? {
    scope: initialAgreement.scope,
    deliverablesText: initialAgreement.deliverables.join('\n'),
    amountRupiah: initialAgreement.amountRupiah,
    deadline: initialAgreement.deadline,
    revisionLimit: String(initialAgreement.revisionLimit),
    cancellationTerms: initialAgreement.cancellationTerms,
    ipTerms: initialAgreement.ipTerms,
  } : emptyForm, [initialAgreement]);
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const mutation = useMutation({
    mutationFn: (snapshot: AgreementSnapshot) => initialAgreement
      ? updateAgreementVersion(initialAgreement.id, snapshot)
      : createAgreementVersion(projectId, { ...snapshot, ...(changeRequestId ? { changeRequestId } : {}) }),
    onSuccess: onSaved,
  });

  function setField(field: keyof AgreementFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  }

  function submit() {
    const parsed = agreementFormSchema.safeParse(values);
    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const field = String(issue.path[0] ?? 'form');
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      return;
    }
    mutation.mutate({
      scope: parsed.data.scope.trim(),
      deliverables: parsed.data.deliverablesText.split('\n').map((item) => item.trim()).filter(Boolean),
      amountRupiah: BigInt(parsed.data.amountRupiah).toString(),
      deadline: parsed.data.deadline,
      revisionLimit: Number(parsed.data.revisionLimit),
      cancellationTerms: parsed.data.cancellationTerms.trim(),
      ipTerms: parsed.data.ipTerms.trim(),
    });
  }

  const mutationError = mutation.error instanceof ApiError
    ? mutation.error.message
    : mutation.error
      ? 'Draft belum bisa disimpan.'
      : null;

  return (
    <Card style={styles.formCard}>
      <SectionLabel>{initialAgreement ? `EDIT VERSI ${initialAgreement.versionNumber}` : 'DRAFT BARU'}</SectionLabel>
      {mutationError ? <InlineNotice tone="error">{mutationError}</InlineNotice> : null}
      <Field error={errors.scope} label="Ruang lingkup" multiline onChangeText={(text) => setField('scope', text)} placeholder="Jelaskan pekerjaan yang disepakati" value={values.scope} />
      <Field error={errors.deliverablesText} label="Hasil kerja (satu per baris)" multiline onChangeText={(text) => setField('deliverablesText', text)} placeholder={'Desain halaman utama\nFile sumber'} value={values.deliverablesText} />
      <Field error={errors.amountRupiah} inputMode="numeric" label="Nilai proyek (Rupiah)" onChangeText={(text) => setField('amountRupiah', text.replace(/\D/g, ''))} placeholder="5000000" value={values.amountRupiah} />
      <View style={styles.twoColumns}>
        <Field error={errors.deadline} label="Deadline" onChangeText={(text) => setField('deadline', text)} placeholder="2026-12-31" value={values.deadline} />
        <Field error={errors.revisionLimit} inputMode="numeric" label="Batas revisi" onChangeText={(text) => setField('revisionLimit', text.replace(/\D/g, ''))} placeholder="2" value={values.revisionLimit} />
      </View>
      <Field error={errors.cancellationTerms} label="Ketentuan pembatalan" multiline onChangeText={(text) => setField('cancellationTerms', text)} placeholder="Jelaskan ketentuan pembatalan proyek" value={values.cancellationTerms} />
      <Field error={errors.ipTerms} label="Hak karya" multiline onChangeText={(text) => setField('ipTerms', text)} placeholder="Jelaskan kepemilikan hasil kerja" value={values.ipTerms} />
      <ActionButton label={mutation.isPending ? 'Menyimpan...' : 'Simpan draft'} loading={mutation.isPending} onPress={submit} />
      <ActionButton label="Batal" onPress={onCancel} variant="secondary" />
    </Card>
  );
}

function AgreementCard({
  actionPending,
  onApprove,
  onEdit,
  onReject,
  onSubmit,
  projectRole,
  rejectReason,
  setRejectReason,
  version,
}: {
  actionPending: boolean;
  onApprove: () => void;
  onEdit: () => void;
  onReject: () => void;
  onSubmit: () => void;
  projectRole?: 'FREELANCER' | 'CLIENT';
  rejectReason: string | null;
  setRejectReason: (reason: string) => void;
  version: AgreementVersion;
}) {
  return (
    <Card style={styles.versionCard}>
      <View style={styles.versionTop}>
        <View>
          <SectionLabel>VERSI {version.versionNumber}</SectionLabel>
          <Text style={styles.versionDate}>{new Date(version.createdAt).toLocaleDateString('id-ID')}</Text>
        </View>
        <View style={[styles.statusBadge, statusStyle(version.status)]}>
          <Text style={styles.statusText}>{statusLabel[version.status]}</Text>
        </View>
      </View>
      <Text style={styles.scope}>{version.scope}</Text>
      <View style={styles.summaryGrid}>
        <Summary label="Nilai" value={`Rp${Number(version.amountRupiah).toLocaleString('id-ID')}`} />
        <Summary label="Deadline" value={version.deadline} />
        <Summary label="Revisi" value={`${version.revisionLimit} kali`} />
        <Summary label="Persetujuan" value={`${version.approvalCount}/2 pihak`} />
      </View>
      <View style={styles.deliverables}>
        <Text style={styles.detailLabel}>Hasil kerja</Text>
        {version.deliverables.map((item) => <Text key={item} style={styles.detailText}>• {item}</Text>)}
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Pembatalan</Text>
        <Text style={styles.detailText}>{version.cancellationTerms}</Text>
      </View>
      <View style={styles.detailBlock}>
        <Text style={styles.detailLabel}>Hak karya</Text>
        <Text style={styles.detailText}>{version.ipTerms}</Text>
      </View>
      {version.rejectionReason ? <InlineNotice tone="error">Alasan ditolak: {version.rejectionReason}</InlineNotice> : null}
      {projectRole === 'FREELANCER' && version.status === 'DRAFT' ? (
        <View style={styles.actions}>
          <ActionButton label="Edit draft" onPress={onEdit} variant="secondary" />
          <ActionButton label="Ajukan persetujuan" loading={actionPending} onPress={onSubmit} />
        </View>
      ) : null}
      {version.status === 'PENDING' ? (
        <View style={styles.actions}>
          {rejectReason !== null ? (
            <Field label="Alasan penolakan" onChangeText={setRejectReason} placeholder="Minimal 3 karakter" value={rejectReason} />
          ) : null}
          <ActionButton label="Setujui versi ini" loading={actionPending} onPress={onApprove} />
          <ActionButton
            disabled={rejectReason !== null && rejectReason.trim().length < 3}
            label={rejectReason === null ? 'Tolak' : 'Kirim penolakan'}
            onPress={onReject}
            variant="danger"
          />
        </View>
      ) : null}
    </Card>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return <View style={styles.summary}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

function statusStyle(status: AgreementStatus) {
  if (status === 'ACCEPTED') return { backgroundColor: colors.successSurface };
  if (status === 'REJECTED') return { backgroundColor: colors.dangerSurface };
  if (status === 'PENDING') return { backgroundColor: colors.warningSurface };
  return { backgroundColor: colors.primarySoft };
}

function LoadingState() {
  return <SafeAreaView style={styles.loading}><ActivityIndicator color={colors.primary} /><Text style={styles.description}>Memuat kesepakatan...</Text></SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },
  heading: { gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.xs },
  title: { color: colors.ink, ...typography.title },
  description: { color: colors.textMuted, ...typography.body },
  list: { gap: spacing.md },
  formCard: { gap: spacing.lg },
  twoColumns: { gap: spacing.md },
  versionCard: { gap: spacing.md },
  versionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md },
  versionDate: { color: colors.textSubtle, fontSize: 11, marginTop: 4 },
  statusBadge: { borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { color: colors.inkSoft, fontSize: 10, fontWeight: '800' },
  scope: { color: colors.inkSoft, fontSize: 15, lineHeight: 23, fontWeight: '700' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summary: { width: '48%', borderRadius: radii.md, backgroundColor: colors.background, padding: spacing.md, gap: 4 },
  summaryLabel: { color: colors.textSubtle, fontSize: 10 },
  summaryValue: { color: colors.inkSoft, fontSize: 12, lineHeight: 17, fontWeight: '800' },
  deliverables: { gap: 5 },
  detailBlock: { gap: 4, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.md },
  detailLabel: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800' },
  detailText: { color: colors.text, fontSize: 13, lineHeight: 20 },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
});
