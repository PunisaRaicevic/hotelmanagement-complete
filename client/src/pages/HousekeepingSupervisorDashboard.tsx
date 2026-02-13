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
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
        active
          ? 'ring-2 ring-primary shadow-md'
          : 'hover:bg-muted/50'
      }`}
    >
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-sm font-medium">{label}</span>
      <Badge variant={count > 0 ? 'default' : 'secondary'} className="ml-1">
        {count}
      </Badge>
    </button>
  );
}

// Komponenta za karticu sobe - kompaktna verzija
function RoomCard({
  room,
  hasRequest,
  onClick
}: {
  room: Room;
  hasRequest?: boolean;
  onClick: () => void;
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'clean': return 'bg-green-500';
      case 'dirty': return 'bg-red-500';
      case 'in_cleaning': return 'bg-yellow-500';
      case 'inspected': return 'bg-blue-500';
      case 'out_of_order': return 'bg-gray-500';
      case 'do_not_disturb': return 'bg-purple-500';
      default: return 'bg-gray-300';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'clean': return 'Čista';
      case 'dirty': return 'Prljava';
      case 'in_cleaning': return 'Čišćenje';
      case 'inspected': return 'Pregledana';
      case 'out_of_order': return 'Van funkcije';
      case 'do_not_disturb': return 'Ne uznemiravaj';
      default: return status;
    }
  };

  const getOccupancyIcon = (status: string) => {
    if (status === 'occupied') return '👤';
    if (status === 'checkout') return '🚪';
    if (status === 'checkin_expected') return '📥';
    return '';
  };

  return (
    <div
      onClick={onClick}
      className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${
        room.status === 'dirty' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' :
        room.status === 'in_cleaning' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' :
        room.status === 'clean' ? 'border-green-300 bg-green-50 dark:bg-green-950/20' :
        room.status === 'inspected' ? 'border-blue-300 bg-blue-50 dark:bg-blue-950/20' :
        'border-gray-200 bg-gray-50 dark:bg-gray-950/20'
      }`}
    >
      {/* Notifikacija za zahtjev gosta */}
      {hasRequest && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
          <MessageSquare className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Broj sobe */}
      <div className="text-center">
        <span className="text-2xl font-bold">{room.room_number}</span>
        <span className="ml-1 text-lg">{getOccupancyIcon(room.occupancy_status)}</span>
      </div>

      {/* Status */}
      <div className="flex items-center justify-center gap-1.5 mt-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor(room.status)}`} />
        <span className="text-xs font-medium">{getStatusLabel(room.status)}</span>
      </div>

      {/* Gost */}
      {room.guest_name && (
        <p className="text-xs text-center text-muted-foreground mt-1 truncate">
          {room.guest_name}
        </p>
      )}

      {/* Minibar indikator */}
      {room.needs_minibar_check && (
        <Badge variant="outline" className="w-full justify-center mt-2 text-[10px]">
          Minibar
        </Badge>
      )}
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
      {/* Header */}
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

      {/* Kompaktna statistika - horizontalna traka */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-xl">
        <StatBadge
          label="Prljave"
          count={dirtyRooms.length}
          color="bg-red-500"
          active={statusFilter === 'dirty'}
          onClick={() => setStatusFilter(statusFilter === 'dirty' ? 'all' : 'dirty')}
        />
        <StatBadge
          label="U čišćenju"
          count={inCleaningRooms.length}
          color="bg-yellow-500"
          active={statusFilter === 'in_cleaning'}
          onClick={() => setStatusFilter(statusFilter === 'in_cleaning' ? 'all' : 'in_cleaning')}
        />
        <StatBadge
          label="Čiste"
          count={cleanRooms.length}
          color="bg-green-500"
          active={statusFilter === 'clean'}
          onClick={() => setStatusFilter(statusFilter === 'clean' ? 'all' : 'clean')}
        />
        <StatBadge
          label="Pregledane"
          count={inspectedRooms.length}
          color="bg-blue-500"
          active={statusFilter === 'inspected'}
          onClick={() => setStatusFilter(statusFilter === 'inspected' ? 'all' : 'inspected')}
        />
        <StatBadge
          label="Check-out"
          count={checkoutRooms.length}
          color="bg-orange-500"
        />
        <div className="flex-1" />
        {activeRequests.length > 0 && (
          <Badge variant="destructive" className="animate-pulse px-3 py-1.5">
            <MessageSquare className="w-4 h-4 mr-1" />
            {activeRequests.length} zahtjev{activeRequests.length > 1 ? 'a' : ''} gostiju
          </Badge>
        )}
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

      {/* Zahtjevi gostiju - ako ih ima, prikaži kao traku */}
      {activeRequests.length > 0 && (
        <Card className="border-red-200 bg-red-50/50 dark:bg-red-950/20">
          <CardHeader className="py-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-red-500" />
              Aktivni zahtjevi gostiju
            </CardTitle>
          </CardHeader>
          <CardContent className="py-2">
            <div className="flex flex-wrap gap-2">
              {activeRequests.map((request) => (
                <Button
                  key={request.id}
                  variant="outline"
                  size="sm"
                  className={`${
                    request.priority === 'urgent'
                      ? 'border-red-400 bg-red-100 dark:bg-red-900/30'
                      : ''
                  }`}
                  onClick={() => handleRequestClick(request)}
                >
                  <span className="font-bold mr-2">Soba {request.room_number}</span>
                  <span className="text-muted-foreground text-xs">
                    {request.request_type === 'housekeeping' && 'Čišćenje'}
                    {request.request_type === 'amenities' && 'Potrepštine'}
                    {request.request_type === 'maintenance' && 'Održavanje'}
                    {request.request_type === 'other' && 'Ostalo'}
                  </span>
                  {request.priority === 'urgent' && (
                    <Badge variant="destructive" className="ml-2 text-[10px]">Hitno</Badge>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* GLAVNI SADRŽAJ - Grid kartica soba */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-3">
        {filteredRooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            hasRequest={roomsWithRequests.has(room.room_number)}
            onClick={() => handleRoomClick(room)}
          />
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nema soba koje odgovaraju filteru</p>
        </div>
      )}

      {/* Tim sobarica - kompaktni prikaz na dnu */}
      {housekeepers.length > 0 && (
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
