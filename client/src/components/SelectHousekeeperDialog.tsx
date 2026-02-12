import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserCheck, Sparkles, Loader2, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '@/lib/apiUrl';

type Housekeeper = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  department: string | null;
  phone: string | null;
  is_active: boolean;
};

interface SelectHousekeeperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  roomNumber: string;
  onTaskCreated: () => void;
  onSkip: () => void;
}

export default function SelectHousekeeperDialog({
  open,
  onOpenChange,
  roomId,
  roomNumber,
  onTaskCreated,
  onSkip,
}: SelectHousekeeperDialogProps) {
  const [selectedHousekeeper, setSelectedHousekeeper] = useState<string | null>(null);
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: housekeepersData, isLoading } = useQuery<{ housekeepers: Housekeeper[] }>({
    queryKey: ['/api/housekeepers'],
    enabled: open,
  });

  const housekeepers = housekeepersData?.housekeepers || [];

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetState();
    }
    onOpenChange(newOpen);
  };

  const resetState = () => {
    setSelectedHousekeeper(null);
    setPriority('normal');
    setMessage('');
  };

  const handleSubmit = async () => {
    if (!selectedHousekeeper) return;

    const housekeeper = housekeepers.find(h => h.id === selectedHousekeeper);
    if (!housekeeper) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(getApiUrl('/api/housekeeping/tasks'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          room_id: roomId,
          room_number: roomNumber,
          cleaning_type: 'checkout',
          assigned_to: housekeeper.id,
          assigned_to_name: housekeeper.full_name,
          priority,
          scheduled_date: new Date().toISOString(),
          guest_requests: message || undefined,
        }),
      });

      if (response.ok) {
        resetState();
        onOpenChange(false);
        onTaskCreated();
      }
    } catch (error) {
      console.error('Error creating housekeeping task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    resetState();
    onOpenChange(false);
    onSkip();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Dodijeli čišćenje - Soba {roomNumber}
          </DialogTitle>
          <DialogDescription>
            Soba je označena kao prljava nakon odjave gosta. Odaberite sobaricu za čišćenje.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {/* Housekeeper list */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Odaberite sobaricu</Label>
            <ScrollArea className="h-[250px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : housekeepers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <AlertTriangle className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nema dostupnih sobarica</h3>
                  <p className="text-sm text-muted-foreground">
                    Trenutno nema aktivnih sobarica u sistemu.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {housekeepers.map((hk) => (
                    <button
                      key={hk.id}
                      onClick={() => setSelectedHousekeeper(hk.id)}
                      className={`w-full p-4 rounded-md border-2 transition-all hover-elevate ${
                        selectedHousekeeper === hk.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {hk.full_name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>

                        <div className="flex-1 text-left">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="font-medium">{hk.full_name}</h4>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500" />
                              <span className="text-xs text-muted-foreground">Aktivna</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {hk.phone && (
                              <Badge variant="secondary" className="text-xs">
                                {hk.phone}
                              </Badge>
                            )}
                            {selectedHousekeeper === hk.id && (
                              <Badge variant="default" className="text-xs">
                                <UserCheck className="w-3 h-3 mr-1" />
                                Izabrana
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Priority selector */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Prioritet</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={priority === 'normal' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPriority('normal')}
              >
                Normalan
              </Button>
              <Button
                type="button"
                variant={priority === 'urgent' ? 'destructive' : 'outline'}
                size="sm"
                onClick={() => setPriority('urgent')}
              >
                Hitno
              </Button>
            </div>
          </div>

          {/* Optional message */}
          <div>
            <Label htmlFor="hk-message" className="text-sm font-medium mb-2 block">
              Poruka (opciono)
            </Label>
            <Textarea
              id="hk-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Npr. gost je tražio dodatne peškire..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleSkip}>
            Preskoči
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedHousekeeper || isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Dodijeli i obavijesti
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
