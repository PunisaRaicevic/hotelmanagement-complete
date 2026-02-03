import { Capacitor } from "@capacitor/core";
import type { Messaging } from "firebase/messaging";

// Firebase Web Messaging - ONLY for web platform
// On native (Android/iOS), use Capacitor Push Notifications instead
let messaging: Messaging | null = null;
let firebaseInitialized = false;

// Initialize Firebase ONLY on web platform
async function initializeFirebaseWeb() {
  if (firebaseInitialized) return;

  // Skip Firebase Web SDK on native platforms - it doesn't work there
  if (Capacitor.isNativePlatform()) {
    console.log("[Firebase] Native platform detected - skipping Web SDK, using Capacitor Push Notifications");
    firebaseInitialized = true;
    return;
  }

  try {
    const { initializeApp } = await import("firebase/app");
    const { getMessaging } = await import("firebase/messaging");

    // IMPORTANT: Match mobile app Firebase project (google-services.json)
    const firebaseConfig = {
      apiKey: "AIzaSyBfYhSzQH_qVPTVsCO9X85R8Kl6-k6f8dY",
      authDomain: "hotelmanagement-complete.firebaseapp.com",
      projectId: "hotelmanagement-complete",
      storageBucket: "hotelmanagement-complete.firebasestorage.app",
      messagingSenderId: "97241477060",
      appId: "1:97241477060:web:eca4ce4e2117d2cf6a3e91",
    };

    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
    console.log("[Firebase] Web messaging initialized");
  } catch (error) {
    console.warn("[Firebase] Could not initialize web messaging:", error);
  }

  firebaseInitialized = true;
}

// Auto-initialize on web (safe because we check platform)
if (typeof window !== 'undefined') {
  initializeFirebaseWeb();
}

// Wrapper for getToken that handles null messaging
const getToken = async (messagingInstance: Messaging | null, options?: { vapidKey?: string }) => {
  if (!messagingInstance) {
    console.warn("[Firebase] Messaging not available on this platform");
    return null;
  }
  const { getToken: firebaseGetToken } = await import("firebase/messaging");
  return firebaseGetToken(messagingInstance, options);
};

export { messaging, getToken };