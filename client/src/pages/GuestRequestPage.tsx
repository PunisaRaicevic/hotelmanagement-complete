import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
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
} from 'lucide-react';

interface RoomInfo {
  room_number: string;
  floor: number;
  category: string;
  guest_name?: string;
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

  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'submitted'>('loading');
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [requestType, setRequestType] = useState<RequestType | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [priority, setPriority] = useState<Priority>('normal');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/public/room/${roomNumber}/${token}`);
        const data = await response.json();

        if (response.ok && data.valid) {
          setRoomInfo(data.room);
          setGuestName(data.room.guest_name || '');
          setStatus('valid');
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
          <Button onClick={resetForm} className="w-full">
            Pošalji novi zahtjev
          </Button>
        </Card>
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
