import { useEffect, useRef } from 'react';
import { Capacitor, registerPlugin } from '@capacitor/core';
import { apiRequest } from '@/lib/queryClient';

const LOCATION_INTERVAL_MS = 60000; // Every 60 seconds

// Register the native background geolocation plugin
interface BackgroundGeolocationPlugin {
  addWatcher(
    options: {
      backgroundMessage?: string;
      backgroundTitle?: string;
      requestPermissions?: boolean;
      stale?: boolean;
      distanceFilter?: number;
    },
    callback: (position?: any, error?: any) => void
  ): Promise<string>;
  removeWatcher(options: { id: string }): Promise<void>;
}

const BackgroundGeolocation = registerPlugin<BackgroundGeolocationPlugin>(
  'BackgroundGeolocation'
);

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

    // Always start web tracking (works as baseline on all platforms)
    startWebTracking();

    // Native mobile: ALSO try background geolocation plugin for screen-off tracking
    if (Capacitor.isNativePlatform()) {
      console.log('[GEO] Native platform detected, starting background tracking...');

      const startBackgroundTracking = async () => {
        try {
          console.log('[GEO BG] Calling addWatcher...');
          const watcherId = await BackgroundGeolocation.addWatcher(
            {
              backgroundMessage: 'Praćenje lokacije je aktivno',
              backgroundTitle: 'Hotel Management',
              requestPermissions: true,
              stale: false,
              distanceFilter: 10,
            },
            (location, error) => {
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
          console.error('[GEO BG] FAILED to start background tracking:', err);
          console.error('[GEO BG] Error details:', JSON.stringify(err));
        }
      };

      startBackgroundTracking();

      // Also send location when app comes back to foreground
      import('@capacitor/app').then(({ App }) => {
        App.addListener('appStateChange', ({ isActive }) => {
          if (isActive) {
            console.log('[GEO] App resumed from background');
            fetchAndSendOnce('RESUME');
          }
        }).then((listener) => {
          appListenerRef.current = listener;
        });
      }).catch((err) => {
        console.warn('[GEO] Failed to add app state listener:', err);
      });
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
      if (bgWatcherRef.current && Capacitor.isNativePlatform()) {
        BackgroundGeolocation.removeWatcher({ id: bgWatcherRef.current });
        bgWatcherRef.current = null;
      }
      if (appListenerRef.current) {
        appListenerRef.current.remove();
        appListenerRef.current = null;
      }
    };
  }, [userId]);
}
