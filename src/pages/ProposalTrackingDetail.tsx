import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Users,
  MessageSquare,
  Calendar,
  Send,
  Eye,
  Star,
  Mail,
  CreditCard,
  Phone,
  MapPin,
  BookOpen,
  Building2,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { proposalStatusLabels } from '@/types/proposal';

// ============ TYPES ============

interface TimelineEntry {
  date: string;
  status: string;
  description: string;
  completed: boolean;
}

interface ScoreInfo {
  criterionName: string;
  score: number;
  maxScore: number;
  comments: string | null;
}

interface EvaluatorInfo {
  id: string;
  name: string;
  email: string;
  department: string | null;
  dni: string | null;
  phone: string | null;
  location: string | null;
  specialty: string | null;
  assignedAt: string;
  completedAt: string | null;
  status: string;
  recommendation: string | null;
  totalScore: number;
  maxScore: number;
}

interface FeedbackEntry {
  evaluator: string;
  comments: string;
  date: string;
  type: 'general' | 'criterion';
  criterionName?: string;
  score?: number;
  maxScore?: number;
  recommendation?: string;
}

interface ProposerInfo {
  id: string;
  name: string;
  email: string;
  department: string | null;
  dni: string | null;
  phone: string | null;
  location: string | null;
  specialty: string | null;
  role: string;
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
  proposer: ProposerInfo | null;
  timeline: TimelineEntry[];
  evaluators: EvaluatorInfo[];
  feedback: FeedbackEntry[];
}

// ============ HELPERS ============

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completado':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'rechazado':
      return <XCircle className="h-5 w-5 text-red-600" />;
    case 'en_progreso':
      return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    default:
      return <Clock className="h-5 w-5 text-muted-foreground" />;
  }
};

const getStatusBadgeClass = (status: string) => {
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

const formatDateTime = (dateStr: string | null): string => {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es });
  } catch {
    return dateStr;
  }
};

// ============ COMPONENT ============

export default function ProposalTrackingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<EvaluatorInfo | null>(null);
  const [selectedProposer, setSelectedProposer] = useState<ProposerInfo | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchTracking = async () => {
      setIsLoading(true);
      try {
        const response = await api.getProposalTracking(id) as unknown as TrackingData;
        if (response && response.id) {
          setTrackingData(response);
          setFetchError(false);
        } else {
          throw new Error('Respuesta inválida');
        }
      } catch {
        setFetchError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTracking();
  }, [id]);

  // ============ LOADING STATE ============

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-72 bg-muted rounded animate-pulse" />
            <div className="h-5 w-56 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    );
  }

  // ============ ERROR STATE ============

  if (fetchError || !trackingData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/proposals/${id}`)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="page-title">Seguimiento de Propuesta</h1>
            <p className="page-subtitle">No se pudo cargar la información de seguimiento</p>
          </div>
        </div>
        <EmptyState
          title="Error al cargar seguimiento"
          description="Ocurrió un error al obtener los datos de seguimiento. Verifica que la propuesta exista o intenta nuevamente."
          variant="error"
          action={{ label: 'Volver a la propuesta', onClick: () => navigate(`/proposals/${id}`) }}
        />
      </div>
    );
  }

  const tl = trackingData.timeline || [];
  const evals = trackingData.evaluators || [];
  const feedback = trackingData.feedback || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/proposals/${id}`)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title truncate">{trackingData.title}</h1>
            <Badge className={getStatusBadgeClass(trackingData.status)}>
              {proposalStatusLabels[trackingData.status as keyof typeof proposalStatusLabels] || trackingData.status}
            </Badge>
          </div>
          <p className="page-subtitle mt-1">Seguimiento detallado de la propuesta</p>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in" style={{ animationDelay: '80ms' } as React.CSSProperties}>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Creada</p>
            <p className="text-sm font-medium mt-1">{formatDate(trackingData.createdAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Send className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Enviada</p>
            <p className="text-sm font-medium mt-1">{formatDate(trackingData.submittedAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-4 w-4 text-yellow-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Evaluación</p>
            <p className="text-sm font-medium mt-1">{formatDate(trackingData.evaluationStartedAt)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground">Finalizada</p>
            <p className="text-sm font-medium mt-1">{formatDate(trackingData.evaluatedAt)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column — Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Timeline */}
          <Card className="animate-fade-in" style={{ animationDelay: '120ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Línea de Tiempo
                {tl.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">{tl.length} paso{tl.length !== 1 ? 's' : ''}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tl.length > 0 ? (
                <div className="relative">
                  <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />
                  <div className="space-y-5">
                    {tl.map((step, i) => (
                      <div key={i} className="relative flex gap-4 pl-10">
                        <div className="absolute left-0 top-0 bg-card p-0.5">
                          {getStatusIcon(step.status)}
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                            <p className="text-sm font-medium">{step.description}</p>
                            <time className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDateTime(step.date)}
                            </time>
                          </div>
                          {step.completed && (
                            <p className="text-xs text-green-600 mt-1 font-medium">✓ Completado</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No hay actividad registrada en la línea de tiempo
                </p>
              )}
            </CardContent>
          </Card>

          {/* Feedback */}
          <Card className="animate-fade-in" style={{ animationDelay: '160ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Retroalimentación
                {feedback.length > 0 && (
                  <Badge variant="outline" className="ml-2 text-xs">{feedback.length}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedback.length > 0 ? (
                <div className="space-y-4">
                  {feedback.map((fb, i) => (
                    <div key={i} className="p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className="text-xs bg-secondary">
                              {getInitials(fb.evaluator)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{fb.evaluator}</span>
                          {fb.recommendation && (
                            <Badge className={
                              fb.recommendation === 'aprobar' ? 'bg-green-100 text-green-800 text-xs' :
                              fb.recommendation === 'rechazar' ? 'bg-red-100 text-red-800 text-xs' :
                              'bg-yellow-100 text-yellow-800 text-xs'
                            }>
                              {fb.recommendation === 'aprobar' ? 'Aprobada' :
                               fb.recommendation === 'rechazar' ? 'Rechazada' : 'Revisión'}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {fb.score != null && (
                            <span className="text-xs font-medium text-muted-foreground">
                              {fb.score}/{fb.maxScore}
                            </span>
                          )}
                          <span className="text-xs text-muted-foreground">{formatDate(fb.date)}</span>
                        </div>
                      </div>
                      <div className="ml-9">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          "{fb.comments}"
                        </p>
                        {fb.type === 'criterion' && fb.criterionName && (
                          <div className="flex items-center gap-2 mt-2">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className="text-xs font-medium text-muted-foreground">
                              {fb.criterionName}: {fb.score}/{fb.maxScore}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <MessageSquare className="h-10 w-10 mb-3" />
                  <p className="text-sm">No hay retroalimentación registrada</p>
                  <p className="text-xs mt-1">Los evaluadores dejarán comentarios durante el proceso</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column — Evaluators & Details */}
        <div className="space-y-6">
          {/* Evaluator / Proponente card based on role */}
          {user?.role === 'evaluador' ? (
            /* Proponente data for evaluador role */
            <Card className="animate-fade-in" style={{ animationDelay: '140ms' } as React.CSSProperties}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Proponente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {trackingData.proposer ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs bg-primary/10 text-primary">
                          {getInitials(trackingData.proposer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <button
                          onClick={() => setSelectedProposer(trackingData.proposer)}
                          className="text-sm font-medium hover:text-primary transition-colors text-left"
                        >
                          {trackingData.proposer.name}
                        </button>
                        <p className="text-xs text-muted-foreground">
                          {trackingData.proposer.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {trackingData.proposer.role}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <Users className="h-10 w-10 mb-2" />
                    <p className="text-sm">Sin datos del proponente</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            /* Evaluator data for proponente role (and others) */
            <Card className="animate-fade-in" style={{ animationDelay: '140ms' } as React.CSSProperties}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Evaluador
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {evals.length > 0 ? (
                  evals.map((evaluator, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {getInitials(evaluator.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <button
                            onClick={() => setSelectedEvaluator(evaluator)}
                            className="text-sm font-medium hover:text-primary transition-colors text-left"
                          >
                            {evaluator.name}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            Asignado: {formatDate(evaluator.assignedAt)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant={evaluator.completedAt ? 'default' : 'secondary'}
                        className="shrink-0 ml-2"
                      >
                        {evaluator.completedAt ? 'Completado' : 'Pendiente'}
                      </Badge>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                    <Users className="h-10 w-10 mb-2" />
                    <p className="text-sm">Sin evaluadores asignados</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Info */}
          <Card className="animate-fade-in" style={{ animationDelay: '180ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Información
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Estado actual</span>
                <Badge className={getStatusBadgeClass(trackingData.status)}>
                  {proposalStatusLabels[trackingData.status as keyof typeof proposalStatusLabels] || trackingData.status}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Pasos completados</span>
                <span className="text-sm font-medium">{tl.filter(t => t.completed).length} / {tl.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Evaluaciones</span>
                <span className="text-sm font-medium">{evals.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Comentarios</span>
                <span className="text-sm font-medium">{feedback.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" variant="outline" onClick={() => navigate(`/proposals/${id}`)}>
                <Eye className="mr-2 h-4 w-4" />
                Ver detalle de propuesta
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evaluator Profile Dialog */}
      <Dialog open={!!selectedEvaluator} onOpenChange={(open) => { if (!open) setSelectedEvaluator(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(selectedEvaluator?.name || 'Evaluador')}
                </AvatarFallback>
              </Avatar>
              <span>{selectedEvaluator?.name || 'Evaluador'}</span>
            </DialogTitle>
            <DialogDescription>
              Información personal del evaluador
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Correo</p>
                  <p className="text-sm font-medium">{selectedEvaluator?.email || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Departamento</p>
                  <p className="text-sm font-medium">{selectedEvaluator?.department || 'No asignado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Cédula / DNI</p>
                  <p className="text-sm font-medium">{selectedEvaluator?.dni || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">{selectedEvaluator?.phone || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Ubicación / Dirección</p>
                  <p className="text-sm font-medium">{selectedEvaluator?.location || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 sm:col-span-2">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Especialidad</p>
                  <p className="text-sm font-medium">{selectedEvaluator?.specialty || 'No registrado'}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proponente Profile Dialog */}
      <Dialog open={!!selectedProposer} onOpenChange={(open) => { if (!open) setSelectedProposer(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(selectedProposer?.name || 'Proponente')}
                </AvatarFallback>
              </Avatar>
              <span>{selectedProposer?.name || 'Proponente'}</span>
            </DialogTitle>
            <DialogDescription>
              Información personal del proponente
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Correo</p>
                  <p className="text-sm font-medium">{selectedProposer?.email || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Departamento</p>
                  <p className="text-sm font-medium">{selectedProposer?.department || 'No asignado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Cédula / DNI</p>
                  <p className="text-sm font-medium">{selectedProposer?.dni || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Teléfono</p>
                  <p className="text-sm font-medium">{selectedProposer?.phone || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Ubicación / Dirección</p>
                  <p className="text-sm font-medium">{selectedProposer?.location || 'No registrado'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 sm:col-span-2">
                <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Especialidad</p>
                  <p className="text-sm font-medium">{selectedProposer?.specialty || 'No registrado'}</p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
