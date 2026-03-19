import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { apiRequest } from '@/lib/queryClient';

const HEARTBEAT_INTERVAL_MS = 60000; // Every 60 seconds

export function useHeartbeat(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    const sendHeartbeat = () => {
      apiRequest('POST', '/api/users/heartbeat', {}).catch(() => {});
    };

    // Send immediately on login
    sendHeartbeat();

    const interval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

    // On mobile: also send heartbeat when app returns from background
    let appStateListener: any = null;
    if (Capacitor.isNativePlatform()) {
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            console.log('[HEARTBEAT] App resumed from background, sending heartbeat');
            sendHeartbeat();
          }
        }).then((listener) => {
          appStateListener = listener;
        });
      }).catch(() => {});
    }

    // Web: send heartbeat when tab becomes visible again
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      if (appStateListener) {
        appStateListener.remove();
      }
    };
  }, [userId]);
}
