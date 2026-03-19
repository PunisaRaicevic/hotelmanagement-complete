import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { apiRequest } from '@/lib/queryClient';

const LOCATION_INTERVAL_MS = 60000; // Web fallback: every 60 seconds

export function useGeolocation(userId: string | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgWatcherRef = useRef<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const sendLocation = (lat: number, lng: number) => {
      apiRequest('POST', '/api/users/location', { latitude: lat, longitude: lng }).catch((err) =>
        console.warn('[GEO] Failed to send location:', err.message)
      );
    };

    // Native mobile: use background geolocation plugin
    if (Capacitor.isNativePlatform()) {
      const startBackgroundTracking = async () => {
        try {
          const { BackgroundGeolocation } = await import('@capacitor-community/background-geolocation');

          const watcherId = await BackgroundGeolocation.addWatcher(
            {
              backgroundMessage: 'Praćenje lokacije je aktivno',
              backgroundTitle: 'Hotel Management',
              requestPermissions: true,
              stale: false,
              distanceFilter: 10, // meters
            },
            (location, error) => {
              if (error) {
                if (error.code !== 'NOT_AUTHORIZED') {
                  console.warn('[GEO BG] Error:', error.message);
                }
                return;
              }
              if (location) {
                sendLocation(location.latitude, location.longitude);
              }
            }
          );

          bgWatcherRef.current = watcherId;
          console.log('[GEO BG] Background tracking started, watcher:', watcherId);
        } catch (err: any) {
          console.error('[GEO BG] Failed to start background tracking:', err.message);
          // Fallback to web geolocation
          startWebTracking();
        }
      };

      startBackgroundTracking();
    } else {
      // Web browser: use standard geolocation API
      startWebTracking();
    }

    function startWebTracking() {
      if (!('geolocation' in navigator)) return;

      const fetchAndSend = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude),
          (err) => console.warn('[GEO] Position unavailable:', err.message),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      };

      fetchAndSend();
      intervalRef.current = setInterval(fetchAndSend, LOCATION_INTERVAL_MS);
    }

    return () => {
      // Cleanup web tracking
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Cleanup native background tracking
      if (bgWatcherRef.current && Capacitor.isNativePlatform()) {
        import('@capacitor-community/background-geolocation').then(({ BackgroundGeolocation }) => {
          BackgroundGeolocation.removeWatcher({ id: bgWatcherRef.current! });
          bgWatcherRef.current = null;
          console.log('[GEO BG] Background tracking stopped');
        });
      }
    };
  }, [userId]);
}
