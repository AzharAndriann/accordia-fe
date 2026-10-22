import { Redirect, Stack } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { useAuthSession } from '@/features/auth';

export default function AuthLayout() {
  const { isReady, user } = useAuthSession();
  if (!isReady) return <ActivityIndicator color="#176B5B" style={{ flex: 1 }} />;
  if (user) return <Redirect href="/(app)" />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
