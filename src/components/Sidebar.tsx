import { useLocation, useNavigate } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import {
  FileText,
  ClipboardCheck,
  Settings,
  UserCheck,
  Activity,
  User,
  Bell,
  LayoutGrid,
  LogOut,
  Users,
} from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';

type UserRole = 'proponente' | 'evaluador' | 'administrador';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuLink {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  /** Roles allowed to see this menu item. Omit or set empty for all roles. */
  roles?: UserRole[];
}

interface MenuSeparator {
  type: 'separator';
}

type MenuItem = MenuLink | MenuSeparator;

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    description: 'Panel principal',
    icon: User,
    path: '/proponente/dashboard',
    roles: ['proponente'],
  },
  {
    title: 'Dashboard',
    description: 'Panel principal',
    icon: UserCheck,
    path: '/evaluator/dashboard',
    roles: ['evaluador'],
  },
  {
    title: 'Dashboard',
    description: 'Estadísticas y gráficos del sistema',
    icon: LayoutGrid,
    path: '/admin',
    roles: ['administrador'],
  },
  {
    title: 'Notificaciones',
    description: 'Centro de notificaciones',
    icon: Bell,
    path: '/notificaciones',
  },
  {
    title: 'Propuestas',
    description: 'Gestionar, crear y filtrar propuestas',
    icon: FileText,
    path: '/proposals/list',
  },
  {
    title: 'Seguimiento',
    description: 'Estado y progreso',
    icon: Activity,
    path: '/proposals/tracking',
    roles: ['proponente'],
  },
  {
    title: 'Evaluaciones',
    description: 'Evaluaciones asignadas',
    icon: ClipboardCheck,
    path: '/evaluations',
    roles: ['evaluador', 'administrador'],
  },
  {
    title: 'Usuarios',
    description: 'Gestión de usuarios del sistema',
    icon: Users,
    path: '/admin/usuarios',
    roles: ['administrador'],
  },
  {
    title: 'Configuración',
    description: 'Configuración del sistema',
    icon: Settings,
    path: '/admin/panel',
    roles: ['administrador'],
  },
];

const getUserInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const getRoleLabel = (role: string): string => {
  const labels: Record<string, string> = {
    proponente: 'Proponente',
    evaluador: 'Evaluador',
    administrador: 'Administrador',
  };
  return labels[role] || role;
};

/** Shared sidebar content — used both in the mobile Sheet and the desktop sidebar */
function SidebarContent({ onNavClick }: { onNavClick: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredItems = menuItems.filter((item) => {
    if ('type' in item && item.type === 'separator') return true;
    const link = item as MenuLink;
    if (!link.roles || link.roles.length === 0) return true;
    return user?.role && link.roles.includes(user.role);
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <LayoutGrid className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">Sistema UNERG</h2>
            <p className="text-xs text-muted-foreground">Propuestas</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getUserInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {getRoleLabel(user.role)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {filteredItems.map((item) => {
            if ('type' in item && item.type === 'separator') {
              return <div key="sep" className="my-2 border-t border-border" />;
            }
            const link = item as MenuLink;
            const isActive = location.pathname === link.path;
            const Icon = link.icon;

            return (
              <NavLink
                key={link.title}
                to={link.path}
                onClick={() => onNavClick()}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium hover:bg-primary/15'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-medium truncate">{link.title}</div>
                    {link.title === 'Notificaciones' && unreadCount > 0 && (
                      <Badge className="h-5 min-w-5 px-1.5 text-[10px] bg-destructive text-destructive-foreground">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs opacity-75 truncate">{link.description}</div>
                </div>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-2 py-1">
          <span className="text-xs text-muted-foreground">Tema</span>
          <ThemeToggle />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-2 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-sm"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
        <p className="text-xs text-muted-foreground text-center pt-1">
          © {new Date().getFullYear()} UNERG
        </p>
      </div>
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Mobile: Sheet drawer with overlay managed by shadcn */}
      <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent side="left" className="w-64 p-0 pt-16 [&>button]:hidden">
          <SidebarContent onNavClick={onClose} />
        </SheetContent>
      </Sheet>

      {/* Desktop: Static sidebar (always visible) */}
      <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-64 bg-card border-r border-border shadow-lg z-30">
        <SidebarContent onNavClick={() => {}} />
      </aside>

      {/* Spacer for desktop to prevent content overlap */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
}
