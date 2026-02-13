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
  Bell,
  BellOff,
  ClipboardList,
  MessageCircle,
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
  pending_guest_requests?: number;
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
  minibar_items_used?: string[];
  notification_sent_at?: string;
  linens_changed?: boolean;
  towels_changed?: boolean;
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
  occupied: { label: 'Zauzeta', color: 'text-orange-600 bg-orange-100 dark:bg-orange-950/30 dark:text-orange-300', icon: User },
  vacant: { label: 'Prazna', color: 'text-green-600 bg-green-100 dark:bg-green-950/30 dark:text-green-300', icon: CheckCircle2 },
  checkout: { label: 'Check-out', color: 'text-red-600 bg-red-100 dark:bg-red-950/30 dark:text-red-300', icon: CalendarX },
  checkin: { label: 'Check-in', color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300', icon: CalendarCheck },
  checkin_expected: { label: 'Dolazak', color: 'text-blue-600 bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300', icon: CalendarCheck },
  checkout_expected: { label: 'Odlazak', color: 'text-amber-600 bg-amber-100 dark:bg-amber-950/30 dark:text-amber-300', icon: CalendarX },
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

const getCheckoutInstructions = (task?: HousekeepingTask): string | null => {
  if (!task) return null;
  const parts: string[] = [];
  const ct = task.cleaning_type;
  if (ct === 'checkout' || ct === 'deep_clean') {
    parts.push('potpuno čišćenje');
    parts.push('promjena posteljine');
    parts.push('promjena peškira');
  } else if (ct === 'daily') {
    parts.push('dnevno čišćenje');
    if (task.linens_changed) parts.push('promjena posteljine');
    if (task.towels_changed) parts.push('promjena peškira');
  } else if (ct === 'turndown') {
    parts.push('večernje sređivanje');
  } else if (ct === 'touch_up') {
    parts.push('brzo čišćenje');
  }
  return parts.length > 0 ? `Potrebno: ${parts.join(', ')}` : null;
};

const getRoomStatusSummary = (room: Room, task?: HousekeepingTask): string => {
  if (room.status === 'out_of_order') return 'Van funkcije';
  if (room.status === 'do_not_disturb') return 'Ne uznemiravaj';
  if (task) {
    if (task.status === 'needs_rework') return 'Potrebna dorada';
    if (task.status === 'in_progress' && task.assigned_to_name) {
      return `Čisti: ${task.assigned_to_name}`;
    }
    if (task.status === 'pending') return 'Treba očistiti';
  }
  if (room.status === 'dirty') return 'Treba očistiti';
  if (room.status === 'in_cleaning') return 'U čišćenju';
  if (room.status === 'inspected') return 'Pregledana - spremna';
  if (room.status === 'clean') return 'Spremna za goste';
  return '';
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

  // Floor status counts helper
  const getFloorStatusCounts = (floorRooms: Room[]) => ({
    dirty: floorRooms.filter((r) => r.status === 'dirty').length,
    in_cleaning: floorRooms.filter((r) => r.status === 'in_cleaning').length,
    clean: floorRooms.filter((r) => r.status === 'clean').length,
    inspected: floorRooms.filter((r) => r.status === 'inspected').length,
  });

  // Get active task for room - prefer in_progress over pending, most recent first
  const getTaskForRoom = (roomId: string) => {
    const roomTasks = tasks.filter((t) => t.room_id === roomId && ['pending', 'in_progress', 'needs_rework'].includes(t.status));
    if (roomTasks.length === 0) return undefined;
    // Prefer in_progress tasks, then needs_rework, then pending
    const statusPriority: Record<string, number> = { in_progress: 0, needs_rework: 1, pending: 2 };
    roomTasks.sort((a, b) => (statusPriority[a.status] ?? 9) - (statusPriority[b.status] ?? 9));
    return roomTasks[0];
  };

  const RoomTile = ({ room }: { room: Room }) => {
    const config = statusConfig[room.status] || statusConfig.dirty;
    const occConfig = occupancyConfig[room.occupancy_status as keyof typeof occupancyConfig];
    const isUrgent = room.priority_score > 5 || room.occupancy_status === 'checkout';
    const task = getTaskForRoom(room.id);
    const OccIcon = occConfig?.icon || User;
    const statusSummary = getRoomStatusSummary(room, task);
    const checkoutInstructions = room.occupancy_status === 'checkout' ? getCheckoutInstructions(task) : null;

    // Minibar display logic
    const minibarDisplay = (() => {
      if (!room.needs_minibar_check) return null;
      if (task?.minibar_items_used && task.minibar_items_used.length > 0) {
        return `Minibar - dopuniti: ${task.minibar_items_used.join(', ')}`;
      }
      return 'Minibar - provjeri stanje';
    })();

    // Assignment & notification status
    const notificationStatus = (() => {
      if (!task) return null;
      if (!task.assigned_to) return null;
      const name = task.assigned_to_name || 'Sobarica';
      if (task.status === 'in_progress') {
        return { sent: true, label: `${name} čisti` };
      }
      if (task.notification_sent_at) {
        return { sent: true, label: `Dodijeljeno: ${name}` };
      }
      return { sent: true, label: `Dodijeljeno: ${name}` };
    })();

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card
              className={`
                relative p-2 sm:p-4 cursor-pointer transition-all hover-elevate
                border-l-4 ${config.borderColor} ${config.bgColor}
                ${isUrgent ? 'ring-2 ring-red-400 ring-offset-1' : ''}
                w-full min-h-[120px] sm:min-h-[180px] flex flex-col overflow-hidden
              `}
              onClick={() => onRoomClick(room)}
            >
              {/* Header: Room Number + Status Indicator */}
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {room.room_number}
                  </span>
                  {/* Short status description under room number */}
                  {statusSummary && (
                    <p className="text-xs font-medium text-muted-foreground mt-0.5">
                      {statusSummary}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
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
                  {/* Status dot with text label */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                    <div className={`w-3.5 h-3.5 rounded-full ${config.color} ring-2 ring-white dark:ring-gray-900`} />
                  </div>
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
                <Badge className={`text-[11px] px-1.5 py-0.5 rounded-full ${occConfig.color} border-0 mb-2`}>
                  <OccIcon className="w-3 h-3 mr-1" />
                  {occConfig.label}
                </Badge>
              )}

              {/* Guest Info with guest count */}
              {room.guest_name && (
                <div className="bg-white/60 dark:bg-black/20 rounded-lg p-2.5 mb-2">
                  <div className="flex items-center gap-1.5 text-sm font-medium">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span className="truncate">
                      {room.guest_name}
                      {room.guest_count && room.guest_count > 0 && (
                        <span className="text-muted-foreground font-normal"> ({room.guest_count} {room.guest_count === 1 ? 'osoba' : room.guest_count < 5 ? 'osobe' : 'osoba'})</span>
                      )}
                    </span>
                  </div>
                  {(room.checkin_date || room.checkout_date) && (
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
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

              {/* Checkout Instructions */}
              {checkoutInstructions && (
                <div className="bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded p-2 mb-2">
                  <div className="flex items-start gap-1.5 text-xs text-orange-800 dark:text-orange-200">
                    <ClipboardList className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{checkoutInstructions}</span>
                  </div>
                </div>
              )}

              {/* Cleaning Task Info */}
              {task && (
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-2 mb-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Brush className="w-3.5 h-3.5 text-amber-600" />
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
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <UserCog className="w-3.5 h-3.5" />
                      <span>{task.assigned_to_name}</span>
                    </div>
                  )}
                  {task.guest_requests && (
                    <div className="flex items-start gap-1.5 text-xs text-blue-600 mt-1">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{task.guest_requests}</span>
                    </div>
                  )}
                  {task.issues_found && task.status === 'in_progress' && (
                    <div className="flex items-start gap-1.5 text-xs text-red-600 mt-1">
                      <MessageSquareWarning className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{task.issues_found}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Notification Status */}
              {notificationStatus && (
                <div className={`flex items-center gap-1.5 text-xs mb-2 ${
                  notificationStatus.sent
                    ? 'text-green-700 dark:text-green-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}>
                  {notificationStatus.sent ? (
                    <Bell className="w-3.5 h-3.5" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5" />
                  )}
                  <span className="font-medium">{notificationStatus.label}</span>
                </div>
              )}

              {/* Assigned Housekeeper (when no active task) */}
              {!task && room.assigned_housekeeper_name && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                  <BedDouble className="w-3.5 h-3.5" />
                  <span className="truncate">{room.assigned_housekeeper_name}</span>
                </div>
              )}

              {/* Spacer to push indicators to bottom */}
              <div className="flex-grow" />

              {/* Indicators Row */}
              <div className="flex gap-1.5 flex-wrap mt-auto">
                {room.pending_guest_requests && room.pending_guest_requests > 0 && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-700 animate-pulse">
                    <MessageCircle className="w-3 h-3 mr-1" />
                    {room.pending_guest_requests} zahtjev{room.pending_guest_requests > 1 ? 'a' : ''} gosta
                  </Badge>
                )}
                {minibarDisplay && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-700">
                    <Wine className="w-3 h-3 mr-1" />
                    {minibarDisplay}
                  </Badge>
                )}
                {isUrgent && (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                    <AlertTriangle className="w-3 h-3 mr-1" />
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
                  <p className="text-sm">
                    <span className="text-muted-foreground">Gost:</span> {room.guest_name}
                    {room.guest_count && room.guest_count > 0 && (
                      <span className="text-muted-foreground"> ({room.guest_count} {room.guest_count === 1 ? 'osoba' : room.guest_count < 5 ? 'osobe' : 'osoba'})</span>
                    )}
                  </p>
                  {room.checkin_date && <p className="text-xs text-muted-foreground">Check-in: {formatDate(room.checkin_date)}</p>}
                  {room.checkout_date && <p className="text-xs text-muted-foreground">Check-out: {formatDate(room.checkout_date)}</p>}
                </div>
              )}
              {checkoutInstructions && (
                <div className="pt-1 border-t text-xs text-orange-700 dark:text-orange-300">
                  <ClipboardList className="w-3 h-3 inline mr-1" />
                  {checkoutInstructions}
                </div>
              )}
              {minibarDisplay && (
                <div className="pt-1 border-t text-xs text-amber-700 dark:text-amber-300">
                  <Wine className="w-3 h-3 inline mr-1" />
                  {minibarDisplay}
                </div>
              )}
              {(room.last_cleaned_at || room.last_inspected_at) && (
                <div className="pt-1 border-t text-xs text-muted-foreground space-y-0.5">
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
              {room.notes && (
                <div className="pt-1 border-t text-xs text-muted-foreground">
                  <Info className="w-3 h-3 inline mr-1" />
                  {room.notes}
                </div>
              )}
              {task && (
                <div className="pt-1 border-t">
                  <p className="text-sm font-medium">Aktivan zadatak:</p>
                  <p className="text-xs">{cleaningTypeLabels[task.cleaning_type]} - {task.assigned_to_name || 'Nije dodijeljeno'}</p>
                  {notificationStatus && (
                    <p className={`text-xs mt-0.5 ${notificationStatus.sent ? 'text-green-600' : 'text-orange-600'}`}>
                      {notificationStatus.sent ? '✓' : '!'} {notificationStatus.label}
                    </p>
                  )}
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
      <div className="p-2 sm:p-3 bg-muted/30 rounded-xl">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 sm:top-3 text-muted-foreground" />
            <Input
              placeholder="Traži sobu..."
              className="pl-8 h-9 sm:h-10 w-full sm:w-48 rounded-lg text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Status Filters */}
          <div className="flex gap-1 flex-wrap overflow-x-auto">
            <Button
              size="sm"
              variant={statusFilter === null ? 'default' : 'outline'}
              className="h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3"
              onClick={() => setStatusFilter(null)}
            >
              Sve ({rooms.length})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'dirty' ? 'default' : 'outline'}
              className="h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3 bg-red-50 hover:bg-red-100 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800 dark:hover:bg-red-950/50"
              onClick={() => setStatusFilter(statusFilter === 'dirty' ? null : 'dirty')}
            >
              <div className="w-2 h-2 rounded-full bg-red-500 mr-1" />
              Prljave ({statusCounts.dirty})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'in_cleaning' ? 'default' : 'outline'}
              className="h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-300 dark:border-yellow-800 dark:hover:bg-yellow-950/50"
              onClick={() => setStatusFilter(statusFilter === 'in_cleaning' ? null : 'in_cleaning')}
            >
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-1" />
              U čišćenju ({statusCounts.in_cleaning})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'clean' ? 'default' : 'outline'}
              className="h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-300 dark:border-green-800 dark:hover:bg-green-950/50"
              onClick={() => setStatusFilter(statusFilter === 'clean' ? null : 'clean')}
            >
              <div className="w-2 h-2 rounded-full bg-green-500 mr-1" />
              Čiste ({statusCounts.clean})
            </Button>
            <Button
              size="sm"
              variant={statusFilter === 'inspected' ? 'default' : 'outline'}
              className="h-7 sm:h-9 text-[10px] sm:text-xs px-2 sm:px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800 dark:hover:bg-blue-950/50"
              onClick={() => setStatusFilter(statusFilter === 'inspected' ? null : 'inspected')}
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-1" />
              Pregledane ({statusCounts.inspected})
            </Button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              variant={viewMode === 'floor' ? 'default' : 'outline'}
              className="h-7 sm:h-9 w-7 sm:w-9 p-0"
              onClick={() => setViewMode('floor')}
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              className="h-7 sm:h-9 w-7 sm:w-9 p-0"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>

        {/* Occupancy Quick Filters */}
        <div className="flex gap-1.5 sm:gap-2 flex-wrap mt-2 sm:mt-3">
          <span className="text-xs font-medium text-muted-foreground self-center">Zauzetost:</span>
          <Badge
            variant={occupancyFilter === null ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80"
            onClick={() => setOccupancyFilter(null)}
          >
            Svi statusi
          </Badge>
          <Badge
            variant={occupancyFilter === 'occupied' ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 bg-orange-100 text-orange-700 dark:bg-orange-950/30 dark:text-orange-300"
            onClick={() => setOccupancyFilter(occupancyFilter === 'occupied' ? null : 'occupied')}
          >
            Zauzete
          </Badge>
          <Badge
            variant={occupancyFilter === 'vacant' ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-300"
            onClick={() => setOccupancyFilter(occupancyFilter === 'vacant' ? null : 'vacant')}
          >
            Prazne
          </Badge>
          <Badge
            variant={occupancyFilter === 'checkout' ? 'default' : 'outline'}
            className="cursor-pointer hover:opacity-80 bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-300"
            onClick={() => setOccupancyFilter(occupancyFilter === 'checkout' ? null : 'checkout')}
          >
            Check-out
          </Badge>
        </div>
      </div>

      {/* Room Display */}
      {viewMode === 'floor' ? (
        // Floor-based view
        <div className="space-y-6">
          {floors.map((floor) => {
            const floorRooms = roomsByFloor[floor] || [];
            if (floorRooms.length === 0) return null;
            const floorCounts = getFloorStatusCounts(floorRooms);

            return (
              <div key={floor}>
                {/* Floor Header */}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 pb-2 border-b-2 border-primary/20">
                  <div className="p-1 sm:p-1.5 rounded-lg bg-primary/10">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-base sm:text-lg">Sprat {floor}</h3>
                  <Badge variant="secondary" className="ml-1 sm:ml-2 text-[10px] sm:text-xs">
                    {floorRooms.length} soba
                  </Badge>
                  <div className="flex items-center gap-1.5 ml-auto">
                    {floorCounts.dirty > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <span className="text-xs text-muted-foreground">{floorCounts.dirty}</span>
                      </div>
                    )}
                    {floorCounts.in_cleaning > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <span className="text-xs text-muted-foreground">{floorCounts.in_cleaning}</span>
                      </div>
                    )}
                    {floorCounts.clean > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-xs text-muted-foreground">{floorCounts.clean}</span>
                      </div>
                    )}
                    {floorCounts.inspected > 0 && (
                      <div className="flex items-center gap-1">
                        <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        <span className="text-xs text-muted-foreground">{floorCounts.inspected}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Floor Rooms Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
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
      <Card className="p-4 bg-muted/30 border-dashed">
        <h4 className="font-medium text-sm mb-3 flex items-center gap-1.5">
          <Info className="w-4 h-4 text-muted-foreground" />
          Legenda
        </h4>
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
