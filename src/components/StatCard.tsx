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
  variant?: 'default' | 'primary' | 'accent';
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1 text-foreground">{value}</p>
          {trend && (
            <p className={cn(
              'text-sm mt-2',
              trend.isPositive ? 'text-green-600' : 'text-destructive'
            )}>
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% vs mes anterior
            </p>
          )}
        </div>
        <div className={cn(
          'p-3 rounded-lg',
          variant === 'primary' && 'gradient-primary',
          variant === 'accent' && 'gradient-accent',
          variant === 'default' && 'bg-muted'
        )}>
          <Icon className={cn(
            'h-6 w-6',
            variant === 'default' ? 'text-muted-foreground' : 'text-white'
          )} />
        </div>
      </div>
    </div>
  );
}
