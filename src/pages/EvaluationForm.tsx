import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Send, 
  XCircle,
  FileText,
  Target,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

import { 
  proposals, 
  evaluations, 
  currentUser, 
  getUserById 
} from '@/data/mockData';
import { 
  proposalStatusLabels, 
  proposalTypeLabels,
  Evaluation
} from '@/types/proposal';

// Evaluation criteria with weights
const evaluationCriteria = [
  { 
    id: 'pertinencia', 
    name: 'Pertinencia', 
    weight: 25,
    description: 'Relevancia del programa para las necesidades institucionales y del sector'
  },
  { 
    id: 'calidad', 
    name: 'Calidad Académica', 
    weight: 25,
    description: 'Rigor académico, actualidad de contenidos y nivel de profundización'
  },
  { 
    id: 'viabilidad', 
    name: 'Viabilidad', 
    weight: 20,
    description: 'Factibilidad técnica, financiera y operativa del programa'
  },
  { 
    id: 'metodologia', 
    name: 'Metodología', 
    weight: 15,
    description: 'Adecuación de las estrategias didácticas y recursos pedagógicos'
  },
  { 
    id: 'impacto', 
    name: 'Impacto Esperado', 
    weight: 15,
    description: 'Beneficios proyectados para participantes e institución'
  },
];

// Validation schema
const evaluationSchema = z.object({
  scores: z.record(z.number().min(1).max(5)),
  comments: z.record(z.string().max(500)),
  generalObservations: z.string().max(2000),
  recommendation: z.enum(['aprobar', 'rechazar', 'revision']).optional(),
});

interface CriterionScore {
  score: number;
  comment: string;
}

type ScoresState = Record<string, CriterionScore>;

const getScoreLabel = (score: number): string => {
  const labels: Record<number, string> = {
    1: 'Deficiente',
    2: 'Regular',
    3: 'Bueno',
    4: 'Muy Bueno',
    5: 'Excelente',
  };
  return labels[score] || '';
};

const getScoreColor = (score: number): string => {
  if (score >= 4) return 'text-green-600';
  if (score >= 3) return 'text-yellow-600';
  return 'text-red-600';
};

export default function EvaluationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const proposal = proposals.find(p => p.id === id);
  const previousEvaluations = evaluations.filter(e => e.proposalId === id && e.evaluatorId !== currentUser.id);
  
  const [scores, setScores] = useState<ScoresState>(() => {
    const initial: ScoresState = {};
    evaluationCriteria.forEach(c => {
      initial[c.id] = { score: 0, comment: '' };
    });
    return initial;
  });
  
  const [generalObservations, setGeneralObservations] = useState('');
  const [recommendation, setRecommendation] = useState<string>('');
  const [isProposalOpen, setIsProposalOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate total score
  const totalScore = useMemo(() => {
    let weightedSum = 0;
    let totalWeight = 0;
    
    evaluationCriteria.forEach(criterion => {
      const score = scores[criterion.id]?.score || 0;
      if (score > 0) {
        weightedSum += (score / 5) * criterion.weight;
        totalWeight += criterion.weight;
      }
    });
    
    return totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;
  }, [scores]);

  const completedCriteria = useMemo(() => {
    return evaluationCriteria.filter(c => scores[c.id]?.score > 0).length;
  }, [scores]);

  const isFormComplete = completedCriteria === evaluationCriteria.length && recommendation;

  if (!proposal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <FileText className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Propuesta no encontrada</h2>
        <Button onClick={() => navigate('/evaluations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver a Evaluaciones
        </Button>
      </div>
    );
  }

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], score }
    }));
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    // Limit to 500 characters
    if (comment.length <= 500) {
      setScores(prev => ({
        ...prev,
        [criterionId]: { ...prev[criterionId], comment }
      }));
    }
  };

  const handleSaveDraft = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    toast({
      title: "Borrador guardado",
      description: "Tu evaluación ha sido guardada como borrador.",
    });
  };

  const handleSubmit = async () => {
    if (!isFormComplete) {
      toast({
        title: "Formulario incompleto",
        description: "Por favor completa todos los criterios y selecciona una recomendación.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSaving(false);
    
    toast({
      title: "Evaluación enviada",
      description: "Tu evaluación ha sido enviada exitosamente.",
    });
    navigate(`/proposals/${id}`);
  };

  const handleReject = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    
    toast({
      title: "Propuesta rechazada",
      description: "Has rechazado participar en esta evaluación.",
    });
    navigate('/evaluations');
  };

  const getTotalScoreForEvaluation = (evaluation: Evaluation) => {
    const total = evaluation.scores.reduce((sum, s) => sum + s.score, 0);
    const max = evaluation.scores.reduce((sum, s) => sum + s.maxScore, 0);
    return max > 0 ? (total / max) * 100 : 0;
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
            <h1 className="page-title">Evaluar Propuesta</h1>
            <p className="page-subtitle mt-1">Complete la rúbrica de evaluación para esta propuesta</p>
          </div>
        </div>
        
        {/* Progress indicator */}
        <div className="flex items-center gap-4 bg-card rounded-lg p-4 border">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{completedCriteria}/{evaluationCriteria.length}</p>
            <p className="text-xs text-muted-foreground">Criterios</p>
          </div>
          <Separator orientation="vertical" className="h-10" />
          <div className="text-center">
            <p className={`text-2xl font-bold ${totalScore >= 70 ? 'text-green-600' : totalScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
              {totalScore.toFixed(0)}%
            </p>
            <p className="text-xs text-muted-foreground">Puntuación</p>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Evaluation Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Evaluation Rubric */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Rúbrica de Evaluación
              </CardTitle>
              <CardDescription>
                Evalúe cada criterio en una escala del 1 al 5 y agregue comentarios específicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {evaluationCriteria.map((criterion, index) => (
                <div key={criterion.id} className="space-y-4">
                  {index > 0 && <Separator />}
                  
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{criterion.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {criterion.weight}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {criterion.description}
                        </p>
                      </div>
                      {scores[criterion.id]?.score > 0 && (
                        <div className="text-right">
                          <span className={`font-bold ${getScoreColor(scores[criterion.id].score)}`}>
                            {scores[criterion.id].score}/5
                          </span>
                          <p className="text-xs text-muted-foreground">
                            {getScoreLabel(scores[criterion.id].score)}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Score Selection */}
                    <RadioGroup
                      value={scores[criterion.id]?.score?.toString() || ''}
                      onValueChange={(value) => handleScoreChange(criterion.id, parseInt(value))}
                      className="flex gap-2"
                    >
                      {[1, 2, 3, 4, 5].map((score) => (
                        <div key={score} className="flex-1">
                          <RadioGroupItem
                            value={score.toString()}
                            id={`${criterion.id}-${score}`}
                            className="peer sr-only"
                          />
                          <Label
                            htmlFor={`${criterion.id}-${score}`}
                            className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 cursor-pointer transition-all"
                          >
                            <span className="text-lg font-bold">{score}</span>
                            <span className="text-[10px] text-muted-foreground hidden sm:block">
                              {getScoreLabel(score)}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Comments */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor={`comment-${criterion.id}`} className="text-sm">
                          Comentarios (opcional)
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {scores[criterion.id]?.comment?.length || 0}/500
                        </span>
                      </div>
                      <Textarea
                        id={`comment-${criterion.id}`}
                        placeholder={`Observaciones sobre ${criterion.name.toLowerCase()}...`}
                        value={scores[criterion.id]?.comment || ''}
                        onChange={(e) => handleCommentChange(criterion.id, e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* General Observations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Observaciones Generales
              </CardTitle>
              <CardDescription>
                Proporcione una evaluación global y recomendaciones
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="general-observations">Comentarios generales</Label>
                  <span className="text-xs text-muted-foreground">
                    {generalObservations.length}/2000
                  </span>
                </div>
                <Textarea
                  id="general-observations"
                  placeholder="Escriba sus observaciones generales sobre la propuesta, fortalezas, debilidades y sugerencias de mejora..."
                  value={generalObservations}
                  onChange={(e) => {
                    if (e.target.value.length <= 2000) {
                      setGeneralObservations(e.target.value);
                    }
                  }}
                  className="resize-none"
                  rows={5}
                />
              </div>

              {/* Recommendation */}
              <div className="space-y-3">
                <Label>Recomendación Final *</Label>
                <RadioGroup
                  value={recommendation}
                  onValueChange={setRecommendation}
                  className="grid grid-cols-1 sm:grid-cols-3 gap-3"
                >
                  <div>
                    <RadioGroupItem
                      value="aprobar"
                      id="rec-aprobar"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="rec-aprobar"
                      className="flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-green-500 peer-data-[state=checked]:bg-green-50 dark:peer-data-[state=checked]:bg-green-950 cursor-pointer transition-all"
                    >
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-medium">Aprobar</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="revision"
                      id="rec-revision"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="rec-revision"
                      className="flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-yellow-500 peer-data-[state=checked]:bg-yellow-50 dark:peer-data-[state=checked]:bg-yellow-950 cursor-pointer transition-all"
                    >
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium">Revisión</span>
                    </Label>
                  </div>
                  <div>
                    <RadioGroupItem
                      value="rechazar"
                      id="rec-rechazar"
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor="rec-rechazar"
                      className="flex items-center justify-center gap-2 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-red-500 peer-data-[state=checked]:bg-red-50 dark:peer-data-[state=checked]:bg-red-950 cursor-pointer transition-all"
                    >
                      <XCircle className="h-5 w-5 text-red-600" />
                      <span className="font-medium">Rechazar</span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Previous Evaluations History */}
          {previousEvaluations.length > 0 && (
            <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Evaluaciones Previas ({previousEvaluations.length})
                      </CardTitle>
                      {isHistoryOpen ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4">
                    {previousEvaluations.map((evaluation) => {
                      const evaluator = getUserById(evaluation.evaluatorId);
                      const scorePercentage = getTotalScoreForEvaluation(evaluation);
                      
                      return (
                        <div 
                          key={evaluation.id}
                          className="p-4 rounded-lg border bg-muted/30"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="text-xs bg-secondary">
                                  {evaluator?.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{evaluator?.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(evaluation.updatedAt, "d 'de' MMMM, yyyy", { locale: es })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`font-bold ${scorePercentage >= 70 ? 'text-green-600' : scorePercentage >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {scorePercentage.toFixed(0)}%
                              </span>
                              {evaluation.recommendation && (
                                <Badge 
                                  className={`ml-2 ${
                                    evaluation.recommendation === 'aprobar' 
                                      ? 'bg-green-100 text-green-800' 
                                      : evaluation.recommendation === 'rechazar'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {evaluation.recommendation === 'aprobar' ? 'Aprobar' :
                                   evaluation.recommendation === 'rechazar' ? 'Rechazar' : 'Revisión'}
                                </Badge>
                              )}
                            </div>
                          </div>
                          {evaluation.comments && (
                            <p className="text-sm text-muted-foreground">
                              "{evaluation.comments}"
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}
        </div>

        {/* Right Column - Proposal Preview & Actions */}
        <div className="space-y-6">
          {/* Proposal Preview */}
          <Collapsible open={isProposalOpen} onOpenChange={setIsProposalOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Propuesta
                    </CardTitle>
                    {isProposalOpen ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg leading-tight">{proposal.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{proposalTypeLabels[proposal.type]}</Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        {proposalStatusLabels[proposal.status]}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">{proposal.description}</p>
                  
                  <Separator />
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Duración:</span>
                      <span className="font-medium">{proposal.duration || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Público:</span>
                      <span className="font-medium text-xs">{proposal.targetAudience || 'N/A'}</span>
                    </div>
                  </div>
                  
                  {proposal.objectives && proposal.objectives.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          Objetivos
                        </p>
                        <ul className="space-y-1">
                          {proposal.objectives.slice(0, 3).map((obj, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <CheckCircle2 className="h-3 w-3 shrink-0 mt-1 text-primary" />
                              <span className="line-clamp-2">{obj}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate(`/proposals/${proposal.id}`)}
                  >
                    Ver Propuesta Completa
                  </Button>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Submitter Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5" />
                Proponente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {proposal.submitter.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{proposal.submitter.name}</p>
                  <p className="text-sm text-muted-foreground">{proposal.submitter.department}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Score Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-5 w-5" />
                Resumen de Puntuación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center p-4 rounded-lg bg-muted/50">
                <p className={`text-4xl font-bold ${totalScore >= 70 ? 'text-green-600' : totalScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {totalScore.toFixed(0)}%
                </p>
                <p className="text-sm text-muted-foreground mt-1">Puntuación Ponderada</p>
              </div>
              
              <Progress value={totalScore} className="h-2" />
              
              <div className="space-y-2">
                {evaluationCriteria.map((criterion) => (
                  <div key={criterion.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{criterion.name}</span>
                    <span className={`font-medium ${scores[criterion.id]?.score > 0 ? getScoreColor(scores[criterion.id].score) : 'text-muted-foreground'}`}>
                      {scores[criterion.id]?.score > 0 ? `${scores[criterion.id].score}/5` : '-'}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Acciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                className="w-full"
                onClick={handleSubmit}
                disabled={!isFormComplete || isSaving}
              >
                <Send className="mr-2 h-4 w-4" />
                {isSaving ? 'Enviando...' : 'Enviar Evaluación'}
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSaveDraft}
                disabled={isSaving}
              >
                <Save className="mr-2 h-4 w-4" />
                Guardar Borrador
              </Button>
              
              <Separator />
              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-destructive hover:text-destructive">
                    <XCircle className="mr-2 h-4 w-4" />
                    Rechazar Evaluación
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Rechazar esta evaluación?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción indicará que no puedes o no deseas evaluar esta propuesta. 
                      Se notificará al administrador para asignar otro evaluador.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleReject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Confirmar Rechazo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              
              {!isFormComplete && (
                <p className="text-xs text-muted-foreground text-center">
                  Complete todos los criterios y seleccione una recomendación para enviar
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
