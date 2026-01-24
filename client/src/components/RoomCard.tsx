import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import RoomStatusBadge, { OccupancyBadge } from './RoomStatusBadge';
import { BedDouble, User, Clock, AlertTriangle } from 'lucide-react';

interface Room {
  id: string;
  room_number: string;
  floor: number;
  category: string;
  status: 'clean' | 'dirty' | 'in_cleaning' | 'inspected' | 'out_of_order' | 'do_not_disturb';
  occupancy_status: string;
  assigned_housekeeper_name?: string;
  guest_name?: string;
  checkout_date?: string;
  checkin_date?: string;
  priority_score: number;
  needs_minibar_check: boolean;
}

interface RoomCardProps {
  room: Room;
  onClick?: () => void;
  compact?: boolean;
}

export default function RoomCard({ room, onClick, compact = false }: RoomCardProps) {
  const isUrgent = room.priority_score > 5 || room.occupancy_status === 'checkout';

  if (compact) {
    return (
      <Card
        className={`p-2 cursor-pointer hover:shadow-md transition-shadow ${
          isUrgent ? 'border-red-300 dark:border-red-700' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg">{room.room_number}</span>
            <RoomStatusBadge status={room.status} size="sm" />
          </div>
          {isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isUrgent ? 'border-red-300 dark:border-red-700 bg-red-50/50 dark:bg-red-950/20' : ''
      }`}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xl">{room.room_number}</span>
              <Badge variant="outline" className="text-[10px]">
                Sprat {room.floor}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground capitalize">{room.category}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <RoomStatusBadge status={room.status} />
            <OccupancyBadge status={room.occupancy_status} />
          </div>
        </div>

        {/* Info */}
        <div className="space-y-1.5 text-sm">
          {room.guest_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="w-3.5 h-3.5" />
              <span>{room.guest_name}</span>
            </div>
          )}

          {room.assigned_housekeeper_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <BedDouble className="w-3.5 h-3.5" />
              <span>{room.assigned_housekeeper_name}</span>
            </div>
          )}

          {(room.checkout_date || room.checkin_date) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {room.checkout_date
                  ? `Check-out: ${new Date(room.checkout_date).toLocaleDateString('sr-RS')}`
                  : room.checkin_date
                  ? `Check-in: ${new Date(room.checkin_date).toLocaleDateString('sr-RS')}`
                  : ''}
              </span>
            </div>
          )}
        </div>

        {/* Alerts */}
        <div className="flex flex-wrap gap-1">
          {room.needs_minibar_check && (
            <Badge variant="outline" className="text-[10px] bg-yellow-50 dark:bg-yellow-950">
              Minibar
            </Badge>
          )}
          {isUrgent && (
            <Badge variant="destructive" className="text-[10px]">
              Prioritet
            </Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
