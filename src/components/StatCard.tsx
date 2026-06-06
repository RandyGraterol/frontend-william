import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'primary' | 'destructive';
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: StatCardProps) {
  return (
    <div className="stat-card min-w-0 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 text-foreground truncate">{value}</p>
          {trend && (
            <p className={cn(
              'text-xs sm:text-sm mt-1 sm:mt-2',
              trend.isPositive ? 'text-green-600' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% vs mes anterior
            </p>
          )}
        </div>
        <div className={cn(
          'p-2 sm:p-3 rounded-lg shrink-0',
          variant === 'primary' && 'gradient-primary',
          variant === 'destructive' && 'gradient-destructive',
          variant === 'default' && 'bg-muted'
        )}>
          <Icon className={cn(
            'h-5 w-5 sm:h-6 sm:w-6',
            variant === 'default' ? 'text-muted-foreground' : 'text-white'
          )} />
        </div>
      </div>
    </div>
  );
}
