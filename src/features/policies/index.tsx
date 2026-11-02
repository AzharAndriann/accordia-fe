import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { apiRequest, authenticatedRequest } from '@/lib/api';
import { Field, InlineNotice } from '@/components/ui';
import { colors } from '@/theme';
import type { ApiSuccess } from '@/types/api';
import { z } from 'zod';

export const consentSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Isi tanggal lahir YYYY-MM-DD'),
  declaredCapacity: z.boolean().refine(Boolean, 'Pernyataan kecakapan wajib disetujui'),
  acceptedTerms: z.boolean().refine(Boolean, 'Syarat penggunaan wajib disetujui'),
  acceptedPrivacy: z.boolean().refine(Boolean, 'Kebijakan privasi wajib disetujui'),
  termsVersion: z.string().min(1, 'Muat kebijakan terlebih dahulu'),
  privacyVersion: z.string().min(1, 'Muat kebijakan terlebih dahulu'),
});
export type Consent = z.infer<typeof consentSchema>;
export const emptyConsent: Consent = { birthDate: '', declaredCapacity: false, acceptedTerms: false, acceptedPrivacy: false, termsVersion: '', privacyVersion: '' };
export type Policies = { version: string; minimumAge: number; terms: { title: string; content: string }; privacy: { title: string; content: string } };
export const fetchPolicies = () => apiRequest<ApiSuccess<Policies>>('/auth/policies');
export const acceptPolicies = (input: Consent) => authenticatedRequest('/auth/consent', { method: 'POST', body: JSON.stringify(input) });

export function ConsentFields({ value, onChange }: { value: Consent; onChange: (value: Consent) => void }) {
  const query = useQuery({ queryKey: ['public-policies'], queryFn: fetchPolicies });
  const version = query.data?.data.version;
  const set = (patch: Partial<Consent>) => onChange({ ...value, ...patch, termsVersion: version ?? '', privacyVersion: version ?? '' });
  return <View style={{ gap: 12 }}>
    {query.isError ? <><InlineNotice tone="error">Kebijakan belum dapat dimuat.</InlineNotice><Pressable onPress={() => void query.refetch()}><Text>Coba lagi</Text></Pressable></> : null}
    {query.isPending ? <Text>Memuat kebijakan...</Text> : null}
    <Field label="Tanggal lahir" value={value.birthDate} placeholder="YYYY-MM-DD" onChangeText={(birthDate) => set({ birthDate })} />
    <Check label="Saya berusia minimal 18 tahun dan menyatakan mampu membuat kesepakatan atas nama sendiri." checked={value.declaredCapacity} onPress={() => set({ declaredCapacity: !value.declaredCapacity })} />
    <Link href="/policies" style={{ color: colors.primary }}>Baca syarat penggunaan dan kebijakan privasi{version ? ` (${version})` : ''}</Link>
    <Check label="Saya menyetujui syarat penggunaan." checked={value.acceptedTerms} disabled={!version} onPress={() => set({ acceptedTerms: !value.acceptedTerms })} />
    <Check label="Saya telah membaca dan menyetujui kebijakan privasi." checked={value.acceptedPrivacy} disabled={!version} onPress={() => set({ acceptedPrivacy: !value.acceptedPrivacy })} />
  </View>;
}
function Check({ label, checked, disabled, onPress }: { label: string; checked: boolean; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8, opacity: disabled ? 0.5 : 1 }}>
    <Text style={{ color: colors.primary, fontSize: 20 }}>{checked ? '☑' : '☐'}</Text><Text style={{ flex: 1, color: colors.text, lineHeight: 21 }}>{label}</Text>
  </Pressable>;
}
