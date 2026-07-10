import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/contexts/AuthContext';
import { Wifi, WifiOff, LogOut, ChevronDown } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { getSocketUrl } from '@/lib/apiUrl';

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

    // native → backend, web → origin (isti izvor kao REST; ne koristi VITE_API_URL)
    const socketUrl = getSocketUrl();

    console.log('[GUEST DISPLAY] Connecting to Socket.IO:', socketUrl);

    const newSocket = io(socketUrl, {
      auth: { token: localStorage.getItem('authToken') || undefined },
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
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: '#0F2040',
          backgroundImage:
            'radial-gradient(ellipse 55% 35% at 12% 0%, rgba(195, 149, 76, 0.32), transparent 60%),' +
            'radial-gradient(ellipse 65% 55% at 100% 100%, rgba(195, 149, 76, 0.16), transparent 60%),' +
            'linear-gradient(160deg, #1B3052 0%, #142849 55%, #0F2040 100%)',
        }}
      >
        <div className="text-center text-white">
          <img src="/icon-512.webp" alt="Hotel" className="w-20 h-20 mx-auto mb-6 opacity-80 rounded-2xl shadow-lg" />
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
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundColor: '#0F2040',
          backgroundImage:
            'radial-gradient(ellipse 55% 35% at 12% 0%, rgba(195, 149, 76, 0.32), transparent 60%),' +
            'linear-gradient(160deg, #1B3052 0%, #142849 55%, #0F2040 100%)',
        }}
      >
        <div className="text-center text-white">
          <img src="/icon-512.webp" alt="Hotel" className="w-20 h-20 mx-auto mb-6 opacity-80 rounded-2xl shadow-lg" />
          <h1 className="text-3xl font-bold mb-2">Pristup odbijen</h1>
          <p className="text-xl opacity-70">Nemate pristup guest display-u</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundColor: '#0F2040',
        backgroundImage:
          'radial-gradient(ellipse 50% 35% at 18% 0%, rgba(195, 149, 76, 0.35), transparent 60%),' +
          'radial-gradient(ellipse 60% 50% at 100% 100%, rgba(195, 149, 76, 0.20), transparent 60%),' +
          'radial-gradient(ellipse 80% 80% at 50% 50%, rgba(60, 95, 145, 0.40), transparent 70%),' +
          'linear-gradient(160deg, #1B3052 0%, #142849 55%, #0F2040 100%)',
      }}
    >
      {/* Background decoration — soft floating gold orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(195,149,76,0.18) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl" style={{ background: 'radial-gradient(circle, rgba(195,149,76,0.12) 0%, transparent 70%)' }} />
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
        <div className="bg-emerald-950/85 backdrop-blur-md text-white px-6 py-4 border-b border-gold-500/20">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            {/* Left side - User info */}
            <div className="flex items-center gap-3">
              <img src="/icon-128.webp" alt="Hotel" className="w-8 h-8 rounded-lg shadow" />
              <div>
                <p className="font-semibold">{user.fullName}</p>
                <p className="text-xs text-gold-200/70">Guest Display</p>
              </div>
            </div>

            {/* Center - Connection status */}
            <div className="flex items-center gap-2 text-sm">
              {connected ? (
                <>
                  <Wifi className="w-4 h-4 text-emerald-300" />
                  <span className="text-emerald-300">Povezano</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4 text-rose-400 animate-pulse" />
                  <span className="text-rose-400">Nije povezano</span>
                </>
              )}
            </div>

            {/* Right side - Logout button */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-emerald-950 hover:bg-gold-400 rounded-lg transition-colors font-medium"
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
            <ChevronDown className="w-5 h-5 text-gold-300/40 animate-bounce" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center">
        {!qrData ? (
          // IDLE STATE - Dobrodošli poruka sa premium navy + gold logom
          <div className="text-white animate-fade-in">
            <div className="relative w-32 h-32 mx-auto mb-10">
              {/* Soft gold halo behind the logo */}
              <div className="absolute inset-0 rounded-full blur-2xl" style={{ background: 'radial-gradient(circle, rgba(195,149,76,0.45) 0%, transparent 70%)' }} />
              <img
                src="/icon-512.webp"
                alt="Hotel"
                className="relative w-32 h-32 rounded-3xl shadow-2xl ring-1 ring-gold-500/30"
              />
            </div>
            <h1 className="text-6xl md:text-7xl font-bold mb-4 tracking-tight">
              <span className="text-white">Dobro</span><span className="text-gold-400">došli</span>
            </h1>
            <p className="text-2xl md:text-3xl text-gold-200/80 mb-2 font-light italic">
              Welcome
            </p>
            <p className="text-base md:text-lg text-white/50 mt-6 tracking-wide">
              Willkommen · Benvenuti · Bienvenue
            </p>

            {/* Subtle gold pulse indicator */}
            <div className="mt-14 flex justify-center gap-2">
              <div className="w-2 h-2 bg-gold-400/60 rounded-full animate-pulse" />
              <div className="w-2 h-2 bg-gold-400/60 rounded-full animate-pulse delay-100" />
              <div className="w-2 h-2 bg-gold-400/60 rounded-full animate-pulse delay-200" />
            </div>
          </div>
        ) : (
          // QR CODE STATE - Prikaži QR kod sa gold frame
          <div className="animate-scale-in">
            <div
              className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl max-w-md mx-auto ring-1 ring-gold-500/40"
              style={{ boxShadow: '0 30px 60px -15px rgba(0,0,0,0.4), 0 0 0 1px rgba(195,149,76,0.2)' }}
            >
              <img
                src="/icon-128.webp"
                alt="Hotel"
                className="w-12 h-12 mx-auto mb-4 rounded-xl shadow"
              />
              <h2 className="text-2xl md:text-3xl font-bold text-emerald-900 mb-2">
                Skenirajte QR kod
              </h2>
              <p className="text-lg text-emerald-900/70 mb-6">
                <span className="font-semibold text-gold-600">Soba {qrData.room_number}</span>
                {qrData.guest_name && qrData.guest_name !== 'Gost' && (
                  <span className="block text-base mt-1 text-emerald-900/60">{qrData.guest_name}</span>
                )}
              </p>

              <div className="bg-white p-4 rounded-2xl inline-block shadow-inner border-4 border-gold-100">
                <QRCodeSVG
                  value={qrData.qr_url}
                  size={280}
                  level="H"
                  includeMargin={false}
                  fgColor="#142849"
                />
              </div>

              <p className="mt-6 text-sm text-emerald-900/50">
                Scan to access guest portal
              </p>
            </div>

            {/* Room number badge */}
            <div className="mt-6 inline-flex items-center gap-2 bg-gold-500/15 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-gold-500/40">
              <span className="w-2 h-2 rounded-full bg-gold-400" />
              <span className="text-xl font-semibold">Soba {qrData.room_number}</span>
            </div>
          </div>
        )}
      </div>

      {/* Footer - minimal hint + small switch-user pill.
          On a real kiosk tablet at reception, staff use the pull-down header.
          But when testing on a phone or switching demo accounts, the bottom
          pill is much more discoverable than the tap-top gesture. */}
      <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-2 text-center">
        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium text-gold-200 bg-white/5 border border-gold-500/30 hover:bg-white/15 hover:border-gold-500/50 backdrop-blur-sm transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Odjava / Switch user
        </button>
        <span className="text-gold-300/30 text-[10px] tracking-wide">
          Tapnite na vrh ekrana za opcije
        </span>
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
