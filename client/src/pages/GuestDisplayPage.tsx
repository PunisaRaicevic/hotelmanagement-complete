import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { Hotel, Wifi, WifiOff, LogOut, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

interface QRData {
  room_number: string;
  guest_name: string;
  qr_url: string;
  token: string;
}

export default function GuestDisplayPage() {
  const { user, loading, logout } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [qrData, setQrData] = useState<QRData | null>(null);
  const [connected, setConnected] = useState(false);
  const [headerVisible, setHeaderVisible] = useState(false);
  const currentTokenRef = useRef<string | null>(null);
  const headerTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const isAuthenticated = !!user;

  // Auto-hide header after 5 seconds
  useEffect(() => {
    if (headerVisible) {
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
      headerTimeoutRef.current = setTimeout(() => {
        setHeaderVisible(false);
      }, 5000);
    }
    return () => {
      if (headerTimeoutRef.current) {
        clearTimeout(headerTimeoutRef.current);
      }
    };
  }, [headerVisible]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  useEffect(() => {
    if (!user?.id) return;

    // Dinamička URL selekcija za mobile vs web
    let socketUrl: string;
    if (Capacitor.isNativePlatform()) {
      socketUrl = import.meta.env.VITE_API_URL || 'https://hotelmanagement-complete-production.up.railway.app';
    } else {
      socketUrl = window.location.origin;
    }

    console.log('[GUEST DISPLAY] Connecting to Socket.IO:', socketUrl);

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      path: '/socket.io',
      autoConnect: true
    });

    newSocket.on('connect', () => {
      console.log('[GUEST DISPLAY] Connected:', newSocket.id);
      setConnected(true);
      // Pridruži se globalnoj guest-display sobi
      newSocket.emit('display:join');
    });

    newSocket.on('display:paired', (data) => {
      console.log('[GUEST DISPLAY] Paired successfully:', data);
    });

    newSocket.on('disconnect', (reason) => {
      console.warn('[GUEST DISPLAY] Disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('[GUEST DISPLAY] Connection error:', error.message);
      setConnected(false);
    });

    // Prikaži QR kod
    newSocket.on('guest-display:show-qr', (data: QRData) => {
      console.log('[GUEST DISPLAY] Received QR data:', data.room_number);
      setQrData(data);
      currentTokenRef.current = data.token;
    });

    // Sakrij QR kod
    newSocket.on('guest-display:hide-qr', () => {
      console.log('[GUEST DISPLAY] Hiding QR');
      setQrData(null);
      currentTokenRef.current = null;
    });

    // Sakrij QR ako se podudara token
    newSocket.on('guest-display:hide-qr-if-token', ({ token }: { token: string }) => {
      console.log('[GUEST DISPLAY] Hide if token matches:', token.substring(0, 8));
      if (currentTokenRef.current === token) {
        console.log('[GUEST DISPLAY] Token matched, hiding QR');
        setQrData(null);
        currentTokenRef.current = null;
      }
    });

    setSocket(newSocket);

    return () => {
      console.log('[GUEST DISPLAY] Cleanup, disconnecting');
      newSocket.emit('display:leave');
      newSocket.disconnect();
    };
  }, [user?.id, isAuthenticated]);

  // Ako korisnik nije ulogovan, prikaži poruku
  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Hotel className="w-20 h-20 mx-auto mb-6 opacity-50" />
          <h1 className="text-3xl font-bold mb-2">Guest Display</h1>
          <p className="text-xl opacity-70">Molimo prijavite se</p>
        </div>
      </div>
    );
  }

  // Provjeri da li je korisnik ima pristup guest display-u
  const allowedRoles = ['guest_display', 'recepcioner', 'admin', 'sef_domacinstva'];
  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <Hotel className="w-20 h-20 mx-auto mb-6 opacity-50" />
          <h1 className="text-3xl font-bold mb-2">Pristup odbijen</h1>
          <p className="text-xl opacity-70">Nemate pristup guest display-u</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
      </div>

      {/* Invisible trigger zone at top of screen */}
      <div
        className="absolute top-0 left-0 right-0 h-16 z-50 cursor-pointer"
        onClick={() => setHeaderVisible(true)}
      />

      {/* Pull-down Header - hidden by default */}
      <div
        className={`absolute top-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${
          headerVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="bg-black/80 backdrop-blur-md text-white px-6 py-4">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Left side - User info */}
            <div className="flex items-center gap-3">
              <Hotel className="w-6 h-6" />
              <div>
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-xs text-white/60">Guest Display</p>
              </div>
            </div>

            {/* Center - Connection status */}
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-green-400" />
                  <span className="text-green-400">Povezano</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
                  <span className="text-red-400">Nije povezano</span>
                </>
              )}
            </div>

            {/* Right side - Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Odjava</span>
            </button>
          </div>

          {/* Pull indicator */}
          <div
            className="flex justify-center mt-2 cursor-pointer"
            onClick={() => setHeaderVisible(false)}
          >
            <ChevronDown className="w-5 h-5 text-white/40 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {!qrData ? (
          // IDLE STATE - Dobrodošli poruka
          <div className="text-white animate-fade-in">
            <Hotel className="w-24 h-24 mx-auto mb-8 opacity-90" />
            <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
              Dobrodošli
            </h1>
            <p className="text-2xl md:text-3xl opacity-80 mb-2">
              Welcome
            </p>
            <p className="text-xl opacity-60 mt-8">
              Willkommen | Benvenuti | Bienvenue
            </p>

            {/* Subtle pulse indicator */}
            <div className="mt-12 flex justify-center gap-2">
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-white/40 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        ) : (
          // QR CODE STATE - Prikaži QR kod
          <div className="animate-scale-in">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-md mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
                Skenirajte QR kod
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                Soba {qrData.room_number}
                {qrData.guest_name && qrData.guest_name !== 'Gost' && (
                  <span className="block text-base mt-1">{qrData.guest_name}</span>
                )}
              </p>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner border-4 border-gray-100">
                <QRCodeSVG
                  value={qrData.qr_url}
                  size={280}
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="mt-6 text-sm text-gray-500">
                Scan to access guest portal
              </p>
            </div>

            {/* Room number badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full">
              <Hotel className="w-5 h-5" />
              <span className="text-xl font-semibold">Soba {qrData.room_number}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer - minimal, no user info (it's in header now) */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/20 text-xs">
        Tapnite na vrh ekrana za opcije
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }
        .delay-100 {
          animation-delay: 0.1s;
        }
        .delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
}
