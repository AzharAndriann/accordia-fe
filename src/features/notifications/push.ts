import { AndroidImportance } from 'expo-notifications';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { authenticatedRequest } from '@/lib/api';


export async function enablePush() {
  if (Platform.OS === 'web') throw new Error('Notifikasi push tersedia pada aplikasi Android/iOS.');
  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Notifikasi perangkat belum dikonfigurasi untuk build aplikasi ini.');
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('default', { name: 'Pembaruan proyek', importance: AndroidImportance.DEFAULT });
  let permissions = await Notifications.getPermissionsAsync();
  if (!permissions.granted) permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) throw new Error('Izin notifikasi belum diberikan. Aktifkan melalui pengaturan perangkat.');
  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await authenticatedRequest('/notifications/device', { method: 'PUT', body: JSON.stringify({ token, platform: Platform.OS }) });
  if (__DEV__) console.info(`[Accordia push] ExpoPushToken: ${token}`);
}
export const disablePush = () => authenticatedRequest('/notifications/device', { method: 'DELETE' });
