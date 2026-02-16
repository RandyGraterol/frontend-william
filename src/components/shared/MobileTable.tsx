import { ReactNode, CSSProperties } from 'react';
import { cn } from '@/lib/utils';

interface MobileTableCardProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}

export function MobileTableCard({ children, className, style }: MobileTableCardProps) {
  return (
    <div
      className={cn(
        "stat-card space-y-3 lg:hidden animate-fade-in",
        className
      )}
      style={style}
    >
      {children}
    </div>
  );
}

interface MobileTableRowProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function MobileTableRow({ label, children, className }: MobileTableRowProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="text-right">{children}</div>
    </div>
  );
}

interface MobileTableActionsProps {
  children: ReactNode;
  className?: string;
}

export function MobileTableActions({ children, className }: MobileTableActionsProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-end gap-2 pt-3 mt-3 border-t border-border",
        className
      )}
    >
      {children}
    </div>
  );
}
