import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus, 
  Send,
  Timer,
  ClipboardList,
  Calendar,
  Bell,
  Eye,
  Edit,
  MoreHorizontal,
  AlertCircle,
  Info,
  CheckCircle2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { 
  dashboardStats, 
  proposals, 
  proposalsByType,
  upcomingDeadlines,
  systemNotifications,
  currentUser,
  getPendingEvaluationsForUser,
  getAverageApprovalTime
} from '@/data/mockData';
import { proposalTypeLabels, proposalStatusLabels } from '@/types/proposal';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading state
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const recentProposals = proposals.slice(0, 5);
  const userPendingEvaluations = getPendingEvaluationsForUser(currentUser.id);
  const avgApprovalDays = getAverageApprovalTime();

  const maxProposalsByType = Math.max(
    proposalsByType.curso,
    proposalsByType.taller,
    proposalsByType.diplomado
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle2;
      case 'warning': return AlertCircle;
      case 'error': return XCircle;
      default: return Info;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success': return 'text-green-600';
      case 'warning': return 'text-amber-600';
      case 'error': return 'text-destructive';
      default: return 'text-primary';
    }
  };

  const getDeadlineColor = (type: string) => {
    switch (type) {
      case 'evaluacion': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300';
      case 'revision': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300';
      case 'entrega': return 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-5 w-72 bg-muted rounded" />
          </div>
          <div className="h-10 w-40 bg-muted rounded" />
        </div>
        <LoadingSkeleton variant="stats" count={5} className="lg:grid-cols-5" />
        <LoadingSkeleton variant="stats" count={3} className="lg:grid-cols-3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <LoadingSkeleton variant="card" count={1} className="lg:col-span-1" />
          <LoadingSkeleton variant="list" count={5} className="lg:col-span-2" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Bienvenido al Sistema de Gestión de Propuestas Académicas
          </p>
        </div>
        <Button 
          className="gradient-primary text-white hover:opacity-90 w-full sm:w-auto transition-all duration-200 hover:scale-[1.02]"
          onClick={() => navigate('/proposals/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propuesta
        </Button>
      </div>

      {/* Stats Grid - 5 columns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { title: "Total Propuestas", value: dashboardStats.totalProposals, icon: FileText, variant: 'primary' as const },
          { title: "Enviadas", value: dashboardStats.pending, icon: Send, variant: 'default' as const },
          { title: "En Evaluación", value: dashboardStats.inEvaluation, icon: Clock, variant: 'default' as const },
          { title: "Aprobadas", value: dashboardStats.approved, icon: CheckCircle, variant: 'default' as const },
          { title: "Rechazadas", value: dashboardStats.rejected, icon: XCircle, variant: 'accent' as const },
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

      {/* Secondary Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { title: "Tiempo Promedio Aprobación", value: `${avgApprovalDays} días`, icon: Timer, variant: 'default' as const },
          { title: "Evaluaciones Pendientes", value: userPendingEvaluations.length, icon: ClipboardList, variant: 'primary' as const },
          { title: "Borradores", value: proposals.filter(p => p.status === 'borrador').length, icon: FileText, variant: 'default' as const },
        ].map((stat, index) => (
          <div 
            key={stat.title} 
            className="animate-fade-in"
            style={{ animationDelay: `${(index + 5) * 50}ms` }}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Bar Chart - Proposals by Type */}
        <div className="stat-card lg:col-span-1 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <h3 className="font-semibold text-foreground mb-6">Propuestas por Tipo</h3>
          <div className="space-y-4">
            {Object.entries(proposalsByType).map(([type, count]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{proposalTypeLabels[type as keyof typeof proposalTypeLabels]}</span>
                  <span className="font-medium text-foreground">{count}</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      type === 'diplomado' && 'gradient-primary',
                      type === 'curso' && 'bg-primary/70',
                      type === 'taller' && 'bg-primary/40'
                    )}
                    style={{ width: `${(count / maxProposalsByType) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Status Breakdown */}
          <div className="mt-6 pt-6 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-4">Desglose por Estado</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-muted" />
                <span className="text-xs text-muted-foreground">Borrador: {proposals.filter(p => p.status === 'borrador').length}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-xs text-muted-foreground">Enviada: {dashboardStats.pending}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-xs text-muted-foreground">En Eval: {dashboardStats.inEvaluation}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-xs text-muted-foreground">Aprobada: {dashboardStats.approved}</span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <div className="w-3 h-3 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">Rechazada: {dashboardStats.rejected}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="stat-card lg:col-span-2 animate-fade-in" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground">Propuestas Recientes</h3>
            <Button variant="ghost" size="sm" onClick={() => navigate('/proposals/list')}>
              Ver todas
            </Button>
          </div>
          
          {recentProposals.length === 0 ? (
            <EmptyState
              title="Sin propuestas"
              description="Aún no hay propuestas registradas en el sistema."
              action={{
                label: 'Crear Propuesta',
                onClick: () => navigate('/proposals/new'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {recentProposals.map((proposal, index) => (
                <div 
                  key={proposal.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 group gap-3"
                  style={{ animationDelay: `${(index + 10) * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-xs">
                        {proposalTypeLabels[proposal.type]}
                      </Badge>
                      <Badge 
                        variant={
                          proposal.status === 'aprobada' ? 'success' :
                          proposal.status === 'rechazada' ? 'error' :
                          proposal.status === 'en_evaluacion' ? 'warning' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {proposalStatusLabels[proposal.status]}
                      </Badge>
                    </div>
                    <p className="font-medium text-foreground truncate">{proposal.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {proposal.submitter.name} • {proposal.updatedAt.toLocaleDateString('es-VE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => navigate(`/proposals/${proposal.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalles</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Más opciones</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row - Calendar and Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Upcoming Deadlines Calendar */}
        <div className="stat-card animate-fade-in" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Plazos Próximos</h3>
          </div>
          
          {upcomingDeadlines.length === 0 ? (
            <EmptyState
              title="Sin plazos pendientes"
              description="No hay plazos próximos programados."
              variant="inbox"
            />
          ) : (
            <div className="space-y-3">
              {upcomingDeadlines.slice(0, 5).map((deadline) => (
                <div 
                  key={deadline.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 transition-all duration-200 hover:shadow-sm"
                >
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
                    <span className="text-xs font-medium text-primary">
                      {deadline.date.toLocaleDateString('es-VE', { month: 'short' }).toUpperCase()}
                    </span>
                    <span className="text-lg font-bold text-primary">
                      {deadline.date.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{deadline.title}</p>
                    <Badge className={cn('text-xs mt-1', getDeadlineColor(deadline.type))}>
                      {deadline.type.charAt(0).toUpperCase() + deadline.type.slice(1)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* System Notifications */}
        <div className="stat-card animate-fade-in" style={{ animationDelay: '550ms' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-foreground">Notificaciones del Sistema</h3>
            </div>
            <Badge variant="secondary" className="text-xs">
              {systemNotifications.filter(n => !n.read).length} nuevas
            </Badge>
          </div>
          
          {systemNotifications.length === 0 ? (
            <EmptyState
              title="Sin notificaciones"
              description="No tienes notificaciones pendientes."
              variant="inbox"
            />
          ) : (
            <>
              <div className="space-y-3">
                {systemNotifications.slice(0, 5).map((notification) => {
                  const NotifIcon = getNotificationIcon(notification.type);
                  return (
                    <div 
                      key={notification.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm",
                        notification.read ? 'bg-muted/30' : 'bg-primary/5 border border-primary/20'
                      )}
                    >
                      <NotifIcon className={cn('h-5 w-5 mt-0.5 shrink-0', getNotificationColor(notification.type))} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn(
                            'font-medium text-sm truncate',
                            notification.read ? 'text-muted-foreground' : 'text-foreground'
                          )}>
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                          {notification.createdAt.toLocaleDateString('es-VE', { 
                            day: 'numeric', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Button variant="ghost" size="sm" className="w-full mt-4">
                Ver todas las notificaciones
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
