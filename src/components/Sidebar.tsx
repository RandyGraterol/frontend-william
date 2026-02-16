import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FileText, 
  ClipboardCheck, 
  Settings,
  ChevronLeft,
  GraduationCap,
  PlusCircle,
  List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuItems = [
  { 
    title: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/' 
  },
  { 
    title: 'Mis Propuestas', 
    icon: FileText, 
    path: '/proposals' 
  },
  { 
    title: 'Nueva Propuesta', 
    icon: PlusCircle, 
    path: '/proposals/new' 
  },
  { 
    title: 'Lista de Propuestas', 
    icon: List, 
    path: '/proposals/list' 
  },
  { 
    title: 'Evaluaciones', 
    icon: ClipboardCheck, 
    path: '/evaluations' 
  },
  { 
    title: 'Administración', 
    icon: Settings, 
    path: '/admin' 
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-sidebar z-40 transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full p-4">
          <div className="lg:hidden flex justify-end mb-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </div>

          <nav className="flex-1 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => onClose()}
                  className={cn(
                    'sidebar-item',
                    isActive && 'sidebar-item-active'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <span>{item.title}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-sidebar-border">
            <div className="flex items-center gap-3 px-4 py-3 text-sidebar-foreground/70">
              <GraduationCap className="h-5 w-5" />
              <div className="text-sm">
                <p className="font-medium text-sidebar-foreground">UNERG</p>
                <p className="text-xs">Versión 1.0.0</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
