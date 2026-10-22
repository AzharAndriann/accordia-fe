import { Redirect, Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { AppStackHeader } from '@/components/app-stack-header';
import { BottomNavigation } from '@/components/bottom-navigation';
import { useAuthSession } from '@/features/auth';

export default function AppLayout() {
  const router = useRouter();
  const { isReady, user } = useAuthSession();
  const renderHeader = (title: string) => (
    <AppStackHeader onBack={() => router.back()} title={title} />
  );

  if (!isReady) return <ActivityIndicator color="#176B5B" style={{ flex: 1 }} />;
  if (!user) return <Redirect href="/(auth)/login" />;

  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Beranda' }} />
        <Stack.Screen name="account" options={{ headerShown: false, title: 'Akun' }} />
        <Stack.Screen name="projects/index" options={{ headerShown: false, title: 'Proyek' }} />
        <Stack.Screen
          name="projects/new"
          options={{ header: () => renderHeader('Buat proyek'), title: 'Buat proyek' }}
        />
        <Stack.Screen
          name="projects/[id]/index"
          options={{ header: () => renderHeader('Detail proyek'), title: 'Detail proyek' }}
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
      </Stack>
      <BottomNavigation />
    </View>
  );
}
