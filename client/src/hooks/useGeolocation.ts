import { useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { apiRequest } from '@/lib/queryClient';

const LOCATION_INTERVAL_MS = 60000; // Every 60 seconds

export function useGeolocation(userId: string | undefined) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bgWatcherRef = useRef<string | null>(null);
  const appListenerRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    const sendLocation = (lat: number, lng: number, source: string) => {
      console.log(`[GEO ${source}] Sending location: ${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      apiRequest('POST', '/api/users/location', { latitude: lat, longitude: lng }).catch((err) =>
        console.warn(`[GEO ${source}] Failed to send location:`, err.message)
      );
    };

    // Always start web tracking as baseline
    startWebTracking();

    // Native mobile: ALSO try background geolocation plugin
    if (Capacitor.isNativePlatform()) {
      console.log('[GEO] Native platform detected, attempting background tracking...');

      const startBackgroundTracking = async () => {
        try {
          const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');
          console.log('[GEO BG] Plugin registered, calling addWatcher...');

          const watcherId = await BackgroundGeolocation.addWatcher(
            {
              backgroundMessage: 'Aplikacija radi u pozadini',
              backgroundTitle: 'Hotel Management',
              requestPermissions: true,
              stale: false,
              distanceFilter: 10,
            },
            (location: any, error: any) => {
              if (error) {
                console.warn('[GEO BG] Watcher error:', error.code, error.message);
                return;
              }
              if (location) {
                sendLocation(location.latitude, location.longitude, 'BG');
              }
            }
          );

          bgWatcherRef.current = watcherId;
          console.log('[GEO BG] Background tracking STARTED, watcher ID:', watcherId);
        } catch (err: any) {
          console.error('[GEO BG] FAILED:', err?.message || err);
        }
      };

      startBackgroundTracking();

      // Send location when app comes back to foreground
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            console.log('[GEO] App resumed from background');
            fetchAndSendOnce('RESUME');
          }
        }).then((listener) => {
          appListenerRef.current = listener;
        });
      }).catch(() => {});
    }

    function fetchAndSendOnce(source: string) {
      if (!('geolocation' in navigator)) return;
      navigator.geolocation.getCurrentPosition(
        (pos) => sendLocation(pos.coords.latitude, pos.coords.longitude, source),
        (err) => console.warn(`[GEO ${source}] Position unavailable:`, err.message),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    function startWebTracking() {
      if (!('geolocation' in navigator)) return;
      console.log('[GEO WEB] Starting web geolocation tracking');
      fetchAndSendOnce('WEB');
      intervalRef.current = setInterval(() => fetchAndSendOnce('WEB'), LOCATION_INTERVAL_MS);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (bgWatcherRef.current) {
        try {
          const BackgroundGeolocation = registerPlugin<any>('BackgroundGeolocation');
          BackgroundGeolocation.removeWatcher({ id: bgWatcherRef.current });
        } catch (e) {}
        bgWatcherRef.current = null;
      }
      if (appListenerRef.current) {
        appListenerRef.current.remove();
        appListenerRef.current = null;
      }
    };
  }, [userId]);
}
