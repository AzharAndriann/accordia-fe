import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, Card, InlineNotice } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { acceptInvitation, invitationTokenSchema } from '@/features/invitations';
import { projectKeys } from '@/features/projects';
import { ApiError } from '@/lib/api';
import { colors, spacing, typography } from '@/theme';

export default function InvitationScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isReady, user } = useAuthSession();
  const invitationToken = Array.isArray(token) ? token[0] : token;
  const tokenResult = invitationTokenSchema.safeParse(invitationToken);
  const mutation = useMutation({
    mutationFn: () => acceptInvitation(tokenResult.data!),
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: projectKeys.all });
    },
  });
  const membership = mutation.data?.data;
  const error = mutation.error instanceof ApiError
    ? mutation.error.message
    : mutation.error
      ? 'Undangan belum bisa diterima. Coba lagi.'
      : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <View style={styles.mark}>
            <Text style={styles.markText}>A</Text>
          </View>
          <Text style={styles.title}>Undangan proyek</Text>
          {!tokenResult.success ? (
            <InlineNotice tone="error">Tautan undangan ini tidak valid.</InlineNotice>
          ) : !isReady ? (
            <Text style={styles.description}>Memeriksa sesi...</Text>
          ) : !user ? (
            <>
              <Text style={styles.description}>Masuk dengan akun klien yang menerima undangan ini.</Text>
              <ActionButton
                label="Masuk untuk melanjutkan"
                onPress={() => router.push({
                  pathname: '/(auth)/login',
                  params: { redirect: `/invitations/${invitationToken}` },
                })}
              />
            </>
          ) : membership ? (
            <>
              <InlineNotice tone="success">Undangan berhasil diterima. Proyek sudah masuk ke ruang kerjamu.</InlineNotice>
              <ActionButton
                label="Buka proyek"
                onPress={() => router.replace(`/(app)/projects/${membership.projectId}`)}
              />
            </>
          ) : (
            <>
              <Text style={styles.description}>Kamu masuk sebagai {user.email}. Pastikan ini email yang dituju.</Text>
              {error ? <InlineNotice tone="error">{error}</InlineNotice> : null}
              <ActionButton
                label={mutation.isPending ? 'Menerima undangan...' : 'Terima undangan'}
                loading={mutation.isPending}
                onPress={() => mutation.mutate()}
              />
            </>
          )}
        </Card>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  card: { gap: spacing.lg, alignItems: 'stretch' },
  mark: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
  },
  markText: { color: colors.white, fontSize: 25, fontWeight: '900' },
  title: { color: colors.ink, ...typography.title, textAlign: 'center' },
  description: { color: colors.textMuted, ...typography.body, textAlign: 'center' },
});
