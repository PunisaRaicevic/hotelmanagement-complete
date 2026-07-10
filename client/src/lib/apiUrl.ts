import { Capacitor } from '@capacitor/core';

// 🔥 Production Backend URL - Railway deployment
// VAŽNO: Za mobilne aplikacije UVIJEK koristi hardkodirani URL
// Ne koristiti VITE_API_URL jer Appflow može uključiti development URL
const BACKEND_URL = "https://hotelmanagement-complete-production.up.railway.app";

/**
 * Get the full API URL for a given endpoint
 * - Mobile app (Capacitor): uses hardcoded BACKEND_URL to connect to backend server
 * - Web app: uses relative URLs (frontend and backend on same origin)
 */
export function getApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  
  // Only use full URL for native mobile apps (Capacitor)
  // Web apps (including Replit preview) should use relative URLs
  if (Capacitor.isNativePlatform()) {
    // UVIJEK koristi hardkodirani production URL za mobilne aplikacije
    // NE koristiti import.meta.env.VITE_API_URL jer može biti development URL
    console.log(`[API] Using backend URL: ${BACKEND_URL}`);
    return `${BACKEND_URL}/${cleanEndpoint}`;
  }
  
  // Web app: use relative URLs (same origin)
  return `/${cleanEndpoint}`;
}

/**
 * Public-facing base URL for links a guest will open from their own phone
 * (QR codes, copy-link, share). Must point to the public backend, NOT the
 * dev server: `window.location.origin` returns `http://localhost:5000` when
 * staff is viewing the app on the dev machine, and a phone can't reach that.
 */
export function getPublicUrl(): string {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    if (origin && !origin.includes('localhost') && !origin.startsWith('http://127.')) {
      return origin;
    }
  }
  return BACKEND_URL;
}

/**
 * Base URL for the Socket.IO connection.
 * - Native (Capacitor APK): hardcoded BACKEND_URL (phone can't reach localhost).
 * - Web: current origin — u produkciji je to Railway domen (isti server), a u
 *   lokalnom dev-u `http://localhost:5000` (isti Express koji nosi Socket.IO).
 *   NE koristiti getPublicUrl() ovdje: on localhost preusmjeri na produkciju pa
 *   lokalni realtime ne radi.
 */
export function getSocketUrl(): string {
  if (Capacitor.isNativePlatform()) return BACKEND_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return BACKEND_URL;
}
