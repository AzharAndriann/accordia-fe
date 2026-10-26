import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, EmptyState, InlineNotice, SectionLabel } from '@/components/ui';
import {
  acceptInvitation,
  invitationKeys,
  listMembershipRemovalRequests,
  listPendingInvitations,
  respondToMembershipRemoval,
  type MembershipRemovalRequest,
  type PendingInvitation,
} from '@/features/invitations';
import { projectKeys } from '@/features/projects';
import { ApiError } from '@/lib/api';
import { colors, radii, spacing, typography } from '@/theme';

export default function NotificationsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const invitationsQuery = useInfiniteQuery({
    queryKey: invitationKeys.pending(),
    queryFn: ({ pageParam }) => listPendingInvitations(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const invitations = invitationsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const removalsQuery = useInfiniteQuery({
    queryKey: invitationKeys.removals(),
    queryFn: ({ pageParam }) => listMembershipRemovalRequests(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (page) => page.nextCursor ?? undefined,
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const removals = removalsQuery.data?.pages.flatMap((page) => page.data) ?? [];
  const acceptMutation = useMutation({
    mutationFn: (invitationId: string) => acceptInvitation(invitationId),
    async onSuccess(response) {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      ]);
      router.replace(`/(app)/projects/${response.data.projectId}`);
    },
  });
  const removalMutation = useMutation({
    mutationFn: ({
      invitationId,
      decision,
    }: {
      invitationId: string;
      decision: 'approve' | 'reject';
    }) => respondToMembershipRemoval(invitationId, decision),
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: invitationKeys.all }),
        queryClient.invalidateQueries({ queryKey: projectKeys.all }),
      ]);
    },
  });
  const error = invitationsQuery.error
    ?? removalsQuery.error
    ?? acceptMutation.error
    ?? removalMutation.error;
  const errorMessage = error instanceof ApiError
    ? error.message
    : error
      ? 'Notifikasi belum bisa dimuat. Coba lagi.'
      : null;

  if (invitationsQuery.isPending || removalsQuery.isPending) {
    return (
      <SafeAreaView edges={['bottom']} style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.description}>Memuat notifikasi...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            onRefresh={() => void Promise.all([invitationsQuery.refetch(), removalsQuery.refetch()])}
            refreshing={
              (invitationsQuery.isRefetching && !invitationsQuery.isFetchingNextPage)
              || (removalsQuery.isRefetching && !removalsQuery.isFetchingNextPage)
            }
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heading}>
          <Text style={styles.title}>Undangan proyek</Text>
          <Text style={styles.description}>Terima undangan untuk memasukkan proyek ke ruang kerjamu.</Text>
        </View>

        {errorMessage ? <InlineNotice tone="error">{errorMessage}</InlineNotice> : null}

        {removals.length > 0 ? (
          <View style={styles.section}>
            <View style={styles.sectionHeading}>
              <Text style={styles.sectionTitle}>Persetujuan keanggotaan</Text>
              <Text style={styles.sectionDescription}>
                Freelancer meminta persetujuanmu untuk melepas akses proyek.
              </Text>
            </View>
            <View style={styles.list}>
              {removals.map((request) => (
                <RemovalCard
                  key={request.invitationId}
                  loading={
                    removalMutation.isPending
                    && removalMutation.variables.invitationId === request.invitationId
                  }
                  onApprove={() => {
                    Alert.alert(
                      'Setujui keluar dari proyek?',
                      `Aksesmu ke ${request.projectTitle} akan dilepas setelah disetujui.`,
                      [
                        { text: 'Kembali', style: 'cancel' },
                        {
                          text: 'Setujui keluar',
                          style: 'destructive',
                          onPress: () => removalMutation.mutate({
                            invitationId: request.invitationId,
                            decision: 'approve',
                          }),
                        },
                      ],
                    );
                  }}
                  onReject={() => removalMutation.mutate({
                    invitationId: request.invitationId,
                    decision: 'reject',
                  })}
                  request={request}
                />
              ))}
            </View>
          </View>
        ) : null}

        {!errorMessage && invitations.length === 0 && removals.length === 0 ? (
          <EmptyState
            title="Belum ada undangan"
            description="Undangan proyek baru akan muncul otomatis di sini."
          />
        ) : invitations.length > 0 ? (
          <View style={styles.list}>
            {invitations.map((invitation) => (
              <InvitationCard
                accepting={acceptMutation.isPending && acceptMutation.variables === invitation.id}
                disabled={acceptMutation.isPending && acceptMutation.variables !== invitation.id}
                invitation={invitation}
                key={invitation.id}
                onAccept={() => acceptMutation.mutate(invitation.id)}
              />
            ))}
          </View>
        ) : null}

        {invitationsQuery.hasNextPage ? (
          <ActionButton
            label={invitationsQuery.isFetchingNextPage ? 'Memuat...' : 'Muat lainnya'}
            loading={invitationsQuery.isFetchingNextPage}
            onPress={() => void invitationsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
        {removalsQuery.hasNextPage ? (
          <ActionButton
            label={removalsQuery.isFetchingNextPage ? 'Memuat...' : 'Muat permintaan lainnya'}
            loading={removalsQuery.isFetchingNextPage}
            onPress={() => void removalsQuery.fetchNextPage()}
            variant="secondary"
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function RemovalCard({
  loading,
  onApprove,
  onReject,
  request,
}: {
  loading: boolean;
  onApprove: () => void;
  onReject: () => void;
  request: MembershipRemovalRequest;
}) {
  return (
    <Card style={styles.card}>
      <SectionLabel>PERSETUJUAN PELEPASAN</SectionLabel>
      <Text style={styles.projectTitle}>{request.projectTitle}</Text>
      <Text style={styles.message}>
        {request.freelancerName} ingin melepasmu dari proyek ini. Akses baru berakhir jika kamu menyetujuinya.
      </Text>
      <Text style={styles.meta}>Diajukan {new Date(request.requestedAt).toLocaleString('id-ID')}</Text>
      <View style={styles.actions}>
        <View style={styles.actionItem}>
          <ActionButton
            disabled={loading}
            label="Tolak"
            onPress={onReject}
            variant="secondary"
          />
        </View>
        <View style={styles.actionItem}>
          <ActionButton
            label={loading ? 'Memproses...' : 'Setujui keluar'}
            loading={loading}
            onPress={onApprove}
            variant="danger"
          />
        </View>
      </View>
    </Card>
  );
}

function InvitationCard({
  accepting,
  disabled,
  invitation,
  onAccept,
}: {
  accepting: boolean;
  disabled: boolean;
  invitation: PendingInvitation;
  onAccept: () => void;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.icon}>
          <Text style={styles.iconText}>A</Text>
        </View>
        <View style={styles.cardCopy}>
          <SectionLabel>UNDANGAN PROYEK</SectionLabel>
          <Text style={styles.projectTitle}>{invitation.projectTitle}</Text>
        </View>
      </View>
      <Text style={styles.message}>
        {invitation.inviterName} mengundangmu untuk bergabung sebagai klien.
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>Dikirim {new Date(invitation.createdAt).toLocaleString('id-ID')}</Text>
        <Text style={styles.meta}>Berlaku sampai {new Date(invitation.expiresAt).toLocaleString('id-ID')}</Text>
      </View>
      <ActionButton
        label={accepting ? 'Menerima undangan...' : 'Terima undangan'}
        disabled={disabled}
        loading={accepting}
        onPress={onAccept}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  content: { padding: spacing.xl, paddingBottom: 48, gap: spacing.lg },
  heading: { gap: spacing.xs },
  title: { color: colors.ink, ...typography.title },
  description: { color: colors.textMuted, ...typography.body },
  list: { gap: spacing.md },
  section: { gap: spacing.md },
  sectionHeading: { gap: 3 },
  sectionTitle: { color: colors.inkSoft, fontSize: 18, lineHeight: 24, fontWeight: '800' },
  sectionDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  card: { gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  icon: {
    width: 46,
    height: 46,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  iconText: { color: colors.primary, fontSize: 20, fontWeight: '900' },
  cardCopy: { flex: 1, gap: 3 },
  projectTitle: { color: colors.inkSoft, fontSize: 17, lineHeight: 22, fontWeight: '800' },
  message: { color: colors.text, fontSize: 13, lineHeight: 20 },
  metaRow: {
    borderRadius: radii.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: 4,
  },
  meta: { color: colors.textSubtle, fontSize: 10, lineHeight: 15 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionItem: { flex: 1 },
});
