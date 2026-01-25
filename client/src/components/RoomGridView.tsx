import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Search,
  User,
  Wine,
  AlertTriangle,
  Grid3X3,
  Building2,
  Sparkles,
  Clock,
  CheckCircle2,
  Eye,
  XCircle,
  BedDouble,
  Calendar,
  CalendarCheck,
  CalendarX,
  MessageSquareWarning,
  Brush,
  UserCog,
  Info,
  Bed,
  Users,
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
  checkout_date?: string;
  checkin_date?: string;
  priority_score: number;
  needs_minibar_check: boolean;
  last_cleaned_at?: string;
  last_inspected_at?: string;
  last_inspected_by?: string;
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
  issues_found?: string;
  guest_requests?: string;
}

interface RoomGridViewProps {
  rooms: Room[];
  tasks?: HousekeepingTask[];
  onRoomClick: (room: Room) => void;
}

const statusConfig = {
  dirty: {
    color: 'bg-red-500',
    borderColor: 'border-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    label: 'Prljava',
    icon: XCircle,
  },
  in_cleaning: {
    color: 'bg-yellow-500',
    borderColor: 'border-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    label: 'U čišćenju',
    icon: Clock,
  },
  clean: {
    color: 'bg-green-500',
    borderColor: 'border-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    label: 'Čista',
    icon: CheckCircle2,
  },
  inspected: {
    color: 'bg-blue-500',
    borderColor: 'border-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    label: 'Pregledana',
    icon: Eye,
  },
  out_of_order: {
    color: 'bg-gray-500',
    borderColor: 'border-gray-400',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Van funkcije',
    icon: XCircle,
  },
  do_not_disturb: {
    color: 'bg-purple-500',
    borderColor: 'border-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    label: 'Ne uznemiravaj',
    icon: XCircle,
  },
};

const occupancyConfig = {
  occupied: { label: 'Zauzeta', color: 'text-orange-600 bg-orange-100', icon: User },
  vacant: { label: 'Prazna', color: 'text-green-600 bg-green-100', icon: CheckCircle2 },
  checkout: { label: 'Check-out', color: 'text-red-600 bg-red-100', icon: CalendarX },
  checkin: { label: 'Check-in', color: 'text-blue-600 bg-blue-100', icon: CalendarCheck },
  checkin_expected: { label: 'Dolazak', color: 'text-blue-600 bg-blue-100', icon: CalendarCheck },
  checkout_expected: { label: 'Odlazak', color: 'text-amber-600 bg-amber-100', icon: CalendarX },
};

const cleaningTypeLabels: Record<string, string> = {
  daily: 'Dnevno',
  checkout: 'Check-out',
  deep_clean: 'Generalno',
  turndown: 'Večernje',
  touch_up: 'Brzo',
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

const formatDate = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit' });
};

const formatDateTime = (dateString?: string) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('sr-RS', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function RoomGridView({ rooms, tasks = [], onRoomClick }: RoomGridViewProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'floor'>('floor');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [occupancyFilter, setOccupancyFilter] = useState<string | null>(null);

  // Get unique floors
  const floors = [...new Set(rooms.map((r) => r.floor))].sort((a, b) => a - b);

  // Filter rooms
  const filteredRooms = rooms.filter((room) => {
    if (searchQuery && !room.room_number.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (statusFilter && room.status !== statusFilter) return false;
    if (occupancyFilter && room.occupancy_status !== occupancyFilter) return false;
    return true;
  });

  // Group rooms by floor
  const roomsByFloor = floors.reduce((acc, floor) => {
    acc[floor] = filteredRooms.filter((r) => r.floor === floor).sort((a, b) =>
      a.room_number.localeCompare(b.room_number, undefined, { numeric: true })
    );
    return acc;
  }, {} as Record<number, Room[]>);

  // Status counts
  const statusCounts = {
    dirty: rooms.filter((r) => r.status === 'dirty').length,
    in_cleaning: rooms.filter((r) => r.status === 'in_cleaning').length,
    clean: rooms.filter((r) => r.status === 'clean').length,
    inspected: rooms.filter((r) => r.status === 'inspected').length,
  };

  // Get task for room
  const getTaskForRoom = (roomId: string) => {
    return tasks.find((t) => t.room_id === roomId && ['pending', 'in_progress'].includes(t.status));
  };

  const RoomTile = ({ room }: { room: Room }) => {
    const config = statusConfig[room.status] || statusConfig.dirty;
    const occConfig = occupancyConfig[room.occupancy_status as keyof typeof occupancyConfig];
    const isUrgent = room.priority_score > 5 || room.occupancy_status === 'checkout';
    const task = getTaskForRoom(room.id);
    const OccIcon = occConfig?.icon || User;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={`
                relative p-3 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg
                border-l-4 ${config.borderColor} ${config.bgColor}
                ${isUrgent ? 'ring-2 ring-red-400 ring-offset-1' : ''}
                h-full min-h-[180px] flex flex-col
              `}
              onClick={() => onRoomClick(room)}
            >
              {/* Header: Room Number + Status Indicator */}
              <div className="flex items-start justify-between mb-1">
                <div>
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">
                    {room.room_number}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>{categoryLabels[room.category] || room.category}</span>
                    {room.bed_type && (
                      <>
                        <span>•</span>
                        <Bed className="w-3 h-3" />
                        <span>{bedTypeLabels[room.bed_type] || room.bed_type}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} title={config.label} />
                  {room.max_occupancy && room.max_occupancy > 2 && (
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="w-3 h-3 mr-0.5" />
                      {room.max_occupancy}
                    </div>
                  )}
                </div>
              </div>

              {/* Occupancy Badge */}
              {occConfig && (
                <Badge className={`text-[10px] px-1.5 py-0 ${occConfig.color} border-0 mb-2`}>
                  <OccIcon className="w-3 h-3 mr-1" />
                  {occConfig.label}
                </Badge>
              )}

              {/* Guest Info */}
              {room.guest_name && (
                <div className="bg-white/60 dark:bg-black/20 rounded p-1.5 mb-2">
                  <div className="flex items-center gap-1 text-xs font-medium">
                    <User className="w-3 h-3 text-blue-600" />
                    <span className="truncate">{room.guest_name}</span>
                  </div>
                  {(room.checkin_date || room.checkout_date) && (
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                      {room.checkin_date && (
                        <span className="flex items-center gap-0.5">
                          <CalendarCheck className="w-3 h-3 text-green-600" />
                          {formatDate(room.checkin_date)}
                        </span>
                      )}
                      {room.checkout_date && (
                        <span className="flex items-center gap-0.5">
                          <CalendarX className="w-3 h-3 text-red-600" />
                          {formatDate(room.checkout_date)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Cleaning Task Info */}
              {task && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-1.5 mb-2">
                  <div className="flex items-center gap-1 text-xs">
                    <Brush className="w-3 h-3 text-amber-600" />
                    <span className="font-medium text-amber-800 dark:text-amber-200">
                      {cleaningTypeLabels[task.cleaning_type] || task.cleaning_type}
                    </span>
                    {task.priority === 'urgent' && (
                      <Badge variant="destructive" className="text-[9px] px-1 py-0 ml-auto">
                        HITNO
                      </Badge>
                    )}
                  </div>
                  {task.assigned_to_name && (
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                      <UserCog className="w-3 h-3" />
                      <span>{task.assigned_to_name}</span>
                    </div>
                  )}
                  {task.guest_requests && (
                    <div className="flex items-start gap-1 text-[10px] text-blue-600 mt-0.5">
                      <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{task.guest_requests}</span>
                    </div>
                  )}
                  {task.issues_found && (
                    <div className="flex items-start gap-1 text-[10px] text-red-600 mt-0.5">
                      <MessageSquareWarning className="w-3 h-3 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{task.issues_found}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned Housekeeper (when no active task) */}
              {!task && room.assigned_housekeeper_name && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                  <BedDouble className="w-3 h-3" />
                  <span className="truncate">{room.assigned_housekeeper_name}</span>
                </div>
              )}

              {/* Last Cleaned/Inspected Info */}
              {(room.last_cleaned_at || room.last_inspected_at) && (
                <div className="text-[10px] text-muted-foreground space-y-0.5 mb-2">
                  {room.last_cleaned_at && (
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>Čišćeno: {formatDateTime(room.last_cleaned_at)}</span>
                    </div>
                  )}
                  {room.last_inspected_at && (
                    <div className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Pregled: {formatDateTime(room.last_inspected_at)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notes */}
              {room.notes && (
                <div className="text-[10px] text-muted-foreground bg-gray-100 dark:bg-gray-800 rounded p-1 mb-2 line-clamp-2">
                  <Info className="w-3 h-3 inline mr-1" />
                  {room.notes}
                </div>
              )}

              {/* Spacer to push indicators to bottom */}
              <div className="flex-grow" />

              {/* Indicators Row */}
              <div className="flex gap-1.5 flex-wrap mt-auto">
                {room.needs_minibar_check && (
                  <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-300">
                    <Wine className="w-3 h-3 mr-0.5" />
                    Minibar
                  </Badge>
                )}
                {isUrgent && (
                  <Badge variant="destructive" className="text-[9px] px-1 py-0">
                    <AlertTriangle className="w-3 h-3 mr-0.5" />
                    Prioritet
                  </Badge>
                )}
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-bold text-lg">Soba {room.room_number}</p>
                <Badge className={`${config.bgColor} ${config.borderColor} border text-xs`}>
                  {config.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                <span className="text-muted-foreground">Kategorija:</span>
                <span>{categoryLabels[room.category] || room.category}</span>
                <span className="text-muted-foreground">Sprat:</span>
                <span>{room.floor}</span>
                {room.bed_type && (
                  <>
                    <span className="text-muted-foreground">Krevet:</span>
                    <span>{bedTypeLabels[room.bed_type] || room.bed_type}</span>
                  </>
                )}
                {room.max_occupancy && (
                  <>
                    <span className="text-muted-foreground">Kapacitet:</span>
                    <span>{room.max_occupancy} osoba</span>
                  </>
                )}
              </div>
              {room.guest_name && (
                <div className="pt-1 border-t">
                  <p className="text-sm"><span className="text-muted-foreground">Gost:</span> {room.guest_name}</p>
                  {room.checkin_date && <p className="text-xs text-muted-foreground">Check-in: {formatDate(room.checkin_date)}</p>}
                  {room.checkout_date && <p className="text-xs text-muted-foreground">Check-out: {formatDate(room.checkout_date)}</p>}
                </div>
              )}
              {task && (
                <div className="pt-1 border-t">
                  <p className="text-sm font-medium">Aktivan zadatak:</p>
                  <p className="text-xs">{cleaningTypeLabels[task.cleaning_type]} - {task.assigned_to_name || 'Nije dodijeljeno'}</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <div className="space-y-4">
      {/* Filters & Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input
            placeholder="Traži sobu..."
            className="pl-8 h-9 w-40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div className="flex gap-1 flex-wrap">
          <Button
            size="sm"
            variant={statusFilter === null ? 'default' : 'outline'}
            className="h-8 text-xs"
            onClick={() => setStatusFilter(null)}
          >
            Sve ({rooms.length})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'dirty' ? 'default' : 'outline'}
            className="h-8 text-xs bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            onClick={() => setStatusFilter(statusFilter === 'dirty' ? null : 'dirty')}
          >
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
            Prljave ({statusCounts.dirty})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'in_cleaning' ? 'default' : 'outline'}
            className="h-8 text-xs bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200"
            onClick={() => setStatusFilter(statusFilter === 'in_cleaning' ? null : 'in_cleaning')}
          >
            <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1.5" />
            U čišćenju ({statusCounts.in_cleaning})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'clean' ? 'default' : 'outline'}
            className="h-8 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            onClick={() => setStatusFilter(statusFilter === 'clean' ? null : 'clean')}
          >
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            Čiste ({statusCounts.clean})
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'inspected' ? 'default' : 'outline'}
            className="h-8 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            onClick={() => setStatusFilter(statusFilter === 'inspected' ? null : 'inspected')}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
            Pregledane ({statusCounts.inspected})
          </Button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-1 ml-auto">
          <Button
            size="sm"
            variant={viewMode === 'floor' ? 'default' : 'outline'}
            className="h-8"
            onClick={() => setViewMode('floor')}
          >
            <Building2 className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            className="h-8"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Occupancy Quick Filters */}
      <div className="flex gap-2 flex-wrap">
        <Badge
          variant={occupancyFilter === null ? 'default' : 'outline'}
          className="cursor-pointer hover:opacity-80"
          onClick={() => setOccupancyFilter(null)}
        >
          Svi statusi
        </Badge>
        <Badge
          variant={occupancyFilter === 'occupied' ? 'default' : 'outline'}
          className="cursor-pointer hover:opacity-80 bg-orange-100 text-orange-700"
          onClick={() => setOccupancyFilter(occupancyFilter === 'occupied' ? null : 'occupied')}
        >
          Zauzete
        </Badge>
        <Badge
          variant={occupancyFilter === 'vacant' ? 'default' : 'outline'}
          className="cursor-pointer hover:opacity-80 bg-green-100 text-green-700"
          onClick={() => setOccupancyFilter(occupancyFilter === 'vacant' ? null : 'vacant')}
        >
          Prazne
        </Badge>
        <Badge
          variant={occupancyFilter === 'checkout' ? 'default' : 'outline'}
          className="cursor-pointer hover:opacity-80 bg-red-100 text-red-700"
          onClick={() => setOccupancyFilter(occupancyFilter === 'checkout' ? null : 'checkout')}
        >
          Check-out
        </Badge>
      </div>

      {/* Room Display */}
      {viewMode === 'floor' ? (
        // Floor-based view
        <div className="space-y-6">
          {floors.map((floor) => {
            const floorRooms = roomsByFloor[floor] || [];
            if (floorRooms.length === 0) return null;

            return (
              <div key={floor}>
                {/* Floor Header */}
                <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                  <Building2 className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-lg">Sprat {floor}</h3>
                  <Badge variant="secondary" className="ml-2">
                    {floorRooms.length} soba
                  </Badge>
                </div>

                {/* Floor Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
                  {floorRooms.map((room) => (
                    <RoomTile key={room.id} room={room} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        // Simple grid view
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 items-stretch">
          {filteredRooms
            .sort((a, b) => a.room_number.localeCompare(b.room_number, undefined, { numeric: true }))
            .map((room) => (
              <RoomTile key={room.id} room={room} />
            ))}
        </div>
      )}

      {/* Empty State */}
      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Nema soba koje odgovaraju filterima</p>
        </div>
      )}

      {/* Legend */}
      <Card className="p-4 bg-muted/50">
        <h4 className="font-medium text-sm mb-3">Legenda</h4>
        <div className="flex flex-wrap gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">Status čistoće:</p>
            <div className="flex flex-wrap gap-3">
              {Object.entries(statusConfig).slice(0, 4).map(([key, config]) => (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${config.color}`} />
                  <span className="text-xs text-muted-foreground">{config.label}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground mb-1">Zauzetost:</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5">
                <User className="w-3 h-3 text-orange-600" />
                <span className="text-xs text-muted-foreground">Zauzeta</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
                <span className="text-xs text-muted-foreground">Prazna</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CalendarX className="w-3 h-3 text-red-600" />
                <span className="text-xs text-muted-foreground">Check-out</span>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
