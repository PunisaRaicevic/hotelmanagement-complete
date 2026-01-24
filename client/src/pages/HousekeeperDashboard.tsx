import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/apiUrl';
import StatCard from '@/components/StatCard';
import RoomStatusBadge from '@/components/RoomStatusBadge';
import {
  BedDouble,
  CheckCircle,
  Clock,
  PlayCircle,
  ClipboardList,
  Sparkles,
  AlertTriangle,
  Camera,
  Send,
} from 'lucide-react';

interface HousekeepingTask {
  id: string;
  room_id: string;
  room_number: string;
  cleaning_type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  guest_requests?: string;
  linens_changed: boolean;
  towels_changed: boolean;
  amenities_restocked: boolean;
  issues_found?: string;
  time_spent_minutes: number;
}

export default function HousekeeperDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<HousekeepingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<HousekeepingTask | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [issuesFound, setIssuesFound] = useState('');
  const [linensChanged, setLinensChanged] = useState(false);
  const [towelsChanged, setTowelsChanged] = useState(false);
  const [amenitiesRestocked, setAmenitiesRestocked] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch(
        getApiUrl(`/api/housekeeping/tasks?assigned_to=${user?.id}`),
        {
          credentials: 'include',
          headers: getAuthHeaders(),
        }
      );
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchTasks();
    }
  }, [user?.id]);

  const pendingTasks = tasks.filter((t) => t.status === 'pending');
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress');
  const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'inspected');
  const needsReworkTasks = tasks.filter((t) => t.status === 'needs_rework');

  const handleStartTask = async (task: HousekeepingTask) => {
    try {
      const response = await fetch(getApiUrl(`/api/housekeeping/tasks/${task.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'in_progress' }),
      });

      if (response.ok) {
        toast({ title: 'Zadatak započet', description: `Soba ${task.room_number}` });
        fetchTasks();
      }
    } catch (error) {
      toast({ title: 'Greška', description: 'Nije moguće započeti zadatak', variant: 'destructive' });
    }
  };

  const handleCompleteTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await fetch(getApiUrl(`/api/housekeeping/tasks/${selectedTask.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        credentials: 'include',
        body: JSON.stringify({
          status: 'completed',
          linens_changed: linensChanged,
          towels_changed: towelsChanged,
          amenities_restocked: amenitiesRestocked,
          issues_found: issuesFound || null,
        }),
      });

      if (response.ok) {
        toast({ title: 'Zadatak završen', description: `Soba ${selectedTask.room_number} označena kao čista` });
        setIsDialogOpen(false);
        resetForm();
        fetchTasks();
      }
    } catch (error) {
      toast({ title: 'Greška', description: 'Nije moguće završiti zadatak', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setSelectedTask(null);
    setIssuesFound('');
    setLinensChanged(false);
    setTowelsChanged(false);
    setAmenitiesRestocked(false);
  };

  const openCompleteDialog = (task: HousekeepingTask) => {
    setSelectedTask(task);
    setLinensChanged(task.linens_changed);
    setTowelsChanged(task.towels_changed);
    setAmenitiesRestocked(task.amenities_restocked);
    setIssuesFound(task.issues_found || '');
    setIsDialogOpen(true);
  };

  const getCleaningTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      daily: 'Dnevno čišćenje',
      checkout: 'Check-out čišćenje',
      deep_clean: 'Generalno čišćenje',
      turndown: 'Večernje sređivanje',
      touch_up: 'Brzo sređivanje',
    };
    return labels[type] || type;
  };

  const getPriorityBadge = (priority: string) => {
    if (priority === 'urgent') {
      return <Badge variant="destructive" className="text-[10px]">Hitno</Badge>;
    }
    if (priority === 'can_wait') {
      return <Badge variant="secondary" className="text-[10px]">Može čekati</Badge>;
    }
    return null;
  };

  const renderTaskCard = (task: HousekeepingTask, showActions = true) => (
    <Card key={task.id} className="p-4">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">{task.room_number}</span>
              {getPriorityBadge(task.priority)}
            </div>
            <p className="text-sm text-muted-foreground">{getCleaningTypeLabel(task.cleaning_type)}</p>
          </div>
          <Badge variant="outline" className="text-xs">
            {task.status === 'pending' && 'Čeka'}
            {task.status === 'in_progress' && 'U toku'}
            {task.status === 'completed' && 'Završeno'}
            {task.status === 'inspected' && 'Pregledano'}
            {task.status === 'needs_rework' && 'Ponovi'}
          </Badge>
        </div>

        {task.guest_requests && (
          <div className="p-2 bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded text-sm">
            <span className="font-medium">Zahtjev gosta: </span>
            {task.guest_requests}
          </div>
        )}

        {showActions && (
          <div className="flex gap-2 pt-2">
            {task.status === 'pending' && (
              <Button size="sm" onClick={() => handleStartTask(task)} className="flex-1">
                <PlayCircle className="w-4 h-4 mr-1" />
                Započni
              </Button>
            )}
            {(task.status === 'in_progress' || task.status === 'needs_rework') && (
              <Button size="sm" onClick={() => openCompleteDialog(task)} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-1" />
                Završi
              </Button>
            )}
          </div>
        )}
      </div>
    </Card>
  );

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
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" />
          Moji zadaci
        </h1>
        <p className="text-muted-foreground">{user?.fullName}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard title="Čeka" value={pendingTasks.length} icon={ClipboardList} />
        <StatCard title="U toku" value={inProgressTasks.length} icon={Clock} iconColor="text-yellow-500" />
        <StatCard title="Završeno" value={completedTasks.length} icon={CheckCircle} iconColor="text-green-500" />
        {needsReworkTasks.length > 0 && (
          <StatCard title="Ponovi" value={needsReworkTasks.length} icon={AlertTriangle} iconColor="text-red-500" />
        )}
      </div>

      {/* Tasks */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Zadaci za danas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="pending" className="text-xs">
                Čeka ({pendingTasks.length})
              </TabsTrigger>
              <TabsTrigger value="in_progress" className="text-xs">
                U toku ({inProgressTasks.length + needsReworkTasks.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-xs">
                Završeno ({completedTasks.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {pendingTasks.length > 0 ? (
                    pendingTasks.map((task) => renderTaskCard(task))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BedDouble className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nema zadataka na čekanju</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="in_progress" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {needsReworkTasks.length > 0 && (
                    <>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Potrebno ponoviti:</p>
                      {needsReworkTasks.map((task) => renderTaskCard(task))}
                    </>
                  )}
                  {inProgressTasks.length > 0 ? (
                    inProgressTasks.map((task) => renderTaskCard(task))
                  ) : needsReworkTasks.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nema zadataka u toku</p>
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="completed" className="mt-4">
              <ScrollArea className="h-[400px]">
                <div className="space-y-3 pr-4">
                  {completedTasks.length > 0 ? (
                    completedTasks.map((task) => renderTaskCard(task, false))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>Nema završenih zadataka</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Complete Task Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Završi čišćenje - Soba {selectedTask?.room_number}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Urađeno:</Label>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="linens"
                  checked={linensChanged}
                  onCheckedChange={(checked) => setLinensChanged(checked as boolean)}
                />
                <label htmlFor="linens" className="text-sm">Posteljina promijenjena</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="towels"
                  checked={towelsChanged}
                  onCheckedChange={(checked) => setTowelsChanged(checked as boolean)}
                />
                <label htmlFor="towels" className="text-sm">Peškiri promijenjeni</label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="amenities"
                  checked={amenitiesRestocked}
                  onCheckedChange={(checked) => setAmenitiesRestocked(checked as boolean)}
                />
                <label htmlFor="amenities" className="text-sm">Amenities dopunjeni</label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="issues">Pronađeni problemi (opcionalno)</Label>
              <Textarea
                id="issues"
                placeholder="Npr. pokvarena slavina, oštećena zavjesa..."
                value={issuesFound}
                onChange={(e) => setIssuesFound(e.target.value)}
                rows={3}
              />
            </div>

            <Button variant="outline" className="w-full" disabled>
              <Camera className="w-4 h-4 mr-2" />
              Dodaj fotografije (uskoro)
            </Button>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Otkaži
            </Button>
            <Button onClick={handleCompleteTask}>
              <Send className="w-4 h-4 mr-2" />
              Završi zadatak
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
