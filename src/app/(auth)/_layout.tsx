import { postAuthRoute } from '@/lib/invitation-route';
import { Redirect, Stack, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator } from 'react-native';

import { useAuthSession } from '@/features/auth';
import { colors } from '@/theme';

export default function AuthLayout() {
  const { isReady, user } = useAuthSession();
  const { invitationId } = useLocalSearchParams<{ invitationId?: string }>();
  if (!isReady) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;
  if (user) return <Redirect href={postAuthRoute(invitationId, user.needsConsent)} />;

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
