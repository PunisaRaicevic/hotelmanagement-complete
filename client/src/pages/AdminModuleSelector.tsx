import { useState, useEffect } from 'react';
import { IonContent, IonPage } from '@ionic/react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/apiUrl';
import RoomGridView from '@/components/RoomGridView';
import RoomDetailDialog from '@/components/RoomDetailDialog';
import GuestRequestChat from '@/components/GuestRequestChat';
import {
  Home,
  Wrench,
  MessageSquare,
  Users,
  ClipboardList,
  CheckCircle,
  RefreshCw,
  Phone,
  User,
  Settings,
  Sparkles,
  Bell,
  ChevronRight,
  X,
} from 'lucide-react';

interface Room {
  id: string;
  room_number: string;
  floor: number;
  category: string;
  status: 'clean' | 'dirty' | 'in_cleaning' | 'inspected' | 'out_of_order' | 'do_not_disturb';
  occupancy_status: string;
  assigned_housekeeper_id?: string;
  assigned_housekeeper_name?: string;
  guest_name?: string;
  guest_count?: number;
  guest_phone?: string;
  checkout_date?: string;
  checkin_date?: string;
  priority_score: number;
  needs_minibar_check: boolean;
  pending_guest_requests?: number;
}

interface HousekeepingTask {
  id: string;
  room_id: string;
  room_number: string;
  cleaning_type: string;
  assigned_to?: string;
  assigned_to_name?: string;
  status: string;
  priority: string;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  location?: string;
  room_number?: string;
  status: string;
  priority: string;
  created_at: string;
  assigned_to_name?: string;
}

interface GuestRequest {
  id: string;
  room_id: string;
  room_number: string;
  request_type: string;
  category?: string;
  description: string;
  guest_name?: string;
  guest_phone?: string;
  priority: string;
  status: string;
  created_at: string;
}

interface Housekeeper {
  id: string;
  full_name: string;
  is_active: boolean;
}

interface Technician {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

type SidebarView = 'tech-requests' | 'hk-requests' | 'housekeepers' | 'technicians' | null;

export default function AdminModuleSelector() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Data state
  const [rooms, setRooms] = useState<Room[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [maintenanceTasks, setMaintenanceTasks] = useState<Task[]>([]);
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);

  // UI state
  const [sidebarView, setSidebarView] = useState<SidebarView>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedGuestRequest, setSelectedGuestRequest] = useState<GuestRequest | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<{ type: 'housekeeper' | 'technician'; data: Housekeeper | Technician } | null>(null);
  const [isStaffDialogOpen, setIsStaffDialogOpen] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      const [roomsRes, hkTasksRes, tasksRes, requestsRes, hkRes, techRes] = await Promise.all([
        fetch(getApiUrl('/api/rooms'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeeping/tasks'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/tasks'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/guest-requests'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeepers'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/technicians'), { credentials: 'include', headers: getAuthHeaders() }),
      ]);

      if (roomsRes.ok) setRooms((await roomsRes.json()).rooms || []);
      if (hkTasksRes.ok) setHousekeepingTasks((await hkTasksRes.json()).tasks || []);
      if (tasksRes.ok) setMaintenanceTasks((await tasksRes.json()).tasks || []);
      if (requestsRes.ok) setGuestRequests((await requestsRes.json()).requests || []);
      if (hkRes.ok) setHousekeepers((await hkRes.json()).housekeepers || []);
      if (techRes.ok) setTechnicians((await techRes.json()).technicians || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Statistics
  const activeRequests = guestRequests.filter(r => r.status !== 'completed');
  const techRequests = activeRequests.filter(r => r.request_type === 'maintenance');
  const hkRequests = activeRequests.filter(r => r.request_type === 'housekeeping' || r.request_type === 'amenities');
  const urgentTechRequests = techRequests.filter(r => r.priority === 'urgent');
  const urgentHkRequests = hkRequests.filter(r => r.priority === 'urgent');

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomDialogOpen(true);
  };

  const handleRequestClick = (request: GuestRequest) => {
    setSelectedGuestRequest(request);
    setIsRequestDialogOpen(true);
  };

  const handleCompleteRequest = async () => {
    if (!selectedGuestRequest) return;
    try {
      const response = await fetch(getApiUrl(`/api/guest-requests/${selectedGuestRequest.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({ status: 'completed' }),
      });
      if (response.ok) {
        toast({ title: 'Uspješno', description: 'Zahtjev završen' });
        setIsRequestDialogOpen(false);
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Greška', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <IonPage>
        <IonContent>
          <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-50 to-gray-100">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-pulse"></div>
              <p className="text-gray-500 font-medium">Učitavanje...</p>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonContent>
        {/* Apple-style background with subtle gradient */}
        <div className="min-h-screen bg-gradient-to-br from-[#f5f5f7] to-[#e8e8ed]">

          {/* Top Navigation Bar - Apple style */}
          <div className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-gray-200/50">
            <div className="max-w-[1800px] mx-auto px-3 py-2 sm:px-6 sm:py-4">
              <div className="flex items-center justify-between">
                {/* Logo & Title */}
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-900 flex items-center justify-center">
                    <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-semibold text-gray-900">Hotel Manager</h1>
                    <p className="text-xs text-gray-400 hidden sm:block">{rooms.length} soba • {user?.fullName}</p>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-2">
                  {(urgentTechRequests.length > 0 || urgentHkRequests.length > 0) && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                      <span className="text-xs font-medium text-red-700">
                        {urgentTechRequests.length + urgentHkRequests.length} hitno
                      </span>
                    </div>
                  )}
                  <button
                    onClick={fetchData}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-gray-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-[1800px] mx-auto p-2 sm:p-3 lg:p-6">
            {/* Mobile Sidebar - Horizontal compact bar */}
            <div className="lg:hidden mb-4">
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-2 shadow-sm border border-gray-200/50">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  <div className="flex-shrink-0">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 px-1">Zahtjevi</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSidebarView(sidebarView === 'tech-requests' ? null : 'tech-requests')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium whitespace-nowrap ${
                          sidebarView === 'tech-requests'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        Tehnički
                        {techRequests.length > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            sidebarView === 'tech-requests' ? 'bg-white/20' : 'bg-gray-200'
                          }`}>
                            {techRequests.length}
                          </span>
                        )}
                      </button>
                      <button
                        onClick={() => setSidebarView(sidebarView === 'hk-requests' ? null : 'hk-requests')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium whitespace-nowrap ${
                          sidebarView === 'hk-requests'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        HK
                        {hkRequests.length > 0 && (
                          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                            sidebarView === 'hk-requests' ? 'bg-white/20' : 'bg-gray-200'
                          }`}>
                            {hkRequests.length}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="w-px bg-gray-200 mx-1 self-stretch" />
                  <div className="flex-shrink-0">
                    <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5 px-1">Osoblje</p>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setSidebarView(sidebarView === 'housekeepers' ? null : 'housekeepers')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium whitespace-nowrap ${
                          sidebarView === 'housekeepers'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        Sobarice
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          sidebarView === 'housekeepers' ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          {housekeepers.length}
                        </span>
                      </button>
                      <button
                        onClick={() => setSidebarView(sidebarView === 'technicians' ? null : 'technicians')}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-200 text-xs font-medium whitespace-nowrap ${
                          sidebarView === 'technicians'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Tehničari
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${
                          sidebarView === 'technicians' ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          {technicians.length}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Mobile Detail Panel */}
              {sidebarView && (
                <div className="lg:hidden mt-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h4 className="font-medium text-gray-800 text-sm">
                      {sidebarView === 'tech-requests' && 'Tehnički zahtjevi'}
                      {sidebarView === 'hk-requests' && 'Housekeeping zahtjevi'}
                      {sidebarView === 'housekeepers' && 'Sobarice'}
                      {sidebarView === 'technicians' && 'Tehničari'}
                    </h4>
                    <button onClick={() => setSidebarView(null)} className="text-gray-400 hover:text-gray-600 p-1">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <ScrollArea className="h-60">
                    <div className="p-3 space-y-2">
                      {sidebarView === 'tech-requests' && (
                        techRequests.length > 0 ? techRequests.map(request => (
                          <button key={request.id} onClick={() => handleRequestClick(request)} className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800 text-sm">Soba {request.room_number}</span>
                              {request.priority === 'urgent' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{request.description}</p>
                          </button>
                        )) : <div className="text-center py-6 text-gray-400"><p className="text-sm">Nema zahtjeva</p></div>
                      )}
                      {sidebarView === 'hk-requests' && (
                        hkRequests.length > 0 ? hkRequests.map(request => (
                          <button key={request.id} onClick={() => handleRequestClick(request)} className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 text-left">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-gray-800 text-sm">Soba {request.room_number}</span>
                              {request.priority === 'urgent' && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2">{request.description}</p>
                          </button>
                        )) : <div className="text-center py-6 text-gray-400"><p className="text-sm">Nema zahtjeva</p></div>
                      )}
                      {sidebarView === 'housekeepers' && (
                        housekeepers.length > 0 ? housekeepers.map(hk => {
                          const tasks = housekeepingTasks.filter(t => t.assigned_to === hk.id);
                          const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                          const completed = tasks.filter(t => ['completed', 'inspected'].includes(t.status)).length;
                          return (
                            <button key={hk.id} onClick={() => { setSelectedStaff({ type: 'housekeeper', data: hk }); setIsStaffDialogOpen(true); }} className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium text-sm">{hk.full_name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-gray-800 text-sm">{hk.full_name}</p>
                                  <p className="text-xs text-gray-400">
                                    {inProgress > 0 ? `${inProgress} u toku` : ''}{inProgress > 0 && completed > 0 ? ' · ' : ''}{completed > 0 ? `${completed} završeno` : ''}{inProgress === 0 && completed === 0 ? 'Bez zadataka' : ''}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              </div>
                            </button>
                          );
                        }) : <div className="text-center py-6 text-gray-400"><p className="text-sm">Nema sobarica</p></div>
                      )}
                      {sidebarView === 'technicians' && (
                        technicians.length > 0 ? technicians.map(tech => {
                          const tasks = maintenanceTasks.filter(t => t.assigned_to_name === tech.full_name);
                          const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                          const completed = tasks.filter(t => t.status === 'completed').length;
                          return (
                            <button key={tech.id} onClick={() => { setSelectedStaff({ type: 'technician', data: tech }); setIsStaffDialogOpen(true); }} className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                                  <span className="text-gray-600 font-medium text-sm">{tech.full_name.charAt(0)}</span>
                                </div>
                                <div className="flex-1 text-left">
                                  <p className="font-medium text-gray-800 text-sm">{tech.full_name}</p>
                                  <p className="text-xs text-gray-400">
                                    {inProgress > 0 ? `${inProgress} u toku` : ''}{inProgress > 0 && completed > 0 ? ' · ' : ''}{completed > 0 ? `${completed} završeno` : ''}{inProgress === 0 && completed === 0 ? 'Bez zadataka' : ''}
                                  </p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-300" />
                              </div>
                            </button>
                          );
                        }) : <div className="text-center py-6 text-gray-400"><p className="text-sm">Nema tehničara</p></div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>

            <div className="flex gap-6">

              {/* Sidebar - Minimal Apple Style (Desktop only) */}
              <div className="hidden lg:block w-72 flex-shrink-0 space-y-3">

                {/* Zahtjevi Gostiju */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-gray-200/50">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3 px-1">Zahtjevi gostiju</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSidebarView(sidebarView === 'tech-requests' ? null : 'tech-requests')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        sidebarView === 'tech-requests'
                          ? 'bg-gray-900 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Wrench className="w-4 h-4" />
                      <span className="flex-1 text-left text-sm font-medium">Tehnički</span>
                      {techRequests.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sidebarView === 'tech-requests' ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          {techRequests.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setSidebarView(sidebarView === 'hk-requests' ? null : 'hk-requests')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        sidebarView === 'hk-requests'
                          ? 'bg-gray-900 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Sparkles className="w-4 h-4" />
                      <span className="flex-1 text-left text-sm font-medium">Housekeeping</span>
                      {hkRequests.length > 0 && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          sidebarView === 'hk-requests' ? 'bg-white/20' : 'bg-gray-200'
                        }`}>
                          {hkRequests.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Osoblje */}
                <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-sm border border-gray-200/50">
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-3 px-1">Osoblje</p>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSidebarView(sidebarView === 'housekeepers' ? null : 'housekeepers')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        sidebarView === 'housekeepers'
                          ? 'bg-gray-900 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span className="flex-1 text-left text-sm font-medium">Sobarice</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sidebarView === 'housekeepers' ? 'bg-white/20' : 'bg-gray-200'
                      }`}>
                        {housekeepers.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setSidebarView(sidebarView === 'technicians' ? null : 'technicians')}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                        sidebarView === 'technicians'
                          ? 'bg-gray-900 text-white'
                          : 'hover:bg-gray-100 text-gray-700'
                      }`}
                    >
                      <Settings className="w-4 h-4" />
                      <span className="flex-1 text-left text-sm font-medium">Tehničari</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        sidebarView === 'technicians' ? 'bg-white/20' : 'bg-gray-200'
                      }`}>
                        {technicians.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Detail Panel - Shows when sidebar item selected */}
                {sidebarView && (
                  <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
                    {/* Panel Header */}
                    <div className="px-4 py-3 border-b border-gray-100">
                      <h4 className="font-medium text-gray-800 text-sm">
                        {sidebarView === 'tech-requests' && 'Tehnički zahtjevi'}
                        {sidebarView === 'hk-requests' && 'Housekeeping zahtjevi'}
                        {sidebarView === 'housekeepers' && 'Sobarice'}
                        {sidebarView === 'technicians' && 'Tehničari'}
                      </h4>
                    </div>

                    {/* Panel Content */}
                    <ScrollArea className="h-80">
                      <div className="p-4 space-y-3">
                        {/* Tech Requests */}
                        {sidebarView === 'tech-requests' && (
                          techRequests.length > 0 ? techRequests.map(request => (
                            <button
                              key={request.id}
                              onClick={() => handleRequestClick(request)}
                              className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 text-left"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 text-sm">Soba {request.room_number}</span>
                                {request.priority === 'urgent' && (
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2">{request.description}</p>
                            </button>
                          )) : (
                            <div className="text-center py-6 text-gray-400">
                              <p className="text-sm">Nema zahtjeva</p>
                            </div>
                          )
                        )}

                        {/* HK Requests */}
                        {sidebarView === 'hk-requests' && (
                          hkRequests.length > 0 ? hkRequests.map(request => (
                            <button
                              key={request.id}
                              onClick={() => handleRequestClick(request)}
                              className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200 text-left"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium text-gray-800 text-sm">Soba {request.room_number}</span>
                                {request.priority === 'urgent' && (
                                  <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2">{request.description}</p>
                            </button>
                          )) : (
                            <div className="text-center py-6 text-gray-400">
                              <p className="text-sm">Nema zahtjeva</p>
                            </div>
                          )
                        )}

                        {/* Housekeepers */}
                        {sidebarView === 'housekeepers' && (
                          housekeepers.length > 0 ? housekeepers.map(hk => {
                            const tasks = housekeepingTasks.filter(t => t.assigned_to === hk.id);
                            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                            const completed = tasks.filter(t => ['completed', 'inspected'].includes(t.status)).length;

                            return (
                              <button
                                key={hk.id}
                                onClick={() => {
                                  setSelectedStaff({ type: 'housekeeper', data: hk });
                                  setIsStaffDialogOpen(true);
                                }}
                                className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium text-sm">
                                      {hk.full_name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-800 text-sm">{hk.full_name}</p>
                                    <p className="text-xs text-gray-400">
                                      {inProgress > 0 ? `${inProgress} u toku` : ''}
                                      {inProgress > 0 && completed > 0 ? ' · ' : ''}
                                      {completed > 0 ? `${completed} završeno` : ''}
                                      {inProgress === 0 && completed === 0 ? 'Bez zadataka' : ''}
                                    </p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                              </button>
                            );
                          }) : (
                            <div className="text-center py-6 text-gray-400">
                              <p className="text-sm">Nema sobarica</p>
                            </div>
                          )
                        )}

                        {/* Technicians */}
                        {sidebarView === 'technicians' && (
                          technicians.length > 0 ? technicians.map(tech => {
                            const tasks = maintenanceTasks.filter(t => t.assigned_to_name === tech.full_name);
                            const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                            const completed = tasks.filter(t => t.status === 'completed').length;

                            return (
                              <button
                                key={tech.id}
                                onClick={() => {
                                  setSelectedStaff({ type: 'technician', data: tech });
                                  setIsStaffDialogOpen(true);
                                }}
                                className="w-full p-3 hover:bg-gray-50 rounded-xl transition-all duration-200"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-gray-600 font-medium text-sm">
                                      {tech.full_name.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="flex-1 text-left">
                                    <p className="font-medium text-gray-800 text-sm">{tech.full_name}</p>
                                    <p className="text-xs text-gray-400">
                                      {inProgress > 0 ? `${inProgress} u toku` : ''}
                                      {inProgress > 0 && completed > 0 ? ' · ' : ''}
                                      {completed > 0 ? `${completed} završeno` : ''}
                                      {inProgress === 0 && completed === 0 ? 'Bez zadataka' : ''}
                                    </p>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-gray-300" />
                                </div>
                              </button>
                            );
                          }) : (
                            <div className="text-center py-6 text-gray-400">
                              <p className="text-sm">Nema tehničara</p>
                            </div>
                          )
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              {/* Main Content - Room Grid */}
              <div className="flex-1">
                <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-2 sm:p-3 lg:p-5 shadow-sm border border-gray-200/50">
                  <div className="flex items-center justify-between mb-2 sm:mb-4">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold text-gray-800">Sobe</h2>
                      <p className="text-xs text-gray-400 hidden sm:block">Pregled po spratovima</p>
                    </div>
                  </div>
                  <RoomGridView
                    rooms={rooms}
                    tasks={housekeepingTasks}
                    onRoomClick={handleRoomClick}
                  />
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Room Detail Dialog */}
        <RoomDetailDialog
          room={selectedRoom}
          open={isRoomDialogOpen}
          onOpenChange={setIsRoomDialogOpen}
          onRoomUpdated={fetchData}
        />

        {/* Guest Request Dialog - Minimal */}
        <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                <p className="text-lg font-semibold">Soba {selectedGuestRequest?.room_number}</p>
                <p className="text-sm text-gray-400 font-normal">Zahtjev gosta</p>
              </DialogTitle>
            </DialogHeader>

            {selectedGuestRequest && (
              <div className="space-y-4 mt-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-sm text-gray-400">Tip</span>
                    <span className="text-sm font-medium text-gray-700">
                      {selectedGuestRequest.request_type === 'housekeeping' && 'Čišćenje'}
                      {selectedGuestRequest.request_type === 'amenities' && 'Potrepštine'}
                      {selectedGuestRequest.request_type === 'maintenance' && 'Održavanje'}
                      {selectedGuestRequest.request_type === 'other' && 'Ostalo'}
                    </span>
                  </div>
                  {selectedGuestRequest.guest_name && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-400">Gost</span>
                      <span className="text-sm font-medium text-gray-700">{selectedGuestRequest.guest_name}</span>
                    </div>
                  )}
                  {selectedGuestRequest.guest_phone && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-400">Telefon</span>
                      <a href={`tel:${selectedGuestRequest.guest_phone}`} className="text-sm font-medium text-gray-900">
                        {selectedGuestRequest.guest_phone}
                      </a>
                    </div>
                  )}
                  {selectedGuestRequest.priority === 'urgent' && (
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-400">Prioritet</span>
                      <span className="text-sm font-medium text-red-600">Hitno</span>
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm text-gray-700">{selectedGuestRequest.description}</p>
                </div>

                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Komunikacija</p>
                  <GuestRequestChat
                    requestId={selectedGuestRequest.id}
                    isStaff={true}
                  />
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              {selectedGuestRequest?.status !== 'completed' && (
                <Button
                  onClick={handleCompleteRequest}
                  className="w-full rounded-xl bg-gray-900 hover:bg-gray-800"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Završi zahtjev
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Staff Detail Dialog - Minimal */}
        <Dialog open={isStaffDialogOpen} onOpenChange={setIsStaffDialogOpen}>
          <DialogContent className="max-w-md rounded-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-lg font-semibold text-gray-600">
                    {selectedStaff?.data.full_name?.charAt(0) || '?'}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-800">{selectedStaff?.data.full_name}</p>
                  <p className="text-sm text-gray-400 font-normal">
                    {selectedStaff?.type === 'housekeeper' ? 'Sobarica' : 'Tehničar'}
                  </p>
                </div>
              </DialogTitle>
            </DialogHeader>

            {selectedStaff && (
              <div className="space-y-5 mt-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {(() => {
                    const tasks = selectedStaff.type === 'housekeeper'
                      ? housekeepingTasks.filter(t => t.assigned_to === selectedStaff.data.id)
                      : maintenanceTasks.filter(t => t.assigned_to_name === selectedStaff.data.full_name);

                    const pending = tasks.filter(t => t.status === 'pending' || t.status === 'assigned').length;
                    const inProgress = tasks.filter(t => t.status === 'in_progress').length;
                    const completed = tasks.filter(t => ['completed', 'inspected'].includes(t.status)).length;

                    return (
                      <>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-semibold text-gray-700">{pending}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Čeka</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-semibold text-gray-700">{inProgress}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">U toku</p>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                          <p className="text-2xl font-semibold text-gray-700">{completed}</p>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider">Gotovo</p>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {/* Tasks List */}
                <div>
                  <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">Zadaci</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {(() => {
                      const tasks = selectedStaff.type === 'housekeeper'
                        ? housekeepingTasks.filter(t => t.assigned_to === selectedStaff.data.id)
                        : maintenanceTasks.filter(t => t.assigned_to_name === selectedStaff.data.full_name);

                      if (tasks.length === 0) {
                        return (
                          <p className="text-center text-gray-400 py-4 text-sm">
                            Nema zadataka
                          </p>
                        );
                      }

                      return tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="p-3 rounded-xl bg-gray-50 flex items-center justify-between"
                        >
                          <span className="font-medium text-gray-700 text-sm">
                            {selectedStaff.type === 'housekeeper'
                              ? `Soba ${task.room_number}`
                              : task.title}
                          </span>
                          <span className="text-xs text-gray-400">
                            {task.status === 'completed' && 'Završeno'}
                            {task.status === 'inspected' && 'Pregledano'}
                            {task.status === 'in_progress' && 'U toku'}
                            {task.status === 'pending' && 'Čeka'}
                            {task.status === 'assigned' && 'Dodijeljeno'}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setIsStaffDialogOpen(false)}
                className="w-full rounded-xl"
              >
                Zatvori
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </IonContent>
    </IonPage>
  );
}
