import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing, typography } from '@/theme';

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>PREFERENSI</Text>
          <Text style={styles.title}>Atur Accordia sesuai kebutuhanmu.</Text>
          <Text style={styles.description}>
            Kelola notifikasi serta baca kembali dokumen penggunaan aplikasi dalam satu tempat.
          </Text>
        </View>

        <View style={styles.card}>
          <SettingsRow
            description="Izin perangkat, status token, dan pengujian push notification."
            icon="◉"
            onPress={() => router.push('/(app)/notification-settings')}
            title="Notifikasi perangkat"
          />
          <View style={styles.divider} />
          <SettingsRow
            description="Tinjau syarat penggunaan dan kebijakan privasi Accordia."
            icon="▤"
            onPress={() => router.push('/policies')}
            title="Syarat & privasi"
          />
        </View>

        <View style={styles.note}>
          <View style={styles.noteDot} />
          <Text style={styles.noteText}>
            Pengaturan akun tersimpan aman dan sebagian izin tetap mengikuti pengaturan perangkatmu.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsRow({
  description,
  icon,
  onPress,
  title,
}: {
  description: string;
  icon: string;
  onPress: () => void;
  title: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed ? styles.rowPressed : null]}
    >
      <View style={styles.iconBox}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowDescription}>{description}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingTop: spacing.xxl, paddingBottom: 128, gap: spacing.xxl },
  heading: { gap: spacing.sm },
  eyebrow: { color: colors.primaryAccent, ...typography.label },
  title: { color: colors.ink, fontSize: 27, lineHeight: 34, fontWeight: '800', letterSpacing: -0.5 },
  description: { color: colors.textMuted, ...typography.body },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  row: {
    minHeight: 96,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.md,
  },
  rowPressed: { opacity: 0.7, transform: [{ scale: 0.995 }] },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  iconText: { color: colors.primary, fontSize: 23, lineHeight: 26, fontWeight: '800' },
  rowCopy: { flex: 1, gap: 4 },
  rowTitle: { color: colors.inkSoft, fontSize: 16, lineHeight: 21, fontWeight: '800' },
  rowDescription: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
  chevron: { color: colors.primaryAccent, fontSize: 29, lineHeight: 31 },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: 64 },
  note: {
    borderRadius: radii.lg,
    backgroundColor: colors.primarySoft,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  noteDot: { width: 8, height: 8, borderRadius: radii.pill, backgroundColor: colors.primary, marginTop: 6 },
  noteText: { flex: 1, color: colors.text, fontSize: 12, lineHeight: 19 },
});
