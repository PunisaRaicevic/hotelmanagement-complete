import { useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/queryClient';

const LOCATION_INTERVAL_MS = 60000; // Send location every 60 seconds

export function useGeolocation(userId: string | undefined) {
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastLocationRef = useRef<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (!userId || !('geolocation' in navigator)) return;

    const sendLocation = (lat: number, lng: number) => {
      lastLocationRef.current = { lat, lng };
      apiRequest('POST', '/api/users/location', { latitude: lat, longitude: lng }).catch((err) =>
        console.warn('[GEO] Failed to send location:', err.message)
      );
    };

    // Get initial position
    navigator.geolocation.getCurrentPosition(
      (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => console.warn('[GEO] Initial position error:', err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Watch position changes
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastLocationRef.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000 }
    );

    // Send location periodically
    intervalRef.current = setInterval(() => {
      if (lastLocationRef.current) {
        sendLocation(lastLocationRef.current.lat, lastLocationRef.current.lng);
      } else {
        navigator.geolocation.getCurrentPosition(
          (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
          () => {},
          { enableHighAccuracy: true, timeout: 10000 }
        );
      }
    }, LOCATION_INTERVAL_MS);

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
