import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Clock, CheckCircle, AlertTriangle, Eye, FileText, Calendar, User, Trophy, MessageSquare, Star, Target, ScrollText, Mail, Phone, MapPin, Building2, Stethoscope, Fingerprint, CalendarDays, Shield, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

const proposalStatusConfig: Record<string, { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'secondary' | 'default' }> = {
  aprobada: { label: 'Aprobada', variant: 'success' },
  rechazada: { label: 'Rechazada', variant: 'error' },
  en_evaluacion: { label: 'En Evaluación', variant: 'warning' },
  enviada: { label: 'Enviada', variant: 'info' },
  borrador: { label: 'Borrador', variant: 'secondary' },
};

export default function Evaluations() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'administrador';

  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [evaluations, setEvaluations] = useState<Array<Record<string, any>>>([]);
  const [selectedEval, setSelectedEval] = useState<Record<string, any> | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [proponentProfile, setProponentProfile] = useState<Record<string, any> | null>(null);
  const [proponentDialogOpen, setProponentDialogOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [evaluatorProfile, setEvaluatorProfile] = useState<Record<string, any> | null>(null);
  const [evaluatorDialogOpen, setEvaluatorDialogOpen] = useState(false);
  const [evaluatorProfileLoading, setEvaluatorProfileLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 50;

  const fetchEvaluations = useCallback(async () => {
    setIsLoading(true);
    setApiError(false);
    try {
      if (isAdmin) {
        const res = await api.getAdminAllEvaluations({ page, limit: perPage });
        if (res?.success) {
          const items = Array.isArray(res.data) ? res.data : [];
          setEvaluations(items);
          setTotal(res.pagination?.total || items.length || 0);
        } else {
          setApiError(true);
        }
      } else {
        const data = await api.getAllEvaluatorEvaluations();
        setEvaluations(data as Array<Record<string, any>>);
        setTotal((data as Array<Record<string, any>>).length);
      }
    } catch {
      setApiError(true);
    }
    setIsLoading(false);
  }, [isAdmin, page]);

  useEffect(() => {
    fetchEvaluations();
  }, [fetchEvaluations]);

  const approvedCount = evaluations.filter(e => e.recommendation === 'aprobar').length;
  const rejectedCount = evaluations.filter(e => e.recommendation === 'rechazar').length;
  const inEvaluationCount = evaluations.filter(e => !e.recommendation || e.recommendation === 'revision').length;
  const totalPages = Math.ceil(total / perPage) || 1;

  const formatDate = (date: string | Date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-VE', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const openDetail = (evaluation: Record<string, any>) => {
    setSelectedEval(evaluation);
    setDetailOpen(true);
  };

  const openProponentProfile = async (proposerId: string) => {
    setProfileLoading(true);
    try {
      const res = await api.getUser(proposerId);
      if (res.success && res.data) {
        setProponentProfile(res.data as Record<string, any>);
      } else {
        setProponentProfile(null);
      }
    } catch {
      setProponentProfile(null);
    }
    setProfileLoading(false);
    setProponentDialogOpen(true);
  };

  const openEvaluatorProfile = async (evaluator: Record<string, any>) => {
    setEvaluatorProfileLoading(true);
    try {
      const res = await api.getUser(evaluator.id);
      if (res.success && res.data) {
        setEvaluatorProfile(res.data as Record<string, any>);
      } else {
        setEvaluatorProfile(evaluator);
      }
    } catch {
      setEvaluatorProfile(evaluator);
    }
    setEvaluatorProfileLoading(false);
    setEvaluatorDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse" />
        </div>
        <LoadingSkeleton variant="stats" count={3} className="sm:grid-cols-3" />
        <LoadingSkeleton variant="list" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="page-title">Evaluaciones</h1>
        <p className="page-subtitle">
          {isAdmin ? 'Todas las evaluaciones del sistema' : 'Consulta todas tus evaluaciones realizadas'}
        </p>
      </div>

      {apiError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive animate-fade-in">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Error al cargar evaluaciones</p>
            <p className="text-destructive/80">No se pudieron obtener las evaluaciones. Intenta recargar la página.</p>
          </div>
        </div>
      )}

      {isAdmin ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between px-3 sm:px-6">
            <div className="min-w-0">
              <CardTitle className="text-sm sm:text-base truncate">Todas las Evaluaciones</CardTitle>
              <CardDescription className="truncate">
                {total > 0 ? `Total: ${total} evaluaciones` : 'Sin evaluaciones'}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6">
            {evaluations.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No hay evaluaciones registradas</p>
            ) : (
              <>
                <div className="overflow-x-auto -mx-2 sm:mx-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs whitespace-nowrap">Evaluador</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Propuesta</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Estado</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Puntaje</TableHead>
                        <TableHead className="text-xs whitespace-nowrap">Recomendación</TableHead>
                        <TableHead className="text-xs whitespace-nowrap hidden sm:table-cell">Fecha</TableHead>
                        <TableHead className="text-xs whitespace-nowrap hidden md:table-cell">Criterios</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluations.map((ev: Record<string, any>) => {
                        const pStatus = ev.proposal?.status;
                        const statusColors: Record<string, string> = {
                          pendiente: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
                          en_progreso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
                          completada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                        };
                        const statusLabels: Record<string, string> = {
                          pendiente: 'Pendiente',
                          en_progreso: 'En Progreso',
                          completada: 'Completada',
                        };
                        const recColors: Record<string, string> = {
                          aprobar: 'text-green-600',
                          rechazar: 'text-red-600',
                          revision: 'text-amber-600',
                        };
                        return (
                          <TableRow key={ev.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(ev)}>
                            <TableCell>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">{ev.evaluator?.name || '—'}</p>
                                <p className="text-[10px] text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">{ev.evaluator?.email || ''}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[250px]">{ev.proposal?.title || '—'}</p>
                              <span className="text-[10px] text-muted-foreground">{ev.proposal?.type || ''}</span>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusColors[ev.status] || 'bg-gray-100 text-gray-700'}`}>
                                {statusLabels[ev.status] || ev.status}
                              </span>
                            </TableCell>
                            <TableCell>
                              <span className="text-xs sm:text-sm font-medium">
                                {(() => {
                                  const computedTotal = ev.scores?.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
                                  const displayScore = ev.totalScore != null ? Number(ev.totalScore) : (computedTotal > 0 ? computedTotal : null);
                                  return displayScore != null ? Number(displayScore).toFixed(1) : '—';
                                })()}
                              </span>
                            </TableCell>
                            <TableCell>
                              {ev.recommendation ? (
                                <span className={`text-xs font-medium capitalize ${recColors[ev.recommendation] || ''}`}>{ev.recommendation}</span>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell className="hidden sm:table-cell">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('es-ES') : '—'}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className="text-xs text-muted-foreground">{ev.scores?.length || 0}</span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between gap-3 mt-4">
                    <p className="text-xs text-muted-foreground">
                      Página {page} de {totalPages}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                        <ChevronLeft className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline ml-1">Anterior</span>
                      </Button>
                      <span className="text-xs text-muted-foreground sm:hidden">{page}/{totalPages}</span>
                      <div className="hidden sm:flex gap-1">
                        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                          let p = i + 1;
                          if (totalPages > 5 && page > 3) p = Math.min(Math.max(page - 2 + i, 1), totalPages - 4 + i);
                          return (
                            <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" className="w-7 h-8 text-xs" onClick={() => setPage(p)}>
                              {p}
                            </Button>
                          );
                        })}
                      </div>
                      <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                        <span className="hidden sm:inline mr-1">Siguiente</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              { title: "Aprobadas", value: approvedCount, icon: CheckCircle, variant: 'primary' as const },
              { title: "Rechazadas", value: rejectedCount, icon: AlertTriangle, variant: 'destructive' as const },
              { title: "En Evaluación", value: inEvaluationCount, icon: Clock, variant: 'default' as const },
              { title: "Total", value: evaluations.length, icon: ClipboardCheck, variant: 'default' as const },
            ].map((stat, index) => (
              <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                <StatCard title={stat.title} value={stat.value} icon={stat.icon} variant={stat.variant} />
              </div>
            ))}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
              Mis Evaluaciones
            </h2>

            {evaluations.length === 0 ? (
              <EmptyState
                title="Sin evaluaciones"
                description="No tienes evaluaciones asignadas actualmente."
                variant="inbox"
              />
            ) : (
              <div className="space-y-3">
                {evaluations.map((evaluation, index) => {
                  const pStatus = evaluation.proposal?.status;
                  return (
                    <div
                      key={evaluation.id}
                      className="stat-card flex items-center justify-between gap-4 animate-fade-in transition-all duration-200 hover:shadow-md p-4"
                      style={{ animationDelay: `${(index + 4) * 50}ms` }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          {pStatus && (
                            <Badge variant={proposalStatusConfig[pStatus]?.variant || 'default'}>
                              {proposalStatusConfig[pStatus]?.label || pStatus}
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground truncate">
                          {evaluation.proposal?.title || evaluation.proposalTitle || evaluation.title || 'Propuesta'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground mt-1">
                          <span className="capitalize">{evaluation.proposal?.type || evaluation.proposalType || ''}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatDate(evaluation.updatedAt || evaluation.createdAt)}</span>
                          {(() => {
                            const total = evaluation.scores?.reduce((sum: number, s: any) => sum + (s.score || 0), 0) || 0;
                            return total > 0 ? (
                              <>
                                <span className="hidden sm:inline">•</span>
                                <span className="font-medium">Puntaje: {total}</span>
                              </>
                            ) : null;
                          })()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => openDetail(evaluation)}
                        >
                          <Eye className="h-4 w-4" />
                          Ver detalles
                        </Button>
                        {evaluation.status !== 'completada' && (
                          <Button
                            className="gradient-primary text-white hover:opacity-90 transition-all duration-200 hover:scale-[1.02]"
                            size="sm"
                            onClick={() => navigate(`/evaluations/${evaluation.proposal?.id || evaluation.proposalId || evaluation.id}`)}
                          >
                            Evaluar
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-5 w-5 text-primary" />
              Detalles de Evaluación
            </DialogTitle>
            <DialogDescription>
              Información completa de la evaluación realizada
            </DialogDescription>
          </DialogHeader>

          {selectedEval && (
            <ScrollArea className="max-h-[65vh] pr-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                      <ScrollText className="h-4 w-4" />
                      Propuesta
                    </h4>
                    <div>
                      <p className="font-medium text-foreground">{selectedEval.proposal?.title || selectedEval.proposalTitle || 'Sin título'}</p>
                      <p className="text-sm text-muted-foreground capitalize mt-0.5">
                        Tipo: {selectedEval.proposal?.type || selectedEval.proposalType || 'No especificado'}
                      </p>
                      {selectedEval.proposal?.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{selectedEval.proposal.description}</p>
                      )}
                    </div>
                    {selectedEval.proposal?.proposer && (
                      <button
                        type="button"
                        onClick={() => openProponentProfile(selectedEval.proposal.proposer.id)}
                        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      >
                        <User className="h-3.5 w-3.5" />
                        <span>Proponente: <span className="font-medium underline underline-offset-2 decoration-dotted">{selectedEval.proposal.proposer.name}</span></span>
                      </button>
                    )}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Badge variant={proposalStatusConfig[selectedEval.proposal?.status]?.variant || 'default'}>
                        {proposalStatusConfig[selectedEval.proposal?.status]?.label || selectedEval.proposal?.status || '-'}
                      </Badge>
                    </div>
                  </div>

                  {selectedEval.evaluator && selectedEval.evaluator.id !== user?.id ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <ClipboardCheck className="h-4 w-4" />
                        Evaluador
                      </h4>
                      <div>
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline text-left cursor-pointer"
                          onClick={() => openEvaluatorProfile(selectedEval.evaluator)}
                        >
                          {selectedEval.evaluator.name}
                        </button>
                        <p className="text-sm text-muted-foreground mt-0.5">{selectedEval.evaluator.email}</p>
                      </div>
                    </div>
                  ) : selectedEval.proposal?.proposer ? (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <User className="h-4 w-4" />
                        Proponente
                      </h4>
                      <div>
                        <button
                          type="button"
                          className="font-medium text-primary hover:underline text-left cursor-pointer"
                          onClick={() => openProponentProfile(selectedEval.proposal.proposer.id)}
                        >
                          {selectedEval.proposal.proposer.name}
                        </button>
                        {selectedEval.proposal?.proposer?.email && (
                          <p className="text-sm text-muted-foreground mt-0.5">{selectedEval.proposal.proposer.email}</p>
                        )}
                        {selectedEval.proposal?.proposer?.department && (
                          <p className="text-sm text-muted-foreground mt-0.5">{selectedEval.proposal.proposer.department}</p>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <Separator />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Fechas
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">Asignada: <span className="text-foreground">{formatDate(selectedEval.createdAt)}</span></p>
                      <p className="text-muted-foreground">Actualizada: <span className="text-foreground">{formatDate(selectedEval.updatedAt)}</span></p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <Trophy className="h-4 w-4" />
                      Resultado
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Estado:</span>
                        <Badge variant={proposalStatusConfig[selectedEval.proposal?.status]?.variant || 'default'}>
                          {proposalStatusConfig[selectedEval.proposal?.status]?.label || selectedEval.proposal?.status || '-'}
                        </Badge>
                      </div>
                      {selectedEval.status === 'completada' && selectedEval.scores?.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">Puntaje Total:</span>
                          <span className="font-semibold text-foreground">
                            {selectedEval.scores?.reduce((sum: number, s: any) => sum + (s.score || 0), 0) || 0}
                            <span className="text-muted-foreground font-normal"> / {selectedEval.scores?.reduce((sum: number, s: any) => sum + (s.criterion?.maxScore || 5), 0) || 0}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {selectedEval.status === 'completada' && selectedEval.scores && selectedEval.scores.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        <Star className="h-4 w-4" />
                        Puntajes por Criterio
                      </h4>
                      <div className="space-y-3">
                        {selectedEval.scores.map((score: Record<string, any>) => (
                          <div key={score.id} className="p-3 rounded-lg bg-muted/50 border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-sm text-foreground">
                                {score.criterion?.name || 'Criterio'}
                              </span>
                              <span className="text-sm font-semibold text-primary">
                                {score.score || 0} / {score.criterion?.maxScore || 5}
                              </span>
                            </div>
                            {score.criterion?.description && (
                              <p className="text-xs text-muted-foreground mb-1.5">{score.criterion.description}</p>
                            )}
                            {score.comments && (
                              <div className="flex items-start gap-1.5 text-sm text-muted-foreground mt-1">
                                <MessageSquare className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                <p>{score.comments}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {(selectedEval.generalComments || selectedEval.comments) && selectedEval.status === 'completada' && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <MessageSquare className="h-4 w-4" />
                        Comentarios Generales
                      </h4>
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {selectedEval.generalComments || selectedEval.comments}
                        </p>
                      </div>
                    </div>
                  </>
                )}

                {selectedEval.proposal?.objectives && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Target className="h-4 w-4" />
                        Detalles de la Propuesta
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedEval.proposal.objectives && (
                          <div className="p-2.5 rounded-lg bg-muted/30 border text-sm">
                            <span className="font-medium text-foreground">Objetivos:</span>
                            <p className="text-muted-foreground mt-0.5">{selectedEval.proposal.objectives}</p>
                          </div>
                        )}
                        {selectedEval.proposal.modality && (
                          <div className="p-2.5 rounded-lg bg-muted/30 border text-sm">
                            <span className="font-medium text-foreground">Modalidad:</span>
                            <p className="text-muted-foreground mt-0.5 capitalize">{selectedEval.proposal.modality}</p>
                          </div>
                        )}
                        {selectedEval.proposal.duration && (
                          <div className="p-2.5 rounded-lg bg-muted/30 border text-sm">
                            <span className="font-medium text-foreground">Duración:</span>
                            <p className="text-muted-foreground mt-0.5">{selectedEval.proposal.duration}</p>
                          </div>
                        )}
                        {selectedEval.proposal.budget && (
                          <div className="p-2.5 rounded-lg bg-muted/30 border text-sm">
                            <span className="font-medium text-foreground">Presupuesto:</span>
                            <p className="text-muted-foreground mt-0.5">{selectedEval.proposal.budget}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={proponentDialogOpen} onOpenChange={setProponentDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <User className="h-5 w-5 text-primary" />
              Perfil del Proponente
            </DialogTitle>
            <DialogDescription>
              Datos personales e información del proponente
            </DialogDescription>
          </DialogHeader>

          {profileLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : proponentProfile ? (
            <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-5">
              <div className="flex gap-3">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 shrink-0">
                  <AvatarFallback className="text-base sm:text-lg bg-primary/10 text-primary">
                    {(proponentProfile.name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 self-center">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">{proponentProfile.name}</h3>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Correo electrónico</p>
                    <p className="text-sm font-medium text-foreground truncate">{proponentProfile.email || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Departamento</p>
                    <p className="text-sm font-medium text-foreground truncate">{proponentProfile.department || 'No asignado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Fingerprint className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Cédula / DNI</p>
                    <p className="text-sm font-medium text-foreground truncate">{proponentProfile.dni || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium text-foreground truncate">{proponentProfile.phone || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2 min-w-0">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Ubicación / Dirección</p>
                    <p className="text-sm font-medium text-foreground truncate">{proponentProfile.location || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2 min-w-0">
                  <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Especialidad</p>
                    <p className="text-sm font-medium text-foreground truncate">{proponentProfile.specialty || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                {proponentProfile.createdAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Registrado: {formatDate(proponentProfile.createdAt)}
                  </span>
                )}
                {proponentProfile.role && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Rol: {proponentProfile.role}
                  </span>
                )}
              </div>
            </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se pudo cargar la información del proponente
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={evaluatorDialogOpen} onOpenChange={setEvaluatorDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Perfil del Evaluador
            </DialogTitle>
            <DialogDescription>
              Datos personales e información del evaluador
            </DialogDescription>
          </DialogHeader>

          {evaluatorProfileLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : evaluatorProfile ? (
            <ScrollArea className="max-h-[65vh] pr-4">
            <div className="space-y-5">
              <div className="flex gap-3">
                <Avatar className="h-14 w-14 sm:h-16 sm:w-16 border-2 border-primary/20 shrink-0">
                  <AvatarFallback className="text-base sm:text-lg bg-primary/10 text-primary">
                    {(evaluatorProfile.name || '?').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 self-center">
                  <h3 className="text-base sm:text-lg font-semibold text-foreground break-words">{evaluatorProfile.name}</h3>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Correo electrónico</p>
                    <p className="text-sm font-medium text-foreground truncate">{evaluatorProfile.email || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Departamento</p>
                    <p className="text-sm font-medium text-foreground truncate">{evaluatorProfile.department || 'No asignado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Fingerprint className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Cédula / DNI</p>
                    <p className="text-sm font-medium text-foreground truncate">{evaluatorProfile.dni || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 min-w-0">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Teléfono</p>
                    <p className="text-sm font-medium text-foreground truncate">{evaluatorProfile.phone || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2 min-w-0">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Ubicación / Dirección</p>
                    <p className="text-sm font-medium text-foreground truncate">{evaluatorProfile.location || 'No registrado'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 sm:col-span-2 min-w-0">
                  <Stethoscope className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Especialidad</p>
                    <p className="text-sm font-medium text-foreground truncate">{evaluatorProfile.specialty || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                {evaluatorProfile.createdAt && (
                  <span className="flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    Registrado: {formatDate(evaluatorProfile.createdAt)}
                  </span>
                )}
                {evaluatorProfile.role && (
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    Rol: {evaluatorProfile.role}
                  </span>
                )}
              </div>
            </div>
            </ScrollArea>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No se pudo cargar la información del evaluador
            </p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
