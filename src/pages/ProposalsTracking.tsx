import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Users,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Send,
  Eye,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { proposalStatusLabels } from '@/types/proposal';

interface TrackingTimelineEntry {
  date: string;
  status: string;
  description: string;
  completed: boolean;
}

interface TrackingEvaluator {
  name: string;
  assignedAt: string;
  completedAt: string | null;
}

interface TrackingFeedback {
  evaluator: string;
  comments: string;
  date: string;
}

interface TrackingData {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  submittedAt: string | null;
  evaluationStartedAt: string | null;
  evaluatedAt: string | null;
  decidedAt: string | null;
  timeline: TrackingTimelineEntry[];
  evaluators: TrackingEvaluator[];
  feedback: TrackingFeedback[];
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completado':
      return <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />;
    case 'rechazado':
      return <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />;
    case 'en_progreso':
      return <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-600" />;
    default:
      return <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />;
  }
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    borrador: 'bg-muted text-muted-foreground',
    enviada: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    en_evaluacion: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    aprobada: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    rechazada: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };
  return colors[status] || colors.borrador;
};

const getInitials = (name: string): string =>
  name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '??';

const formatDate = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
  } catch {
    return dateStr;
  }
};

const LIMIT = 10;

export default function ProposalsTracking() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchTracking = useCallback(async (showLoader = true, page = 1) => {
    if (showLoader) setIsLoading(true);
    setApiError(false);
    try {
      const response = await api.getAllProposalsTracking(user?.id, page, LIMIT) as unknown as { data: TrackingData[]; total: number; page: number; totalPages: number };
      if (response?.data) {
        setTrackingData(response.data);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
        setTotalItems(response.total);
      } else {
        setTrackingData([]);
      }
    } catch {
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useAutoRefresh(() => { fetchTracking(false, currentPage); });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchTracking(true, page);
  };

  const toggleExpanded = (id: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const stats = [
    { label: 'Borrador', value: trackingData.filter(t => t.status === 'borrador').length, color: 'text-muted-foreground' },
    { label: 'Enviadas', value: trackingData.filter(t => t.status === 'enviada').length, color: 'text-blue-600' },
    { label: 'En Evaluación', value: trackingData.filter(t => t.status === 'en_evaluacion').length, color: 'text-yellow-600' },
    { label: 'Finalizadas', value: trackingData.filter(t => t.status === 'aprobada' || t.status === 'rechazada').length, color: 'text-green-600' },
  ];

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="space-y-2">
          <div className="h-7 sm:h-8 w-48 sm:w-56 bg-muted rounded animate-pulse" />
          <div className="h-4 sm:h-5 w-60 sm:w-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 sm:h-24 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-hidden">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0 h-8 w-8 sm:h-10 sm:w-10">
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl lg:text-2xl font-semibold text-foreground break-words">Seguimiento de Propuestas</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            {totalItems} propuesta{totalItems !== 1 ? 's' : ''} en seguimiento
          </p>
        </div>
      </div>

      {apiError && (
        <div className="flex items-start sm:items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm animate-fade-in">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 sm:mt-0" />
          <span>No se pudieron cargar los datos de seguimiento.</span>
        </div>
      )}

      {totalItems > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {stats.map(stat => (
            <Card key={stat.label}>
              <CardContent className="p-3 sm:p-4 text-center">
                <p className={`text-lg sm:text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 truncate">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {trackingData.length === 0 && !apiError ? (
        <EmptyState
          title="Sin propuestas en seguimiento"
          description="Aún no has creado ninguna propuesta para hacer seguimiento."
          variant="inbox"
          action={{ label: 'Crear propuesta', onClick: () => navigate('/proposals/new') }}
        />
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {trackingData.map((item, index) => {
            const isExpanded = expandedCards.has(item.id);
            const tl = item.timeline || [];
            const evals = item.evaluators || [];
            const feedback = item.feedback || [];

            return (
              <Collapsible
                key={item.id}
                open={isExpanded}
                onOpenChange={() => toggleExpanded(item.id)}
                className="animate-fade-in"
                style={{ animationDelay: `${(index + 1) * 50}ms` } as React.CSSProperties}
              >
                <Card className="transition-all duration-200 hover:shadow-md overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors p-3 sm:p-4 lg:p-6">
                      <div className="flex items-center justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <CardTitle className="text-sm sm:text-base truncate">{item.title}</CardTitle>
                            <Badge className={`${getStatusColor(item.status)} text-[10px] sm:text-xs whitespace-nowrap`}>
                              {proposalStatusLabels[item.status as keyof typeof proposalStatusLabels] || item.status}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 shrink-0" />
                              <span className="truncate">Creada: {formatDate(item.createdAt)}</span>
                            </span>
                            {item.submittedAt && (
                              <span className="flex items-center gap-1">
                                <Send className="h-3 w-3 shrink-0" />
                                <span className="truncate">Enviada: {formatDate(item.submittedAt)}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <Badge variant="outline" className="text-[10px] sm:text-xs whitespace-nowrap hidden sm:inline-flex">
                            {tl.length} paso{tl.length !== 1 ? 's' : ''}
                          </Badge>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground shrink-0" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <CardContent className="space-y-4 sm:space-y-6 pt-0 px-3 sm:px-4 lg:px-6 pb-4 sm:pb-6">
                      <Separator />

                      {tl.length > 0 ? (
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-foreground mb-3 sm:mb-4 flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Línea de Tiempo
                          </h4>
                          <div className="relative">
                            <div className="absolute left-[14px] sm:left-[18px] top-0 bottom-0 w-0.5 bg-border" />
                            <div className="space-y-3 sm:space-y-4">
                              {tl.map((step, i) => (
                                <div key={i} className="relative flex gap-3 sm:gap-4 pl-8 sm:pl-10">
                                  <div className="absolute left-0 top-0 bg-card p-0.5">
                                    {getStatusIcon(step.status)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5 sm:gap-1">
                                      <p className="text-xs sm:text-sm font-medium break-words">{step.description}</p>
                                      <time className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                        {formatDate(step.date)}
                                      </time>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs sm:text-sm text-muted-foreground text-center py-2">
                          No hay historial de actividad disponible
                        </p>
                      )}

                      {evals.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Evaluadores Asignados ({evals.length})
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
                              {evals.map((evaluator, i) => (
                                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 gap-2">
                                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                    <Avatar className="h-6 w-6 sm:h-7 sm:w-7 shrink-0">
                                      <AvatarFallback className="text-[10px] sm:text-xs bg-secondary">
                                        {getInitials(evaluator.name)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-xs sm:text-sm truncate">{evaluator.name}</span>
                                  </div>
                                  <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                                    {evaluator.completedAt ? (
                                      <span className="text-green-600 font-medium">Completado</span>
                                    ) : (
                                      'Pendiente'
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      {feedback.length > 0 && (
                        <>
                          <Separator />
                          <div>
                            <h4 className="text-xs sm:text-sm font-medium text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                              <MessageSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              Retroalimentación ({feedback.length})
                            </h4>
                            <div className="space-y-2 sm:space-y-3">
                              {feedback.map((fb, i) => (
                                <div key={i} className="p-2 sm:p-3 rounded-lg bg-muted/30">
                                  <div className="flex items-center justify-between mb-1 sm:mb-2 gap-2">
                                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                      <Avatar className="h-5 w-5 sm:h-6 sm:w-6 shrink-0">
                                        <AvatarFallback className="text-[9px] sm:text-xs bg-secondary">
                                          {getInitials(fb.evaluator)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-xs sm:text-sm font-medium truncate">{fb.evaluator}</span>
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">{formatDate(fb.date)}</span>
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground ml-7 sm:ml-8 break-words">"{fb.comments}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </>
                      )}

                      <div className="flex justify-end pt-1 sm:pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => navigate(`/proposals/${item.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Ver detalle
                        </Button>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 animate-fade-in">
          <p className="text-xs text-muted-foreground order-2 sm:order-1">
            {totalItems} propuesta{totalItems !== 1 ? 's' : ''} — Pág. {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={currentPage <= 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" />
              Anterior
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, idx, arr) => (
                  <span key={p} className="flex items-center">
                    {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-xs text-muted-foreground px-0.5">...</span>}
                    <Button
                      variant={p === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className={`h-8 w-8 p-0 text-xs ${p === currentPage ? '' : ''}`}
                      onClick={() => handlePageChange(p)}
                    >
                      {p}
                    </Button>
                  </span>
                ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              disabled={currentPage >= totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Siguiente
              <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
