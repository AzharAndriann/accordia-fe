import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { projectRoleLabel } from '@/features/projects';
import { clearSession, getCurrentUser } from '@/lib/session';
import { colors } from '@/theme';

export default function AccountScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  async function logout() {
    await clearSession();
    queryClient.clear();
    router.replace('/(auth)/login');
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>PROFIL</Text>
          <Text style={styles.title}>Akunmu</Text>
          <Text style={styles.description}>Informasi akun yang sedang digunakan.</Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{currentUser?.name.trim().charAt(0).toUpperCase() || 'A'}</Text>
          </View>
          <View style={styles.profileCopy}>
            <Text style={styles.name}>{currentUser?.name ?? 'Pengguna Accordia'}</Text>
            <Text style={styles.email}>{currentUser?.email ?? 'Sesi tidak tersedia'}</Text>
          </View>
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Peran akun</Text>
            <Text style={styles.infoValue}>
              {currentUser ? projectRoleLabel(currentUser.role) : '—'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Penyimpanan sesi</Text>
            <Text style={styles.infoValue}>Perangkat ini</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void logout()}
          style={({ pressed }) => [styles.logoutButton, pressed ? styles.pressed : null]}
        >
          <Text style={styles.logoutText}>Keluar dari akun</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingTop: 24, paddingBottom: 120, gap: 18 },
  heading: { gap: 6, marginBottom: 5 },
  eyebrow: { color: colors.primaryAccent, fontSize: 11, fontWeight: '800', letterSpacing: 1.7 },
  title: { color: colors.ink, fontSize: 32, lineHeight: 39, fontWeight: '800', letterSpacing: -0.8 },
  description: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  profileCard: { borderRadius: 22, backgroundColor: colors.primary, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 15 },
  avatar: { width: 58, height: 58, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  profileCopy: { flex: 1, gap: 4 },
  name: { color: colors.white, fontSize: 19, fontWeight: '800' },
  email: { color: colors.primaryMuted, fontSize: 13 },
  infoCard: { borderWidth: 1, borderColor: colors.border, borderRadius: 19, backgroundColor: colors.white, paddingHorizontal: 17 },
  infoRow: { minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 },
  divider: { height: 1, backgroundColor: colors.divider },
  infoLabel: { color: colors.textMuted, fontSize: 13 },
  infoValue: { color: colors.inkSoft, fontSize: 13, fontWeight: '800' },
  logoutButton: { minHeight: 52, borderWidth: 1, borderColor: colors.dangerBorder, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.72 },
});
