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
} from 'lucide-react';

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
  room,
  open,
  onOpenChange,
  onRoomUpdated,
}: RoomDetailDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('info');
  const [isLoading, setIsLoading] = useState(false);
  const [guestRequests, setGuestRequests] = useState<GuestServiceRequest[]>([]);

  // Check-in form state
  const [checkInData, setCheckInData] = useState({
    guest_name: '',
    guest_count: 1,
    guest_phone: '',
    guest_email: '',
    checkin_date: new Date().toISOString().split('T')[0],
    checkout_date: '',
  });

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

      // Fetch guest requests for this room
      fetchGuestRequests();
    }
  }, [room]);

  const fetchGuestRequests = async () => {
    if (!room) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/guest-requests?room_id=${room.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setGuestRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching guest requests:', error);
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
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rooms/${room.id}/checkin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(checkInData),
      });

      if (response.ok) {
        const data = await response.json();
        toast({ title: 'Uspješno', description: 'Gost je prijavljen' });
        onRoomUpdated();
        setActiveTab('qrcode');
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

  const handleCheckOut = async () => {
    if (!room) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/rooms/${room.id}/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        toast({ title: 'Uspješno', description: 'Gost je odjavljen, QR kod je nevažeći' });
        onRoomUpdated();
        setActiveTab('info');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-2xl font-bold">Soba {room.room_number}</span>
            <div className={`w-3 h-3 rounded-full ${status.color}`} />
            <Badge className={occupancy.color}>{occupancy.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="checkin">Check-in</TabsTrigger>
            <TabsTrigger value="qrcode" disabled={!hasActiveToken}>
              QR Kod
            </TabsTrigger>
            <TabsTrigger value="requests">Zahtjevi</TabsTrigger>
          </TabsList>

          {/* Info Tab */}
          <TabsContent value="info" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Detalji sobe
              </h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Sprat:</span>
                  <span className="font-medium">{room.floor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Kategorija:</span>
                  <span className="font-medium">{categoryLabels[room.category] || room.category}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Krevet:</span>
                  <span className="font-medium">{bedTypeLabels[room.bed_type || 'double']}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
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
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Ime:</span>
                    <span className="font-medium">{room.guest_name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-muted-foreground" />
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
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Zadnje čišćenje:</span>
                  <span className="font-medium">{formatDateTime(room.last_cleaned_at)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
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
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label htmlFor="guest_name">Ime gosta *</Label>
                      <Input
                        id="guest_name"
                        value={checkInData.guest_name}
                        onChange={(e) => setCheckInData({ ...checkInData, guest_name: e.target.value })}
                        placeholder="Unesite ime i prezime"
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
                      />
                    </div>
                    <div>
                      <Label htmlFor="guest_phone">Telefon</Label>
                      <Input
                        id="guest_phone"
                        value={checkInData.guest_phone}
                        onChange={(e) => setCheckInData({ ...checkInData, guest_phone: e.target.value })}
                        placeholder="+387..."
                      />
                    </div>
                    <div className="col-span-2">
                      <Label htmlFor="guest_email">Email</Label>
                      <Input
                        id="guest_email"
                        type="email"
                        value={checkInData.guest_email}
                        onChange={(e) => setCheckInData({ ...checkInData, guest_email: e.target.value })}
                        placeholder="email@example.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkin_date">Datum dolaska</Label>
                      <Input
                        id="checkin_date"
                        type="date"
                        value={checkInData.checkin_date}
                        onChange={(e) => setCheckInData({ ...checkInData, checkin_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="checkout_date">Datum odlaska</Label>
                      <Input
                        id="checkout_date"
                        type="date"
                        value={checkInData.checkout_date}
                        onChange={(e) => setCheckInData({ ...checkInData, checkout_date: e.target.value })}
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

                <div className="flex gap-2 justify-center">
                  <Button variant="outline" onClick={copyQRLink}>
                    <Clipboard className="w-4 h-4 mr-2" />
                    Kopiraj link
                  </Button>
                  <Button variant="outline" onClick={downloadQRCode}>
                    <Download className="w-4 h-4 mr-2" />
                    Preuzmi QR
                  </Button>
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
                      className="p-3 border rounded-lg bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {requestTypeLabels[request.request_type] || request.request_type}
                        </Badge>
                        <Badge
                          variant={request.status === 'completed' ? 'default' : request.status === 'new' ? 'destructive' : 'secondary'}
                        >
                          {request.status === 'new' ? 'Novi' :
                           request.status === 'seen' ? 'Viđen' :
                           request.status === 'in_progress' ? 'U obradi' :
                           request.status === 'completed' ? 'Završen' : request.status}
                        </Badge>
                      </div>
                      <p className="text-sm">{request.description}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDateTime(request.created_at)}
                        {request.guest_name && ` - ${request.guest_name}`}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
