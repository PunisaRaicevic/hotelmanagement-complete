import { Badge } from '@/components/ui/badge';

type RoomStatus = 'clean' | 'dirty' | 'in_cleaning' | 'inspected' | 'out_of_order' | 'do_not_disturb';

interface RoomStatusBadgeProps {
  status: RoomStatus;
  size?: 'sm' | 'md';
}

const statusConfig: Record<RoomStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  clean: {
    label: 'Čista',
    variant: 'default',
    className: 'bg-green-500 hover:bg-green-600 text-white',
  },
  dirty: {
    label: 'Prljava',
    variant: 'destructive',
    className: 'bg-red-500 hover:bg-red-600 text-white',
  },
  in_cleaning: {
    label: 'U čišćenju',
    variant: 'secondary',
    className: 'bg-yellow-500 hover:bg-yellow-600 text-white',
  },
  inspected: {
    label: 'Pregledana',
    variant: 'default',
    className: 'bg-blue-500 hover:bg-blue-600 text-white',
  },
  out_of_order: {
    label: 'Van funkcije',
    variant: 'outline',
    className: 'bg-gray-500 hover:bg-gray-600 text-white',
  },
  do_not_disturb: {
    label: 'Ne uznemiravaj',
    variant: 'outline',
    className: 'bg-purple-500 hover:bg-purple-600 text-white',
  },
};

export default function RoomStatusBadge({ status, size = 'md' }: RoomStatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.dirty;

  return (
    <Badge
      className={`${config.className} ${size === 'sm' ? 'text-[10px] px-1.5 py-0' : 'text-xs'}`}
    >
      {config.label}
    </Badge>
  );
}

export function OccupancyBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    vacant: { label: 'Prazna', className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
    occupied: { label: 'Zauzeta', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
    checkout: { label: 'Check-out', className: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' },
    checkin_expected: { label: 'Dolazak', className: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' },
    checkout_expected: { label: 'Odlazak', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' },
  };

  const cfg = config[status] || config.vacant;

  return (
    <Badge variant="outline" className={`text-[10px] ${cfg.className}`}>
      {cfg.label}
    </Badge>
  );
}
