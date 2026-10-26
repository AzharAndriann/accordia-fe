import { type Href, Redirect, Stack, usePathname, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { AppStackHeader } from '@/components/app-stack-header';
import { BottomNavigation } from '@/components/bottom-navigation';
import { useAuthSession } from '@/features/auth';
import { colors } from '@/theme';

export default function AppLayout() {
  const router = useRouter();
  const pathname = usePathname();
  const { isReady, user } = useAuthSession();
  const [tabAnimation, setTabAnimation] = useState<'slide_from_left' | 'slide_from_right'>(
    'slide_from_right',
  );
  const renderHeader = (title: string) => (
    <AppStackHeader onBack={() => router.back()} title={title} />
  );
  const tabOptions = {
    animation: tabAnimation,
    animationTypeForReplace: 'push' as const,
    headerShown: false,
  };

  function navigateTab(route: Href, nextPath: string) {
    if (pathname === nextPath) return;
    const paths = ['/', '/projects', '/account'];
    const currentIndex = paths.indexOf(pathname);
    const nextIndex = paths.indexOf(nextPath);
    setTabAnimation(nextIndex < currentIndex ? 'slide_from_left' : 'slide_from_right');
    requestAnimationFrame(() => router.replace(route));
  }

  if (!isReady) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ ...tabOptions, title: 'Beranda' }} />
        <Stack.Screen name="account" options={{ ...tabOptions, title: 'Akun' }} />
        <Stack.Screen name="projects/index" options={{ ...tabOptions, title: 'Proyek' }} />
        <Stack.Screen
          name="notifications"
          options={{ header: () => renderHeader('Notifikasi'), title: 'Notifikasi' }}
        />
        <Stack.Screen
          name="projects/new"
          options={{ header: () => renderHeader('Buat proyek'), title: 'Buat proyek' }}
        />
        <Stack.Screen
          name="projects/[id]/index"
          options={{ header: () => renderHeader('Detail proyek'), title: 'Detail proyek' }}
        />
        <Stack.Screen
          name="projects/[id]/invite"
          options={{ header: () => renderHeader('Undang klien'), title: 'Undang klien' }}
        />
        <Stack.Screen
          name="projects/[id]/agreement"
          options={{ header: () => renderHeader('Kesepakatan'), title: 'Kesepakatan' }}
        />
        <Stack.Screen
          name="projects/[id]/changes"
          options={{ header: () => renderHeader('Perubahan'), title: 'Perubahan' }}
        />
        <Stack.Screen
          name="projects/[id]/deliveries"
          options={{ header: () => renderHeader('Penyerahan'), title: 'Penyerahan' }}
        />
        <Stack.Screen
          name="projects/[id]/payments"
          options={{ header: () => renderHeader('Pembayaran'), title: 'Pembayaran' }}
        />
        <Stack.Screen
          name="projects/[id]/activity"
          options={{ header: () => renderHeader('Aktivitas'), title: 'Aktivitas' }}
        />
      </Stack>
      <BottomNavigation onNavigate={navigateTab} />
    </View>
  );
}
