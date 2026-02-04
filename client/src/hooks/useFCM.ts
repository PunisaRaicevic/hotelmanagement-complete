import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { apiRequest } from '@/lib/queryClient';
// NOTE: PushNotifications imported dynamically to avoid errors on web platform

// 🔥 Kreiranje notification channel-a za Android
const createNotificationChannel = async () => {
  const platform = Capacitor.getPlatform();
  if (platform !== 'android') {
    console.log(`⏭️ [FCM] Skipping notification channel - platform is ${platform}`);
    return;
  }
  
  try {
    // Dinamički import PushNotifications samo na native platformama
    const { PushNotifications: PN } = await import('@capacitor/push-notifications');
    await PN.createChannel({
      id: 'reklamacije-alert', // 🔥 MORA SE POKLAPATI SA channelId u Firebase Cloud Function
      name: 'Reklamacije Notifikacije',
      description: 'Notifikacije za dodeljene reklamacije i zadatke',
      importance: 5, // 5 = Max importance (sa zvukom)
      sound: 'default',
      vibration: true,
      visibility: 1, // Public
    });
    console.log('✅ [FCM] Notification channel "reklamacije-alert" created');
  } catch (error) {
    console.error('❌ [FCM] Error creating notification channel:', error);
  }
};

// 🔥 Global FCM status for debugging
export let fcmDebugStatus = {
  lastAttempt: '',
  platform: '',
  step: '',
  error: '',
  tokenSaved: false
};

export const useFCM = (userId?: string) => {
  useEffect(() => {
    // 🔴 UVEK logujem kada se hook pozove - i na web i na mobilnom
    const callTime = new Date().toLocaleTimeString();
    const platform = Capacitor.getPlatform();
    const isNative = Capacitor.isNativePlatform();

    console.log(`📱 [useFCM:${callTime}] Hook called with userId:`, userId ? `${userId.substring(0, 8)}...` : 'UNDEFINED');
    console.log(`📱 [useFCM:${callTime}] Window location:`, typeof window !== 'undefined' ? window.location.href : 'NO WINDOW');
    console.log(`📱 [useFCM:${callTime}] Platform:`, platform);
    console.log(`📱 [useFCM:${callTime}] isNativePlatform:`, isNative);

    // Update global debug status
    fcmDebugStatus = {
      ...fcmDebugStatus,
      lastAttempt: callTime,
      platform: platform,
      step: 'hook_started'
    };

    // 🔥 Show visible alert on MOBILE to confirm code is running (remove after debugging)
    if (isNative && userId) {
      // Using native alert so it's visible even if toasts don't work
      setTimeout(() => {
        console.log(`📱 [useFCM] NATIVE DETECTED - Starting FCM registration for ${userId.substring(0, 8)}...`);
      }, 100);
    }

    if (!userId) {
      console.warn(`⚠️ [useFCM:${callTime}] Skipping FCM setup - no userId provided`);
      fcmDebugStatus.step = 'no_userId';
      return;
    }

    console.log(`✅ [useFCM:${callTime}] userId is valid - proceeding with FCM setup`);
    fcmDebugStatus.step = 'userId_valid';

    // 🔥 DEBUG: Šalji log na server da vidimo da li hook uopšte radi na mobilnoj
    const sendDebugLog = async (step: string, data?: any) => {
      try {
        const { getApiUrl } = await import('@/lib/apiUrl');
        // Use dedicated FCM debug endpoint for better tracking
        await fetch(getApiUrl('/api/mobile/fcm-debug'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: userId,
            platform: Capacitor.getPlatform(),
            step: step,
            data: data,
            timestamp: new Date().toISOString()
          })
        });
      } catch (e) {
        console.error('[useFCM] Debug log failed:', e);
      }
    };

    sendDebugLog('useFCM hook started', { userId: userId.substring(0, 8), platform: Capacitor.getPlatform() });

    let isMounted = true;
    let hasStarted = false;

    const setupFCM = async () => {
      if (hasStarted || !isMounted) return;
      hasStarted = true;
      const setupTime = new Date().toLocaleTimeString();

      try {
        // Detektuj platform - koristi getPlatform() umesto isNativePlatform()
        const platform = Capacitor.getPlatform();
        const isNative = platform !== 'web';
        
        console.log(`🚀 [FCM:${setupTime}] Platform DETECTED: ${platform}, Is Native: ${isNative}`);
        console.log(`🚀 [FCM:${setupTime}] Capacitor.isNativePlatform() = ${Capacitor.isNativePlatform()}`);

        // Proveravamo JWT token
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.warn(`⚠️ [FCM:${setupTime}] Nema JWT tokena!`);
          return;
        }

        console.log(`✅ [FCM:${setupTime}] JWT token dostupan`);

        if (!isNative) {
          // 🌐 WEB VERZIJA - Čekam pravi Firebase Web FCM token (Not implemented yet - čeka Firebase setup)
          console.log(`🌐 [FCM:${setupTime}] Web verzija detektovana - Web Firebase Messaging će biti iniciјalizovan iz App.tsx`);
          return;
        }

        // ========== MOBILNA VERZIJA - Android/iOS ==========
        console.log(`📱 [FCM:${setupTime}] MOBILNA VERZIJA DETEKTOVANA! Platform: ${platform}`);
        sendDebugLog('MOBILE DETECTED - Starting FCM setup', { platform });
        fcmDebugStatus.step = 'mobile_detected';

        // 🔥 1. Kreiraj notification channel (samo Android)
        console.log(`📝 [FCM:${setupTime}] Kreiram notification channel...`);
        await createNotificationChannel();
        console.log(`✅ [FCM:${setupTime}] Notification channel kreiran`);
        sendDebugLog('Notification channel created');

        // Dinamički import PushNotifications
        console.log(`📝 [FCM:${setupTime}] Importujem @capacitor/push-notifications...`);
        const { PushNotifications } = await import('@capacitor/push-notifications');
        console.log(`✅ [FCM:${setupTime}] PushNotifications importovan`);

        // 2. Tražimo dozvolu
        console.log(`📋 [FCM:${setupTime}] Zahtevam push dozvole...`);
        sendDebugLog('Requesting push permissions...');
        const permResult = await PushNotifications.requestPermissions();
        console.log(`✅ [FCM:${setupTime}] Permission result:`, permResult.receive);
        sendDebugLog('Permission result', { receive: permResult.receive });

        if (permResult.receive !== 'granted') {
          console.warn(`⚠️ [FCM:${setupTime}] Push dozvola nije odobrena - status:`, permResult.receive);
          console.error(`❌ [FCM:${setupTime}] FAIL: Push dozvola NIJE ODOBRENA`);
          sendDebugLog('PERMISSION DENIED', { status: permResult.receive });
          return;
        }
        console.log(`✅ [FCM:${setupTime}] Push dozvola odobrena`);
        sendDebugLog('Permission GRANTED');

        // 3. Registrujemo uređaj i čekamo token
        console.log(`📝 [FCM:${setupTime}] Registrujem uređaj...`);

        let tokenReceived = false;
        const tokenTimeout = setTimeout(() => {
          if (!tokenReceived && isMounted) {
            console.warn(`⚠️ [FCM:${setupTime}] Token nije primljen nakon 10s`);
          }
        }, 10000);

        PushNotifications.addListener('registration', async (fcmToken) => {
          const regTime = new Date().toLocaleTimeString();
          clearTimeout(tokenTimeout);
          tokenReceived = true;

          console.log(`🔥 [FCM:${regTime}] Token primljen:`, fcmToken.value?.substring(0, 50) + '...');
          sendDebugLog('FCM TOKEN RECEIVED!', { tokenLength: fcmToken.value?.length });

          if (!isMounted) return;

          try {
            console.log(`📤 [FCM:${regTime}] Slanje tokena na backend - Platform: ${platform}, Token length: ${fcmToken.value.length}...`);
            const payload = {
              token: fcmToken.value,
              platform: platform,
            };
            console.log(`📤 [FCM:${regTime}] Payload koji se šalje:`, { ...payload, token: payload.token.substring(0, 30) + '...' });
            sendDebugLog('Sending token to backend...', { platform, tokenLength: fcmToken.value.length });

            const response = await apiRequest('POST', '/api/users/fcm-token', payload);
            console.log(`✅ [FCM:${regTime}] Token sačuvan na backend!`, response);
            sendDebugLog('TOKEN SAVED TO BACKEND!', { status: response.status });
            fcmDebugStatus.step = 'token_saved';
            fcmDebugStatus.tokenSaved = true;
          } catch (err: any) {
            console.error(`❌ [FCM:${regTime}] Greška pri slanju tokena:`, err);
            sendDebugLog('ERROR SAVING TOKEN', { error: err?.message || String(err) });
            fcmDebugStatus.step = 'token_save_error';
            fcmDebugStatus.error = err?.message || String(err);
          }
        });

        PushNotifications.addListener('registrationError', (err: any) => {
          const errTime = new Date().toLocaleTimeString();
          clearTimeout(tokenTimeout);
          console.error(`❌ [FCM:${errTime}] Greška pri registraciji:`, err?.message || JSON.stringify(err));
          sendDebugLog('REGISTRATION ERROR!', { error: err?.message || JSON.stringify(err) });
          fcmDebugStatus.step = 'registration_error';
          fcmDebugStatus.error = err?.message || JSON.stringify(err);
        });

        PushNotifications.addListener('pushNotificationReceived', async (notification) => {
          const notifTime = new Date().toLocaleTimeString();
          console.log(`📥 [FCM:${notifTime}] Primljena notifikacija:`, notification);
          
          // 🔥 KLJUČNO: Prikaži LOCAL NOTIFICATION sa zvukom i vibracijom
          // Ovo će raditi i kada je app u background-u!
          try {
            const { LocalNotifications } = await import('@capacitor/local-notifications');
            
            // Tražimo dozvolu za local notifikacije
            const permResult = await LocalNotifications.requestPermissions();
            if (permResult.display !== 'granted') {
              console.warn(`⚠️ [FCM:${notifTime}] Local notification dozvola nije odobrena`);
              return;
            }
            
            // Prikaži notifikaciju SA ZVUKOM
            await LocalNotifications.schedule({
              notifications: [
                {
                  title: notification.data?.title || notification.notification?.title || 'Novi zadatak',
                  body: notification.data?.body || notification.notification?.body || 'Imate novi zadatak',
                  id: Date.now(),
                  sound: 'default', // ZVUK!
                  smallIcon: 'ic_stat_icon_config_sample',
                  channelId: 'reklamacije-alert',
                  extra: notification.data,
                },
              ],
            });
            console.log(`✅ [FCM:${notifTime}] Local notification prikazana sa zvukom!`);
          } catch (error) {
            console.error(`❌ [FCM:${notifTime}] Greška pri prikazu local notifikacije:`, error);
          }
        });

        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const actionTime = new Date().toLocaleTimeString();
          console.log(`🔔 [FCM:${actionTime}] Korisnik kliknuo na notifikaciju`);
          const data = action.notification.data;
          if (data?.taskId) {
            console.log(`🔗 [FCM:${actionTime}] Task ID:`, data.taskId);
          }
        });

        // 4. Registruj uređaj
        console.log(`📝 [FCM:${setupTime}] Pozivam PushNotifications.register()...`);
        sendDebugLog('Calling PushNotifications.register()...');
        await PushNotifications.register();
        console.log(`✅ [FCM:${setupTime}] Uređaj registrovan - čekam token...`);
        sendDebugLog('PushNotifications.register() completed - waiting for token...');

      } catch (error: any) {
        const errorTime = new Date().toLocaleTimeString();
        console.error(`❌ [FCM:${errorTime}] Greška pri inicijalizaciji:`, error?.message || error);
        console.error(`❌ [FCM:${errorTime}] Full stack:`, error);
        sendDebugLog('FCM INITIALIZATION ERROR', { error: error?.message || String(error) });
      }
    };

    // Čekamo da se JWT token kešira pre nego što pokrenemo FCM
    console.log(`📝 [useFCM:${callTime}] Postavljam timeout od 500ms za setupFCM...`);
    const timer = setTimeout(() => {
      if (isMounted) {
        console.log(`📝 [useFCM] Pozivam setupFCM...`);
        setupFCM();
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      try {
        const platform = Capacitor.getPlatform();
        if (platform !== 'web') {
          import('@capacitor/push-notifications').then(({ PushNotifications }) => {
            PushNotifications.removeAllListeners();
          });
        }
      } catch (e) {
        // Ignore cleanup errors
      }
    };
  }, [userId]);
};