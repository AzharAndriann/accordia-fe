import { useMutation } from '@tanstack/react-query';
import { postAuthRoute } from '@/lib/invitation-route';
import { logoutSession } from '@/features/auth/auth.api';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, InlineNotice } from '@/components/ui';
import { acceptPolicies, ConsentFields, consentSchema, emptyConsent } from '@/features/policies';
import { getCurrentUser, updateSessionUser } from '@/lib/session';
import { useAuthSession } from '@/features/auth';
import { colors } from '@/theme';

export default function ConsentScreen() {
  const { invitationId } = useLocalSearchParams<{ invitationId?: string }>();
  const { isReady, user } = useAuthSession();
  const [value, setValue] = useState(emptyConsent);
  const [error, setError] = useState('');
  const mutation = useMutation({ mutationFn: async () => {
    const parsed = consentSchema.safeParse(value);
    if (!parsed.success) throw new Error(parsed.error.issues[0].message);
    await acceptPolicies(parsed.data);
    const current = getCurrentUser();
    if (current) await updateSessionUser({ ...current, needsConsent: false });
  } });
  if (!isReady) return null;
  if (!user) return <Redirect href="/(auth)/login" />;
  if (user.needsConsent === false) return <Redirect href={postAuthRoute(invitationId, false)} />;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
    <Text style={{ fontSize: 26, fontWeight: '700' }}>Persetujuan penggunaan</Text>
    <Text>Lengkapi pernyataan usia dan persetujuan kebijakan sebelum melanjutkan.</Text>
    <ConsentFields value={value} onChange={setValue} />
    {mutation.error || error ? <InlineNotice tone="error">{mutation.error?.message ?? error}</InlineNotice> : null}
    <ActionButton label="Setuju dan lanjutkan" loading={mutation.isPending} onPress={() => mutation.mutate()} />
    <ActionButton label="Keluar" variant="secondary" disabled={mutation.isPending} onPress={() => { setError(''); void logoutSession().catch(() => setError('Sesi server belum dapat dicabut. Periksa koneksi lalu coba lagi.')); }} />
  </ScrollView></SafeAreaView>;
}
