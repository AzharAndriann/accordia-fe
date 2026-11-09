import { AndroidImportance } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authenticatedRequest } from '@/lib/api';

const expoPushEndpoint = 'https://exp.host/--/api/v2/push/send';

async function getPushToken() {
  if (Platform.OS === 'web') throw new Error('Notifikasi push tersedia pada aplikasi Android/iOS.');
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Notifikasi perangkat belum dikonfigurasi untuk build aplikasi ini.');
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Pembaruan proyek', importance: AndroidImportance.DEFAULT });
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) throw new Error('Izin notifikasi belum diberikan. Aktifkan melalui pengaturan perangkat.');
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

export async function enablePush() {
  const token = await getPushToken();
  await authenticatedRequest('/notifications/device', { method: 'PUT', body: JSON.stringify({ token, platform: Platform.OS }) });
  if (__DEV__) console.info(`[Accordia push] ExpoPushToken: ${token}`);
}

export async function sendPushTest() {
  if (!__DEV__) throw new Error('Tes notifikasi hanya tersedia pada development build.');
  const token = await getPushToken();
  const response = await fetch(expoPushEndpoint, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: token,
      title: 'Tes notifikasi Accordia',
      body: 'Expo, FCM, dan perangkat Android berhasil terhubung.',
      sound: 'default',
      channelId: 'default',
    }),
  });
  const payload = await response.json().catch(() => null) as {
    data?: { status?: string; message?: string };
    errors?: { message?: string }[];
  } | null;
  const ticket = payload?.data;
  if (!response.ok || ticket?.status !== 'ok') {
    throw new Error(ticket?.message ?? payload?.errors?.[0]?.message ?? 'Expo belum menerima permintaan notifikasi uji.');
  }
}

export const disablePush = () => authenticatedRequest('/notifications/device', { method: 'DELETE' });
