import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useAuthSession } from '@/features/auth';
import { queryClient } from '@/lib/query-client';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }) });

export function PushListener() {
  const router = useRouter();
  const { isReady } = useAuthSession();
  useEffect(() => {
    if (!isReady) return;
    const open = (response: Notifications.NotificationResponse | null) => {
      const path = response?.notification.request.content.data?.path;
      if (typeof path !== 'string' || !/^\/(?:projects\/[0-9a-f-]{36}\/activity|invitations\/[0-9a-f-]{36})$/i.test(path)) return;
      router.push(path as Href);
      void Notifications.clearLastNotificationResponseAsync();
    };
    const response = Notifications.addNotificationResponseReceivedListener(open);
    const received = Notifications.addNotificationReceivedListener(() => { void queryClient.invalidateQueries(); });
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);
    return () => { response.remove(); received.remove(); };
  }, [isReady, router]);
  return null;
}
