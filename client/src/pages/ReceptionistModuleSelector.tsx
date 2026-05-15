import { useState, useEffect, useRef } from 'react';
import { IonContent, IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton } from '@ionic/react';
import { useAuth } from '@/contexts/AuthContext';
import { Home, MessageSquarePlus, LogOut, ArrowLeft } from 'lucide-react';
import HousekeepingSupervisorDashboard from './HousekeepingSupervisorDashboard';
import ComplaintSubmissionDashboard from './ComplaintSubmissionDashboard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { io, Socket } from 'socket.io-client';
import { Capacitor } from '@capacitor/core';
import { useToast } from '@/hooks/use-toast';

type ModuleType = 'selector' | 'domacinstvo' | 'reklamacije';

export default function ReceptionistModuleSelector() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [selectedModule, setSelectedModule] = useState<ModuleType>('selector');

  // Socket.IO ref for real-time notifications
  const socketRef = useRef<Socket | null>(null);

  // Sound notification state
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('soundNotificationsEnabled');
    return saved === 'true';
  });
  const audioEnabledRef = useRef(audioEnabled);

  // Keep ref in sync
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Listen for sound setting changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('soundNotificationsEnabled');
      setAudioEnabled(saved === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('soundSettingChanged', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('soundSettingChanged', handleStorageChange);
    };
  }, []);

  // Play notification sound
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.1);
      }, 100);
    } catch (error) {
      console.error('Sound error:', error);
    }
  };

  // 🔌 Socket.IO connection for real-time guest request notifications
  useEffect(() => {
    if (!user?.id) return;

    let socketUrl: string;
    if (Capacitor.isNativePlatform()) {
      socketUrl = import.meta.env.VITE_API_URL || "https://hotelmanagement-complete-production.up.railway.app";
    } else {
      socketUrl = window.location.origin;
    }

    console.log('[RECEPTIONIST SOCKET.IO] Connecting to:', socketUrl);

    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      path: '/socket.io',
      autoConnect: true
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[RECEPTIONIST SOCKET.IO] ✅ Connected:', socket.id);
      socket.emit('worker:join', user.id);
    });

    // Listen for new guest requests
    socket.on('guest-request:new', (data) => {
      console.log('[RECEPTIONIST SOCKET.IO] 🔔 New guest request:', data);

      if (audioEnabledRef.current) {
        playNotificationSound();
        console.log('[RECEPTIONIST SOCKET.IO] 🔊 Sound played!');
      }

      toast({
        title: `Novi zahtjev gosta - Soba ${data.room_number}`,
        description: data.description?.substring(0, 80) || 'Novi zahtjev',
        duration: 8000,
      });
    });

    socket.on('disconnect', (reason) => {
      console.log('[RECEPTIONIST SOCKET.IO] Disconnected:', reason);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('worker:leave', user.id);
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [user?.id, toast]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Integrated single-screen receptionist panel — Sobe & Gosti on top,
  // Reklamacije below, both visible without module switching.
  return (
    <IonPage>
      <IonContent>
        <div
          className="min-h-screen"
          style={{
            backgroundColor: '#142849',
            backgroundImage:
              'radial-gradient(ellipse 55% 35% at 12% 0%, rgba(195, 149, 76, 0.32), transparent 60%),' +
              'radial-gradient(ellipse 65% 55% at 100% 100%, rgba(195, 149, 76, 0.16), transparent 60%),' +
              'radial-gradient(ellipse 90% 90% at 50% 50%, rgba(60, 95, 145, 0.45), transparent 70%),' +
              'linear-gradient(160deg, #1B3052 0%, #142849 55%, #0F2040 100%)',
          }}
        >
          <div className="max-w-[1800px] mx-auto p-3 sm:p-5 lg:p-6 space-y-5">
            {/* Page intro */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white drop-shadow">Recepcija</h1>
                <p className="text-white/70 text-sm">Dobrodošli, {user?.fullName}.</p>
              </div>
            </div>

            <Tabs defaultValue="sobe" className="space-y-3">
              <TabsList className="bg-white/55 backdrop-blur-xl border border-white/40 ring-1 ring-emerald-900/10 shadow-sm h-auto p-0.5 rounded-lg gap-0.5">
                <TabsTrigger
                  value="sobe"
                  className="gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium data-[state=active]:bg-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-sm text-emerald-900/80 [&_svg]:size-3.5"
                >
                  <Home />
                  Sobe & Gosti
                </TabsTrigger>
                <TabsTrigger
                  value="reklamacije"
                  className="gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium data-[state=active]:bg-gold-500 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm text-emerald-900/80 [&_svg]:size-3.5"
                >
                  <MessageSquarePlus />
                  Reklamacije
                </TabsTrigger>
              </TabsList>

              <TabsContent value="sobe" className="mt-0">
                <section className="bg-white/55 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/40 ring-1 ring-emerald-900/10 overflow-hidden">
                  <div className="p-2 sm:p-3 lg:p-4">
                    <HousekeepingSupervisorDashboard />
                  </div>
                </section>
              </TabsContent>

              <TabsContent value="reklamacije" className="mt-0">
                <section className="bg-white/55 backdrop-blur-2xl rounded-2xl shadow-lg border border-white/40 ring-1 ring-emerald-900/10 overflow-hidden">
                  <div className="p-2 sm:p-3 lg:p-4">
                    <ComplaintSubmissionDashboard />
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );

  // Legacy module selector (unreachable — kept for reference until removal):
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="tertiary">
          <IonTitle>Recepcija</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleLogout}>
              <LogOut className="w-5 h-5 mr-2" />
              Odjava
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div
          className="min-h-screen flex flex-col items-center justify-center p-6"
          style={{
            backgroundColor: '#142849',
            backgroundImage:
              'radial-gradient(ellipse 55% 35% at 12% 0%, rgba(195, 149, 76, 0.32), transparent 60%),' +
              'radial-gradient(ellipse 65% 55% at 100% 100%, rgba(195, 149, 76, 0.16), transparent 60%),' +
              'radial-gradient(ellipse 90% 90% at 50% 50%, rgba(60, 95, 145, 0.45), transparent 70%),' +
              'linear-gradient(160deg, #1B3052 0%, #142849 55%, #0F2040 100%)',
          }}
        >
          {/* Welcome message */}
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow">
              Dobrodosli, {user?.fullName}!
            </h1>
            <p className="text-white/70 text-lg">
              Izaberite modul za rad
            </p>
          </div>

          {/* Module cards */}
          <div className="flex flex-wrap justify-center gap-8 max-w-4xl">
            {/* Housekeeping Module */}
            <button
              onClick={() => setSelectedModule('domacinstvo')}
              className="group relative w-72 h-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-white/40 ring-1 ring-emerald-900/10"
            >
              {/* Gradient overlay on hover (deep navy) */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-700 to-emerald-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6 z-10">
                {/* Icon container */}
                <div className="w-24 h-24 bg-emerald-100 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                  <Home className="w-12 h-12 text-emerald-700 group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-emerald-900 group-hover:text-white mb-3 transition-colors duration-300">
                  Domacinstvo
                </h2>
                <p className="text-emerald-900/60 group-hover:text-white/80 text-center transition-colors duration-300">
                  Upravljanje sobama, check-in/out gostiju, QR kodovi
                </p>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-emerald-100 group-hover:bg-white/20 rounded-full">
                  <span className="text-xs font-semibold text-emerald-700 group-hover:text-white transition-colors duration-300">
                    Sobe & Gosti
                  </span>
                </div>
              </div>
            </button>

            {/* Complaint Submission Module */}
            <button
              onClick={() => setSelectedModule('reklamacije')}
              className="group relative w-72 h-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-white/40 ring-1 ring-emerald-900/10"
            >
              {/* Gradient overlay on hover (gold) */}
              <div className="absolute inset-0 bg-gradient-to-br from-gold-500 to-gold-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Content */}
              <div className="relative h-full flex flex-col items-center justify-center p-6 z-10">
                {/* Icon container */}
                <div className="w-24 h-24 bg-gold-100 group-hover:bg-white/20 rounded-full flex items-center justify-center mb-6 transition-colors duration-300">
                  <MessageSquarePlus className="w-12 h-12 text-gold-700 group-hover:text-white transition-colors duration-300" />
                </div>

                {/* Text */}
                <h2 className="text-2xl font-bold text-emerald-900 group-hover:text-white mb-3 transition-colors duration-300">
                  Prijava Reklamacije
                </h2>
                <p className="text-emerald-900/60 group-hover:text-white/80 text-center transition-colors duration-300">
                  Prijavite tehnicke probleme i kvarove u sobama
                </p>

                {/* Badge */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-gold-100 group-hover:bg-white/20 rounded-full">
                  <span className="text-xs font-semibold text-gold-700 group-hover:text-white transition-colors duration-300">
                    Tehnika
                  </span>
                </div>
              </div>
            </button>
          </div>

          {/* Footer info */}
          <div className="mt-12 text-center text-gray-400 text-sm">
            <p>Hotel Management System - Recepcija</p>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
