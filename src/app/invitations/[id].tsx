import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActionButton, InlineNotice } from '@/components/ui';
import { AccordiaWordmark } from '@/components/accordia-wordmark';
import { useAuthSession } from '@/features/auth';
import { acceptInvitation, invitationKeys } from '@/features/invitations';
import { projectKeys } from '@/features/projects';
import { authenticatedRequest } from '@/lib/api';
import { validInvitationId } from '@/lib/invitation-route';
import { colors, radii, spacing } from '@/theme';
import type { ApiSuccess } from '@/types/api';

type Invitation = {
  id: string;
  projectId: string;
  expiresAt: string;
  expired: boolean;
  acceptedAt: string | null;
  cancelledAt: string | null;
  project: { title: string };
  inviter: { name: string };
};

export default function InvitationLinkScreen() {
  const { id: input } = useLocalSearchParams<{ id: string }>();
  const id = validInvitationId(input);
  const { user, isReady } = useAuthSession();
  const router = useRouter();
  const cache = useQueryClient();
  const query = useQuery({
    queryKey: [...invitationKeys.all, 'link', user?.id, id],
    queryFn: () => authenticatedRequest<ApiSuccess<Invitation>>(`/invitations/${id}`),
    enabled: !!id && !!user && user.role === 'CLIENT' && user.needsConsent === false,
  });
  const accept = useMutation({
    mutationFn: () => acceptInvitation(id!),
    onSuccess: async (response) => {
      await Promise.all([
        cache.invalidateQueries({ queryKey: projectKeys.all }),
        cache.invalidateQueries({ queryKey: invitationKeys.all }),
      ]);
      router.replace(`/(app)/projects/${response.data.projectId}`);
    },
  });
  const invitation = query.data?.data;
  const unavailable = !!invitation
    && (!!invitation.cancelledAt || !!invitation.acceptedAt || invitation.expired);

  if (!isReady) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <ActivityIndicator color={colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <InvitationHero />

        <View style={styles.body}>
          {!id ? (
            <StateCard
              description="Alamat undangan ini tidak lengkap atau sudah berubah. Minta pengirim membagikan ulang tautannya."
              title="Tautan tidak valid"
            >
              <InlineNotice tone="error">ID undangan tidak ditemukan pada tautan.</InlineNotice>
            </StateCard>
          ) : !user ? (
            <StateCard
              description="Masuk dengan email yang menerima undangan. Detail proyek dapat kamu tinjau sebelum memutuskan bergabung."
              eyebrow="SATU LANGKAH LAGI"
              title="Undanganmu sudah siap"
            >
              <ActionButton
                label="Masuk untuk melihat undangan"
                onPress={() => router.push({ pathname: '/(auth)/login', params: { invitationId: id } })}
              />
              <ActionButton
                label="Belum punya akun? Daftar"
                onPress={() => router.push({ pathname: '/(auth)/register', params: { invitationId: id } })}
                variant="secondary"
              />
              <SecurityNote />
            </StateCard>
          ) : user.needsConsent !== false ? (
            <StateCard
              description="Lengkapi persetujuan penggunaan terlebih dahulu. Setelah selesai, kamu akan kembali ke undangan ini."
              eyebrow="HAMPIR SELESAI"
              title={`Halo, ${firstName(user.name)}`}
            >
              <ActionButton
                label="Lengkapi persetujuan"
                onPress={() => router.push({ pathname: '/consent', params: { invitationId: id } } as Href)}
              />
            </StateCard>
          ) : user.role !== 'CLIENT' ? (
            <StateCard
              description="Undangan proyek ditujukan untuk akun klien. Coba masuk kembali menggunakan email penerima yang tertulis pada undangan."
              title="Akun ini belum sesuai"
            >
              <InlineNotice tone="error">Akun yang aktif bukan akun klien.</InlineNotice>
            </StateCard>
          ) : (
            <InvitationContent
              acceptError={accept.error?.message}
              accepting={accept.isPending}
              invitation={invitation}
              loading={query.isPending}
              onAccept={() => accept.mutate()}
              onOpen={() => invitation && router.replace(`/(app)/projects/${invitation.projectId}`)}
              onRetry={() => void query.refetch()}
              queryError={query.error?.message}
              unavailable={unavailable}
            />
          )}

          <ActionButton label="Kembali ke beranda" onPress={() => router.replace('/')} variant="secondary" />
          <Text style={styles.footer}>accordia · kerja sama yang lebih jelas</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function InvitationHero() {
  return (
    <View style={styles.hero}>
      <View pointerEvents="none" style={styles.heroOrbLarge} />
      <View pointerEvents="none" style={styles.heroOrbSmall} />
      <AccordiaWordmark style={styles.wordmark} width={142} />
      <View style={styles.envelopeWrap}>
        <View style={styles.envelope}>
          <View style={styles.envelopeFoldLeft} />
          <View style={styles.envelopeFoldRight} />
          <View style={styles.envelopeSeal}><View style={styles.envelopeSealDot} /></View>
        </View>
      </View>
      <Text style={styles.heroTitle}>Ada ruang kolaborasi{`\n`}yang menunggumu.</Text>
      <Text style={styles.heroDescription}>
        Tinjau undangan, kenali proyeknya, lalu bergabung saat kamu sudah siap.
      </Text>
    </View>
  );
}

function StateCard({
  children,
  description,
  eyebrow = 'UNDANGAN PROYEK',
  title,
}: React.PropsWithChildren<{ description: string; eyebrow?: string; title: string }>) {
  return (
    <View style={styles.card}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardDescription}>{description}</Text>
      <View style={styles.actions}>{children}</View>
    </View>
  );
}

function InvitationContent({
  acceptError,
  accepting,
  invitation,
  loading,
  onAccept,
  onOpen,
  onRetry,
  queryError,
  unavailable,
}: {
  acceptError?: string;
  accepting: boolean;
  invitation?: Invitation;
  loading: boolean;
  onAccept: () => void;
  onOpen: () => void;
  onRetry: () => void;
  queryError?: string;
  unavailable: boolean;
}) {
  if (loading) {
    return (
      <View style={[styles.card, styles.centerCard]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingTitle}>Menyiapkan undanganmu</Text>
        <Text style={styles.loadingCopy}>Sebentar, kami sedang mengambil detail proyek.</Text>
      </View>
    );
  }
  if (queryError) {
    return (
      <StateCard description="Undangan belum dapat dimuat. Periksa koneksi dan coba sekali lagi." title="Terjadi kendala">
        <InlineNotice tone="error">{queryError}</InlineNotice>
        <ActionButton label="Coba muat lagi" onPress={onRetry} />
      </StateCard>
    );
  }
  if (!invitation) return null;

  return (
    <View style={styles.projectCard}>
      <View style={styles.projectAccent} />
      <View style={styles.projectHeader}>
        <View style={styles.projectMonogram}>
          <Text style={styles.projectMonogramText}>{projectInitial(invitation.project.title)}</Text>
        </View>
        <View style={styles.projectHeading}>
          <Text style={styles.eyebrow}>UNDANGAN PROYEK</Text>
          <Text style={styles.projectTitle}>{invitation.project.title}</Text>
        </View>
      </View>

      <View style={styles.metaPanel}>
        <MetaRow label="DIUNDANG OLEH" value={invitation.inviter.name} />
        <View style={styles.metaDivider} />
        <MetaRow label="BERLAKU HINGGA" value={formatDate(invitation.expiresAt)} />
      </View>

      {unavailable ? (
        <InlineNotice tone={invitation.acceptedAt ? 'success' : 'neutral'}>
          {invitation.acceptedAt
            ? 'Undangan sudah diterima. Proyek ini telah terhubung dengan akunmu.'
            : invitation.cancelledAt
              ? 'Undangan telah dibatalkan oleh pengirim.'
              : 'Masa berlaku undangan telah berakhir.'}
        </InlineNotice>
      ) : (
        <View style={styles.welcomeNote}>
          <View style={styles.welcomeDot} />
          <Text style={styles.welcomeText}>
            Dengan menerima, proyek ini akan muncul di ruang kerja Accordia milikmu.
          </Text>
        </View>
      )}

      {acceptError ? <InlineNotice tone="error">{acceptError}</InlineNotice> : null}
      {!unavailable ? (
        <ActionButton label="Terima dan lihat proyek" loading={accepting} onPress={onAccept} />
      ) : null}
      {invitation.acceptedAt ? <ActionButton label="Buka proyek" onPress={onOpen} /> : null}
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function SecurityNote() {
  return (
    <View style={styles.securityNote}>
      <View style={styles.securityIcon}><View style={styles.securityIconInner} /></View>
      <Text style={styles.securityText}>Hanya email tujuan undangan yang dapat menerima proyek ini.</Text>
    </View>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'selamat datang';
}

function projectInitial(title: string) {
  return title.trim().charAt(0).toLocaleUpperCase('id-ID') || 'A';
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.primary },
  loadingScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { flexGrow: 1, backgroundColor: colors.background },
  hero: { minHeight: 380, overflow: 'hidden', backgroundColor: colors.primary, paddingHorizontal: spacing.xxl, paddingTop: spacing.lg, paddingBottom: 54, alignItems: 'center' },
  heroOrbLarge: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: colors.primaryBright, opacity: 0.26, right: -105, top: -100 },
  heroOrbSmall: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 28, borderColor: colors.primaryHighlight, opacity: 0.18, left: -78, bottom: -25 },
  wordmark: { alignSelf: 'flex-start' },
  envelopeWrap: { width: 86, height: 86, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', marginTop: 27, marginBottom: 18, transform: [{ rotate: '-3deg' }] },
  envelope: { width: 53, height: 39, borderRadius: 8, backgroundColor: colors.white, overflow: 'hidden' },
  envelopeFoldLeft: { position: 'absolute', width: 39, height: 39, backgroundColor: colors.primarySoft, transform: [{ rotate: '42deg' }], left: -20, top: -14 },
  envelopeFoldRight: { position: 'absolute', width: 39, height: 39, backgroundColor: colors.primaryMuted, transform: [{ rotate: '-42deg' }], right: -20, top: -14 },
  envelopeSeal: { position: 'absolute', width: 18, height: 18, borderRadius: 9, backgroundColor: colors.gold, alignItems: 'center', justifyContent: 'center', left: 18, top: 13 },
  envelopeSealDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.primary },
  heroTitle: { color: colors.white, fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8, textAlign: 'center' },
  heroDescription: { color: '#DCEDE8', fontSize: 14, lineHeight: 21, textAlign: 'center', maxWidth: 330, marginTop: spacing.sm },
  body: { alignSelf: 'center', width: '100%', maxWidth: 560, paddingHorizontal: spacing.xl, paddingBottom: 34, gap: spacing.md, marginTop: -30 },
  card: { backgroundColor: colors.white, borderRadius: radii.xl, padding: spacing.xl, shadowColor: colors.inkShadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 26, elevation: 5 },
  eyebrow: { color: colors.primaryAccent, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  cardTitle: { color: colors.ink, fontSize: 24, lineHeight: 30, fontWeight: '800', letterSpacing: -0.6, marginTop: spacing.sm },
  cardDescription: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginTop: spacing.sm },
  actions: { gap: spacing.md, marginTop: spacing.xl },
  projectCard: { overflow: 'hidden', backgroundColor: colors.white, borderRadius: radii.xl, padding: spacing.xl, gap: spacing.lg, shadowColor: colors.inkShadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 26, elevation: 5 },
  projectAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 5, backgroundColor: colors.gold },
  projectHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  projectMonogram: { width: 52, height: 52, borderRadius: 18, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  projectMonogramText: { color: colors.primary, fontSize: 22, fontWeight: '900' },
  projectHeading: { flex: 1, gap: 5 },
  projectTitle: { color: colors.ink, fontSize: 21, lineHeight: 27, fontWeight: '800', letterSpacing: -0.4 },
  metaPanel: { borderRadius: radii.lg, backgroundColor: colors.background, padding: spacing.lg, gap: spacing.md },
  metaRow: { gap: 4 },
  metaLabel: { color: colors.textSubtle, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  metaValue: { color: colors.inkSoft, fontSize: 14, lineHeight: 20, fontWeight: '700' },
  metaDivider: { height: 1, backgroundColor: colors.border },
  welcomeNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 2 },
  welcomeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryHighlight, marginTop: 6 },
  welcomeText: { flex: 1, color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  centerCard: { minHeight: 245, alignItems: 'center', justifyContent: 'center' },
  loadingTitle: { color: colors.ink, fontSize: 18, fontWeight: '800', marginTop: spacing.lg },
  loadingCopy: { color: colors.textMuted, fontSize: 13, marginTop: 5, textAlign: 'center' },
  securityNote: { flexDirection: 'row', alignItems: 'center', alignSelf: 'center', maxWidth: 290, gap: spacing.sm },
  securityIcon: { width: 18, height: 18, borderRadius: 6, borderWidth: 2, borderColor: colors.primaryAccent, alignItems: 'center', justifyContent: 'center' },
  securityIconInner: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.primaryAccent },
  securityText: { flex: 1, color: colors.textSubtle, fontSize: 11, lineHeight: 16 },
  footer: { color: colors.textSubtle, fontSize: 11, textAlign: 'center', marginTop: spacing.sm },
});
