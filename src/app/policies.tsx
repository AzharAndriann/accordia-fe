import { useQuery } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fetchPolicies } from '@/features/policies';
import { ActionButton, InlineNotice } from '@/components/ui';
import { colors } from '@/theme';
import { useRouter } from 'expo-router';

export default function PoliciesScreen() {
  const router = useRouter();
  const query = useQuery({ queryKey: ['public-policies'], queryFn: fetchPolicies });
  const policy = query.data?.data;
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
    <ActionButton label="Kembali" onPress={() => router.back()} variant="secondary" />
    {query.isPending ? <Text>Memuat kebijakan...</Text> : null}
    {query.isError ? <><InlineNotice tone="error">Kebijakan gagal dimuat.</InlineNotice><ActionButton label="Coba lagi" onPress={() => void query.refetch()} /></> : null}
    {policy ? <><Text>Versi {policy.version}</Text>{[policy.terms, policy.privacy].map((section) => <View key={section.title} style={{ gap: 12 }}><Text style={{ fontSize: 24, fontWeight: '700', color: colors.ink }}>{section.title}</Text><Text style={{ fontSize: 16, lineHeight: 26, color: colors.text }}>{section.content}</Text></View>)}</> : null}
  </ScrollView></SafeAreaView>;
}
