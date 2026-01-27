import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  bgColorClass?: string;
}

export default function StatCard({ title, value, icon: Icon, trend, iconColor = 'text-primary', bgColorClass }: StatCardProps) {
  return (
    <Card
      data-testid={`card-stat-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className={`hover-elevate transition-all duration-300 ${bgColorClass || ''}`}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-0.5 leading-tight">{title}</p>
            <p className="text-3xl font-bold leading-tight" data-testid={`text-stat-value-${title.toLowerCase().replace(/\s+/g, '-')}`}>{value}</p>
            {trend && (
              <p className={`text-[10px] mt-0.5 leading-tight ${trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={`p-2.5 rounded-xl bg-primary/10 ${iconColor} flex-shrink-0`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
