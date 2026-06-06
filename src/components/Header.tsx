import { Menu, User, LogOut, Shield, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationCenter } from '@/components/NotificationCenter';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onToggleSidebar: () => void;
}

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

const getRoleBadgeColor = (role: string): string => {
  const colors: Record<string, string> = {
    proponente: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
    evaluador: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
    administrador: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  };
  return colors[role] || 'bg-muted text-muted-foreground';
};

export function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-3 h-full px-4 sm:px-6">
        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleSidebar}
          className="lg:hidden shrink-0 text-muted-foreground hover:text-foreground"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex-1" />

        <NotificationCenter />
        <ThemeToggle />

        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-3 h-10 px-2 rounded-full hover:bg-muted transition-colors"
              >
                <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-left">
                  <span className="text-sm font-medium leading-tight text-foreground">
                    {user.name}
                  </span>
                  <span className="text-[11px] leading-tight text-muted-foreground">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-64"
            >
              {/* User info header */}
              <div className="flex items-center gap-3 px-2 py-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                    {getUserInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              {/* Role badge */}
              <div className="px-3 pb-2">
                <span className={cn(
                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium',
                  getRoleBadgeColor(user.role),
                )}>
                  <Shield className="h-3 w-3" />
                  {getRoleLabel(user.role)}
                </span>
              </div>

              <DropdownMenuSeparator />

              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                Cuenta
              </DropdownMenuLabel>

              <DropdownMenuItem
                className="cursor-pointer gap-2"
                onClick={() => navigate('/profile')}
              >
                <User className="h-4 w-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                className="cursor-pointer gap-2 text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {!user && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/login')}
          >
            Iniciar Sesión
          </Button>
        )}
      </div>
    </header>
  );
}
