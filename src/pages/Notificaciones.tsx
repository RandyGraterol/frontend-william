import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, BellOff, CheckCheck, Trash2, Filter, ArrowLeft,
  FileText, ClipboardCheck, RefreshCw, AlertTriangle, Settings,
  Calendar, Clock, ChevronLeft, ChevronRight, Loader2, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { NotificationType } from '@/contexts/NotificationContext';
import { api } from '@/lib/api';

const typeConfig: Record<NotificationType, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  proposal: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', label: 'Propuestas' },
  evaluation: { icon: ClipboardCheck, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', label: 'Evaluaciones' },
  status: { icon: RefreshCw, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30', label: 'Estados' },
  deadline: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30', label: 'Fechas límite' },
  system: { icon: Settings, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/30', label: 'Sistema' },
};

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) return 'Hoy';
  if (days === 1) return 'Ayer';

  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `Hace ${minutes}m`;
  if (hours < 24) return `Hace ${hours}h`;
  if (days === 1) return 'Ayer';
  return `Hace ${days}d`;
}

export default function Notificaciones() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';
  const {
    notifications: myNotifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    filterByType,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<NotificationType | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [globalNotifs, setGlobalNotifs] = useState<Record<string, any>[]>([]);
  const [allSystemNotifs, setAllSystemNotifs] = useState<Record<string, any>[]>([]);
  const [showAllNotifs, setShowAllNotifs] = useState(isAdmin);

  useEffect(() => {
    api.getActiveGlobalNotifications()
      .then(res => { if (res.success && res.data) setGlobalNotifs(Array.isArray(res.data) ? res.data : []); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    api.getAdminAllNotifications({ limit: 200 })
      .then(res => { if (res.success && res.data) setAllSystemNotifs(Array.isArray(res.data) ? res.data : []); })
      .catch(() => {});
  }, [isAdmin]);

  const notifications = showAllNotifs && isAdmin
    ? allSystemNotifs.map(mapApiNotification)
    : myNotifications;

  const perPage = 10;

  const filtered = useMemo(() => {
    let result = activeFilter === 'all' ? notifications : filterByType(activeFilter);
    if (typeFilter !== 'all') {
      result = result.filter((n: any) => n.type === typeFilter);
    }
    return result;
  }, [notifications, activeFilter, typeFilter, filterByType]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, typeof paginated> = {};
    for (const n of paginated) {
      const key = formatDate(n.timestamp);
      if (!groups[key]) groups[key] = [];
      groups[key].push(n);
    }
    return groups;
  }, [paginated]);

  const stats = useMemo(() => ({
    total: notifications.length,
    unread: isAdmin && showAllNotifs ? allSystemNotifs.filter((n: any) => !n.isRead).length : unreadCount,
    read: notifications.length - (isAdmin && showAllNotifs ? allSystemNotifs.filter((n: any) => !n.isRead).length : unreadCount),
    byType: Object.keys(typeConfig).reduce((acc, key) => {
      acc[key as NotificationType] = notifications.filter((n: any) => n.type === key).length;
      return acc;
    }, {} as Record<string, number>),
  }), [notifications, unreadCount, isAdmin, showAllNotifs, allSystemNotifs]);

  const handleFilterChange = (value: string) => {
    setActiveFilter(value as NotificationType | 'all');
    setPage(1);
  };

  const handleTypeFilterChange = (value: string) => {
    setTypeFilter(value);
    setPage(1);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold truncate">Notificaciones</h1>
            <p className="text-xs sm:text-sm text-muted-foreground truncate">
              {isAdmin && showAllNotifs ? 'Todas las notificaciones del sistema' : 'Gestiona tus notificaciones'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {isAdmin && (
            <Button
              variant={showAllNotifs ? 'default' : 'outline'}
              size="sm"
              className="text-xs h-8"
              onClick={() => { setShowAllNotifs(v => !v); setPage(1); }}
            >
              <User className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">{showAllNotifs ? 'Mis notificaciones' : 'Todas del sistema'}</span>
            </Button>
          )}
          {unreadCount > 0 && !showAllNotifs && (
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={markAllAsRead}>
              <CheckCheck className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Marcar todo leído</span>
            </Button>
          )}
          {notifications.length > 0 && !showAllNotifs && (
            <Button variant="ghost" size="sm" className="text-xs h-8 text-destructive hover:text-destructive" onClick={clearAll}>
              <Trash2 className="h-3.5 w-3.5 sm:mr-1.5" />
              <span className="hidden sm:inline">Limpiar todas</span>
            </Button>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-full bg-primary/10">
                <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.total}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Totales</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <BellOff className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.unread}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Sin leer</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <CheckCheck className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.read}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Leídas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3 sm:pt-6 sm:px-6 sm:pb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-full bg-amber-100 dark:bg-amber-900/30">
                <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
              </div>
              <div className="min-w-0">
                <p className="text-lg sm:text-2xl font-bold">{stats.byType.deadline || 0}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">Alertas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Notifications */}
      {globalNotifs.length > 0 && (
        <div className="space-y-2 animate-fade-in">
          {globalNotifs.map((notif: Record<string, any>) => (
            <div
              key={notif.id}
              className={`flex items-start gap-2 sm:gap-3 p-2.5 sm:p-4 rounded-lg border ${
                notif.priority === 'urgent' ? 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800' :
                notif.priority === 'high' ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800' :
                'bg-muted/30'
              }`}
            >
              <div className={`p-1.5 sm:p-2 rounded-full shrink-0 ${
                notif.priority === 'urgent' ? 'bg-red-100 dark:bg-red-900/30' :
                notif.priority === 'high' ? 'bg-amber-100 dark:bg-amber-900/30' :
                'bg-primary/10'
              }`}>
                <Bell className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                  notif.priority === 'urgent' ? 'text-red-600' :
                  notif.priority === 'high' ? 'text-amber-600' :
                  'text-primary'
                }`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-xs sm:text-sm font-semibold truncate">{notif.title}</p>
                  <Badge variant="outline" className="text-[9px] sm:text-[10px] h-4 sm:h-5">{notif.type}</Badge>
                  {notif.priority === 'urgent' && <Badge variant="destructive" className="text-[9px] sm:text-[10px] h-4 sm:h-5">Urgente</Badge>}
                </div>
                <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="flex-1 overflow-x-auto -mx-1 px-1 pb-1">
          <div className="flex gap-1 min-w-0">
            {(['all', 'proposal', 'evaluation', 'status', 'system', 'deadline'] as const).map((key) => (
              <Button
                key={key}
                variant={activeFilter === key ? 'default' : 'outline'}
                size="sm"
                className="text-[11px] sm:text-xs whitespace-nowrap h-7 sm:h-8"
                onClick={() => handleFilterChange(key)}
              >
                {key === 'all' ? 'Todas' : typeConfig[key as NotificationType]?.label || key}
              </Button>
            ))}
          </div>
        </div>
        <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
          <SelectTrigger className="w-full sm:w-44 h-8 sm:h-10 text-xs">
            <Filter className="h-3.5 w-3.5 sm:mr-2" />
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50 text-xs sm:text-sm">
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(typeConfig).map(([key, config]) => (
              <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results info */}
      <div className="text-xs sm:text-sm text-muted-foreground">
        {filtered.length > 0
          ? `Mostrando ${paginated.length} de ${filtered.length} notificaciones`
          : 'No hay notificaciones que coincidan con los filtros'
        }
      </div>

      {/* Notifications list */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-muted-foreground">
            <BellOff className="h-12 w-12 sm:h-16 sm:w-16 mb-3 sm:mb-4 opacity-20" />
            <p className="text-base sm:text-lg font-medium">No hay notificaciones</p>
            <p className="text-xs sm:text-sm mt-1 text-center px-4">
              {activeFilter !== 'all'
                ? `No hay notificaciones de ${typeConfig[activeFilter as NotificationType]?.label.toLowerCase()}`
                : 'Estás al día con todo'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 sm:space-y-8">
          {Object.entries(groupedByDate).map(([dateLabel, items]) => (
            <div key={dateLabel}>
              <div className="flex items-center gap-2 mb-2 sm:mb-3">
                <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground shrink-0" />
                <h3 className="text-xs sm:text-sm font-medium text-muted-foreground">{dateLabel}</h3>
                <Separator className="flex-1" />
              </div>
              <div className="space-y-1.5 sm:space-y-2">
                {items.map((notification: any) => {
                  const config = typeConfig[notification.type] || typeConfig.system;
                  const Icon = config.icon;

                  return (
                    <div
                      key={notification.id}
                      className={`group flex items-start gap-2 sm:gap-4 p-2.5 sm:p-4 rounded-lg border transition-colors hover:bg-muted/50 cursor-pointer ${
                        !notification.read ? 'bg-primary/5 border-primary/20' : ''
                      }`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      {isAdmin && showAllNotifs && notification.user ? (
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[9px] sm:text-[10px] bg-muted">
                            {notification.user.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className={`p-1.5 sm:p-2 rounded-full ${config.bg} shrink-0`}>
                          <Icon className={`h-3.5 w-3.5 sm:h-5 sm:w-5 ${config.color}`} />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                          <div className="min-w-0 flex-1">
                            {isAdmin && showAllNotifs && notification.user && (
                              <p className="text-[9px] sm:text-xs text-muted-foreground mb-0.5 truncate">
                                {notification.user.name} · {notification.user.role}
                              </p>
                            )}
                            <p className={`text-xs sm:text-base ${!notification.read ? 'font-semibold' : ''} truncate`}>
                              {notification.title}
                            </p>
                            <p className="text-[11px] sm:text-sm text-muted-foreground mt-0.5 line-clamp-2">
                              {notification.message}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 sm:gap-1 shrink-0">
                            <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                              {formatTimeAgo(notification.timestamp)}
                            </span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground hidden sm:block">
                              {formatTime(notification.timestamp)}
                            </span>
                          </div>
                        </div>

                        {!showAllNotifs && (
                          <div className="flex items-center gap-1.5 sm:gap-2 mt-1.5 sm:mt-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification.id);
                                }}
                              >
                                <CheckCheck className="h-3 w-3 sm:mr-1" />
                                <span className="hidden sm:inline">Marcar leída</span>
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 sm:h-7 text-[10px] sm:text-xs px-1.5 sm:px-2 text-destructive hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3 sm:mr-1" />
                              <span className="hidden sm:inline">Eliminar</span>
                            </Button>
                          </div>
                        )}
                      </div>

                      {!notification.read && (
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full mt-1.5 sm:mt-2 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2 sm:px-3"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5 sm:mr-1" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            <span className="text-xs sm:text-sm text-muted-foreground sm:hidden">
              {page} / {totalPages}
            </span>
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number;
                if (totalPages <= 5) {
                  p = i + 1;
                } else if (page <= 3) {
                  p = i + 1;
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + i;
                } else {
                  p = page - 2 + i;
                }
                return (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="w-7 h-8 text-xs"
                  >
                    {p}
                  </Button>
                );
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs px-2 sm:px-3"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="h-3.5 w-3.5 sm:ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

interface ApiNotification {
  id: string; title: string; message: string; type: NotificationType;
  read: boolean; timestamp: Date; link?: string; user?: Record<string, any> | null;
}

function mapApiNotification(item: Record<string, any>): ApiNotification {
  return {
    id: item.id,
    title: item.title,
    message: item.message,
    type: mapBackendType(item.type || 'system'),
    read: item.isRead || false,
    timestamp: new Date(item.createdAt),
    link: item.link,
    user: item.user || null,
  };
}

function mapBackendType(type: string): NotificationType {
  switch (type) {
    case 'proposal': return 'proposal';
    case 'evaluation': return 'evaluation';
    case 'status': return 'status';
    case 'system':
    case 'welcome':
    case 'password_reset':
    case 'invitation':
    case 'activity':
      return 'system';
    case 'deadline':
    case 'deadline_reminder':
      return 'deadline';
    default: return 'system';
  }
}
