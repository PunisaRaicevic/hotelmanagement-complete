import { useEffect } from 'react';
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
    return () => clearInterval(interval);
  }, [userId]);
}
