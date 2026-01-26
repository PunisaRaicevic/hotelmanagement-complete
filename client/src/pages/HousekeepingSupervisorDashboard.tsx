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

export default function HousekeepingSupervisorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [housekeepers, setHousekeepers] = useState<Housekeeper[]>([]);
  const [loading, setLoading] = useState(true);

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
      const [roomsRes, tasksRes, housekeepersRes] = await Promise.all([
        fetch(getApiUrl('/api/rooms'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeeping/tasks'), { credentials: 'include', headers: getAuthHeaders() }),
        fetch(getApiUrl('/api/housekeepers'), { credentials: 'include', headers: getAuthHeaders() }),
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
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Statistics
  const dirtyRooms = rooms.filter((r) => r.status === 'dirty');
  const cleanRooms = rooms.filter((r) => r.status === 'clean');
  const inCleaningRooms = rooms.filter((r) => r.status === 'in_cleaning');
  const inspectedRooms = rooms.filter((r) => r.status === 'inspected');
  const checkoutRooms = rooms.filter((r) => r.occupancy_status === 'checkout');

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const completedTasks = tasks.filter((t) => t.status === 'completed');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Domaćinstvo
          </h1>
          <p className="text-muted-foreground">{user?.fullName} - Šef domaćinstva</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchData}>
          <RefreshCw className="w-4 h-4 mr-1" />
          Osvježi
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatCard title="Prljave sobe" value={dirtyRooms.length} icon={BedDouble} iconColor="text-red-500" />
        <StatCard title="U čišćenju" value={inCleaningRooms.length} icon={Clock} iconColor="text-yellow-500" />
        <StatCard title="Čiste" value={cleanRooms.length} icon={CheckCircle} iconColor="text-green-500" />
        <StatCard title="Pregledane" value={inspectedRooms.length} icon={Eye} iconColor="text-blue-500" />
        <StatCard title="Check-out" value={checkoutRooms.length} icon={AlertTriangle} iconColor="text-orange-500" />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="rooms">
        <TabsList>
          <TabsTrigger value="rooms" className="gap-1">
            <Building className="w-4 h-4" />
            Sobe ({rooms.length})
          </TabsTrigger>
          <TabsTrigger value="tasks" className="gap-1">
            <ClipboardList className="w-4 h-4" />
            Zadaci ({tasks.length})
          </TabsTrigger>
          <TabsTrigger value="inspection" className="gap-1">
            <Eye className="w-4 h-4" />
            Inspekcija ({needsInspection.length})
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-1">
            <Users className="w-4 h-4" />
            Tim ({housekeepers.length})
          </TabsTrigger>
        </TabsList>

        {/* Rooms Tab */}
        <TabsContent value="rooms" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <RoomGridView rooms={rooms} tasks={tasks} onRoomClick={handleRoomClick} />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Zadaci za danas</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2 pr-4">
                  {tasks.length > 0 ? (
                    tasks.map((task) => (
                      <Card key={task.id} className="p-3">
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
                    ))
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
                        className="p-4 cursor-pointer hover:shadow-md"
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
                          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-950 rounded text-sm">
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

                  return (
                    <Card key={hk.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{hk.full_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {assignedTasks.length} zadataka dodijeljeno
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{completedCount}</p>
                          <p className="text-xs text-muted-foreground">završeno</p>
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
                <div className="flex items-center gap-2">
                  {selectedTask.linens_changed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Posteljina</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTask.towels_changed ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Peškiri</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedTask.amenities_restocked ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span>Amenities</span>
                </div>
              </div>

              {selectedTask.issues_found && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded">
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
            <Button onClick={() => handleInspectTask(true)}>
              <CheckCircle className="w-4 h-4 mr-1" />
              Prošla inspekciju
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
