import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Calendar, 
  Clock, 
  Users, 
  Target, 
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Download,
  Edit,
  Send,
  RotateCcw,
  Activity,
  Award,
  ClipboardList,
  DollarSign,
  Lightbulb,
  UserCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { LoadingSkeleton } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

import { 
  proposalStatusLabels, 
  proposalTypeLabels,
  Evaluation
} from '@/types/proposal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ============ HELPER FUNCTIONS ============

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

const getWorkflowStatusIcon = (status: string) => {
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

const parseObjectives = (objectives: unknown): string[] => {
  if (!objectives) return [];
  if (Array.isArray(objectives)) return objectives as string[];
  if (typeof objectives === 'string') {
    try {
      const parsed = JSON.parse(objectives);
      return Array.isArray(parsed) ? parsed : [objectives];
    } catch {
      return [objectives];
    }
  }
  return [];
};

const getInitials = (name: string): string =>
  name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============ API DATA TRANSFORMATION ============

const mapApiProposalDetail = (data: Record<string, any>): Record<string, any> => {
  // Parse objectives (could be JSON string, array, or null)
  const objectives = parseObjectives(data.objectives);

  // Map evaluators: API returns ProposalEvaluator[] with nested user
  const evaluators = (data.evaluators || []).map((ev: Record<string, any>) => {
    const user = ev.user || {};
    return {
      id: user.id || ev.userId,
      name: user.name || 'Evaluador',
      email: user.email || '',
      department: user.department || null,
      role: user.role || 'evaluador',
    };
  });

  // Map evaluations
  const evaluations = (data.evaluations || []).map((ev: Record<string, any>) => ({
    ...ev,
    comments: ev.generalComments || ev.comments || '',
    scores: (ev.scores || []).map((s: Record<string, any>) => ({
      criterion: s.criterion?.name || s.criterion || '',
      maxScore: s.maxScore,
      score: s.score,
      comments: s.comments,
    })),
    createdAt: ev.createdAt ? new Date(ev.createdAt) : new Date(),
    updatedAt: ev.updatedAt ? new Date(ev.updatedAt) : new Date(),
  }));

  // Map workflow history
  const workflowHistory = (data.workflowHistory || []).map((w: Record<string, any>) => ({
    ...w,
    date: w.date ? new Date(w.date) : new Date(),
  }));

  // Map documents
  const documents = (data.documents || []).map((d: Record<string, any>) => ({
    id: d.id,
    name: d.name,
    size: formatFileSize(d.fileSize || 0),
    filePath: d.filePath,
    fileType: d.fileType,
    uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : new Date(),
  }));

  return {
    ...data,
    submitter: data.proposer || data.submitter || { id: '', name: 'Usuario', email: '' },
    objectives,
    evaluators,
    evaluations,
    workflowHistory,
    documents,
    createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
    updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
  };
};



// ============ COMPONENT ============

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [proposalData, setProposalData] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [statusAction, setStatusAction] = useState<string | null>(null);
  const [isStatusLoading, setIsStatusLoading] = useState(false);
  const [selectedEvaluator, setSelectedEvaluator] = useState<Record<string, any> | null>(null);
  useEffect(() => {
    if (!id) return;

    const fetchProposal = async () => {
      setIsLoading(true);
      try {
        const response = await api.getProposal(id);
        if (response.success && response.data) {
          setProposalData(mapApiProposalDetail(response.data as Record<string, any>));
          setApiError(false);
        } else {
          throw new Error('Respuesta inválida del servidor');
        }
      } catch {
        setApiError(true);
      }
      setIsLoading(false);
    };

    fetchProposal();
  }, [id]);

  // Send proposal for review (proponente action)
  const handleSendForReview = async () => {
    if (!id || !user?.id) return;
    setIsStatusLoading(true);
    try {
      await api.updateProposalStatus(id, {
        status: 'enviada',
        userId: user.id,
        comments: 'Propuesta enviada para revisión',
        role: user.role,
      });
      setProposalData(prev => prev ? { ...prev, status: 'enviada' } : prev);
      toast({
        title: 'Propuesta enviada',
        description: 'La propuesta ha sido enviada para revisión.',
      });
    } catch {
      toast({
        title: 'Error al enviar',
        description: 'No se pudo enviar la propuesta. Intente nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsStatusLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!id || !statusAction) return;
    setIsStatusLoading(true);
    try {
      await api.updateProposalStatus(id, { status: statusAction });
      setProposalData(prev => prev ? { ...prev, status: statusAction } : prev);
      const labels: Record<string, string> = { aprobada: 'aprobada', rechazada: 'rechazada', enviada: 'devuelta para corrección' };
      toast({ title: 'Estado actualizado', description: `La propuesta ha sido ${labels[statusAction] || statusAction}.` });
      setStatusAction(null);
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el estado.', variant: 'destructive' });
    } finally {
      setIsStatusLoading(false);
    }
  };

  // ============ LOADING STATE ============

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-96 bg-muted rounded animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LoadingSkeleton variant="card" count={3} />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton variant="card" count={3} />
          </div>
        </div>
      </div>
    );
  }

  // ============ NOT FOUND / ERROR STATE ============

  if (!proposalData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Propuesta no encontrada</h2>
        <p className="text-muted-foreground text-sm">
          {apiError ? 'Error al cargar la propuesta. Intente nuevamente.' : 'La propuesta que buscas no existe.'}
        </p>
        <Button onClick={() => navigate('/proposals/list')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Propuestas
        </Button>
      </div>
    );
  }

  const proposal = proposalData;
  const proposalEvaluations = proposal.evaluations || [];
  const proposalDocuments = proposal.documents || [];

  const canEdit = user?.role === 'proponente' && (proposal.status === 'borrador' || proposal.status === 'en_evaluacion');
  const canEvaluate = user?.role === 'evaluador' && proposal.status === 'en_evaluacion';
  const hasExistingEvaluations = proposalEvaluations.length > 0;
  const canApprove = user?.role === 'administrador' && 
    (proposal.status === 'en_evaluacion' || proposal.status === 'enviada');

  // ============ DOCUMENT HANDLERS ============

  const handleDownloadDocument = (doc: Record<string, any>) => {
    const fileUrl = doc.filePath || doc.url;
    if (!fileUrl) {
      toast({
        title: 'Documento no disponible',
        description: 'Este documento no tiene una ruta asociada.',
        variant: 'destructive',
      });
      return;
    }
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = doc.name || 'documento';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({
      title: 'Descargando...',
      description: `"${doc.name}" se está descargando.`,
    });
  };

  const handleExportPDF = () => {
    toast({
      title: 'Generando PDF',
      description: 'Preparando la vista de impresión...',
    });
    // Use browser's print functionality which allows "Save as PDF"
    setTimeout(() => window.print(), 300);
  };

  const getTotalScore = (evaluation: Evaluation) => {
    const scores = evaluation.scores || [];
    const total = scores.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
    const max = scores.reduce((sum: number, s: any) => sum + (s.maxScore || 5), 0);
    return { total, max, percentage: max > 0 ? (total / max) * 100 : 0 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3 sm:gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0 mt-0.5"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              <h1 className="page-title text-lg sm:text-xl lg:text-2xl break-words">{proposal.title}</h1>
              <Badge className={getStatusColor(proposal.status) + ' shrink-0 text-xs whitespace-nowrap'}>
                {proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels]}
              </Badge>
            </div>
            <p className="page-subtitle mt-2">{proposal.description}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column - Tabs */}
        <div className="md:col-span-2">
          <Tabs defaultValue="informacion" className="space-y-4">
            <div className="overflow-x-auto -mx-1 px-1">
              <TabsList className="w-full min-w-0">
                <TabsTrigger value="informacion" className="flex-1 text-xs sm:text-sm px-2 sm:px-4">Información</TabsTrigger>
                <TabsTrigger value="documentos" className="flex-1 text-xs sm:text-sm px-2 sm:px-4">Documentos</TabsTrigger>
                <TabsTrigger value="evaluaciones" className="flex-1 text-xs sm:text-sm px-2 sm:px-4">Evaluaciones</TabsTrigger>
                <TabsTrigger value="historial" className="flex-1 text-xs sm:text-sm px-2 sm:px-4">Historial</TabsTrigger>
              </TabsList>
            </div>

            {/* Tab: Información */}
            <TabsContent value="informacion" className="space-y-4">
              {/* Datos Generales */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Datos Generales
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo</label>
                      <p className="mt-1 font-medium">
                        {proposalTypeLabels[proposal.type as keyof typeof proposalTypeLabels] || proposal.type}
                      </p>
                    </div>
                    {proposal.modality && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Modalidad</label>
                        <p className="mt-1 font-medium">{proposal.modality}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duración</label>
                      <p className="mt-1 font-medium">{proposal.duration || 'No especificada'}</p>
                    </div>

                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha de Creación</label>
                      <p className="mt-1 font-medium">
                        {format(proposal.createdAt, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Última Actualización</label>
                      <p className="mt-1 font-medium">
                        {format(proposal.updatedAt, "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    {proposal.submittedAt && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Fecha de Envío</label>
                        <p className="mt-1 font-medium">
                          {format(proposal.submittedAt, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Descripción */}
              {proposal.description && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Descripción
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{proposal.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Presentación y Justificación */}
              {(proposal.presentation || proposal.justification) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposal.presentation && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5" />
                          Presentación
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground whitespace-pre-wrap">{proposal.presentation}</p>
                      </CardContent>
                    </Card>
                  )}
                  {proposal.justification && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Justificación
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground whitespace-pre-wrap">{proposal.justification}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Objetivos */}
              {proposal.objectives && proposal.objectives.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Objetivos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {proposal.objectives.map((obj: string, index: number) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Competencias */}
              {proposal.competencias && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Competencias
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{proposal.competencias}</p>
                  </CardContent>
                </Card>
              )}

              {/* Programa */}
              {proposal.programa && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Programa
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{proposal.programa}</p>
                  </CardContent>
                </Card>
              )}

              {/* Metodología */}
              {proposal.methodology && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Metodología
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{proposal.methodology}</p>
                  </CardContent>
                </Card>
              )}

              {/* Perfiles */}
              {(proposal.entryProfile || proposal.graduationProfile) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {proposal.entryProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserCheck className="h-5 w-5" />
                          Perfil de Ingreso
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground whitespace-pre-wrap">{proposal.entryProfile}</p>
                      </CardContent>
                    </Card>
                  )}
                  {proposal.graduationProfile && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Award className="h-5 w-5" />
                          Perfil de Egreso
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-foreground whitespace-pre-wrap">{proposal.graduationProfile}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Ejes Transversales */}
              {proposal.transversalAxes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Ejes Transversales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{proposal.transversalAxes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Requisitos */}
              {(proposal.requirements || proposal.exitRequirements || proposal.credentialToAward) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ClipboardList className="h-5 w-5" />
                      Requisitos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {proposal.requirements && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Requisitos de Ingreso</label>
                        <p className="mt-1 text-foreground whitespace-pre-wrap">{proposal.requirements}</p>
                      </div>
                    )}
                    {proposal.exitRequirements && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Requisitos de Egreso</label>
                        <p className="mt-1 text-foreground whitespace-pre-wrap">{proposal.exitRequirements}</p>
                      </div>
                    )}
                    {proposal.credentialToAward && (
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Credencial a Otorgar</label>
                        <p className="mt-1 font-medium">{proposal.credentialToAward}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Cupos y Presupuesto */}
              {(proposal.minQuota != null || proposal.maxQuota != null || proposal.budget != null) && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {proposal.minQuota != null && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="h-4 w-4" />
                          Cupo Mínimo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{proposal.minQuota}</p>
                      </CardContent>
                    </Card>
                  )}
                  {proposal.maxQuota != null && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Users className="h-4 w-4" />
                          Cupo Máximo
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">{proposal.maxQuota}</p>
                      </CardContent>
                    </Card>
                  )}
                  {proposal.budget != null && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                          <DollarSign className="h-4 w-4" />
                          Presupuesto
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {typeof proposal.budget === 'number' 
                            ? `$${proposal.budget.toLocaleString('es-CL')}` 
                            : `$${proposal.budget}`}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Facilitadores */}
              {proposal.facilitadores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Facilitadores
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground whitespace-pre-wrap">{proposal.facilitadores}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documentos" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Documentos Adjuntos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {proposalDocuments.length > 0 ? (
                    proposalDocuments.map((doc: Record<string, any>) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{doc.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {doc.size} • {format(doc.uploadedAt, "d MMM yyyy", { locale: es })}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadDocument(doc)}
                            title="Descargar documento"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4" />
                      <p>No hay documentos adjuntos</p>
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            {/* Tab: Evaluaciones */}
            <TabsContent value="evaluaciones" className="space-y-4">
              {proposalEvaluations.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay evaluaciones registradas</p>
                  </CardContent>
                </Card>
              ) : (
                proposalEvaluations.map((evaluation: Record<string, any>) => {
                  const evaluator = evaluation.evaluator || null;
                  const scoreInfo = getTotalScore(evaluation as Evaluation);
                  
                  return (
                    <Card key={evaluation.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {evaluator ? getInitials(evaluator.name || 'Evaluador') : 'EV'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">
                                <button
                                  onClick={() => setSelectedEvaluator({ ...evaluator, evaluation })}
                                  className="hover:text-primary transition-colors text-left font-semibold"
                                >
                                  {evaluator?.name || 'Evaluador'}
                                </button>
                              </CardTitle>
                              {evaluator?.department && (
                                <p className="text-sm text-muted-foreground">{evaluator.department}</p>
                              )}
                            </div>
                          </div>
                          <Badge variant={evaluation.status === 'completada' ? 'default' : 'secondary'}>
                            {evaluation.status === 'completada' ? 'Completada' : 
                             evaluation.status === 'en_progreso' ? 'En Progreso' : 'Pendiente'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Score Summary */}
                        {evaluation.scores && evaluation.scores.length > 0 && (
                          <>
                            <div className="p-4 rounded-lg bg-muted/50">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">Puntuación Total</span>
                                <div className="flex items-center gap-2">
                                  <span className={cn(
                                    'text-sm font-medium',
                                    scoreInfo.percentage >= 70 ? 'text-emerald-600' :
                                    scoreInfo.percentage >= 40 ? 'text-amber-600' : 'text-red-600'
                                  )}>
                                    {Math.round(scoreInfo.percentage)}%
                                  </span>
                                  <span className="text-lg font-bold text-primary">
                                    {scoreInfo.total} / {scoreInfo.max}
                                  </span>
                                </div>
                              </div>
                              <Progress 
                                value={scoreInfo.percentage} 
                                className={cn(
                                  'h-2',
                                  scoreInfo.percentage >= 70 ? '[&>div]:bg-emerald-500' :
                                  scoreInfo.percentage >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                                )} 
                              />
                            </div>

                            {/* Individual Scores */}
                            <div className="space-y-2">
                              {evaluation.scores.map((score: Record<string, any>, index: number) => {
                                const pct = (score.score / (score.maxScore || 5)) * 100;
                                return (
                                  <div key={index} className="p-3 rounded-lg border border-border/50 bg-muted/20">
                                    <div className="flex items-center justify-between text-sm mb-1.5">
                                      <span className="font-medium">{score.criterion}</span>
                                      <span className={cn(
                                        'font-medium',
                                        pct >= 70 ? 'text-emerald-600' :
                                        pct >= 40 ? 'text-amber-600' : 'text-red-600'
                                      )}>
                                        {score.score} / {score.maxScore || 5}
                                      </span>
                                    </div>
                                    <Progress 
                                      value={pct} 
                                      className={cn(
                                        'h-1.5',
                                        pct >= 70 ? '[&>div]:bg-emerald-500' :
                                        pct >= 40 ? '[&>div]:bg-amber-500' : '[&>div]:bg-red-500'
                                      )}
                                    />
                                    {score.comments && (
                                      <p className="text-xs text-muted-foreground mt-1.5 italic">{score.comments}</p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {/* General Comments */}
                        {evaluation.comments && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium mb-2">Comentarios Generales</p>
                              <p className="text-sm text-muted-foreground">{evaluation.comments}</p>
                            </div>
                          </>
                        )}

                        {/* Recommendation */}
                        {evaluation.recommendation && (
                          <div className="flex items-center gap-2 pt-2">
                            <span className="text-sm font-medium">Recomendación:</span>
                            <Badge 
                              className={
                                evaluation.recommendation === 'aprobar' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                                  : evaluation.recommendation === 'rechazar'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                              }
                            >
                              {evaluation.recommendation === 'aprobar' ? 'Aprobar' :
                               evaluation.recommendation === 'rechazar' ? 'Rechazar' : 'Requiere cambios'}
                            </Badge>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </TabsContent>

            {/* Tab: Historial */}
            <TabsContent value="historial">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Historial del Workflow
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!proposal.workflowHistory || proposal.workflowHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay historial disponible</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />
                      
                      <div className="space-y-6">
                        {proposal.workflowHistory.map((step: Record<string, any>, index: number) => {
                          const stepUser = step.user || null;
                          
                          return (
                            <div key={index} className="relative flex gap-4 pl-10">
                              {/* Timeline dot */}
                              <div className="absolute left-0 top-0 bg-background p-0.5">
                                {getWorkflowStatusIcon(step.status)}
                              </div>
                              
                              <div className="flex-1 pb-4">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                  <h4 className="font-medium">{step.name}</h4>
                                  <time className="text-sm text-muted-foreground">
                                    {format(step.date, "d 'de' MMMM, yyyy", { locale: es })}
                                  </time>
                                </div>
                                
                                {stepUser && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs bg-secondary">
                                        {getInitials(stepUser.name || 'Usuario')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground">{stepUser.name}</span>
                                  </div>
                                )}
                                
                                {step.comments && (
                                  <p className="text-sm text-muted-foreground mt-2 p-3 bg-muted rounded-lg">
                                    "{step.comments}"
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Info & Actions */}
        <div className="space-y-6">
          {/* Submitter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Proponente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {getInitials(proposal.submitter?.name || 'Proponente')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{proposal.submitter?.name || 'No disponible'}</p>
                  <p className="text-sm text-muted-foreground">{proposal.submitter?.department || ''}</p>
                  <p className="text-sm text-muted-foreground">{proposal.submitter?.email || ''}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluators */}
          {proposal.evaluators && proposal.evaluators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Evaluadores Asignados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposal.evaluators.map((evaluator: Record<string, any>) => (
                  <div key={evaluator.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {getInitials(evaluator.name || 'Evaluador')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <button
                        onClick={() => setSelectedEvaluator(evaluator)}
                        className="font-medium text-sm hover:text-primary transition-colors text-left"
                      >
                        {evaluator.name}
                      </button>
                      {evaluator.department && (
                        <p className="text-xs text-muted-foreground">{evaluator.department}</p>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Información Rápida
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo</span>
                <Badge variant="outline">
                  {proposalTypeLabels[proposal.type as keyof typeof proposalTypeLabels] || proposal.type}
                </Badge>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duración</span>
                <span className="font-medium">{proposal.duration || '-'}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Evaluaciones</span>
                <span className="font-medium">{proposalEvaluations.length}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pasos del Workflow</span>
                <span className="font-medium">{(proposal.workflowHistory?.length || 0) + proposalEvaluations.filter((e: Record<string, any>) => e.status !== 'pendiente').length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Proponente Actions */}
              {user?.role === 'proponente' && (
                <>
                  {canEdit ? (
                    <Button className="w-full" onClick={() => navigate(`/proposals/${proposal.id}/edit`)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar Propuesta
                    </Button>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Esta propuesta está en modo solo lectura
                    </p>
                  )}
                </>
              )}

              {/* Evaluador Actions */}
              {canEvaluate && (
                <Button className="w-full" onClick={() => navigate(`/evaluations/${id}`)}>
                  <FileText className="mr-2 h-4 w-4" />
                  {hasExistingEvaluations ? 'Re Evaluar Propuesta' : 'Evaluar Propuesta'}
                </Button>
              )}

              {/* Administrador Actions */}
              {canApprove && (
                <>
                  <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500" onClick={() => setStatusAction('aprobada')}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                  <Button variant="destructive" className="w-full" onClick={() => setStatusAction('rechazada')}>
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => setStatusAction('enviada')}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Devolver para Corrección
                  </Button>
                </>
              )}

              {/* Confirmación de cambio de estado */}
              <AlertDialog open={!!statusAction} onOpenChange={(open) => { if (!open) setStatusAction(null); }}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      {statusAction === 'aprobada' ? 'Aprobar Propuesta' :
                       statusAction === 'rechazada' ? 'Rechazar Propuesta' : 'Devolver Propuesta'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      {statusAction === 'aprobada' ? '¿Estás seguro de aprobar esta propuesta? Esta acción no se puede deshacer.' :
                       statusAction === 'rechazada' ? '¿Estás seguro de rechazar esta propuesta? El proponente recibirá una notificación.' :
                       '¿Estás seguro de devolver esta propuesta para corrección? El proponente podrá editarla y reenviarla.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleStatusChange} disabled={isStatusLoading}>
                      {isStatusLoading ? 'Procesando...' : 'Confirmar'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Common Actions */}
              <Button variant="outline" className="w-full" onClick={() => navigate(`/proposals/${id}/tracking`)}>
                <Activity className="mr-2 h-4 w-4" />
                Ver Seguimiento
              </Button>
              <Separator />
              <Button variant="ghost" className="w-full" onClick={handleExportPDF}>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Evaluator Profile Dialog */}
      <Dialog open={!!selectedEvaluator} onOpenChange={(open) => { if (!open) setSelectedEvaluator(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {getInitials(selectedEvaluator?.name || 'Evaluador')}
                </AvatarFallback>
              </Avatar>
              <div>
                <span>{selectedEvaluator?.name || 'Evaluador'}</span>
                {selectedEvaluator?.department && (
                  <p className="text-sm font-normal text-muted-foreground">{selectedEvaluator.department}</p>
                )}
              </div>
            </DialogTitle>
            <DialogDescription>
              Información personal del evaluador
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-3 p-4 rounded-lg bg-muted/30">
            <div>
              <p className="text-xs text-muted-foreground">Nombre</p>
              <p className="text-sm font-medium">{selectedEvaluator?.name || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Correo</p>
              <p className="text-sm font-medium">{selectedEvaluator?.email || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cédula / DNI</p>
              <p className="text-sm font-medium">{selectedEvaluator?.dni || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Teléfono</p>
              <p className="text-sm font-medium">{selectedEvaluator?.phone || 'No registrado'}</p>
            </div>
            {selectedEvaluator?.department && (
              <div>
                <p className="text-xs text-muted-foreground">Departamento</p>
                <p className="text-sm font-medium">{selectedEvaluator.department}</p>
              </div>
            )}
            <div>
              <p className="text-xs text-muted-foreground">Ubicación / Dirección</p>
              <p className="text-sm font-medium">{selectedEvaluator?.location || 'No registrado'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Especialidad</p>
              <p className="text-sm font-medium">{selectedEvaluator?.specialty || 'No registrado'}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
