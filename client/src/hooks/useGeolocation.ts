import { useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

const LOCATION_INTERVAL_MS = 60000; // Send location every 60 seconds

export function useGeolocation(userId: string | undefined) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!userId || !('geolocation' in navigator)) return;

    const sendLocation = (lat: number, lng: number) => {
      apiRequest('POST', '/api/users/location', { latitude: lat, longitude: lng }).catch((err) =>
        console.warn('[GEO] Failed to send location:', err.message)
      );
    };

    // Get fresh position and send it - fails if GPS is off
    const fetchAndSend = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
        (err) => console.warn('[GEO] Position unavailable:', err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    // Send initial position
    fetchAndSend();

    // Send fresh position periodically (not cached)
    intervalRef.current = setInterval(fetchAndSend, LOCATION_INTERVAL_MS);

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [userId]);
}
