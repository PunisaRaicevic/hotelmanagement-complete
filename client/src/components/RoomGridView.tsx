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
  List,
  Building2,
  Sparkles,
  Clock,
  CheckCircle2,
  Eye,
  XCircle,
  BedDouble,
} from 'lucide-react';

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

interface RoomGridViewProps {
  rooms: Room[];
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
  occupied: { label: 'Zauzeta', color: 'text-orange-600 bg-orange-100' },
  vacant: { label: 'Prazna', color: 'text-green-600 bg-green-100' },
  checkout: { label: 'Check-out', color: 'text-red-600 bg-red-100' },
  checkin: { label: 'Check-in', color: 'text-blue-600 bg-blue-100' },
};

export default function RoomGridView({ rooms, onRoomClick }: RoomGridViewProps) {
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

  const RoomTile = ({ room }: { room: Room }) => {
    const config = statusConfig[room.status] || statusConfig.dirty;
    const occConfig = occupancyConfig[room.occupancy_status as keyof typeof occupancyConfig];
    const isUrgent = room.priority_score > 5 || room.occupancy_status === 'checkout';
    const StatusIcon = config.icon;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={`
                relative p-3 cursor-pointer transition-all hover:scale-105 hover:shadow-lg
                border-l-4 ${config.borderColor} ${config.bgColor}
                ${isUrgent ? 'ring-2 ring-red-400 ring-offset-1' : ''}
              `}
              onClick={() => onRoomClick(room)}
            >
              {/* Room Number - Large and prominent */}
              <div className="flex items-start justify-between mb-2">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {room.room_number}
                </span>
                <div className={`w-3 h-3 rounded-full ${config.color}`} />
              </div>

              {/* Category */}
              <p className="text-xs text-muted-foreground capitalize mb-2">{room.category}</p>

              {/* Occupancy Badge */}
              {occConfig && (
                <Badge className={`text-[10px] px-1.5 py-0 ${occConfig.color} border-0 mb-2`}>
                  {occConfig.label}
                </Badge>
              )}

              {/* Guest/Housekeeper info */}
              <div className="space-y-1">
                {room.guest_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <User className="w-3 h-3" />
                    <span className="truncate">{room.guest_name}</span>
                  </div>
                )}
                {room.assigned_housekeeper_name && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <BedDouble className="w-3 h-3" />
                    <span className="truncate">{room.assigned_housekeeper_name}</span>
                  </div>
                )}
              </div>

              {/* Indicators */}
              <div className="flex gap-1 mt-2">
                {room.needs_minibar_check && (
                  <Wine className="w-3.5 h-3.5 text-amber-500" />
                )}
                {isUrgent && (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                )}
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold">Soba {room.room_number}</p>
              <p className="text-sm">Status: {config.label}</p>
              {room.guest_name && <p className="text-sm">Gost: {room.guest_name}</p>}
              {room.assigned_housekeeper_name && (
                <p className="text-sm">Sobarica: {room.assigned_housekeeper_name}</p>
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
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
        <h4 className="font-medium text-sm mb-3">Legenda statusa</h4>
        <div className="flex flex-wrap gap-4">
          {Object.entries(statusConfig).slice(0, 4).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${config.color}`} />
              <span className="text-sm text-muted-foreground">{config.label}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
