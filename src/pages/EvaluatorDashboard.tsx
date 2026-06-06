import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClipboardCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  User,
  BookOpen,
  ArrowRight,
  BarChart3,
  PieChart,
  Sparkles,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend,
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { api } from '@/lib/api';

const RECOMMENDATION_COLORS = {
  aprobar: '#22c55e',
  rechazar: '#ef4444',
  revision: '#f59e0b',
};

const RECOMMENDATION_LABELS: Record<string, string> = {
  aprobar: 'Aprobada',
  rechazar: 'Rechazada',
  revision: 'En revisión',
};

interface EvaluatorStats {
  totalEvaluations: number;
  averageScore: number;
  approvalRate: number;
  averageEvaluationTime: number;
  pendingEvaluations: number;
  urgentDeadlines: number;
}

interface AssignedProposal {
  id: string;
  proposalId: string;
  title: string;
  type: string;
  assignedAt: string;
  deadline: string | null;
  daysRemaining: number;
  urgency: 'urgent' | 'soon' | 'on_time';
  submitter: { id: string; name: string; email: string } | null;
}

interface EvaluationHistoryItem {
  id: string;
  proposalId: string;
  proposalTitle: string;
  proposalType: string;
  evaluatedAt: string;
  totalScore: number;
  maxScore: number;
  recommendation: 'aprobar' | 'rechazar' | 'revision';
  generalComments: string | null;
}

interface RecentEvaluation {
  id: string;
  proposalTitle: string;
  evaluatedAt: string;
  totalScore: number;
  maxScore: number;
  recommendation: 'aprobar' | 'rechazar' | 'revision';
}

export default function EvaluatorDashboard() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [stats, setStats] = useState<EvaluatorStats | null>(null);
  const [assignedProposals, setAssignedProposals] = useState<AssignedProposal[]>([]);
  const [history, setHistory] = useState<EvaluationHistoryItem[]>([]);
  const [recentEvaluations, setRecentEvaluations] = useState<RecentEvaluation[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [statsRes, proposalsRes, historyRes, recentRes] = await Promise.all([
          api.getEvaluatorStats().catch(() => null),
          api.getAssignedProposals().catch(() => null),
          api.getEvaluationHistory().catch(() => null),
          api.getRecentEvaluations().catch(() => null),
        ]);

        if (statsRes) {
          const statsData = statsRes.success ? statsRes.data : statsRes;
          if (statsData) setStats(statsData as unknown as EvaluatorStats);
        }
        if (proposalsRes) {
          const proposalsData = proposalsRes.success ? proposalsRes.data : proposalsRes;
          if (proposalsData) setAssignedProposals((proposalsData as unknown as AssignedProposal[]) || []);
        }
        if (historyRes) {
          const historyData = historyRes.success ? historyRes.data : historyRes;
          if (historyData) setHistory((historyData as unknown as EvaluationHistoryItem[]) || []);
        }
        if (recentRes) {
          const recentData = recentRes.success ? recentRes.data : recentRes;
          if (recentData) setRecentEvaluations((recentData as unknown as RecentEvaluation[]) || []);
        }

        if (!statsRes && !proposalsRes) {
          setApiError(true);
        }
      } catch {
        setApiError(true);
      }
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const PROPOSALS_PER_PAGE = 5;
  const [proposalPage, setProposalPage] = useState(0);
  const totalProposalPages = Math.max(1, Math.ceil(assignedProposals.length / PROPOSALS_PER_PAGE));
  const paginatedProposals = assignedProposals.slice(proposalPage * PROPOSALS_PER_PAGE, (proposalPage + 1) * PROPOSALS_PER_PAGE);

  const monthlyData = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const item of history) {
      const date = new Date(item.evaluatedAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      grouped[key] = (grouped[key] || 0) + 1;
    }
    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => {
        const [year, m] = month.split('-');
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return { month: `${monthNames[parseInt(m) - 1]} ${year}`, count };
      });
  }, [history]);

  const recommendationData = useMemo(() => {
    const counts: Record<string, number> = { aprobar: 0, rechazar: 0, revision: 0 };
    for (const item of recentEvaluations) {
      const rec = item.recommendation || 'revision';
      counts[rec] = (counts[rec] || 0) + 1;
    }
    return Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => ({
        name: RECOMMENDATION_LABELS[key] || key,
        value: count,
        color: RECOMMENDATION_COLORS[key as keyof typeof RECOMMENDATION_COLORS] || '#6b7280',
      }));
  }, [recentEvaluations]);

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return { variant: 'destructive' as const, label: 'Urgente' };
      case 'soon': return { variant: 'warning' as const, label: 'Próximo' };
      default: return { variant: 'secondary' as const, label: 'A Tiempo' };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-muted rounded" />
          <div className="h-5 w-72 bg-muted rounded" />
        </div>
        <LoadingSkeleton variant="stats" count={4} className="lg:grid-cols-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={1} />
        </div>
        <LoadingSkeleton variant="list" count={4} />
      </div>
    );
  }

  const displayStats = stats || {
    totalEvaluations: 0,
    averageScore: 0,
    approvalRate: 0,
    averageEvaluationTime: 0,
    pendingEvaluations: 0,
    urgentDeadlines: 0,
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-title">Dashboard del Evaluador</h1>
          <p className="page-subtitle">
            Estadísticas y gráficos de tus evaluaciones
          </p>
        </div>
        {assignedProposals.length > 0 && (
          <Badge variant="destructive" className="text-sm px-4 py-1.5 whitespace-nowrap">
            {assignedProposals.length} pendiente{assignedProposals.length !== 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* API Error Banner */}
      {apiError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-fade-in">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>No se pudieron cargar todos los datos. Mostrando información disponible.</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { title: 'Asignadas', value: displayStats.totalEvaluations, icon: ClipboardCheck, variant: 'primary' as const },
          { title: 'Pendientes', value: displayStats.pendingEvaluations, icon: Clock, variant: 'default' as const },
          { title: 'Completadas', value: displayStats.totalEvaluations - displayStats.pendingEvaluations, icon: CheckCircle2, variant: 'default' as const },
          { title: 'Tasa Aprobación', value: `${displayStats.approvalRate}%`, icon: TrendingUp, variant: 'default' as const },
        ].map((stat, index) => (
          <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <StatCard title={stat.title} value={stat.value} icon={stat.icon} variant={stat.variant} />
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Bar Chart - Monthly Evaluations */}
        <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Evaluaciones por Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No hay datos suficientes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" name="Evaluaciones" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Pie Chart - Recommendation Distribution */}
        <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-primary" />
              Distribución de Recomendaciones
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recommendationData.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
                No hay evaluaciones completadas
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <RePieChart>
                  <Pie
                    data={recommendationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {recommendationData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    formatter={(value: string) => <span style={{ fontSize: '12px' }}>{value}</span>}
                  />
                </RePieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
        <div className="stat-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Puntaje Promedio</p>
            <p className="text-lg font-semibold text-foreground">{displayStats.averageScore}%</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tasa de Aprobación</p>
            <p className="text-lg font-semibold text-foreground">{displayStats.approvalRate}%</p>
          </div>
        </div>
        <div className="stat-card flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20">
            <CheckCircle2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Completadas</p>
            <p className="text-lg font-semibold text-foreground">{Math.max(0, displayStats.totalEvaluations - displayStats.pendingEvaluations)}</p>
          </div>
        </div>
      </div>

      {/* Assigned Proposals */}
      <div className="stat-card animate-fade-in" style={{ animationDelay: '300ms' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Propuestas Pendientes</h3>
          </div>
          {assignedProposals.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {assignedProposals.length}
            </Badge>
          )}
        </div>

        {assignedProposals.length === 0 ? (
          <EmptyState
            title="Sin propuestas pendientes"
            description="No tienes propuestas pendientes de evaluación."
            variant="inbox"
          />
        ) : (
          <>
            <div className="space-y-3">
              {paginatedProposals.map((proposal, index) => {
                const urgencyBadge = getUrgencyBadge(proposal.urgency);
                return (
                  <div
                    key={proposal.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 group gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="secondary" className="text-xs capitalize">{proposal.type}</Badge>
                        <Badge variant={urgencyBadge.variant} className="text-xs">{urgencyBadge.label}</Badge>
                      </div>
                      <p className="font-medium text-foreground truncate">{proposal.title}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <User className="h-3 w-3" />
                        <span>{proposal.submitter?.name || 'Desconocido'}</span>
                        <span className="hidden sm:inline">•</span>
                        <span className="hidden sm:inline">{proposal.daysRemaining} días restantes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {proposal.daysRemaining <= 3 && (
                        <AlertCircle className="h-4 w-4 text-destructive" />
                      )}
                      <Button
                        size="sm"
                        className="gradient-primary text-white hover:opacity-90 transition-all duration-200 hover:scale-[1.02]"
                        onClick={() => navigate(`/evaluations/${proposal.proposalId}`)}
                      >
                        Evaluar
                        <ArrowRight className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalProposalPages > 1 && (
              <div className="flex items-center justify-between pt-3 border-t border-border/50 mt-3">
                <p className="text-xs text-muted-foreground">
                  {proposalPage * PROPOSALS_PER_PAGE + 1}-{Math.min((proposalPage + 1) * PROPOSALS_PER_PAGE, assignedProposals.length)} de {assignedProposals.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={proposalPage === 0}
                    onClick={() => setProposalPage(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  {Array.from({ length: totalProposalPages }, (_, i) => (
                    <Button
                      key={i}
                      variant={i === proposalPage ? 'default' : 'ghost'}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setProposalPage(i)}
                    >
                      {i + 1}
                    </Button>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    disabled={proposalPage >= totalProposalPages - 1}
                    onClick={() => setProposalPage(p => Math.min(totalProposalPages - 1, p + 1))}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Recent Evaluations */}
      {recentEvaluations.length > 0 && (
        <div className="stat-card animate-fade-in" style={{ animationDelay: '350ms' }}>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-foreground">Evaluaciones Recientes</h3>
          </div>
          <div className="space-y-3">
            {recentEvaluations.map((evalItem, index) => (
              <div
                key={evalItem.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`p-1.5 rounded-full border shrink-0 ${
                    evalItem.recommendation === 'aprobar' ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200' :
                    evalItem.recommendation === 'rechazar' ? 'text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200' :
                    'text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200'
                  }`}>
                    {evalItem.recommendation === 'aprobar' ? <CheckCircle2 className="h-4 w-4" /> :
                     evalItem.recommendation === 'rechazar' ? <XCircle className="h-4 w-4" /> :
                     <AlertCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{evalItem.proposalTitle}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {evalItem.totalScore}/{evalItem.maxScore} pts • {new Date(evalItem.evaluatedAt).toLocaleDateString('es-VE')}
                    </p>
                  </div>
                  <Badge
                    className="text-xs shrink-0"
                    variant={
                      evalItem.recommendation === 'aprobar' ? 'success' as const :
                      evalItem.recommendation === 'rechazar' ? 'error' as const :
                      'warning' as const
                    }
                  >
                    {RECOMMENDATION_LABELS[evalItem.recommendation] || evalItem.recommendation}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/evaluations')}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Ver Todas las Evaluaciones</p>
              <p className="text-xs text-muted-foreground mt-0.5">Lista completa de evaluaciones asignadas</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto shrink-0" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate('/proposals/list')}>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20">
              <BookOpen className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Explorar Propuestas</p>
              <p className="text-xs text-muted-foreground mt-0.5">Catálogo completo de propuestas académicas</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground ml-auto shrink-0" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
