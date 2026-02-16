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
  Eye,
  Edit,
  Send,
  RotateCcw
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

import { 
  proposals, 
  evaluations, 
  currentUser, 
  getUserById 
} from '@/data/mockData';
import { 
  proposalStatusLabels, 
  proposalTypeLabels,
  WorkflowStep,
  Evaluation
} from '@/types/proposal';

// Mock documents
const mockDocuments = [
  { id: 'doc-1', name: 'Propuesta_Completa.pdf', size: '2.4 MB', uploadedAt: new Date('2024-01-10') },
  { id: 'doc-2', name: 'Presupuesto_Detallado.pdf', size: '456 KB', uploadedAt: new Date('2024-01-10') },
  { id: 'doc-3', name: 'Cronograma_Actividades.pdf', size: '189 KB', uploadedAt: new Date('2024-01-11') },
  { id: 'doc-4', name: 'Curriculum_Docente.pdf', size: '1.1 MB', uploadedAt: new Date('2024-01-12') },
];

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

export default function ProposalDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const proposal = proposals.find(p => p.id === id);
  const proposalEvaluations = evaluations.filter(e => e.proposalId === id);
  
  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Propuesta no encontrada</h2>
        <Button onClick={() => navigate('/proposals')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Propuestas
        </Button>
      </div>
    );
  }

  const canEdit = currentUser.role === 'proponente' && proposal.status === 'borrador';
  const canEvaluate = currentUser.role === 'evaluador' && proposal.status === 'en_evaluacion';
  const canApprove = currentUser.role === 'administrador' && 
    (proposal.status === 'en_evaluacion' || proposal.status === 'enviada');

  const getTotalScore = (evaluation: Evaluation) => {
    const total = evaluation.scores.reduce((sum, s) => sum + s.score, 0);
    const max = evaluation.scores.reduce((sum, s) => sum + s.maxScore, 0);
    return { total, max, percentage: max > 0 ? (total / max) * 100 : 0 };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate(-1)}
            className="shrink-0 mt-1"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="page-title">{proposal.title}</h1>
              <Badge className={getStatusColor(proposal.status)}>
                {proposalStatusLabels[proposal.status]}
              </Badge>
            </div>
            <p className="page-subtitle mt-2">{proposal.description}</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="informacion" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="informacion">Información</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="evaluaciones">Evaluaciones</TabsTrigger>
              <TabsTrigger value="historial">Historial</TabsTrigger>
            </TabsList>

            {/* Tab: Información */}
            <TabsContent value="informacion" className="space-y-4">
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
                      <p className="mt-1 font-medium">{proposalTypeLabels[proposal.type]}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Duración</label>
                      <p className="mt-1 font-medium">{proposal.duration || 'No especificada'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Público Objetivo</label>
                      <p className="mt-1 font-medium">{proposal.targetAudience || 'No especificado'}</p>
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
                      {proposal.objectives.map((obj, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {proposal.methodology && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Metodología
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-foreground">{proposal.methodology}</p>
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
                  {mockDocuments.map((doc) => (
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
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Mock PDF Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle>Vista Previa del Documento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-[3/4] bg-muted rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-border">
                    <FileText className="h-16 w-16 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground font-medium">Propuesta_Completa.pdf</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Seleccione un documento para previsualizarlo
                    </p>
                    <Button variant="outline" className="mt-4">
                      <Eye className="mr-2 h-4 w-4" />
                      Abrir en Nueva Pestaña
                    </Button>
                  </div>
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
                proposalEvaluations.map((evaluation) => {
                  const evaluator = getUserById(evaluation.evaluatorId);
                  const scoreInfo = getTotalScore(evaluation);
                  
                  return (
                    <Card key={evaluation.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {evaluator?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <CardTitle className="text-base">{evaluator?.name}</CardTitle>
                              <p className="text-sm text-muted-foreground">{evaluator?.department}</p>
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
                        <div className="p-4 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Puntuación Total</span>
                            <span className="text-lg font-bold text-primary">
                              {scoreInfo.total} / {scoreInfo.max}
                            </span>
                          </div>
                          <Progress value={scoreInfo.percentage} className="h-2" />
                        </div>

                        {/* Individual Scores */}
                        <div className="space-y-3">
                          {evaluation.scores.map((score, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>{score.criterion}</span>
                                <span className="font-medium">{score.score} / {score.maxScore}</span>
                              </div>
                              <Progress 
                                value={(score.score / score.maxScore) * 100} 
                                className="h-1.5"
                              />
                              {score.comments && (
                                <p className="text-xs text-muted-foreground mt-1">{score.comments}</p>
                              )}
                            </div>
                          ))}
                        </div>

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
                                  ? 'bg-green-100 text-green-800' 
                                  : evaluation.recommendation === 'rechazar'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }
                            >
                              {evaluation.recommendation === 'aprobar' ? 'Aprobar' :
                               evaluation.recommendation === 'rechazar' ? 'Rechazar' : 'Revisión'}
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
                  {proposal.workflowHistory.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8">
                      <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No hay historial disponible</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-[18px] top-0 bottom-0 w-0.5 bg-border" />
                      
                      <div className="space-y-6">
                        {proposal.workflowHistory.map((step: WorkflowStep, index: number) => {
                          const user = step.userId ? getUserById(step.userId) : null;
                          
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
                                
                                {user && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs bg-secondary">
                                        {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-muted-foreground">{user.name}</span>
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
                    {proposal.submitter.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{proposal.submitter.name}</p>
                  <p className="text-sm text-muted-foreground">{proposal.submitter.department}</p>
                  <p className="text-sm text-muted-foreground">{proposal.submitter.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Evaluators */}
          {proposal.evaluators.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Evaluadores Asignados
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {proposal.evaluators.map((evaluator) => (
                  <div key={evaluator.id} className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {evaluator.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{evaluator.name}</p>
                      <p className="text-xs text-muted-foreground">{evaluator.department}</p>
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
                <Badge variant="outline">{proposalTypeLabels[proposal.type]}</Badge>
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
                <span className="font-medium">{proposal.workflowHistory.length}</span>
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
              {currentUser.role === 'proponente' && (
                <>
                  {canEdit ? (
                    <>
                      <Button className="w-full" onClick={() => navigate(`/proposals/edit/${proposal.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Editar Propuesta
                      </Button>
                      <Button variant="outline" className="w-full">
                        <Send className="mr-2 h-4 w-4" />
                        Enviar para Revisión
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Esta propuesta está en modo solo lectura
                    </p>
                  )}
                </>
              )}

              {/* Evaluador Actions */}
              {canEvaluate && (
                <Button className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Evaluar Propuesta
                </Button>
              )}

              {/* Administrador Actions */}
              {canApprove && (
                <>
                  <Button className="w-full bg-green-600 hover:bg-green-700">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Aprobar
                  </Button>
                  <Button variant="destructive" className="w-full">
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar
                  </Button>
                  <Button variant="outline" className="w-full">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Devolver para Corrección
                  </Button>
                </>
              )}

              {/* Common Actions */}
              <Separator />
              <Button variant="ghost" className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
