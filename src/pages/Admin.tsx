import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Building, FileText, Settings, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { LoadingSkeleton } from '@/components/shared';

const adminModules = [
  {
    title: 'Gestión de Usuarios',
    description: 'Administra investigadores, evaluadores y coordinadores',
    icon: Users,
    action: 'Gestionar',
    path: '/admin/panel?tab=users',
  },
  {
    title: 'Departamentos',
    description: 'Configura departamentos y facultades',
    icon: Building,
    action: 'Configurar',
    path: '/admin/panel?tab=workflows',
  },
  {
    title: 'Tipos de Propuestas',
    description: 'Define categorías y requisitos',
    icon: FileText,
    action: 'Editar',
    path: '/admin/panel?tab=rubrics',
  },
  {
    title: 'Configuración General',
    description: 'Ajustes del sistema y notificaciones',
    icon: Settings,
    action: 'Ajustar',
    path: '/admin/panel?tab=notifications',
  },
];

export default function Admin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse" />
        </div>
        <LoadingSkeleton variant="stats" count={4} className="lg:grid-cols-4" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-32 bg-muted rounded" />
                  <div className="h-4 w-full bg-muted rounded" />
                  <div className="h-8 w-24 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="page-title">Administración</h1>
        <p className="page-subtitle">
          Panel de administración del sistema
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: "Usuarios Activos", value: 156, icon: Users, variant: 'primary' as const },
          { title: "Departamentos", value: 12, icon: Building, variant: 'default' as const },
          { title: "Propuestas Totales", value: 324, icon: FileText, variant: 'default' as const },
          { title: "Evaluadores", value: 28, icon: Users, variant: 'default' as const },
        ].map((stat, index) => (
          <div 
            key={stat.title} 
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              variant={stat.variant}
            />
          </div>
        ))}
      </div>

      {/* Admin Modules */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 animate-fade-in" style={{ animationDelay: '200ms' }}>
          Módulos de Administración
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminModules.map((module, index) => (
            <div
              key={module.title}
              className="stat-card flex items-start gap-4 animate-fade-in transition-all duration-200 hover:shadow-md group cursor-pointer"
              style={{ animationDelay: `${(index + 5) * 50}ms` }}
              onClick={() => navigate(module.path)}
            >
              <div className="p-3 rounded-lg gradient-primary shrink-0 transition-transform duration-200 group-hover:scale-105">
                <module.icon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                  {module.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {module.description}
                </p>
                <Button variant="ghost" size="sm" className="mt-3 -ml-3 group-hover:text-primary">
                  {module.action}
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
