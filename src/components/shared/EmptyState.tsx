import { LucideIcon, FileText, Search, Inbox, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'error' | 'inbox';
  className?: string;
}

const variantIcons: Record<string, LucideIcon> = {
  default: FileText,
  search: Search,
  error: AlertCircle,
  inbox: Inbox,
};

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const Icon = icon || variantIcons[variant];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in",
        className
      )}
    >
      <div className="relative mb-6">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-primary/5 rounded-full blur-xl scale-150" />
        <div className="relative p-6 rounded-full bg-muted">
          <Icon className="h-12 w-12 text-muted-foreground" />
        </div>
      </div>

      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      
      {description && (
        <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} className="gradient-primary text-white">
          {action.label}
        </Button>
      )}
    </div>
  );
}
