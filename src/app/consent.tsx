import { useMutation } from '@tanstack/react-query';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AccordiaWordmark } from '@/components/accordia-wordmark';
import { ActionButton, InlineNotice } from '@/components/ui';
import { useAuthSession } from '@/features/auth';
import { logoutSession } from '@/features/auth/auth.api';
import { acceptPolicies, ConsentFields, consentSchema, emptyConsent } from '@/features/policies';
import { postAuthRoute } from '@/lib/invitation-route';
import { getCurrentUser, updateSessionUser } from '@/lib/session';
import { colors, spacing } from '@/theme';

export default function ConsentScreen() {
  const { invitationId } = useLocalSearchParams<{ invitationId?: string }>();
  const { isReady, user } = useAuthSession();
  const [value, setValue] = useState(emptyConsent);
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: async () => {
      const parsed = consentSchema.safeParse(value);
      if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      await acceptPolicies(parsed.data);
      const current = getCurrentUser();
      if (current) await updateSessionUser({ ...current, needsConsent: false });
    },
  });

  if (!isReady) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.needsConsent === false) return <Redirect href={postAuthRoute(invitationId, false)} />;

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.poster}>
          <View style={styles.hero}>
            <View pointerEvents="none" style={styles.heroOrb} />
            <AccordiaWordmark style={styles.wordmark} width={142} />
            <Text style={styles.eyebrow}>SEBELUM MELANJUTKAN</Text>
            <Text style={styles.title}>Satu langkah untuk{`\n`}melindungi kerja samamu.</Text>
            <Text style={styles.description}>
              Konfirmasikan usia dan persetujuan kebijakan agar setiap kesepakatan dibuat dengan jelas.
            </Text>
          </View>

          <Image
            accessible={false}
            pointerEvents="none"
            resizeMode="stretch"
            source={require('../../assets/images/consent-wave.png')}
            style={styles.wave}
          />

          <View style={styles.formSection}>
            <View style={styles.formHeading}>
              <Text style={styles.formTitle}>Persetujuan penggunaan</Text>
              <Text style={styles.formDescription}>Lengkapi data berikut untuk masuk ke ruang kerja.</Text>
            </View>

            <ConsentFields value={value} onChange={setValue} />

            {mutation.error || error ? (
              <InlineNotice tone="error">{mutation.error?.message ?? error}</InlineNotice>
            ) : null}

            <View style={styles.actions}>
              <ActionButton
                label="Setuju dan lanjutkan"
                loading={mutation.isPending}
                onPress={() => mutation.mutate()}
              />
              <ActionButton
                disabled={mutation.isPending}
                label="Keluar dari akun"
                onPress={() => {
                  setError('');
                  void logoutSession().catch(() => setError('Sesi server belum dapat dicabut. Periksa koneksi lalu coba lagi.'));
                }}
                variant="secondary"
              />
            </View>

            <Text style={styles.footer}>Data persetujuan disimpan bersama versi kebijakan yang kamu setujui.</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, backgroundColor: colors.background, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 38 },
  poster: { alignSelf: 'center', width: '100%', maxWidth: 560, overflow: 'hidden', borderRadius: 36, backgroundColor: colors.surface },
  hero: { overflow: 'hidden', backgroundColor: colors.inkDeep, paddingHorizontal: spacing.xxl, paddingTop: spacing.xl, paddingBottom: 145 },
  heroOrb: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 38, borderColor: colors.primaryBright, opacity: 0.22, right: -82, top: -82 },
  wordmark: { marginBottom: 38 },
  eyebrow: { color: colors.gold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.white, fontSize: 28, lineHeight: 35, fontWeight: '800', letterSpacing: -0.8, marginTop: spacing.sm },
  description: { color: '#DCEDE8', fontSize: 13, lineHeight: 20, maxWidth: 350, marginTop: spacing.sm },
  wave: { width: '100%', height: 140, marginTop: -140 },
  formSection: { backgroundColor: colors.surface, paddingHorizontal: spacing.xl, paddingTop: 0, paddingBottom: 30, gap: spacing.xl },
  formHeading: { gap: 6 },
  formTitle: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.45 },
  formDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  actions: { gap: spacing.md },
  footer: { alignSelf: 'center', maxWidth: 340, color: colors.textSubtle, fontSize: 10, lineHeight: 15, textAlign: 'center', paddingHorizontal: spacing.md, marginTop: spacing.sm },
});
