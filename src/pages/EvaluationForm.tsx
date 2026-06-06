import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
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
  ChevronUp,
  Trash2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
import { LoadingSkeleton } from '@/components/shared';
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
  proposalStatusLabels, 
  proposalTypeLabels,
  Evaluation
} from '@/types/proposal';
import { api } from '@/lib/api';
import { translateApiError } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

// ============ HELPERS ============

const getInitials = (name: string): string =>
  name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() || '??';

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

const mapApiProposal = (data: Record<string, any>): Record<string, any> => ({
  ...data,
  submitter: data.proposer || data.submitter || { id: '', name: 'Usuario', email: '' },
  objectives: parseObjectives(data.objectives),
  createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
  updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
  submittedAt: data.submittedAt ? new Date(data.submittedAt) : undefined,
});

// Fallback evaluation criteria (used when API fails)
const fallbackCriteria = [
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

interface CriterionScore {
  score: number;
  comment: string;
}

type ScoresState = Record<string, CriterionScore>;

export default function EvaluationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // ============ State ============

  const [proposalData, setProposalData] = useState<Record<string, any> | null>(null);
  const [evaluationCriteria, setEvaluationCriteria] = useState(fallbackCriteria);
  const [criterionIdMap, setCriterionIdMap] = useState<Record<string, string>>({});
  const [previousEvaluations, setPreviousEvaluations] = useState<Record<string, any>[]>([]);
  const [existingEvaluation, setExistingEvaluation] = useState<Record<string, any> | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [scores, setScores] = useState<ScoresState>(() => {
    const initial: ScoresState = {};
    (fallbackCriteria).forEach(c => {
      initial[c.id] = { score: 0, comment: '' };
    });
    return initial;
  });

  const [generalObservations, setGeneralObservations] = useState('');
  const [recommendation, setRecommendation] = useState<string>('');
  const [isProposalOpen, setIsProposalOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // ============ Data Fetching ============

  useEffect(() => {
    if (!id || !user) return;

    const fetchData = async () => {
      setIsLoading(true);

      // Fetch proposal
      try {
        const propResponse = await api.getProposal(id);
        if (propResponse.success && propResponse.data) {
          setProposalData(mapApiProposal(propResponse.data as Record<string, any>));
        } else {
          throw new Error('Respuesta inválida');
        }
      } catch {
        // API call failed — proposalData remains null, "not found" state shown
      }

      // Fetch evaluation criteria
      let localCriteria = fallbackCriteria;
      let localCriterionIdMap: Record<string, string> = {};
      try {
        const critResponse = await api.getEvaluationCriteria();
        if (critResponse.success && critResponse.data && Array.isArray(critResponse.data)) {
          const apiCriteria = critResponse.data as Record<string, any>[];
          const mapped = apiCriteria.map((c, i) => ({
            id: `criterion-${i}`,
            name: c.name,
            weight: c.weight,
            description: c.description || '',
            apiId: c.id,
          }));
          const criteriaWithApiId = mapped.map(c => ({ ...c, apiId: (apiCriteria.find(ac => ac.name === c.name) as Record<string, any>)?.id }));
          setEvaluationCriteria(criteriaWithApiId);
          localCriteria = criteriaWithApiId;

          apiCriteria.forEach((c: Record<string, any>) => {
            localCriterionIdMap[c.name] = c.id;
          });
          setCriterionIdMap(localCriterionIdMap);

          const initial: ScoresState = {};
          mapped.forEach(c => {
            initial[c.id] = { score: 0, comment: '' };
          });
          setScores(initial);
        }
      } catch {
        // Keep fallback criteria
      }

      // Fetch evaluations for this proposal (for history + check existing)
      try {
        const evalResponse = await api.getEvaluations({ proposalId: id });
        if (evalResponse.success && evalResponse.data) {
          const allEvals = evalResponse.data as Record<string, any>[];

          // Check if current user already has an evaluation (for editing)
          const myEval = allEvals.find(
            (e: Record<string, any>) => e.evaluatorId === user.id
          );
          if (myEval) {
            setExistingEvaluation(myEval);
            // Pre-populate form with existing data
            const initial: ScoresState = {};
            localCriteria.forEach(c => {
              const matchedScore = (myEval.scores || []).find(
                (s: Record<string, any>) => {
                  const apiId = localCriterionIdMap[c.name];
                  return s.criterionId === apiId || s.criterion?.name === c.name;
                }
              );
              initial[c.id] = {
                score: matchedScore ? (matchedScore.score / (matchedScore.maxScore || 5)) * 5 : 0,
                comment: matchedScore?.comments || '',
              };
            });
            setScores(initial);
            setGeneralObservations(myEval.generalComments || myEval.comments || '');
            setRecommendation(myEval.recommendation || '');
          }

          // Previous evaluations by other evaluators
          const othersEvals = allEvals.filter(
            (e: Record<string, any>) => e.evaluatorId !== user.id && e.status === 'completada'
          );
          setPreviousEvaluations(othersEvals);
        }
      } catch {
        // API call failed — no previous evaluations available
      }

      setIsLoading(false);
    };

    fetchData();
  }, [id, user]);

  // ============ Computed values ============

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
  }, [scores, evaluationCriteria]);

  const completedCriteria = useMemo(() => {
    return evaluationCriteria.filter(c => scores[c.id]?.score > 0).length;
  }, [scores, evaluationCriteria]);

  const isFormComplete = completedCriteria === evaluationCriteria.length && !!recommendation;

  // ============ Handlers ============

  const handleScoreChange = (criterionId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [criterionId]: { ...prev[criterionId], score }
    }));
  };

  const handleCommentChange = (criterionId: string, comment: string) => {
    if (comment.length <= 500) {
      setScores(prev => ({
        ...prev,
        [criterionId]: { ...prev[criterionId], comment }
      }));
    }
  };

  const buildApiScores = () => {
    return evaluationCriteria
      .filter(c => scores[c.id]?.score > 0)
      .map(c => {
        // Use stored apiId if available, else fallback to criterionIdMap lookup or name
        const apiId = (c as any).apiId || criterionIdMap[c.name];
        return {
          criterionId: apiId || c.name,
          score: scores[c.id].score,
          comments: scores[c.id].comment || '',
        };
      });
  };

  const handleSaveDraft = async () => {
    if (!user || !id) return;
    setIsSaving(true);

    const evaluationData = {
      proposalId: id,
      evaluatorId: user.id,
      status: 'en_progreso',
      generalComments: generalObservations,
      scores: buildApiScores(),
    };

    try {
      if (existingEvaluation) {
        await api.updateEvaluation(existingEvaluation.id, evaluationData);
      } else {
        await api.createEvaluation(evaluationData);
      }
      toast({
        title: "Borrador guardado",
        description: "Tu evaluación ha sido guardada como borrador.",
      });
    } catch (err) {
      const message = translateApiError(err);
      toast({
        title: "Error al guardar",
        description: message,
        variant: "destructive",
      });
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
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

    if (!user || !id) return;
    setIsSaving(true);

    const evaluationData = {
      proposalId: id,
      evaluatorId: user.id,
      status: 'completada',
      generalComments: generalObservations,
      recommendation,
      scores: buildApiScores(),
    };

    try {
      if (existingEvaluation) {
        await api.updateEvaluation(existingEvaluation.id, evaluationData);
      } else {
        await api.createEvaluation(evaluationData);
      }
      toast({
        title: "Evaluación enviada",
        description: "Tu evaluación ha sido enviada exitosamente.",
      });
      navigate(`/proposals/${id}`);
    } catch (err) {
      const message = translateApiError(err);
      toast({
        title: "Error al enviar",
        description: message,
        variant: "destructive",
      });
    }

    setIsSaving(false);
  };

  const handleReject = async () => {
    if (!user || !id) return;
    setIsSaving(true);

    try {
      if (existingEvaluation) {
        await api.updateEvaluation(existingEvaluation.id, {
          status: 'rechazada',
          generalComments: 'Evaluador rechazó participar',
        });
      }
      toast({
        title: "Evaluación rechazada",
        description: "Has rechazado participar en esta evaluación.",
      });
    } catch (err) {
      const message = translateApiError(err);
      toast({
        title: "Error al rechazar",
        description: message,
        variant: "destructive",
      });
    }

    setIsSaving(false);
    navigate('/evaluations');
  };

  const getTotalScoreForEvaluation = (evaluation: Record<string, any>) => {
    const scoresArr = evaluation.scores || [];
    const total = scoresArr.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
    const max = scoresArr.reduce((sum: number, s: any) => sum + (s.maxScore || 1), 0);
    return max > 0 ? (total / max) * 100 : 0;
  };

  // ============ Loading State ============

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-64 bg-muted rounded animate-pulse" />
            <div className="h-5 w-48 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LoadingSkeleton variant="card" count={2} />
          </div>
          <div className="space-y-6">
            <LoadingSkeleton variant="card" count={3} />
          </div>
        </div>
      </div>
    );
  }

  // ============ Not Found State ============

  if (!proposalData) {
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

  const proposal = proposalData;

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
                      <Badge variant="outline">
                        {proposalTypeLabels[proposal.type as keyof typeof proposalTypeLabels] || proposal.type}
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                        {proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels] || proposal.status}
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
                          {proposal.objectives.slice(0, 3).map((obj: string, index: number) => (
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
                    {getInitials(proposal.submitter?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{proposal.submitter?.name || 'No disponible'}</p>
                  <p className="text-sm text-muted-foreground">{proposal.submitter?.department || ''}</p>
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
