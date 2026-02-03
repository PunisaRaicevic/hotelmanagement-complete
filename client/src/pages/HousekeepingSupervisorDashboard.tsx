import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/apiUrl';
import StatCard from '@/components/StatCard';
import RoomGridView from '@/components/RoomGridView';
import RoomDetailDialog from '@/components/RoomDetailDialog';
import {
  BedDouble,
  CheckCircle,
  Clock,
  Users,
  ClipboardList,
  Sparkles,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  UserCheck,
  XCircle,
  Building,
  RefreshCw,
  MessageSquare,
  Phone,
  User,
  Send,
} from 'lucide-react';
import GuestRequestChat from '@/components/GuestRequestChat';

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

export default function HousekeepingSupervisorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [guestRequests, setGuestRequests] = useState<GuestRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuestRequest, setSelectedGuestRequest] = useState<GuestRequest | null>(null);

  // Sound notification state
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('soundNotificationsEnabled');
    return saved === 'true';
  });
  const [previousActiveRequestCount, setPreviousActiveRequestCount] = useState<number>(0);

  // Listen for sound setting changes from header toggle
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('soundNotificationsEnabled');
      setAudioEnabled(saved === 'true');
    };

    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom event for same-tab updates
    const handleCustomEvent = () => handleStorageChange();
    window.addEventListener('soundSettingChanged', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('soundSettingChanged', handleCustomEvent);
    };
  }, []);

  // Play notification sound using Web Audio API
  const playNotificationSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create a pleasant notification sound (two-tone)
      oscillator.frequency.value = 800; // First tone
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);

      // Second tone
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();

        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);

        oscillator2.frequency.value = 1000; // Second tone (higher pitch)
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

  // Monitor guest requests and play sound when new ones arrive
  useEffect(() => {
    if (loading) return;

    // Count active (non-completed) guest requests
    const activeRequestCount = guestRequests.filter(r => r.status !== 'completed').length;

    // Only play sound if not initial load and count increased
    if (previousActiveRequestCount > 0 && activeRequestCount > previousActiveRequestCount) {
      if (audioEnabled) {
        playNotificationSound();
      }
      toast({
        title: "Novi zahtjev gosta!",
        description: `Primljen ${activeRequestCount - previousActiveRequestCount} novi zahtjev.`,
      });
    }

    setPreviousActiveRequestCount(activeRequestCount);
  }, [guestRequests, loading, audioEnabled]);

  // Filters
  const [floorFilter, setFloorFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Form states
  const [inspectionNotes, setInspectionNotes] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchData = async () => {
    try {
      const [roomsRes, tasksRes, housekeepersRes, guestRequestsRes] = await Promise.all([
        fetch(getApiUrl('/api/rooms'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeeping/tasks'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeepers'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/guest-requests?forwarded_to_department=housekeeping'), { credentials: 'include', headers: getAuthHeaders() }),
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

    // Poll for new data every 30 seconds
    const pollInterval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // Statistics
  const dirtyRooms = rooms.filter((r) => r.status === 'dirty');
  const cleanRooms = rooms.filter((r) => r.status === 'clean');
  const inCleaningRooms = rooms.filter((r) => r.status === 'in_cleaning');
  const inspectedRooms = rooms.filter((r) => r.status === 'inspected');
  const checkoutRooms = rooms.filter((r) => r.occupancy_status === 'checkout');

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
  const needsReworkTasks = tasks.filter((t) => t.status === 'needs_rework');
  const inspectedTasks = tasks.filter((t) => t.status === 'inspected');
  const needsInspection = tasks.filter((t) => t.status === 'completed' && !t.inspection_passed);

  // Filtered rooms
  const filteredRooms = rooms.filter((room) => {
    if (floorFilter !== 'all' && room.floor !== parseInt(floorFilter)) return false;
    if (statusFilter !== 'all' && room.status !== statusFilter) return false;
    if (searchQuery && !room.room_number.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Get unique floors
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  const handleRoomClick = (room: Room) => {
    setSelectedRoom(room);
    setIsRoomDialogOpen(true);
  };

  const handleInspectTask = async (passed: boolean) => {
    if (!selectedTask) return;

    try {
      const response = await fetch(getApiUrl(`/api/housekeeping/tasks/${selectedTask.id}`), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        credentials: 'include',
        body: JSON.stringify({
          status: passed ? 'inspected' : 'needs_rework',
          inspection_passed: passed,
          inspection_notes: inspectionNotes,
        }),
      });

      if (response.ok) {
        toast({
          title: passed ? 'Inspekcija prošla' : 'Potrebno ponoviti',
          description: `Soba ${selectedTask.room_number}`,
        });
        setIsTaskDialogOpen(false);
        setInspectionNotes('');
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Greška', variant: 'destructive' });
    }
  };

  const getCleaningTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'Dnevno',
      checkout: 'Check-out',
      deep_clean: 'Generalno',
      turndown: 'Večernje',
      touch_up: 'Brzo',
    };
    return labels[type] || type;
  };

  const getTaskStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'border-l-gray-400';
      case 'in_progress': return 'border-l-yellow-500';
      case 'completed': return 'border-l-green-500';
      case 'inspected': return 'border-l-blue-500';
      case 'needs_rework': return 'border-l-red-500';
      default: return 'border-l-gray-300';
    }
  };

  const getTaskStatusDotColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-400';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'inspected': return 'bg-blue-500';
      case 'needs_rework': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const renderTaskSection = (sectionTasks: HousekeepingTask[], label: string, dotColor: string, pulse?: boolean) => {
    if (sectionTasks.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ${pulse ? 'animate-pulse' : ''}`} />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>
          <span className="text-xs text-muted-foreground">({sectionTasks.length})</span>
          <div className="flex-1 border-t border-muted-foreground/20" />
        </div>
        {sectionTasks.map((task) => (
          <Card key={task.id} className={`p-3 border-l-4 ${getTaskStatusColor(task.status)} hover-elevate transition-all`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold">{task.room_number}</span>
                <Badge variant="outline" className="text-xs">
                  {getCleaningTypeLabel(task.cleaning_type)}
                </Badge>
                <Badge
                  variant={
                    task.status === 'completed'
                      ? 'default'
                      : task.status === 'in_progress'
                      ? 'secondary'
                      : task.status === 'needs_rework'
                      ? 'destructive'
                      : 'outline'
                  }
                  className="text-xs"
                >
                  {task.status === 'pending' && 'Čeka'}
                  {task.status === 'in_progress' && 'U toku'}
                  {task.status === 'completed' && 'Završeno'}
                  {task.status === 'inspected' && 'Pregledano'}
                  {task.status === 'needs_rework' && 'Ponovi'}
                </Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {task.assigned_to_name || 'Nije dodijeljeno'}
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-medium flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <span className="text-gradient">Domaćinstvo</span>
          </h1>
          <p className="text-muted-foreground">
            {user?.fullName} - {
              user?.role === 'admin' ? 'Administrator' :
              user?.role === 'recepcioner' ? 'Recepcioner' :
              user?.role === 'sef_domacinstva' ? 'Šef domaćinstva' :
              'Korisnik'
            }
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Osvježi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="Prljave sobe"
          value={dirtyRooms.length}
          icon={BedDouble}
          iconColor="text-red-500"
          bgColorClass="bg-red-50 dark:bg-red-950/20"
        />
        <StatCard
          title="U čišćenju"
          value={inCleaningRooms.length}
          icon={Clock}
          iconColor="text-yellow-500"
          bgColorClass="bg-yellow-50 dark:bg-yellow-950/20"
        />
        <StatCard
          title="Čiste"
          value={cleanRooms.length}
          icon={CheckCircle}
          iconColor="text-green-500"
          bgColorClass="bg-green-50 dark:bg-green-950/20"
        />
        <StatCard
          title="Pregledane"
          value={inspectedRooms.length}
          icon={Eye}
          iconColor="text-blue-500"
          bgColorClass="bg-blue-50 dark:bg-blue-950/20"
        />
        <StatCard
          title="Check-out"
          value={checkoutRooms.length}
          icon={AlertTriangle}
          iconColor="text-orange-500"
          bgColorClass="bg-orange-50 dark:bg-orange-950/20"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="guest-requests">
        <TabsList className="grid w-full grid-cols-5 h-12 p-1 bg-muted/50">
          <TabsTrigger
            value="guest-requests"
            className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Zahtjevi</span>
            <Badge
              variant={guestRequests.filter(r => r.status !== 'completed').length > 0 ? 'destructive' : 'secondary'}
              className="ml-1 text-[10px] px-1.5"
            >
              {guestRequests.filter(r => r.status !== 'completed').length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="rooms"
            className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Sobe</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{rooms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            <ClipboardList className="w-4 h-4" />
            <span className="hidden sm:inline">Zadaci</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{tasks.length}</Badge>
          </TabsTrigger>
          <TabsTrigger
            value="inspection"
            className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Inspekcija</span>
            <Badge
              variant={needsInspection.length > 0 ? 'destructive' : 'secondary'}
              className="ml-1 text-[10px] px-1.5"
            >
              {needsInspection.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger
            value="team"
            className="gap-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md"
          >
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Tim</span>
            <Badge variant="secondary" className="ml-1 text-[10px] px-1.5">{housekeepers.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Guest Requests Tab */}
        <TabsContent value="guest-requests" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Request List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Zahtjevi gostiju
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-3 pr-4">
                    {guestRequests.length > 0 ? (
                      guestRequests.map((request) => {
                        const isActive = request.status !== 'completed';
                        return (
                          <Card
                            key={request.id}
                            className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                              selectedGuestRequest?.id === request.id
                                ? 'ring-2 ring-primary'
                                : ''
                            } ${
                              request.priority === 'urgent'
                                ? 'border-l-4 border-l-red-500'
                                : request.priority === 'normal'
                                ? 'border-l-4 border-l-blue-500'
                                : 'border-l-4 border-l-green-500'
                            }`}
                            onClick={() => setSelectedGuestRequest(request)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-bold">Soba {request.room_number}</span>
                                <Badge variant={isActive ? 'default' : 'outline'} className="text-xs">
                                  {request.status === 'new' && 'Novi'}
                                  {request.status === 'seen' && 'Viđeno'}
                                  {request.status === 'in_progress' && 'U obradi'}
                                  {request.status === 'completed' && 'Završeno'}
                                </Badge>
                              </div>
                              <Badge
                                variant={
                                  request.priority === 'urgent'
                                    ? 'destructive'
                                    : request.priority === 'normal'
                                    ? 'secondary'
                                    : 'outline'
                                }
                                className="text-xs"
                              >
                                {request.priority === 'urgent' && 'Hitno'}
                                {request.priority === 'normal' && 'Normalno'}
                                {request.priority === 'low' && 'Može čekati'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {request.request_type === 'housekeeping' && 'Čišćenje'}
                              {request.request_type === 'amenities' && 'Potrepštine'}
                              {request.request_type === 'other' && 'Ostalo'}
                              {request.category && ` - ${request.category}`}
                            </p>
                            <p className="text-sm line-clamp-2">{request.description}</p>
                            {request.guest_name && (
                              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                                <User className="w-3 h-3" />
                                {request.guest_name}
                                {request.guest_phone && (
                                  <>
                                    <Phone className="w-3 h-3 ml-2" />
                                    {request.guest_phone}
                                  </>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(request.created_at).toLocaleDateString('sr-RS', {
                                day: '2-digit',
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {request.forwarded_by_name && (
                                <span className="ml-2">• Proslijedio: {request.forwarded_by_name}</span>
                              )}
                            </p>
                          </Card>
                        );
                      })
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Nema zahtjeva gostiju</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Selected Request Details & Chat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedGuestRequest ? `Detalji - Soba ${selectedGuestRequest.room_number}` : 'Odaberite zahtjev'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {selectedGuestRequest ? (
                  <div className="space-y-4">
                    {/* Request Details */}
                    <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Tip zahtjeva:</span>
                        <span className="text-sm">
                          {selectedGuestRequest.request_type === 'housekeeping' && 'Čišćenje'}
                          {selectedGuestRequest.request_type === 'amenities' && 'Potrepštine'}
                          {selectedGuestRequest.request_type === 'other' && 'Ostalo'}
                        </span>
                      </div>
                      {selectedGuestRequest.category && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Kategorija:</span>
                          <span className="text-sm">{selectedGuestRequest.category}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Prioritet:</span>
                        <Badge
                          variant={
                            selectedGuestRequest.priority === 'urgent'
                              ? 'destructive'
                              : selectedGuestRequest.priority === 'normal'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {selectedGuestRequest.priority === 'urgent' && 'Hitno'}
                          {selectedGuestRequest.priority === 'normal' && 'Normalno'}
                          {selectedGuestRequest.priority === 'low' && 'Može čekati'}
                        </Badge>
                      </div>
                      {selectedGuestRequest.guest_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Gost:</span>
                          <span className="text-sm">{selectedGuestRequest.guest_name}</span>
                        </div>
                      )}
                      {selectedGuestRequest.guest_phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Telefon:</span>
                          <a href={`tel:${selectedGuestRequest.guest_phone}`} className="text-sm text-blue-600">
                            {selectedGuestRequest.guest_phone}
                          </a>
                        </div>
                      )}
                      <div className="pt-2 border-t">
                        <span className="text-sm font-medium">Opis:</span>
                        <p className="text-sm mt-1">{selectedGuestRequest.description}</p>
                      </div>
                    </div>

                    {/* Chat Section */}
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

                    {/* Action Buttons */}
                    {selectedGuestRequest.status !== 'completed' && (
                      <div className="flex gap-2 pt-4 border-t">
                        <Button
                          className="flex-1"
                          onClick={async () => {
                            try {
                              const response = await fetch(getApiUrl(`/api/guest-requests/${selectedGuestRequest.id}`), {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                credentials: 'include',
                                body: JSON.stringify({ status: 'completed' }),
                              });
                              if (response.ok) {
                                toast({ title: 'Uspješno', description: 'Zahtjev označen kao završen' });
                                fetchData();
                                setSelectedGuestRequest(null);
                              }
                            } catch (error) {
                              toast({ title: 'Greška', variant: 'destructive' });
                            }
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Označi kao završeno
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Odaberite zahtjev sa liste za prikaz detalja i komunikaciju</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="mt-4">
          <RoomGridView rooms={rooms} tasks={tasks} onRoomClick={handleRoomClick} />
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zadaci za danas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4 pr-4">
                  {tasks.length > 0 ? (
                    <>
                      {renderTaskSection(pendingTasks, 'Čeka', 'bg-gray-400')}
                      {renderTaskSection(inProgressTasks, 'U toku', 'bg-yellow-500', true)}
                      {renderTaskSection(completedTasks, 'Završeno', 'bg-green-500')}
                      {renderTaskSection(needsReworkTasks, 'Potrebno ponoviti', 'bg-red-500')}
                      {renderTaskSection(inspectedTasks, 'Pregledano', 'bg-blue-500')}
                    </>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nema zadataka za danas</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Inspection Tab */}
        <TabsContent value="inspection" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Čeka inspekciju</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-3 pr-4">
                  {needsInspection.length > 0 ? (
                    needsInspection.map((task) => (
                      <Card
                        key={task.id}
                        className="p-4 cursor-pointer hover-elevate transition-all border-l-4 border-l-amber-400"
                        onClick={() => {
                          setSelectedTask(task);
                          setIsTaskDialogOpen(true);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-lg">{task.room_number}</span>
                              <Badge variant="outline">{getCleaningTypeLabel(task.cleaning_type)}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Očistila: {task.assigned_to_name || 'N/A'}
                            </p>
                          </div>
                          <Button size="sm">
                            <Eye className="w-4 h-4 mr-1" />
                            Pregledaj
                          </Button>
                        </div>
                        {task.issues_found && (
                          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800 text-sm">
                            <span className="font-medium">Problem: </span>
                            {task.issues_found}
                          </div>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Sve sobe su pregledane</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tim sobarica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {housekeepers.map((hk) => {
                  const assignedTasks = tasks.filter((t) => t.assigned_to === hk.id);
                  const completedCount = assignedTasks.filter(
                    (t) => t.status === 'completed' || t.status === 'inspected'
                  ).length;
                  const completionPercent = assignedTasks.length > 0
                    ? Math.round((completedCount / assignedTasks.length) * 100)
                    : 0;
                  const firstLetter = hk.full_name.charAt(0).toUpperCase();

                  return (
                    <Card key={hk.id} className="p-5 hover-elevate transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-lg font-semibold text-primary">{firstLetter}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{hk.full_name}</p>
                            <span className="text-sm font-semibold text-muted-foreground">{completionPercent}%</span>
                          </div>
                          <Progress value={completionPercent} className="h-2 mt-1.5" />
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-xs text-muted-foreground">
                              {assignedTasks.length} zadataka
                            </span>
                            <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                              {completedCount} završeno
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
                {housekeepers.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nema registrovanih sobarica</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Room Details Dialog */}
      <RoomDetailDialog
        room={selectedRoom}
        open={isRoomDialogOpen}
        onOpenChange={setIsRoomDialogOpen}
        onRoomUpdated={fetchData}
      />

      {/* Inspection Dialog */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Inspekcija - Soba {selectedTask?.room_number}</DialogTitle>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {selectedTask.linens_changed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Posteljina</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {selectedTask.towels_changed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Peškiri</span>
                </div>
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  {selectedTask.amenities_restocked ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Amenities</span>
                </div>
              </div>

              {selectedTask.issues_found && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-medium">Prijavljeni problemi:</p>
                  <p className="text-sm">{selectedTask.issues_found}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Napomene inspekcije</Label>
                <Textarea
                  placeholder="Dodaj napomene..."
                  value={inspectionNotes}
                  onChange={(e) => setInspectionNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="destructive" onClick={() => handleInspectTask(false)}>
              <XCircle className="w-4 h-4 mr-1" />
              Ponovi čišćenje
            </Button>
            <Button className="btn-gradient" onClick={() => handleInspectTask(true)}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Prošla inspekciju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
