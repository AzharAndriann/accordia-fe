import { Stack } from 'expo-router';
import { View } from 'react-native';

import { BottomNavigation } from '@/components/bottom-navigation';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false, title: 'Beranda' }} />
        <Stack.Screen name="account" options={{ headerShown: false, title: 'Akun' }} />
        <Stack.Screen name="projects/index" options={{ headerShown: false, title: 'Proyek' }} />
        <Stack.Screen name="projects/new" options={{ title: 'Buat proyek' }} />
        <Stack.Screen name="projects/[id]/index" options={{ title: 'Detail proyek' }} />
        <Stack.Screen name="projects/[id]/agreement" options={{ title: 'Kesepakatan' }} />
        <Stack.Screen name="projects/[id]/changes" options={{ title: 'Perubahan' }} />
        <Stack.Screen name="projects/[id]/deliveries" options={{ title: 'Penyerahan' }} />
        <Stack.Screen name="projects/[id]/payments" options={{ title: 'Pembayaran' }} />
      </Stack>
      <BottomNavigation />
    </View>
  );
}
