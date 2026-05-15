import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/apiUrl';
import RoomDetailDialog from '@/components/RoomDetailDialog';
import GuestRequestChat from '@/components/GuestRequestChat';
import {
  BedDouble,
  CheckCircle,
  Clock,
  Users,
  Sparkles,
  AlertTriangle,
  Search,
  Eye,
  XCircle,
  RefreshCw,
  MessageSquare,
  Phone,
  User,
  Filter,
  ChevronDown,
  ChevronUp,
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
  guest_email?: string;
  checkout_date?: string;
  checkin_date?: string;
  guest_session_token?: string;
  token_created_at?: string;
  priority_score: number;
  needs_minibar_check: boolean;
  last_cleaned_at?: string;
  last_inspected_at?: string;
  notes?: string;
  bed_type?: string;
  max_occupancy?: number;
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
  scheduled_date: string;
  completed_at?: string;
  inspection_notes?: string;
  inspection_passed?: boolean;
  issues_found?: string;
  linens_changed: boolean;
  towels_changed: boolean;
  amenities_restocked: boolean;
}

interface Housekeeper {
  id: string;
  full_name: string;
  is_active: boolean;
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
  forwarded_to_department?: string;
  forwarded_at?: string;
  forwarded_by_name?: string;
  linked_housekeeping_task_id?: string;
  created_at: string;
  updated_at?: string;
}

// Komponenta za statistiku - kompaktna verzija
function StatBadge({
  label,
  count,
  color,
  active,
  onClick
}: {
  label: string;
  count: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs transition-all ${
        active
          ? 'ring-1 ring-primary shadow-sm bg-white/60'
          : 'border-transparent hover:bg-white/40'
      }`}
    >
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="font-medium">{label}</span>
      <span className={`ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded text-[10px] font-bold ${
        count > 0 ? 'bg-emerald-800 text-white' : 'bg-muted text-muted-foreground'
      }`}>
        {count}
      </span>
    </button>
  );
}

// Komponenta za karticu sobe - kompaktna verzija
function RoomCard({
  room,
  hasRequest,
  onClick,
  pendingGuestRequests = 0,
  unreadGuestMessages = 0,
  hkNote,
}: {
  room: Room;
  hasRequest?: boolean;
  onClick: () => void;
  pendingGuestRequests?: number;
  unreadGuestMessages?: number;
  hkNote?: string;
}) {
  const statusStyle: Record<string, { border: string; bg: string; dot: string; label: string }> = {
    clean:          { border: 'border-emerald-300', bg: 'bg-emerald-50/70 dark:bg-emerald-950/20', dot: 'bg-emerald-600', label: 'Čista' },
    dirty:          { border: 'border-rose-300',    bg: 'bg-rose-50 dark:bg-rose-950/20',           dot: 'bg-rose-500',    label: 'Prljava' },
    in_cleaning:    { border: 'border-emerald-200', bg: 'bg-emerald-50/40 dark:bg-emerald-950/15',  dot: 'bg-emerald-400', label: 'Čišćenje' },
    inspected:      { border: 'border-gold-300',    bg: 'bg-gold-50 dark:bg-gold-900/20',           dot: 'bg-gold-500',    label: 'Pregledana' },
    out_of_order:   { border: 'border-slate-300',   bg: 'bg-slate-50 dark:bg-slate-900/40',         dot: 'bg-slate-400',   label: 'Van funkcije' },
    do_not_disturb: { border: 'border-emerald-700', bg: 'bg-emerald-100/60 dark:bg-emerald-950/30', dot: 'bg-emerald-800', label: 'Ne uznemiravaj' },
  };
  const sty = statusStyle[room.status] || statusStyle.out_of_order;
  const totalRequests = pendingGuestRequests + unreadGuestMessages;

  const occupancyLabel: Record<string, { icon: string; label: string; tone: string }> = {
    occupied:          { icon: '👤', label: 'Zauzeta',  tone: 'text-gold-700 bg-gold-50 border-gold-200' },
    checkout:          { icon: '🚪', label: 'Check-out', tone: 'text-rose-700 bg-rose-50 border-rose-200' },
    checkin_expected:  { icon: '📥', label: 'Dolazak',   tone: 'text-emerald-700 bg-emerald-50/60 border-emerald-200' },
    vacant:            { icon: '',   label: 'Prazna',    tone: 'text-emerald-700/70 bg-emerald-50/40 border-emerald-200/60' },
  };
  const occ = occupancyLabel[room.occupancy_status] || occupancyLabel.vacant;

  return (
    <div
      onClick={onClick}
      className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-0.5 min-h-[200px] flex flex-col ${sty.border} ${sty.bg}`}
    >
      {/* Status dot + occupancy */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${sty.dot}`} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-foreground/70">{sty.label}</span>
        </div>
        {(hasRequest || totalRequests > 0) && (
          <div className="flex items-center gap-0.5 rounded-full px-1.5 py-0.5 bg-gold-500 text-emerald-900 shadow text-[10px] font-bold">
            <MessageSquare className="w-2.5 h-2.5" />
            {totalRequests || 1}
          </div>
        )}
      </div>

      {/* Room number — big, takes the visual lead */}
      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-4xl font-bold leading-none tracking-tight">{room.room_number}</span>
        <span className="text-lg">{occ.icon}</span>
      </div>

      {/* Guest line */}
      {room.guest_name ? (
        <div className="mt-2 space-y-0.5">
          <p className="text-sm font-medium truncate">{room.guest_name}</p>
          {room.checkout_date && (
            <p className="text-[11px] text-muted-foreground">Odlazak: {new Date(room.checkout_date).toLocaleDateString('sr-RS')}</p>
          )}
        </div>
      ) : (
        <div className="mt-2">
          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${occ.tone}`}>
            {occ.label}
          </span>
        </div>
      )}

      {/* Bottom indicator stack — pushed to bottom of card */}
      <div className="mt-auto pt-3 flex flex-wrap gap-1">
        {pendingGuestRequests > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-gold-50 text-gold-800 border border-gold-200">
            <MessageSquare className="w-2.5 h-2.5" />
            {pendingGuestRequests} {pendingGuestRequests === 1 ? 'zahtjev' : 'zahtjeva'}
          </span>
        )}
        {hkNote && (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50/70 text-emerald-800 border border-emerald-200" title={hkNote}>
            <Sparkles className="w-2.5 h-2.5" />
            HK
          </span>
        )}
        {room.notes && (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200" title={room.notes}>
            📝 Napomena
          </span>
        )}
        {room.needs_minibar_check && (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
            🧴 Minibar
          </span>
        )}
        {room.assigned_housekeeper_name && (
          <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium bg-emerald-50/70 text-emerald-700 border border-emerald-200">
            <User className="w-2.5 h-2.5" />
            {room.assigned_housekeeper_name.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  );
}

export default function HousekeepingSupervisorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedGuestRequest, setSelectedGuestRequest] = useState<GuestRequest | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Sound notification state
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('soundNotificationsEnabled');
    return saved === 'true';
  });
  const [previousActiveRequestCount, setPreviousActiveRequestCount] = useState<number>(0);

  // Listen for sound setting changes
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('soundNotificationsEnabled');
      setAudioEnabled(saved === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    const handleCustomEvent = () => handleStorageChange();
    window.addEventListener('soundSettingChanged', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('soundSettingChanged', handleCustomEvent);
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
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        oscillator2.frequency.value = 1000;
        oscillator2.type = 'sine';
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.1);
      }, 100);
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  };

  // Monitor guest requests for new ones
  useEffect(() => {
    if (loading) return;
    const activeRequestCount = guestRequests.filter(r => r.status !== 'completed').length;
    if (previousActiveRequestCount > 0 && activeRequestCount > previousActiveRequestCount) {
      if (audioEnabled) playNotificationSound();
      toast({
        title: "Novi zahtjev gosta!",
        description: `Primljen novi zahtjev.`,
      });
    }
    setPreviousActiveRequestCount(activeRequestCount);
  }, [guestRequests, loading, audioEnabled]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      const [roomsRes, tasksRes, housekeepersRes, guestRequestsRes] = await Promise.all([
        fetch(getApiUrl('/api/rooms'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeeping/tasks?active_only=true'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeepers'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/guest-requests'), { credentials: 'include', headers: getAuthHeaders() }),
      ]);

      if (roomsRes.ok) {
        const data = await roomsRes.json();
        setRooms(data.rooms || []);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data.tasks || []);
      }
      if (housekeepersRes.ok) {
        const data = await housekeepersRes.json();
        setHousekeepers(data.housekeepers || []);
      }
      if (guestRequestsRes.ok) {
        const data = await guestRequestsRes.json();
        setGuestRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const pollInterval = setInterval(fetchData, 30000);
    return () => clearInterval(pollInterval);
  }, []);

  // Statistics
  const dirtyRooms = rooms.filter((r) => r.status === 'dirty');
  const cleanRooms = rooms.filter((r) => r.status === 'clean');
  const inCleaningRooms = rooms.filter((r) => r.status === 'in_cleaning');
  const inspectedRooms = rooms.filter((r) => r.status === 'inspected');
  const checkoutRooms = rooms.filter((r) => r.occupancy_status === 'checkout');
  const activeRequests = guestRequests.filter((r) => r.status !== 'completed');

  // Get rooms with active requests
  const roomsWithRequests = new Set(activeRequests.map(r => r.room_number));

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (floorFilter !== 'all' && room.floor !== parseInt(floorFilter)) return false;
    if (searchQuery && !room.room_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get unique floors
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

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
        toast({ title: 'Uspješno', description: 'Zahtjev označen kao završen' });
        setIsRequestDialogOpen(false);
        setSelectedGuestRequest(null);
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Greška', variant: 'destructive' });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {/* Header — recepcioner embeds this dashboard inside their own page
          chrome, so we skip the redundant "Upravljanje hotelom / Recepcioner"
          title bar there. Other roles (sef_domacinstva, admin) still see it. */}
      {user?.role !== 'recepcioner' ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Upravljanje hotelom</h1>
              <p className="text-sm text-muted-foreground">{user?.fullName}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={fetchData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Osvježi
          </Button>
        </div>
      ) : (
        // Compact refresh button on the right edge so recepcioner can still
        // re-pull data without the duplicate dashboard header.
        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={fetchData} className="text-emerald-900 hover:bg-emerald-900/5">
            <RefreshCw className="w-4 h-4 mr-1" />
            Osvježi
          </Button>
        </div>
      )}

      {/* Kompaktna statistika - horizontalna traka */}
      <div className="flex flex-wrap gap-1.5 px-2 py-1.5 bg-muted/30 rounded-lg">
        <StatBadge
          label="Prljave"
          count={dirtyRooms.length}
          color="bg-rose-500"
          active={statusFilter === 'dirty'}
          onClick={() => setStatusFilter(statusFilter === 'dirty' ? 'all' : 'dirty')}
        />
        <StatBadge
          label="U čišćenju"
          count={inCleaningRooms.length}
          color="bg-emerald-400"
          active={statusFilter === 'in_cleaning'}
          onClick={() => setStatusFilter(statusFilter === 'in_cleaning' ? 'all' : 'in_cleaning')}
        />
        <StatBadge
          label="Čiste"
          count={cleanRooms.length}
          color="bg-emerald-700"
          active={statusFilter === 'clean'}
          onClick={() => setStatusFilter(statusFilter === 'clean' ? 'all' : 'clean')}
        />
        <StatBadge
          label="Pregledane"
          count={inspectedRooms.length}
          color="bg-gold-500"
          active={statusFilter === 'inspected'}
          onClick={() => setStatusFilter(statusFilter === 'inspected' ? 'all' : 'inspected')}
        />
        <StatBadge
          label="Check-out"
          count={checkoutRooms.length}
          color="bg-rose-400"
        />
      </div>

      {/* Filteri i pretraga */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Pretraži sobe..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="w-4 h-4 mr-1" />
          Filteri
          {showFilters ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
        </Button>

        {statusFilter !== 'all' && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('all')}>
            Poništi filter
          </Button>
        )}
      </div>

      {/* Dodatni filteri */}
      {showFilters && (
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Sprat:</Label>
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Svi</SelectItem>
                {floors.map((floor) => (
                  <SelectItem key={floor} value={floor.toString()}>
                    {floor}. sprat
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Zahtjevi gostiju - kompaktna jednoredna traka sa horizontalnim scroll-om */}
      {activeRequests.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gold-300 bg-gold-50/50 dark:bg-gold-900/15">
          <MessageSquare className="w-4 h-4 text-gold-700 shrink-0" />
          <span className="text-xs font-semibold text-gold-900 shrink-0">
            {activeRequests.length} {activeRequests.length === 1 ? 'zahtjev' : 'zahtjeva'}:
          </span>
          <div className="flex gap-1.5 overflow-x-auto flex-1 min-w-0 scrollbar-thin">
            {activeRequests.map((request) => (
              <button
                key={request.id}
                onClick={() => handleRequestClick(request)}
                className={`shrink-0 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border transition-colors hover:bg-white/60 ${
                  request.priority === 'urgent'
                    ? 'border-rose-300 bg-rose-50 text-rose-800'
                    : 'border-gold-200 bg-white/40 text-emerald-900'
                }`}
              >
                <span className="font-bold">{request.room_number}</span>
                <span className="opacity-70">·</span>
                <span>
                  {request.request_type === 'housekeeping' && 'Čišćenje'}
                  {request.request_type === 'amenities' && 'Potrepštine'}
                  {request.request_type === 'maintenance' && 'Održavanje'}
                  {request.request_type === 'other' && 'Ostalo'}
                </span>
                {request.priority === 'urgent' && (
                  <span className="ml-0.5 rounded px-1 bg-rose-600 text-white text-[9px] font-bold uppercase">
                    Hitno
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* GLAVNI SADRŽAJ - sobe grupisane po spratu (jedan red po spratu) */}
      <div className="space-y-4">
        {floors.map((floor) => {
          const floorRooms = filteredRooms.filter((r) => r.floor === floor);
          if (floorRooms.length === 0) return null;
          return (
            <div key={floor} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {floor}. sprat
                </span>
                <span className="text-[11px] text-muted-foreground/70">· {floorRooms.length} {floorRooms.length === 1 ? 'soba' : 'soba'}</span>
                <div className="flex-1 h-px bg-border/60 ml-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {floorRooms.map((room) => {
                  const hkTaskForRoom = tasks.find(
                    (t) => t.room_id === room.id && t.issues_found
                  );
                  return (
                    <RoomCard
                      key={room.id}
                      room={room}
                      hasRequest={roomsWithRequests.has(room.room_number)}
                      pendingGuestRequests={room.pending_guest_requests || 0}
                      hkNote={hkTaskForRoom?.issues_found}
                      onClick={() => handleRoomClick(room)}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nema soba koje odgovaraju filteru</p>
        </div>
      )}

      {/* Tim sobarica - kompaktni prikaz na dnu.
          Hide for `recepcioner`: this dashboard is embedded inside the
          receptionist's integrated panel, where staff workload is not their
          job — it's noise. Housekeeping supervisors and admins still see it. */}
      {housekeepers.length > 0 && user?.role !== 'recepcioner' && (
        <Card className="mt-6">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5" />
              Tim ({housekeepers.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-3">
              {housekeepers.map((hk) => {
                const assignedTasks = tasks.filter((t) => t.assigned_to === hk.id);
                const completedCount = assignedTasks.filter(
                  (t) => t.status === 'completed' || t.status === 'inspected'
                ).length;
                const inProgressCount = assignedTasks.filter((t) => t.status === 'in_progress').length;

                return (
                  <div
                    key={hk.id}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-semibold">{hk.full_name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{hk.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inProgressCount > 0 && <span className="text-yellow-600">{inProgressCount} u toku</span>}
                        {inProgressCount > 0 && completedCount > 0 && ' • '}
                        {completedCount > 0 && <span className="text-green-600">{completedCount} završeno</span>}
                        {inProgressCount === 0 && completedCount === 0 && 'Nema zadataka'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog za detalje sobe */}
      <RoomDetailDialog
        room={selectedRoom}
        open={isRoomDialogOpen}
        onOpenChange={setIsRoomDialogOpen}
        onRoomUpdated={fetchData}
      />

      {/* Dialog za zahtjev gosta */}
      <Dialog open={isRequestDialogOpen} onOpenChange={setIsRequestDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Zahtjev gosta - Soba {selectedGuestRequest?.room_number}
            </DialogTitle>
          </DialogHeader>

          {selectedGuestRequest && (
            <div className="space-y-4">
              {/* Detalji zahtjeva */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Tip:</span>
                  <span className="font-medium">
                    {selectedGuestRequest.request_type === 'housekeeping' && 'Čišćenje'}
                    {selectedGuestRequest.request_type === 'amenities' && 'Potrepštine'}
                    {selectedGuestRequest.request_type === 'maintenance' && 'Održavanje'}
                    {selectedGuestRequest.request_type === 'other' && 'Ostalo'}
                  </span>
                </div>
                {selectedGuestRequest.category && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Kategorija:</span>
                    <span className="font-medium">{selectedGuestRequest.category}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Prioritet:</span>
                  <Badge variant={selectedGuestRequest.priority === 'urgent' ? 'destructive' : 'secondary'}>
                    {selectedGuestRequest.priority === 'urgent' ? 'Hitno' : 'Normalno'}
                  </Badge>
                </div>
                {selectedGuestRequest.guest_name && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Gost:</span>
                    <span className="font-medium flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {selectedGuestRequest.guest_name}
                    </span>
                  </div>
                )}
                {selectedGuestRequest.guest_phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Telefon:</span>
                    <a href={`tel:${selectedGuestRequest.guest_phone}`} className="font-medium text-blue-600 flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {selectedGuestRequest.guest_phone}
                    </a>
                  </div>
                )}
                <div className="pt-2 border-t">
                  <span className="text-sm text-muted-foreground">Opis:</span>
                  <p className="mt-1">{selectedGuestRequest.description}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  Primljeno: {new Date(selectedGuestRequest.created_at).toLocaleString('sr-RS')}
                </div>
              </div>

              {/* Chat */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Komunikacija sa gostom
                </h4>
                <GuestRequestChat
                  requestId={selectedGuestRequest.id}
                  isStaff={true}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedGuestRequest?.status !== 'completed' && (
              <Button onClick={handleCompleteRequest} className="w-full">
                <CheckCircle className="w-4 h-4 mr-2" />
                Označi kao završeno
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
