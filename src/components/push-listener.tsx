import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';
import { useAuthSession } from '@/features/auth';
import { eventKeys } from '@/features/events';
import { invitationKeys } from '@/features/invitations';
import { projectKeys } from '@/features/projects';
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
    const received = Notifications.addNotificationReceivedListener((notification) => {
      const path = notification.request.content.data?.path;

      // Mark cached screens stale without immediately refetching every mounted
      // route. Only refresh the small set that is relevant to this push.
      void queryClient.invalidateQueries({ refetchType: 'none' }).then(async () => {
        if (typeof path === 'string' && /^\/invitations\/[0-9a-f-]{36}$/i.test(path)) {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: invitationKeys.all, type: 'active' }),
            queryClient.refetchQueries({ queryKey: projectKeys.all, type: 'active' }),
          ]);
          return;
        }

        const projectId = typeof path === 'string'
          ? path.match(/^\/projects\/([0-9a-f-]{36})\/activity$/i)?.[1]
          : undefined;
        if (projectId) {
          await Promise.all([
            queryClient.refetchQueries({ queryKey: projectKeys.all, type: 'active' }),
            queryClient.refetchQueries({ queryKey: eventKeys.list(projectId), type: 'active' }),
          ]);
        }
      });
    });
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => undefined);
    return () => { response.remove(); received.remove(); };
  }, [isReady, router]);
  return null;
}
