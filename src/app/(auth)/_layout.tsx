import { type Href, Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { useAuthSession } from '@/features/auth';
import { colors } from '@/theme';

export default function AuthLayout() {
  const { isReady, user } = useAuthSession();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  if (!isReady) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;
  if (user) return <Redirect href={(redirect?.startsWith('/') ? redirect : '/(app)') as Href} />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
