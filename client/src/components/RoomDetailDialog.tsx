import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  User,
  Calendar,
  Phone,
  Mail,
  Users,
  LogIn,
  LogOut,
  QrCode,
  Bed,
  Building2,
  Sparkles,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Clipboard,
  Download,
  Loader2,
  MessageSquare,
  Monitor,
  Wrench,
  Home,
  ArrowLeft,
  Forward,
  Bell,
  PlayCircle,
} from 'lucide-react';
import GuestRequestChat from './GuestRequestChat';
import SelectHousekeeperDialog from './SelectHousekeeperDialog';
import { getApiUrl } from '@/lib/apiUrl';

interface Room {
  id: string;
  room_number: string;
  floor: number;
  category: string;
  status: string;
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

interface GuestServiceRequest {
  id: string;
  room_number: string;
  request_type: string;
  category?: string;
  description: string;
  guest_name?: string;
  priority: string;
  status: string;
  created_at: string;
  forwarded_to_department?: string;
  forwarded_at?: string;
  forwarded_by_name?: string;
}

interface HousekeepingTask {
  id: string;
  room_id: string;
  assigned_to_name?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'inspected' | 'needs_rework';
  priority: string;
  guest_requests?: string;
  issues_found?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface RoomDetailDialogProps {
  room: Room | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomUpdated: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  clean: { label: 'Čista', color: 'bg-green-500' },
  dirty: { label: 'Prljava', color: 'bg-red-500' },
  in_cleaning: { label: 'U čišćenju', color: 'bg-yellow-500' },
  inspected: { label: 'Pregledana', color: 'bg-blue-500' },
  out_of_order: { label: 'Van funkcije', color: 'bg-gray-500' },
  do_not_disturb: { label: 'Ne uznemiravaj', color: 'bg-purple-500' },
};

const occupancyConfig: Record<string, { label: string; color: string }> = {
  occupied: { label: 'Zauzeta', color: 'text-orange-600 bg-orange-100' },
  vacant: { label: 'Prazna', color: 'text-green-600 bg-green-100' },
  checkout: { label: 'Check-out', color: 'text-red-600 bg-red-100' },
  checkin_expected: { label: 'Očekuje se dolazak', color: 'text-blue-600 bg-blue-100' },
  checkout_expected: { label: 'Očekuje se odlazak', color: 'text-amber-600 bg-amber-100' },
};

const categoryLabels: Record<string, string> = {
  standard: 'Standard',
  superior: 'Superior',
  deluxe: 'Deluxe',
  suite: 'Suite',
  apartment: 'Apartman',
};

const bedTypeLabels: Record<string, string> = {
  single: 'Single',
  double: 'Double',
  twin: 'Twin',
  king: 'King',
  queen: 'Queen',
};

const taskStatusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Čeka', color: 'text-yellow-700 bg-yellow-100' },
  in_progress: { label: 'U toku', color: 'text-blue-700 bg-blue-100' },
  completed: { label: 'Završeno', color: 'text-green-700 bg-green-100' },
  inspected: { label: 'Pregledano', color: 'text-purple-700 bg-purple-100' },
  needs_rework: { label: 'Potrebna dorada', color: 'text-red-700 bg-red-100' },
};

const requestTypeLabels: Record<string, string> = {
  maintenance: 'Održavanje',
  housekeeping: 'Čišćenje',
  amenities: 'Potrepštine',
  other: 'Ostalo',
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function RoomDetailDialog({
  room: roomProp,
  open,
  onOpenChange,
  onRoomUpdated,
}: RoomDetailDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingToDisplay, setIsSendingToDisplay] = useState(false);
  const [guestRequests, setGuestRequests] = useState<GuestServiceRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<GuestServiceRequest | null>(null);
  const [isForwarding, setIsForwarding] = useState(false);
  const [showHousekeeperDialog, setShowHousekeeperDialog] = useState(false);  // kept for manual re-assignment
  const [checkoutRoomData, setCheckoutRoomData] = useState<{ roomId: string; roomNumber: string } | null>(null);  // kept for manual re-assignment
  const [activeTask, setActiveTask] = useState<HousekeepingTask | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(false);
  const [issuesText, setIssuesText] = useState('');

  // Local room state that can be updated after check-in
  const [room, setRoom] = useState<Room | null>(roomProp);

  // Check-in form state
  const [checkInData, setCheckInData] = useState({
    guest_name: '',
    guest_count: 1,
    guest_phone: '',
    guest_email: '',
    checkin_date: new Date().toISOString().split('T')[0],
    checkout_date: '',
  });

  // Sync local room state with prop
  useEffect(() => {
    setRoom(roomProp);
  }, [roomProp]);

  // Reset form when room changes
  useEffect(() => {
    if (room) {
      setCheckInData({
        guest_name: room.guest_name || '',
        guest_count: room.guest_count || 1,
        guest_phone: room.guest_phone || '',
        guest_email: room.guest_email || '',
        checkin_date: room.checkin_date?.split('T')[0] || new Date().toISOString().split('T')[0],
        checkout_date: room.checkout_date?.split('T')[0] || '',
      });

      // Reset state when switching rooms
      setGuestRequests([]);
      setSelectedRequest(null);
      setActiveTab('info');

      // Fetch guest requests for this room
      fetchGuestRequests();
    }
  }, [room]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('authToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchGuestRequests = async () => {
    if (!room) return;
    try {
      const response = await fetch(getApiUrl(`/api/guest-requests?room_id=${room.id}`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setGuestRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching guest requests:', error);
    }
  };

  const fetchActiveTask = async () => {
    if (!room) return;
    setIsLoadingTask(true);
    try {
      const response = await fetch(getApiUrl(`/api/housekeeping/tasks?room_id=${room.id}`), {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const tasks: HousekeepingTask[] = data.tasks || data || [];
        // Find the most recent non-completed/non-inspected task, or fall back to the latest
        const active = tasks.find(
          (t) => t.status !== 'completed' && t.status !== 'inspected'
        ) || (tasks.length > 0 ? tasks[0] : null);
        setActiveTask(active);
        if (active?.issues_found) {
          setIssuesText(active.issues_found);
        }
      }
    } catch (error) {
      console.error('Error fetching housekeeping task:', error);
    } finally {
      setIsLoadingTask(false);
    }
  };

  useEffect(() => {
    if (room) {
      fetchActiveTask();
    }
  }, [room?.id]);

  const handleAcceptTask = async () => {
    if (!activeTask) return;
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/housekeeping/tasks/${activeTask.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: 'in_progress' }),
      });
      if (response.ok) {
        toast({ title: 'Uspješno', description: 'Zadatak je prihvaćen' });
        onRoomUpdated();
        await fetchActiveTask();
      } else {
        const error = await response.json();
        toast({ title: 'Greška', description: error.error || 'Nije moguće prihvatiti zadatak', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Greška', description: 'Došlo je do greške', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteTask = async () => {
    if (!activeTask) return;
    setIsLoading(true);
    try {
      const response = await fetch(getApiUrl(`/api/housekeeping/tasks/${activeTask.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: 'completed', issues_found: issuesText || undefined }),
      });
      if (response.ok) {
        toast({ title: 'Uspješno', description: 'Čišćenje je označeno kao završeno' });
        onRoomUpdated();
        await fetchActiveTask();
      } else {
        const error = await response.json();
        toast({ title: 'Greška', description: error.error || 'Nije moguće završiti zadatak', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Greška', description: 'Došlo je do greške', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForwardRequest = async (department: 'housekeeping' | 'maintenance') => {
    if (!selectedRequest) return;

    setIsForwarding(true);
    try {
      const response = await fetch(getApiUrl(`/api/guest-requests/${selectedRequest.id}/forward`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ department }),
      });

      if (response.ok) {
        toast({
          title: 'Uspješno proslijeđeno',
          description: department === 'housekeeping' ? 'Zahtjev proslijeđen domaćinstvu' : 'Zahtjev proslijeđen tehničkoj službi',
        });
        await fetchGuestRequests();
        // Update selected request
        const data = await response.json();
        if (data.request) {
          setSelectedRequest(data.request);
        }
      } else {
        const error = await response.json();
        toast({ title: 'Greška', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Greška', description: 'Došlo je do greške', variant: 'destructive' });
    } finally {
      setIsForwarding(false);
    }
  };

  const handleCheckIn = async () => {
    if (!room) return;
    if (!checkInData.guest_name) {
      toast({ title: 'Greška', description: 'Unesite ime gosta', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      console.log('Starting check-in for room:', room.id);

      const response = await fetch(getApiUrl(`/api/rooms/${room.id}/checkin`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(checkInData),
      });

      console.log('Check-in response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Check-in response data:', data);
        // Update local room state with the response data (includes session_token)
        if (data.room) {
          setRoom(data.room);
        }
        toast({ title: 'Uspješno', description: 'Gost je prijavljen' });
        onRoomUpdated();
        setActiveTab('qrcode');
      } else {
        const errorText = await response.text();
        console.error('Check-in error response:', errorText);
        try {
          const error = JSON.parse(errorText);
          toast({ title: 'Greška', description: error.error || 'Nepoznata greška', variant: 'destructive' });
        } catch {
          toast({ title: 'Greška', description: errorText || 'Nepoznata greška', variant: 'destructive' });
        }
      }
    } catch (error: any) {
      console.error('Check-in exception:', error);
      console.error('Error message:', error?.message);
      console.error('Error stack:', error?.stack);
      toast({ title: 'Greška', description: error?.message || 'Došlo je do greške pri prijavi gosta', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!room) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl(`/api/rooms/${room.id}/checkout`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Update local room state with the response data (token cleared)
        if (data.room) {
          setRoom(data.room);
        }
        // Show toast with auto-assignment info
        if (data.assignedHousekeeperName) {
          toast({ title: 'Uspješno', description: `Gost odjavljen. Checkout čišćenje dodijeljeno: ${data.assignedHousekeeperName}` });
        } else if (data.housekeepingTask) {
          toast({ title: 'Uspješno', description: 'Gost odjavljen. Checkout nalog kreiran (nema dostupnih sobarica za dodjelu)' });
        } else {
          toast({ title: 'Uspješno', description: 'Gost je odjavljen, QR kod je nevažeći' });
        }
        onRoomUpdated();
        setActiveTab('info');
        fetchActiveTask();
      } else {
        const error = await response.json();
        toast({ title: 'Greška', description: error.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Greška', description: 'Došlo je do greške', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // Pošalji QR kod na Guest Display ekran
  const handleSendToDisplay = async () => {
    if (!room) return;

    setIsSendingToDisplay(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl(`/api/rooms/${room.id}/show-qr-to-display`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({
          title: 'Uspješno',
          description: 'QR kod je prikazan na guest display-u'
        });
      } else {
        const error = await response.json();
        toast({
          title: 'Greška',
          description: error.error || 'Nije moguće poslati QR na display',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće povezati se sa serverom',
        variant: 'destructive'
      });
    } finally {
      setIsSendingToDisplay(false);
    }
  };

  const copyQRLink = () => {
    if (!room?.guest_session_token) return;
    const url = `${window.location.origin}/guest/${room.room_number}/${room.guest_session_token}`;
    navigator.clipboard.writeText(url);
    toast({ title: 'Kopirano', description: 'Link je kopiran u clipboard' });
  };

  const downloadQRCode = () => {
    const svg = document.getElementById('room-qr-code');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-Soba-${room?.room_number}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!room) return null;

  const status = statusConfig[room.status] || { label: room.status, color: 'bg-gray-500' };
  const occupancy = occupancyConfig[room.occupancy_status] || { label: room.occupancy_status, color: 'text-gray-600 bg-gray-100' };
  const isOccupied = room.occupancy_status === 'occupied';
  const hasActiveToken = !!room.guest_session_token;
  const qrUrl = hasActiveToken ? `${window.location.origin}/guest/${room.room_number}/${room.guest_session_token}` : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-[95vw] max-h-[90vh] overflow-y-auto p-3 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="text-xl sm:text-2xl font-bold">Soba {room.room_number}</span>
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            <Badge className={occupancy.color}>{occupancy.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="text-xs sm:text-sm px-1 sm:px-3">Info</TabsTrigger>
            <TabsTrigger value="checkin" className="text-xs sm:text-sm px-1 sm:px-3">Check-in</TabsTrigger>
            <TabsTrigger value="qrcode" disabled={!hasActiveToken} className="text-xs sm:text-sm px-1 sm:px-3">
              QR Kod
            </TabsTrigger>
            <TabsTrigger value="requests" className="text-xs sm:text-sm px-1 sm:px-3">Zahtjevi</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Detalji sobe
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Sprat:</span>
                  <span className="font-medium">{room.floor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Kategorija:</span>
                  <span className="font-medium">{categoryLabels[room.category] || room.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Krevet:</span>
                  <span className="font-medium">{bedTypeLabels[room.bed_type || 'double']}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Kapacitet:</span>
                  <span className="font-medium">{room.max_occupancy || 2} osoba</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Status:</span>
                  <Badge variant="outline" className={`${status.color} bg-opacity-20`}>
                    {status.label}
                  </Badge>
                </div>
                {room.assigned_housekeeper_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Sobarica:</span>
                    <span className="font-medium">{room.assigned_housekeeper_name}</span>
                  </div>
                )}
              </div>
            </Card>

            {/* Guest Info (if occupied) */}
            {isOccupied && room.guest_name && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Podaci o gostu
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Ime:</span>
                    <span className="font-medium truncate">{room.guest_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="text-muted-foreground">Broj gostiju:</span>
                    <span className="font-medium">{room.guest_count || 1}</span>
                  </div>
                  {room.guest_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Telefon:</span>
                      <span className="font-medium">{room.guest_phone}</span>
                    </div>
                  )}
                  {room.guest_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Email:</span>
                      <span className="font-medium">{room.guest_email}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    <span className="text-muted-foreground">Check-in:</span>
                    <span className="font-medium">{formatDate(room.checkin_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    <span className="text-muted-foreground">Check-out:</span>
                    <span className="font-medium">{formatDate(room.checkout_date)}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t flex justify-end">
                  <Button variant="destructive" onClick={handleCheckOut} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                    Odjavi gosta
                  </Button>
                </div>
              </Card>
            )}

            {/* Cleaning Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Čišćenje i pregled
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Zadnje čišćenje:</span>
                  <span className="font-medium">{formatDateTime(room.last_cleaned_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-muted-foreground">Zadnji pregled:</span>
                  <span className="font-medium">{formatDateTime(room.last_inspected_at)}</span>
                </div>
              </div>
              {room.notes && (
                <div className="mt-3 p-2 bg-muted rounded text-sm">
                  <span className="text-muted-foreground">Napomena: </span>
                  {room.notes}
                </div>
              )}
            </Card>

            {/* Housekeeping Task Card */}
            {activeTask && (
              <Card className="p-4 border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Obavijest o čišćenju
                </h3>
                <div className="space-y-2 text-sm">
                  {activeTask.assigned_to_name && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Sobarica:</span>
                      <span className="font-medium">{activeTask.assigned_to_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Status:</span>
                    <Badge className={taskStatusConfig[activeTask.status]?.color || ''}>
                      {taskStatusConfig[activeTask.status]?.label || activeTask.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Prioritet:</span>
                    <Badge variant={activeTask.priority === 'urgent' ? 'destructive' : 'secondary'}>
                      {activeTask.priority === 'urgent' ? 'Hitno' : 'Normalan'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Kreirano:</span>
                    <span className="font-medium">{formatDateTime(activeTask.created_at)}</span>
                  </div>
                  {activeTask.guest_requests && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">Poruka:</span>
                      <span className="font-medium">{activeTask.guest_requests}</span>
                    </div>
                  )}
                </div>

                {/* Actions based on status and role */}
                {activeTask.status === 'pending' && (
                  <div className="mt-4 pt-3 border-t">
                    {user?.role === 'sobarica' ? (
                      <Button
                        className="w-full bg-yellow-500 hover:bg-yellow-600 text-white"
                        onClick={handleAcceptTask}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <PlayCircle className="w-4 h-4 mr-2" />
                        )}
                        Prihvati zadatak
                      </Button>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-amber-100 dark:bg-amber-950/40 rounded-lg text-sm">
                        <Clock className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span className="text-amber-800 dark:text-amber-300">
                          {activeTask.assigned_to_name
                            ? `Zadatak dodijeljen sobarici ${activeTask.assigned_to_name}. Čeka se prihvat.`
                            : 'Zadatak kreiran. Čeka se dodjela sobarici.'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {activeTask.status === 'in_progress' && (
                  <div className="mt-4 pt-3 border-t space-y-3">
                    {user?.role === 'sobarica' ? (
                      <>
                        <div>
                          <Label htmlFor="issues_found" className="text-sm font-medium">
                            Napomene (opcionalno)
                          </Label>
                          <Textarea
                            id="issues_found"
                            placeholder="Nešto nedostaje, polomljeno, itd."
                            value={issuesText}
                            onChange={(e) => setIssuesText(e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                          onClick={handleCompleteTask}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                          )}
                          Završi čišćenje
                        </Button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-950/40 rounded-lg text-sm">
                        <Loader2 className="w-4 h-4 text-blue-600 animate-spin flex-shrink-0" />
                        <span className="text-blue-800 dark:text-blue-300">
                          {activeTask.assigned_to_name || 'Sobarica'} čisti sobu. Zadatak u toku{activeTask.started_at ? ` od ${formatDateTime(activeTask.started_at)}` : ''}.
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {activeTask.status === 'completed' && (
                  <div className="mt-4 pt-3 border-t">
                    {activeTask.issues_found && (
                      <div className="p-2 bg-muted rounded text-sm mb-2">
                        <span className="text-muted-foreground">Napomene: </span>
                        {activeTask.issues_found}
                      </div>
                    )}
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Završeno {activeTask.completed_at ? formatDateTime(activeTask.completed_at) : ''}
                    </Badge>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>

          {/* Check-in Tab */}
          <TabsContent value="checkin" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <LogIn className="w-4 h-4" />
                Prijava gosta
              </h3>

              {isOccupied ? (
                <div className="text-center py-6">
                  <AlertTriangle className="w-12 h-12 mx-auto text-amber-500 mb-3" />
                  <p className="text-muted-foreground">Soba je trenutno zauzeta.</p>
                  <p className="text-sm text-muted-foreground">Prvo odjavite trenutnog gosta.</p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="sm:col-span-2">
                      <Label htmlFor="guest_name">Ime gosta *</Label>
                      <Input
                        id="guest_name"
                        value={checkInData.guest_name}
                        onChange={(e) => setCheckInData({ ...checkInData, guest_name: e.target.value })}
                        placeholder="Unesite ime i prezime"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_count">Broj gostiju</Label>
                      <Input
                        id="guest_count"
                        type="number"
                        min={1}
                        max={room.max_occupancy || 10}
                        value={checkInData.guest_count}
                        onChange={(e) => setCheckInData({ ...checkInData, guest_count: parseInt(e.target.value) || 1 })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_phone">Telefon</Label>
                      <Input
                        id="guest_phone"
                        type="number"
                        inputMode="tel"
                        value={checkInData.guest_phone}
                        onChange={(e) => setCheckInData({ ...checkInData, guest_phone: e.target.value })}
                        placeholder="+387..."
                        className="mt-1"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="guest_email">Email</Label>
                      <Input
                        id="guest_email"
                        type="email"
                        value={checkInData.guest_email}
                        onChange={(e) => setCheckInData({ ...checkInData, guest_email: e.target.value })}
                        placeholder="email@example.com"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkin_date">Datum dolaska</Label>
                      <Input
                        id="checkin_date"
                        type="date"
                        value={checkInData.checkin_date}
                        onChange={(e) => setCheckInData({ ...checkInData, checkin_date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout_date">Datum odlaska</Label>
                      <Input
                        id="checkout_date"
                        type="date"
                        value={checkInData.checkout_date}
                        onChange={(e) => setCheckInData({ ...checkInData, checkout_date: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button onClick={handleCheckIn} disabled={isLoading} className="w-full">
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <LogIn className="w-4 h-4 mr-2" />
                    )}
                    Prijavi gosta i generiši QR kod
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* QR Code Tab */}
          <TabsContent value="qrcode" className="space-y-4">
            {hasActiveToken ? (
              <Card className="p-6 text-center">
                <h3 className="font-semibold mb-4 flex items-center justify-center gap-2">
                  <QrCode className="w-5 h-5" />
                  QR Kod za goste
                </h3>

                <div className="bg-white p-4 rounded-lg inline-block mb-4">
                  <QRCodeSVG
                    id="room-qr-code"
                    value={qrUrl}
                    size={200}
                    level="H"
                    includeMargin
                  />
                </div>

                <p className="text-sm text-muted-foreground mb-2">
                  Gost: <strong>{room.guest_name}</strong>
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Kreirano: {formatDateTime(room.token_created_at)}
                </p>

                <div className="flex gap-2 justify-center flex-wrap">
                  <Button variant="outline" onClick={copyQRLink}>
                    <Clipboard className="w-4 h-4 mr-2" />
                    Kopiraj link
                  </Button>
                  <Button variant="outline" onClick={downloadQRCode}>
                    <Download className="w-4 h-4 mr-2" />
                    Preuzmi QR
                  </Button>
                </div>

                {/* Dugme za prikaz na Guest Display ekranu */}
                <div className="mt-4">
                  <Button
                    className="w-full"
                    onClick={handleSendToDisplay}
                    disabled={isSendingToDisplay}
                  >
                    {isSendingToDisplay ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Monitor className="w-4 h-4 mr-2" />
                    )}
                    Prikaži QR gostu
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    Prikazuje QR kod na ekranu okrenutom prema gostu
                  </p>
                </div>

                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded text-sm text-left">
                  <p className="font-medium mb-1">Kako koristiti:</p>
                  <ul className="text-muted-foreground text-xs space-y-1">
                    <li>1. Gost skenira QR kod mobilnim telefonom</li>
                    <li>2. Otvara se stranica za slanje zahtjeva</li>
                    <li>3. Gost može prijaviti problem ili zatražiti uslugu</li>
                    <li>4. QR kod prestaje važiti nakon odjave gosta</li>
                  </ul>
                </div>

                <div className="mt-4 pt-4 border-t">
                  <Button variant="destructive" onClick={handleCheckOut} disabled={isLoading}>
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <LogOut className="w-4 h-4 mr-2" />}
                    Odjavi gosta (poništi QR kod)
                  </Button>
                </div>
              </Card>
            ) : (
              <Card className="p-6 text-center">
                <QrCode className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">QR kod nije aktivan.</p>
                <p className="text-sm text-muted-foreground">Prijavite gosta da biste generisali QR kod.</p>
              </Card>
            )}
          </TabsContent>

          {/* Guest Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            {selectedRequest ? (
              // Selected request detail view
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedRequest(null)}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  Nazad na listu
                </Button>

                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">
                        {requestTypeLabels[selectedRequest.request_type] || selectedRequest.request_type}
                      </Badge>
                      <Badge
                        variant={selectedRequest.status === 'completed' ? 'default' : selectedRequest.status === 'new' ? 'destructive' : 'secondary'}
                      >
                        {selectedRequest.status === 'new' ? 'Novi' :
                         selectedRequest.status === 'seen' ? 'Viđen' :
                         selectedRequest.status === 'in_progress' ? 'U obradi' :
                         selectedRequest.status === 'completed' ? 'Završen' : selectedRequest.status}
                      </Badge>
                    </div>
                    {selectedRequest.priority === 'urgent' && (
                      <Badge variant="destructive">Hitno</Badge>
                    )}
                  </div>

                  <p className="text-sm mb-2">{selectedRequest.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(selectedRequest.created_at)}
                    {selectedRequest.guest_name && ` - ${selectedRequest.guest_name}`}
                  </p>

                  {selectedRequest.forwarded_to_department && (
                    <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-sm flex items-center gap-2">
                      <Forward className="w-4 h-4 text-blue-600" />
                      <span>
                        Proslijeđeno: {selectedRequest.forwarded_to_department === 'housekeeping' ? 'Domaćinstvo' : 'Tehnička služba'}
                        {selectedRequest.forwarded_by_name && ` (${selectedRequest.forwarded_by_name})`}
                      </span>
                    </div>
                  )}

                  {/* Forward buttons - only show if not yet forwarded */}
                  {!selectedRequest.forwarded_to_department && selectedRequest.status !== 'completed' && (
                    <div className="mt-4 pt-3 border-t">
                      <p className="text-sm font-medium mb-2">Proslijedi zahtjev:</p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleForwardRequest('housekeeping')}
                          disabled={isForwarding}
                        >
                          {isForwarding ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Home className="w-4 h-4 mr-1" />
                          )}
                          Domaćinstvu
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleForwardRequest('maintenance')}
                          disabled={isForwarding}
                        >
                          {isForwarding ? (
                            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                          ) : (
                            <Wrench className="w-4 h-4 mr-1" />
                          )}
                          Tehničkoj službi
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Chat section */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Poruke sa gostom
                  </h4>
                  <GuestRequestChat
                    requestId={selectedRequest.id}
                    isStaff={true}
                    onMessageSent={fetchGuestRequests}
                  />
                </div>
              </div>
            ) : (
              // Request list view
              <Card className="p-4">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Zahtjevi gostiju ({guestRequests.length})
                </h3>

                {guestRequests.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>Nema zahtjeva za ovu sobu</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {guestRequests.map((request) => (
                      <div
                        key={request.id}
                        className="p-3 border rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {requestTypeLabels[request.request_type] || request.request_type}
                            </Badge>
                            {request.forwarded_to_department && (
                              <Badge variant="secondary" className="text-xs">
                                <Forward className="w-3 h-3 mr-1" />
                                {request.forwarded_to_department === 'housekeeping' ? 'Domaćinstvo' : 'Tehnička'}
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant={request.status === 'completed' ? 'default' : request.status === 'new' ? 'destructive' : 'secondary'}
                          >
                            {request.status === 'new' ? 'Novi' :
                             request.status === 'seen' ? 'Viđen' :
                             request.status === 'in_progress' ? 'U obradi' :
                             request.status === 'completed' ? 'Završen' : request.status}
                          </Badge>
                        </div>
                        <p className="text-sm line-clamp-2">{request.description}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {formatDateTime(request.created_at)}
                          {request.guest_name && ` - ${request.guest_name}`}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Housekeeper assignment dialog after checkout */}
      {checkoutRoomData && (
        <SelectHousekeeperDialog
          open={showHousekeeperDialog}
          onOpenChange={setShowHousekeeperDialog}
          roomId={checkoutRoomData.roomId}
          roomNumber={checkoutRoomData.roomNumber}
          onTaskCreated={() => {
            toast({ title: 'Uspješno', description: 'Sobarica je obaviještena o čišćenju sobe' });
            setCheckoutRoomData(null);
            onRoomUpdated();
            fetchActiveTask();
          }}
          onSkip={() => {
            setCheckoutRoomData(null);
          }}
        />
      )}
    </Dialog>
  );
}
