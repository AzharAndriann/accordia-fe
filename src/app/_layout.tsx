import { focusManager, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { AnimatedSplash } from '@/components/animated-splash';
import { AuthSessionProvider } from '@/features/auth';
import { queryClient } from '@/lib/query-client';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const finishSplash = useCallback(() => setShowSplash(false), []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);

  return (
    <AuthSessionProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerBackTitle: '' }}>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack>
        {showSplash ? <AnimatedSplash onFinish={finishSplash} /> : null}
      </QueryClientProvider>
    </AuthSessionProvider>
  );
}
