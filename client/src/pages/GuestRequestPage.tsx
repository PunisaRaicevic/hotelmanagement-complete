import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import GuestRequestChat from '@/components/GuestRequestChat';
import {
  Hotel,
  Wrench,
  Sparkles,
  Package,
  HelpCircle,
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Phone,
  User,
  MessageSquare,
  ArrowLeft,
  Plus,
  Clock,
  Forward,
} from 'lucide-react';

interface RoomInfo {
  room_number: string;
  floor: number;
  category: string;
  guest_name?: string;
}

interface GuestRequest {
  id: string;
  request_type: string;
  category?: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  forwarded_to_department?: string;
}

type RequestType = 'maintenance' | 'housekeeping' | 'amenities' | 'other';
type Priority = 'low' | 'normal' | 'urgent';

const requestTypes = [
  { id: 'maintenance', label: 'Tehnički problem', description: 'Kvar, popravka, instalacija', icon: Wrench },
  { id: 'housekeeping', label: 'Čišćenje', description: 'Dodatno čišćenje, promjena posteljine', icon: Sparkles },
  { id: 'amenities', label: 'Potrepštine', description: 'Ručnici, sapun, toalet papir', icon: Package },
  { id: 'other', label: 'Ostalo', description: 'Drugi zahtjevi ili pitanja', icon: HelpCircle },
];

const priorities = [
  { id: 'low', label: 'Može čekati', color: 'text-green-600' },
  { id: 'normal', label: 'Normalno', color: 'text-blue-600' },
  { id: 'urgent', label: 'Hitno', color: 'text-red-600' },
];

const categoryOptions: Record<RequestType, string[]> = {
  maintenance: ['Vodoinstalacije', 'Elektrika', 'Grijanje/Klima', 'TV/Internet', 'Vrata/Prozori', 'Ostalo'],
  housekeeping: ['Promjena posteljine', 'Čišćenje sobe', 'Čišćenje kupatila', 'Usisavanje', 'Ostalo'],
  amenities: ['Ručnici', 'Sapun/Šampon', 'Toalet papir', 'Voda za piće', 'Minibar', 'Ostalo'],
  other: [],
};

export default function GuestRequestPage() {
  const params = useParams<{ roomNumber: string; token: string }>();
  const { roomNumber, token } = params;
  const { toast } = useToast();

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'submitted' | 'viewRequests'>('loading');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<GuestRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<GuestRequest | null>(null);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  // Form state
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');

  // Function to fetch guest requests
  const fetchMyRequests = async (showLoading = true) => {
    if (showLoading) setIsLoadingRequests(true);
    try {
      const response = await fetch(`/api/public/room/${roomNumber}/${token}/requests`);
      if (response.ok) {
        const data = await response.json();
        setMyRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      if (showLoading) setIsLoadingRequests(false);
    }
  };

  // Validate token on mount and fetch existing requests
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/public/room/${roomNumber}/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setRoomInfo(data.room);
          setGuestName(data.room.guest_name || '');
          setStatus('valid');

          // Fetch existing requests in the background (without loading indicator)
          fetchMyRequests(false);
        } else {
          setStatus('invalid');
          setErrorMessage(data.error || 'QR kod nije validan.');
        }
      } catch (error) {
        setStatus('invalid');
        setErrorMessage('Greška pri provjeri QR koda.');
      }
    };

    if (roomNumber && token) {
      validateToken();
    } else {
      setStatus('invalid');
      setErrorMessage('Nedostaje broj sobe ili token.');
    }
  }, [roomNumber, token]);


  const handleSubmit = async () => {
    if (!requestType) {
      toast({ title: 'Greška', description: 'Odaberite vrstu zahtjeva', variant: 'destructive' });
      return;
    }
    if (!description.trim()) {
      toast({ title: 'Greška', description: 'Opišite vaš zahtjev', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/public/room/${roomNumber}/${token}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_type: requestType,
          category,
          description,
          guest_name: guestName,
          guest_phone: guestPhone,
          priority,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('submitted');
        toast({ title: 'Uspješno', description: 'Vaš zahtjev je poslan!' });
      } else {
        toast({ title: 'Greška', description: data.error, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Greška', description: 'Došlo je do greške pri slanju', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRequestType(null);
    setCategory('');
    setDescription('');
    setPriority('normal');
    setStatus('valid');
    // Refresh requests when returning to form
    fetchMyRequests(false);
  };

  const viewMyRequests = () => {
    fetchMyRequests();
    setStatus('viewRequests');
    setSelectedRequest(null);
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'new': return 'Novi';
      case 'seen': return 'Primljeno';
      case 'in_progress': return 'U obradi';
      case 'completed': return 'Završeno';
      default: return s;
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'new': return 'destructive';
      case 'seen': return 'secondary';
      case 'in_progress': return 'default';
      case 'completed': return 'outline';
      default: return 'secondary';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'maintenance': return 'Tehnički problem';
      case 'housekeeping': return 'Čišćenje';
      case 'amenities': return 'Potrepštine';
      case 'other': return 'Ostalo';
      default: return type;
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('sr-RS', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-blue-500 mb-4" />
          <p className="text-muted-foreground">Provjera QR koda...</p>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-red-50 to-white p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">QR kod nije validan</h1>
          <p className="text-muted-foreground mb-4">{errorMessage}</p>
          <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-800">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            Molimo kontaktirajte recepciju za pomoć.
          </div>
        </Card>
      </div>
    );
  }

  // Submitted state
  if (status === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-white p-4">
        <Card className="p-8 text-center max-w-sm w-full">
          <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h1 className="text-xl font-bold mb-2">Zahtjev poslan!</h1>
          <p className="text-muted-foreground mb-4">
            Naše osoblje će se pobrinuti za vaš zahtjev u najkraćem roku.
          </p>
          <div className="space-y-2">
            <Button onClick={viewMyRequests} className="w-full">
              <MessageSquare className="w-4 h-4 mr-2" />
              Pogledaj moje zahtjeve
            </Button>
            <Button onClick={resetForm} variant="outline" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Pošalji novi zahtjev
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // View my requests state
  if (status === 'viewRequests') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 overflow-y-auto">
        <div className="max-w-lg mx-auto pb-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Hotel className="w-10 h-10 mx-auto text-blue-600 mb-2" />
            <h1 className="text-xl font-bold">Moji zahtjevi</h1>
            <p className="text-muted-foreground text-sm">
              Soba {roomInfo?.room_number}
            </p>
          </div>

          {selectedRequest ? (
            // Selected request detail with chat
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedRequest(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Nazad na listu
              </Button>

              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline">
                    {getRequestTypeLabel(selectedRequest.request_type)}
                  </Badge>
                  <Badge variant={getStatusColor(selectedRequest.status) as any}>
                    {getStatusLabel(selectedRequest.status)}
                  </Badge>
                </div>
                <p className="text-sm mb-2">{selectedRequest.description}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatDateTime(selectedRequest.created_at)}
                </p>
                {selectedRequest.forwarded_to_department && (
                  <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                    <Forward className="w-3 h-3" />
                    Proslijeđeno: {selectedRequest.forwarded_to_department === 'housekeeping' ? 'Domaćinstvo' : 'Tehnička služba'}
                  </div>
                )}
              </Card>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Poruke
                </h3>
                <GuestRequestChat
                  requestId={selectedRequest.id}
                  isStaff={false}
                  sessionToken={token}
                  roomNumber={roomNumber}
                />
              </div>
            </div>
          ) : (
            // Request list
            <>
              {isLoadingRequests ? (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
                </div>
              ) : myRequests.length === 0 ? (
                <Card className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                  <p className="text-muted-foreground">Nemate poslanih zahtjeva</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <Card
                      key={req.id}
                      className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => setSelectedRequest(req)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="outline">
                          {getRequestTypeLabel(req.request_type)}
                        </Badge>
                        <Badge variant={getStatusColor(req.status) as any}>
                          {getStatusLabel(req.status)}
                        </Badge>
                      </div>
                      <p className="text-sm line-clamp-2">{req.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDateTime(req.created_at)}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              <Button onClick={resetForm} className="w-full mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Pošalji novi zahtjev
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  // Valid token - show form
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-4 overflow-y-auto">
      <div className="max-w-lg mx-auto pb-8">
        {/* Header */}
        <div className="text-center mb-6">
          <Hotel className="w-12 h-12 mx-auto text-blue-600 mb-2" />
          <h1 className="text-2xl font-bold">Usluga za goste</h1>
          <p className="text-muted-foreground">
            Soba {roomInfo?.room_number} • Sprat {roomInfo?.floor}
          </p>
        </div>

        {/* Previous Requests Section - Show if guest has any requests */}
        {myRequests.length > 0 && (
          <Card className="p-4 mb-4 border-blue-200 bg-blue-50/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Vaši prethodni zahtjevi</span>
              </div>
              <Badge variant="secondary">{myRequests.length}</Badge>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {myRequests.slice(0, 3).map((req) => (
                <div
                  key={req.id}
                  className="p-3 bg-white rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setSelectedRequest(req);
                    setStatus('viewRequests');
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{getRequestTypeLabel(req.request_type)}</span>
                    <Badge variant={getStatusColor(req.status) as any} className="text-xs">
                      {getStatusLabel(req.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{req.description}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDateTime(req.created_at)}
                  </p>
                </div>
              ))}
            </div>
            {myRequests.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-blue-600"
                onClick={viewMyRequests}
              >
                Pogledaj sve ({myRequests.length}) zahtjeva
              </Button>
            )}
            {myRequests.length <= 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-blue-600"
                onClick={viewMyRequests}
              >
                Pogledaj sve zahtjeve
              </Button>
            )}
          </Card>
        )}

        {/* Request Type Selection */}
        <Card className="p-4 mb-4">
          <Label className="text-sm font-medium mb-3 block">Vrsta zahtjeva *</Label>
          <div className="grid grid-cols-2 gap-2">
            {requestTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = requestType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    setRequestType(type.id as RequestType);
                    setCategory('');
                  }}
                >
                  <Icon className={`w-5 h-5 mb-1 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`} />
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Category Selection (if applicable) */}
        {requestType && categoryOptions[requestType].length > 0 && (
          <Card className="p-4 mb-4">
            <Label className="text-sm font-medium mb-3 block">Kategorija</Label>
            <div className="flex flex-wrap gap-2">
              {categoryOptions[requestType].map((cat) => (
                <Button
                  key={cat}
                  type="button"
                  variant={category === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </Card>
        )}

        {/* Description */}
        <Card className="p-4 mb-4">
          <Label htmlFor="description" className="text-sm font-medium mb-2 block">
            Opišite vaš zahtjev *
          </Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detaljno opišite problem ili zahtjev..."
            rows={4}
          />
        </Card>

        {/* Priority */}
        <Card className="p-4 mb-4">
          <Label className="text-sm font-medium mb-3 block">Hitnost</Label>
          <RadioGroup value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <div className="flex gap-4">
              {priorities.map((p) => (
                <div key={p.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={p.id} id={p.id} />
                  <Label htmlFor={p.id} className={`cursor-pointer ${p.color}`}>
                    {p.label}
                  </Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        </Card>

        {/* Contact Info */}
        <Card className="p-4 mb-4">
          <Label className="text-sm font-medium mb-3 block">Vaši podaci (opciono)</Label>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Vaše ime"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Broj telefona (za povratni poziv)"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !requestType || !description.trim()}
          className="w-full h-12 text-lg"
        >
          {isSubmitting ? (
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
          ) : (
            <Send className="w-5 h-5 mr-2" />
          )}
          Pošalji zahtjev
        </Button>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-4 pb-safe">
          Hvala što koristite našu uslugu. Osoblje će biti obaviješteno odmah.
        </p>
      </div>

      {/* CSS for mobile scrolling and safe areas */}
      <style>{`
        .pb-safe {
          padding-bottom: env(safe-area-inset-bottom, 16px);
        }
      `}</style>
    </div>
  );
}
