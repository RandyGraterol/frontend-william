import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import {
  FileText,
  Send,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  TrendingUp,
  Edit,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  AreaChart, Area,
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { proposalTypeLabels, proposalStatusLabels } from '@/types/proposal';
import { cn } from '@/lib/utils';

interface ProponenteStats {
  total: number;
  drafts: number;
  submitted: number;
  inReview: number;
  approved: number;
  rejected: number;
  completionRate: number;
}

interface RecentProposal {
  id: string;
  code: string;
  title: string;
  type: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  proposer: { id: string; name: string };
  evaluationCount: number;
}

interface ProponenteMetrics {
  approvalRate: number;
  averageScore: number;
  averageSubmissionDays: number;
}

interface ChartData {
  proposalsByType: Array<{ name: string; value: number }>;
  proposalsByMonth: Array<{ name: string; creadas: number }>;
  proposalsByModality: Array<{ name: string; value: number }>;
}

const STATUS_COLORS: Record<string, string> = {
  borrador: '#64748b',
  enviada: '#3b82f6',
  en_evaluacion: '#f59e0b',
  aprobada: '#22c55e',
  rechazada: '#ef4444',
};

const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  en_evaluacion: 'En Evaluación',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

const MODALITY_COLORS = ['#6366f1', '#06b6d4', '#f97316'];
const TYPE_COLORS = ['#8b5cf6', '#ec4899', '#14b8a6', '#f59e0b'];

export default function ProponenteDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  const [stats, setStats] = useState<ProponenteStats | null>(null);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [metrics, setMetrics] = useState<ProponenteMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const fetchData = useCallback(async (showLoader = true, page = 1) => {
    if (showLoader) setIsLoading(true);
    try {
      const [statsRes, recentRes, metricsRes, chartRes] = await Promise.all([
        api.getProponenteStats(user?.id).catch(() => null),
        api.getRecentProposals(user?.id, 5, page).catch(() => null),
        api.getPerformanceMetrics(user?.id).catch(() => null),
        api.getProponenteChartData(user?.id).catch(() => null),
      ]);

      const typedStats = statsRes as Record<string, unknown> | null;
      const typedRecent = recentRes as { data: Array<Record<string, unknown>>; total: number; page: number; totalPages: number } | null;
      const typedMetrics = metricsRes as Record<string, unknown> | null;
      const typedChart = chartRes as ChartData | null;

      const hasStats = typedStats && typeof typedStats.total === 'number';

      if (hasStats) {
        setStats({
          total: (typedStats.total as number) || 0,
          drafts: (typedStats.drafts as number) || 0,
          submitted: (typedStats.submitted as number) || 0,
          inReview: (typedStats.inReview as number) || 0,
          approved: (typedStats.approved as number) || 0,
          rejected: (typedStats.rejected as number) || 0,
          completionRate: (typedStats.completionRate as number) || 0,
        });

        if (typedRecent) {
          setCurrentPage(typedRecent.page);
          setTotalPages(typedRecent.totalPages);
          setTotalItems(typedRecent.total);
        }
        const recentData = typedRecent?.data || [];
        setRecentProposals(recentData.map(p => ({
          id: (p.id as string) || '',
          code: (p.code as string) || '',
          title: (p.title as string) || '',
          type: (p.type as string) || '',
          status: (p.status as string) || '',
          createdAt: (p.createdAt as string) || new Date().toISOString(),
          updatedAt: (p.updatedAt as string) || new Date().toISOString(),
          proposer: ((p.proposer as Record<string, unknown>) as { id: string; name: string }) || { id: '', name: '' },
          evaluationCount: (p.evaluationCount as number) || 0,
        })));

        if (typedMetrics && typeof typedMetrics.approvalRate === 'number') {
          setMetrics({
            approvalRate: (typedMetrics.approvalRate as number) || 0,
            averageScore: (typedMetrics.averageScore as number) || 0,
            averageSubmissionDays: (typedMetrics.averageSubmissionDays as number) || 0,
          });
        } else {
          setMetrics({
            approvalRate: (typedStats.total as number) > 0
              ? Math.round(((typedStats.approved as number) / (typedStats.total as number)) * 100) : 0,
            averageScore: 0,
            averageSubmissionDays: 0,
          });
        }

        if (typedChart) setChartData(typedChart);
      } else {
        setApiError(true);
      }
    } catch {
      setApiError(true);
    }
    setIsLoading(false);
  }, [user?.id]);

  useAutoRefresh(() => { fetchData(false, currentPage); });

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchData(true, page);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6 animate-pulse max-w-full overflow-hidden">
        <div className="space-y-2">
          <div className="h-7 sm:h-8 w-48 sm:w-56 bg-muted rounded" />
          <div className="h-4 sm:h-5 w-60 sm:w-72 bg-muted rounded" />
        </div>
        <LoadingSkeleton variant="stats" count={5} className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="stat-card animate-pulse">
              <div className="h-48 bg-muted rounded" />
            </div>
          ))}
        </div>
        <LoadingSkeleton variant="list" count={3} className="space-y-3" />
      </div>
    );
  }

  const displayStats = stats || {
    total: 0, drafts: 0, submitted: 0, inReview: 0, approved: 0, rejected: 0, completionRate: 0,
  };

  const displayMetrics = metrics || {
    approvalRate: 0, averageScore: 0, averageSubmissionDays: 0,
  };

  const pieData = [
    { name: 'Borrador', value: displayStats.drafts, color: STATUS_COLORS.borrador },
    { name: 'Enviada', value: displayStats.submitted, color: STATUS_COLORS.enviada },
    { name: 'En Evaluación', value: displayStats.inReview, color: STATUS_COLORS.en_evaluacion },
    { name: 'Aprobada', value: displayStats.approved, color: STATUS_COLORS.aprobada },
    { name: 'Rechazada', value: displayStats.rejected, color: STATUS_COLORS.rechazada },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-2 sm:p-3 shadow-md text-xs sm:text-sm">
          <p className="font-medium text-foreground">{label}</p>
          {payload.map((entry: any, idx: number) => (
            <p key={idx} style={{ color: entry.color }} className="text-muted-foreground">
              {entry.name}: <span className="font-semibold">{entry.value}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 max-w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-fade-in">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground break-words">Panel del Proponente</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Estadísticas y rendimiento de tus propuestas académicas
          </p>
        </div>
        <Button
          className="gradient-primary text-white hover:opacity-90 w-full sm:w-auto shrink-0 transition-all duration-200 hover:scale-[1.02] text-sm sm:text-base"
          onClick={() => navigate('/proposals/new')}
        >
          <Plus className="h-4 w-4 mr-1.5 sm:mr-2" />
          Nueva Propuesta
        </Button>
      </div>

      {apiError && (
        <div className="flex items-start sm:items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs sm:text-sm animate-fade-in">
          <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 mt-0.5 sm:mt-0" />
          <span>No se pudieron cargar todos los datos. Mostrando información disponible.</span>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
        {[
          { title: 'Total', value: displayStats.total, icon: FileText, variant: 'primary' as const },
          { title: 'Enviadas', value: displayStats.submitted, icon: Send, variant: 'default' as const },
          { title: 'En Evaluación', value: displayStats.inReview, icon: Clock, variant: 'default' as const },
          { title: 'Aprobadas', value: displayStats.approved, icon: CheckCircle, variant: 'default' as const },
          { title: 'Rechazadas', value: displayStats.rejected, icon: XCircle, variant: 'destructive' as const },
        ].map((stat, index) => (
          <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
            <StatCard title={stat.title} value={stat.value} icon={stat.icon} variant={stat.variant} />
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {/* Donut - Estado */}
        <Card className="stat-card p-0 sm:col-span-1 animate-fade-in overflow-hidden" style={{ animationDelay: '200ms' }}>
          <CardHeader className="p-3 sm:p-4 pb-0">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
              Propuestas por Estado
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {pieData.length === 0 ? (
              <div className="flex items-center justify-center h-36 sm:h-44 text-xs text-muted-foreground">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Bar - Tipo */}
        <Card className="stat-card p-0 sm:col-span-1 animate-fade-in overflow-hidden" style={{ animationDelay: '250ms' }}>
          <CardHeader className="p-3 sm:p-4 pb-0">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500 shrink-0" />
              Propuestas por Tipo
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {!chartData?.proposalsByType?.length ? (
              <div className="flex items-center justify-center h-36 sm:h-44 text-xs text-muted-foreground">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData.proposalsByType} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.proposalsByType.map((_, idx) => (
                      <Cell key={idx} fill={TYPE_COLORS[idx % TYPE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar - Modalidad */}
        <Card className="stat-card p-0 sm:col-span-1 animate-fade-in overflow-hidden" style={{ animationDelay: '300ms' }}>
          <CardHeader className="p-3 sm:p-4 pb-0">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-cyan-500 shrink-0" />
              Propuestas por Modalidad
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {!chartData?.proposalsByModality?.length ? (
              <div className="flex items-center justify-center h-36 sm:h-44 text-xs text-muted-foreground">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={chartData.proposalsByModality}
                    cx="50%"
                    cy="50%"
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {chartData.proposalsByModality.map((_, idx) => (
                      <Cell key={idx} fill={MODALITY_COLORS[idx % MODALITY_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Area - Tendencia Mensual */}
        <Card className="stat-card p-0 sm:col-span-1 animate-fade-in overflow-hidden" style={{ animationDelay: '350ms' }}>
          <CardHeader className="p-3 sm:p-4 pb-0">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              Tendencia Mensual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 sm:p-4">
            {!chartData?.proposalsByMonth?.length ? (
              <div className="flex items-center justify-center h-36 sm:h-44 text-xs text-muted-foreground">Sin datos</div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData.proposalsByMonth} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCreadas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 8 }}
                    tickLine={false}
                    tickFormatter={(val) => {
                      const parts = val.split('-');
                      const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
                      return `${months[parseInt(parts[1]) - 1]}`;
                    }}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="creadas" stroke="#22c55e" fill="url(#colorCreadas)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Metrics + Recent Proposals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
        {/* Mini Metrics */}
        <div className="space-y-2 sm:space-y-3 animate-fade-in" style={{ animationDelay: '400ms' }}>
          <div className="stat-card flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-primary/10 shrink-0">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Tasa de Finalización</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">{displayStats.completionRate}%</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 shrink-0">
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Tasa de Aprobación</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">{displayMetrics.approvalRate}%</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 shrink-0">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Puntaje Promedio</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">{displayMetrics.averageScore}</p>
            </div>
          </div>
          <div className="stat-card flex items-center gap-2 sm:gap-3 p-3 sm:p-4">
            <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 shrink-0">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">Días Prom. de Envío</p>
              <p className="text-sm sm:text-base font-semibold text-foreground">{displayMetrics.averageSubmissionDays}</p>
            </div>
          </div>
        </div>

        {/* Recent Proposals */}
        <div className="stat-card p-3 sm:p-4 lg:p-6 lg:col-span-2 animate-fade-in min-w-0 overflow-hidden" style={{ animationDelay: '450ms' }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-foreground truncate">Propuestas Recientes</h3>
            <Button variant="ghost" size="sm" className="shrink-0 ml-2 text-xs h-8" onClick={() => navigate('/proposals/list')}>
              Ver todas
            </Button>
          </div>

          {recentProposals.length === 0 ? (
            <EmptyState
              title="Sin propuestas"
              description="Aún no has creado ninguna propuesta. ¡Comienza ahora!"
              action={{ label: 'Crear Propuesta', onClick: () => navigate('/proposals/new') }}
            />
          ) : (
            <div className="space-y-2">
              {recentProposals.map((proposal, index) => (
                <div
                  key={proposal.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-2 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-all duration-200 group gap-2 min-w-0 overflow-hidden"
                  style={{ animationDelay: `${(index + 5) * 50}ms` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] whitespace-nowrap">
                        {proposalTypeLabels[proposal.type as keyof typeof proposalTypeLabels] || proposal.type}
                      </Badge>
                      <Badge
                        variant={
                          proposal.status === 'aprobada' ? 'success' :
                          proposal.status === 'rechazada' ? 'error' :
                          proposal.status === 'en_evaluacion' ? 'warning' : 'secondary'
                        }
                        className="text-[10px] whitespace-nowrap"
                      >
                        {proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels] || proposal.status}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium text-foreground truncate">{proposal.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {proposal.code && <span className="font-mono mr-1.5">{proposal.code}</span>}
                      {new Date(proposal.updatedAt).toLocaleDateString('es-VE')}
                    </p>
                  </div>
                  <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/proposals/${proposal.id}`)}>
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Ver detalles</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/proposals/${proposal.id}/tracking`)}>
                          <TrendingUp className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Seguimiento</TooltipContent>
                    </Tooltip>
                    {(proposal.status === 'borrador' || proposal.status === 'en_evaluacion') && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate(`/proposals/${proposal.id}/edit`)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Editar</TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {totalItems} propuesta{totalItems !== 1 ? 's' : ''} — Pág. {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage <= 1} onClick={() => handlePageChange(currentPage - 1)}>
                  Anterior
                </Button>
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs" disabled={currentPage >= totalPages} onClick={() => handlePageChange(currentPage + 1)}>
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
