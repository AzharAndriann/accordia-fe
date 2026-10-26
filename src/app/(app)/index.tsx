import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  invitationKeys,
  listMembershipRemovalRequests,
  listPendingInvitations,
} from '@/features/invitations';
import { getCurrentUser } from '@/lib/session';
import { colors } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const currentUser = getCurrentUser();
  const firstName = currentUser?.name.trim().split(/\s+/)[0];
  const invitationsQuery = useQuery({
    queryKey: [...invitationKeys.pending(), 'preview'],
    queryFn: () => listPendingInvitations(undefined, 20),
    enabled: currentUser?.role === 'CLIENT',
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const removalsQuery = useQuery({
    queryKey: [...invitationKeys.removals(), 'preview'],
    queryFn: () => listMembershipRemovalRequests(undefined, 20),
    enabled: currentUser?.role === 'CLIENT',
    refetchOnMount: 'always',
    staleTime: 0,
  });
  const invitationCount = (invitationsQuery.data?.data.length ?? 0)
    + (removalsQuery.data?.data.length ?? 0);
  const invitationCountLabel = invitationsQuery.data?.nextCursor || removalsQuery.data?.nextCursor
    ? '20+'
    : String(invitationCount);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headingRow}>
          <View style={styles.heading}>
            <Text style={styles.eyebrow}>ACCORDIA</Text>
            <Text style={styles.title}>{firstName ? `Halo, ${firstName}` : 'Halo'}</Text>
            <Text style={styles.description}>Lanjutkan pekerjaan dan kesepakatanmu hari ini.</Text>
          </View>
          {currentUser?.role === 'CLIENT' ? (
            <Pressable
              accessibilityLabel={
                invitationCount > 0
                  ? `${invitationCountLabel} undangan proyek baru`
                  : 'Buka notifikasi'
              }
              accessibilityRole="button"
              onPress={() => router.push('/(app)/notifications')}
              style={({ pressed }) => [styles.notificationButton, pressed ? styles.pressed : null]}
            >
              <View style={styles.bell}>
                <View style={styles.bellBody} />
                <View style={styles.bellClapper} />
              </View>
              {invitationCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{invitationCountLabel}</Text>
                </View>
              ) : null}
            </Pressable>
          ) : null}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroDecoration} />
          <Text style={styles.heroLabel}>RUANG KERJA BERSAMA</Text>
          <Text style={styles.heroTitle}>Kesepakatan jelas, kerja lebih tenang.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/(app)/projects')}
            style={({ pressed }) => [styles.heroButton, pressed ? styles.pressed : null]}
          >
            <Text style={styles.heroButtonText}>Lihat proyek</Text>
            <Text style={styles.heroArrow}>›</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Akses cepat</Text>
          <Pressable
            onPress={() => router.push('/(app)/projects')}
            style={({ pressed }) => [styles.quickCard, pressed ? styles.pressed : null]}
          >
            <View style={styles.quickIcon}><Text style={styles.quickIconText}>▤</Text></View>
            <View style={styles.quickCopy}>
              <Text style={styles.quickTitle}>Semua proyek</Text>
              <Text style={styles.quickDescription}>Lihat progres dan detail pekerjaanmu.</Text>
            </View>
            <Text style={styles.quickArrow}>›</Text>
          </Pressable>
          {currentUser?.role === 'FREELANCER' ? (
            <Pressable
              onPress={() => router.push('/(app)/projects/new')}
              style={({ pressed }) => [styles.quickCard, pressed ? styles.pressed : null]}
            >
              <View style={styles.quickIcon}><Text style={styles.quickIconText}>＋</Text></View>
              <View style={styles.quickCopy}>
                <Text style={styles.quickTitle}>Buat proyek</Text>
                <Text style={styles.quickDescription}>Mulai ruang kerja baru bersama klien.</Text>
              </View>
              <Text style={styles.quickArrow}>›</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 24, paddingBottom: 120, gap: 24 },
  headingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heading: { flex: 1, gap: 6 },
  eyebrow: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800', letterSpacing: 1.7 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -0.8 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bell: { width: 18, height: 21, alignItems: 'center', justifyContent: 'flex-end' },
  bellBody: {
    width: 16,
    height: 15,
    borderWidth: 2,
    borderColor: colors.primary,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  bellClapper: {
    width: 5,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.danger,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: colors.white, fontSize: 8, lineHeight: 10, fontWeight: '900' },
  heroCard: { minHeight: 225, borderRadius: 26, backgroundColor: colors.primary, padding: 22, justifyContent: 'flex-end', gap: 10, overflow: 'hidden' },
  heroDecoration: { position: 'absolute', width: 210, height: 210, borderRadius: 105, backgroundColor: colors.primaryBright, top: -100, right: -70 },
  heroLabel: { color: colors.primaryMuted, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  heroTitle: { color: colors.white, maxWidth: 280, fontSize: 24, lineHeight: 31, fontWeight: '800', letterSpacing: -0.5 },
  heroButton: { alignSelf: 'flex-start', minHeight: 42, borderRadius: 21, backgroundColor: colors.white, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  heroButtonText: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  heroArrow: { color: colors.primary, fontSize: 21 },
  pressed: { opacity: 0.76, transform: [{ scale: 0.99 }] },
  section: { gap: 11 },
  sectionTitle: { color: colors.inkSoft, fontSize: 18, fontWeight: '800' },
  quickCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.white, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  quickIconText: { color: colors.primary, fontSize: 21, fontWeight: '800' },
  quickCopy: { flex: 1, gap: 3 },
  quickTitle: { color: colors.inkSoft, fontSize: 14, fontWeight: '800' },
  quickDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },
  quickArrow: { color: colors.primary, fontSize: 24 },
});
