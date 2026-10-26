import { zodResolver } from '@hookform/resolvers/zod';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, Field, InlineNotice, SectionLabel } from '@/components/ui';
import {
  cancelProjectInvitation,
  createInvitation,
  createInvitationSchema,
  invitationKeys,
  listProjectInvitations,
  requestClientRemoval,
  type CreateInvitationForm,
  type ProjectInvitation,
  type ProjectInvitationStatus,
} from '@/features/invitations';
import { ApiError } from '@/lib/api';
import { colors, radii, spacing, typography } from '@/theme';

const statusCopy: Record<ProjectInvitationStatus, { label: string; description: string }> = {
  PENDING: { label: 'Menunggu', description: 'Belum direspons oleh klien.' },
  ACCEPTED: { label: 'Diterima', description: 'Klien sudah bergabung ke proyek.' },
  REMOVAL_PENDING: {
    label: 'Menunggu persetujuan',
    description: 'Permintaan pelepasan sedang menunggu respons klien.',
  },
  REMOVED: { label: 'Sudah dilepas', description: 'Klien menyetujui untuk keluar dari proyek.' },
  CANCELLED: { label: 'Dibatalkan', description: 'Undangan dibatalkan sebelum diterima.' },
  EXPIRED: { label: 'Kedaluwarsa', description: 'Masa berlaku undangan sudah habis.' },
};

export default function InviteClientScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const projectId = Array.isArray(id) ? id[0] : id;
  const queryClient = useQueryClient();
  const { control, handleSubmit, reset, formState: { errors } } = useForm<CreateInvitationForm>({
    resolver: zodResolver(createInvitationSchema),
    defaultValues: { email: '' },
  });
  const invitationsQuery = useInfiniteQuery({
    queryKey: invitationKeys.project(projectId ?? ''),
    queryFn: ({ pageParam }) => listProjectInvitations(projectId!, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    enabled: Boolean(projectId),
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const invitations = invitationsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const refreshLists = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: invitationKeys.project(projectId!) }),
    queryClient.invalidateQueries({ queryKey: invitationKeys.pending() }),
    queryClient.invalidateQueries({ queryKey: invitationKeys.removals() }),
  ]);
  const invitationMutation = useMutation({
    mutationFn: (values: CreateInvitationForm) => createInvitation(projectId!, values),
    async onSuccess() {
      reset();
      await refreshLists();
    },
  });
  const cancelMutation = useMutation({
    mutationFn: (invitationId: string) => cancelProjectInvitation(projectId!, invitationId),
    onSuccess: refreshLists,
  });
  const removalMutation = useMutation({
    mutationFn: (invitationId: string) => requestClientRemoval(projectId!, invitationId),
    onSuccess: refreshLists,
  });
  const mutationError = invitationMutation.error
    ?? cancelMutation.error
    ?? removalMutation.error;
  const mutationErrorMessage = mutationError instanceof ApiError
    ? mutationError.message
    : mutationError
      ? 'Undangan belum bisa diproses. Coba lagi.'
      : null;
  const listErrorMessage = invitationsQuery.error instanceof ApiError
    ? invitationsQuery.error.message
    : invitationsQuery.error
      ? 'Daftar undangan belum bisa dimuat. Coba lagi.'
      : null;

  const submit = handleSubmit((values) => invitationMutation.mutate(values));

  function confirmCancel(invitation: ProjectInvitation) {
    Alert.alert(
      'Batalkan undangan?',
      `Undangan untuk ${invitation.targetEmail} tidak bisa diterima setelah dibatalkan.`,
      [
        { text: 'Kembali', style: 'cancel' },
        {
          text: 'Batalkan undangan',
          style: 'destructive',
          onPress: () => cancelMutation.mutate(invitation.id),
        },
      ],
    );
  }

  function confirmRemoval(invitation: ProjectInvitation) {
    Alert.alert(
      'Ajukan pelepasan klien?',
      `${invitation.targetEmail} akan menerima permintaan ini. Klien baru keluar setelah menyetujuinya.`,
      [
        { text: 'Kembali', style: 'cancel' },
        {
          text: 'Kirim permintaan',
          onPress: () => removalMutation.mutate(invitation.id),
        },
      ],
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            onRefresh={() => void invitationsQuery.refetch()}
            refreshing={invitationsQuery.isRefetching && !invitationsQuery.isFetchingNextPage}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>Undang klien</Text>
          <Text style={styles.description}>
            Kirim undangan dan pantau respons klien untuk proyek ini.
          </Text>
        </View>

        <Card style={styles.formCard}>
          {mutationErrorMessage ? (
            <InlineNotice tone="error">{mutationErrorMessage}</InlineNotice>
          ) : null}
          {invitationMutation.isSuccess ? (
            <InlineNotice tone="success">Undangan berhasil dikirim ke klien.</InlineNotice>
          ) : null}
          <Controller
            control={control}
            name="email"
            render={({ field: { onBlur, onChange, value } }) => (
              <Field
                autoCapitalize="none"
                autoComplete="email"
                error={errors.email?.message}
                inputMode="email"
                label="Email klien"
                onBlur={onBlur}
                onChangeText={(text) => {
                  invitationMutation.reset();
                  onChange(text);
                }}
                onSubmitEditing={() => void submit()}
                placeholder="klien@email.com"
                returnKeyType="send"
                value={value}
              />
            )}
          />
          <ActionButton
            label={invitationMutation.isPending ? 'Mengirim undangan...' : 'Kirim undangan'}
            loading={invitationMutation.isPending}
            onPress={submit}
          />
        </Card>

        <View style={styles.listHeading}>
          <View style={styles.listHeadingCopy}>
            <Text style={styles.listTitle}>Daftar undangan</Text>
            <Text style={styles.listDescription}>Status undangan dan keanggotaan klien.</Text>
          </View>
          {invitations.length > 0 ? (
            <View style={styles.countPill}><Text style={styles.countText}>{invitations.length}</Text></View>
          ) : null}
        </View>

        {listErrorMessage ? (
          <Card style={styles.retryCard}>
            <InlineNotice tone="error">{listErrorMessage}</InlineNotice>
            <ActionButton
              label={invitationsQuery.isFetching ? 'Memuat ulang...' : 'Coba lagi'}
              loading={invitationsQuery.isFetching}
              onPress={() => void invitationsQuery.refetch()}
              variant="secondary"
            />
          </Card>
        ) : null}

        {invitationsQuery.isPending ? (
          <View style={styles.loading}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.loadingText}>Memuat undangan...</Text>
          </View>
        ) : invitations.length === 0 && !listErrorMessage ? (
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Belum ada undangan</Text>
            <Text style={styles.emptyDescription}>Email yang kamu undang akan tercatat di sini.</Text>
          </Card>
        ) : (
          <View style={styles.list}>
            {invitations.map((invitation) => (
              <InvitationItem
                cancelling={cancelMutation.isPending && cancelMutation.variables === invitation.id}
                invitation={invitation}
                key={invitation.id}
                onCancel={() => confirmCancel(invitation)}
                onRequestRemoval={() => confirmRemoval(invitation)}
                requestingRemoval={
                  removalMutation.isPending && removalMutation.variables === invitation.id
                }
              />
            ))}
          </View>
        )}

        {invitationsQuery.hasNextPage ? (
          <ActionButton
            label={invitationsQuery.isFetchingNextPage ? 'Memuat...' : 'Muat lainnya'}
            loading={invitationsQuery.isFetchingNextPage}
            onPress={() => void invitationsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function InvitationItem({
  cancelling,
  invitation,
  onCancel,
  onRequestRemoval,
  requestingRemoval,
}: {
  cancelling: boolean;
  invitation: ProjectInvitation;
  onCancel: () => void;
  onRequestRemoval: () => void;
  requestingRemoval: boolean;
}) {
  const copy = statusCopy[invitation.status];
  const rejected = invitation.status === 'ACCEPTED' && invitation.removalStatus === 'REJECTED';
  return (
    <Card style={styles.invitationCard}>
      <View style={styles.cardTop}>
        <View style={styles.cardCopy}>
          <SectionLabel>EMAIL KLIEN</SectionLabel>
          <Text style={styles.email}>{invitation.targetEmail}</Text>
        </View>
        <StatusBadge status={invitation.status} />
      </View>
      <Text style={styles.statusDescription}>
        {rejected ? 'Permintaan sebelumnya ditolak. Klien masih tergabung.' : copy.description}
      </Text>
      <View style={styles.dateBox}>
        <Text style={styles.dateText}>Dikirim {formatDate(invitation.createdAt)}</Text>
        <Text style={styles.dateText}>{getActivityDate(invitation)}</Text>
      </View>
      {invitation.status === 'PENDING' ? (
        <ActionButton
          label={cancelling ? 'Membatalkan...' : 'Batalkan undangan'}
          loading={cancelling}
          onPress={onCancel}
          variant="danger"
        />
      ) : null}
      {invitation.status === 'ACCEPTED' ? (
        <ActionButton
          label={requestingRemoval ? 'Mengirim permintaan...' : rejected ? 'Ajukan pelepasan lagi' : 'Ajukan pelepasan klien'}
          loading={requestingRemoval}
          onPress={onRequestRemoval}
          variant="secondary"
        />
      ) : null}
    </Card>
  );
}

function StatusBadge({ status }: { status: ProjectInvitationStatus }) {
  const tone = status === 'ACCEPTED'
    ? styles.statusSuccess
    : status === 'PENDING' || status === 'REMOVAL_PENDING'
      ? styles.statusWarning
      : status === 'CANCELLED'
        ? styles.statusDanger
        : styles.statusNeutral;
  const textTone = status === 'ACCEPTED'
    ? styles.statusTextSuccess
    : status === 'PENDING' || status === 'REMOVAL_PENDING'
      ? styles.statusTextWarning
      : status === 'CANCELLED'
        ? styles.statusTextDanger
        : styles.statusTextNeutral;
  return (
    <View style={[styles.status, tone]}>
      <Text style={[styles.statusText, textTone]}>{statusCopy[status].label}</Text>
    </View>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID');
}

function getActivityDate(invitation: ProjectInvitation) {
  if (invitation.status === 'REMOVED' && invitation.removalRespondedAt) {
    return `Disetujui ${formatDate(invitation.removalRespondedAt)}`;
  }
  if (invitation.status === 'REMOVAL_PENDING' && invitation.removalRequestedAt) {
    return `Diajukan ${formatDate(invitation.removalRequestedAt)}`;
  }
  if (invitation.status === 'ACCEPTED' && invitation.acceptedAt) {
    return `Diterima ${formatDate(invitation.acceptedAt)}`;
  }
  if (invitation.status === 'CANCELLED' && invitation.cancelledAt) {
    return `Dibatalkan ${formatDate(invitation.cancelledAt)}`;
  }
  return `Berlaku sampai ${formatDate(invitation.expiresAt)}`;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.xl },
  heading: { gap: spacing.sm },
  title: { color: colors.ink, ...typography.title },
  description: { color: colors.textMuted, ...typography.body },
  formCard: { gap: spacing.lg },
  retryCard: { gap: spacing.md },
  listHeading: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  listHeadingCopy: { flex: 1, gap: 3 },
  listTitle: { color: colors.inkSoft, fontSize: 20, lineHeight: 26, fontWeight: '800' },
  listDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  countPill: { minWidth: 30, height: 30, borderRadius: radii.pill, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.sm },
  countText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  loading: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  loadingText: { color: colors.textMuted, ...typography.body },
  emptyCard: { minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
  emptyTitle: { color: colors.inkSoft, fontSize: 17, fontWeight: '800' },
  emptyDescription: { color: colors.textMuted, ...typography.body, textAlign: 'center' },
  list: { gap: spacing.md },
  invitationCard: { gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  cardCopy: { flex: 1, gap: 4 },
  email: { color: colors.inkSoft, fontSize: 16, lineHeight: 22, fontWeight: '800' },
  status: { maxWidth: 140, borderRadius: radii.pill, paddingHorizontal: 10, paddingVertical: 6 },
  statusSuccess: { backgroundColor: colors.successSurface },
  statusWarning: { backgroundColor: colors.warningSurface },
  statusDanger: { backgroundColor: colors.dangerSurface },
  statusNeutral: { backgroundColor: colors.surfaceMuted },
  statusText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  statusTextSuccess: { color: colors.success },
  statusTextWarning: { color: colors.warning },
  statusTextDanger: { color: colors.danger },
  statusTextNeutral: { color: colors.textSubtle },
  statusDescription: { color: colors.text, fontSize: 13, lineHeight: 19 },
  dateBox: { borderRadius: radii.md, backgroundColor: colors.background, padding: spacing.md, gap: 3 },
  dateText: { color: colors.textSubtle, fontSize: 10, lineHeight: 15 },
});
