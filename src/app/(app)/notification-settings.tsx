import { useMutation } from '@tanstack/react-query';
import { ScrollView, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActionButton, InlineNotice } from '@/components/ui';
import { enablePush, disablePush } from '@/features/notifications/push';
import { colors } from '@/theme';

export default function NotificationSettings() {
  const mutation = useMutation({ mutationFn: (enabled: boolean) => enabled ? enablePush() : disablePush() });
  return <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: colors.background }}><ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
    <Text style={{ fontSize: 26, fontWeight: '700' }}>Notifikasi perangkat</Text>
    <Text>Terima pemberitahuan undangan dan pembaruan proyek di perangkat ini. Isi proyek tetap dibuka setelah masuk ke aplikasi.</Text>
    {mutation.error ? <InlineNotice tone="error">{mutation.error.message}</InlineNotice> : null}
    {mutation.isSuccess ? <InlineNotice tone="success">{mutation.variables ? 'Perangkat terdaftar untuk notifikasi.' : 'Notifikasi pada sesi perangkat ini dinonaktifkan.'}</InlineNotice> : null}
    <ActionButton label="Aktifkan notifikasi" disabled={mutation.isPending} loading={mutation.isPending && mutation.variables === true} onPress={() => mutation.mutate(true)} />
    <ActionButton label="Nonaktifkan notifikasi" variant="secondary" disabled={mutation.isPending} loading={mutation.isPending && mutation.variables === false} onPress={() => mutation.mutate(false)} />
  </ScrollView></SafeAreaView>;
}
