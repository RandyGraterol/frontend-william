import { useState, useEffect } from 'react';
import {
  Users, FileText, ClipboardCheck, UserCheck,
  TrendingUp, BarChart3, PieChart,
  AlertTriangle,
  BookOpen, Calendar, Layers, Box,
  Bell, Shield, Settings, Database,
  Award, Target, Download,
  Eye, Server, UserPlus,
  UserX, BookMarked,
  FolderOpen, HelpCircle, ListTodo, Building,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RePieChart, Pie, Cell, Legend, AreaChart, Area,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { StatCard } from '@/components/StatCard';
import { LoadingSkeleton } from '@/components/shared';
import { api } from '@/lib/api';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#06b6d4'];
const STATUS_COLORS: Record<string, string> = {
  borrador: '#9ca3af',
  enviada: '#3b82f6',
  en_evaluacion: '#f59e0b',
  aprobada: '#22c55e',
  rechazada: '#ef4444',
  convertida: '#8b5cf6',
};
const STATUS_LABELS: Record<string, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  en_evaluacion: 'En Evaluación',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
  convertida: 'Convertida',
};
const TYPE_LABELS: Record<string, string> = {
  curso: 'Curso',
  taller: 'Taller',
  diplomado: 'Diplomado',
};
const ROLE_LABELS: Record<string, string> = {
  proponente: 'Proponente',
  evaluador: 'Evaluador',
  administrador: 'Administrador',
  facilitador: 'Facilitador',
  coordinador: 'Coordinador',
};
const ROLE_COLORS: Record<string, string> = {
  proponente: '#3b82f6',
  evaluador: '#22c55e',
  administrador: '#ef4444',
  facilitador: '#f59e0b',
  coordinador: '#8b5cf6',
};
const SEVERITY_COLORS: Record<string, string> = {
  alta: '#ef4444',
  media: '#f59e0b',
  baja: '#3b82f6',
};
const EVAL_STATUS_COLORS: Record<string, string> = {
  pendiente: '#9ca3af',
  en_progreso: '#f59e0b',
  completada: '#22c55e',
};
const RECOMMENDATION_COLORS: Record<string, string> = {
  aprobar: '#22c55e',
  rechazar: '#ef4444',
  revision: '#f59e0b',
};

function toArray(obj: Record<string, number> | undefined, labelMap?: Record<string, string>): { name: string; value: number }[] {
  if (!obj) return [];
  return Object.entries(obj)
    .filter(([k, v]) => k && k !== 'null' && v > 0)
    .map(([k, v]) => ({
      name: labelMap?.[k] || k,
      value: v,
    }));
}

function ChartCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-h-0 ${className}`}>{children}</div>;
}

export default function Admin() {
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [data, setData] = useState<Record<string, any>>({});
  const [trends, setTrends] = useState<Record<string, any>[]>([]);

  useEffect(() => {
    async function fetchAll() {
      setIsLoading(true);
      try {
        const [superRes, trendsRes] = await Promise.all([
          api.getSuperDashboard(),
          api.getAdminTrends(),
        ]);
        setData((superRes as any)?.data || {});
        const td = (trendsRes as any)?.data || [];
        setTrends(Array.isArray(td) ? td : []);
        setApiError(false);
      } catch {
        setApiError(true);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAll();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-72 bg-muted rounded animate-pulse" />
          <div className="h-72 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  const d = data as Record<string, any>;
  const users = d.users || {};
  const proposals = d.proposals || {};
  const evaluations = d.evaluations || {};
  const workflow = d.workflow || {};
  const activities = d.activities || {};
  const sessions = d.sessions || {};
  const resources = d.resources || {};
  const reports = d.reports || {};
  const departments = d.departments || {};
  const goals = d.goals || {};
  const alerts = d.alerts || {};
  const notifications = d.notifications || {};
  const system = d.system || {};
  const parts = sessions.participants || {};

  const trendData = trends.length > 0 ? trends.map((t: any) => ({
    mes: t.month || t.mes || '',
    creadas: t.created || t.creadas || 0,
    aprobadas: t.approved || t.aprobadas || 0,
    rechazadas: t.rejected || t.rechazadas || 0,
  })) : [];

  const usersByRole = toArray(users.byRole, ROLE_LABELS);
  const proposalsByStatus = toArray(proposals.byStatus, STATUS_LABELS);
  const proposalsByType = toArray(proposals.byType, TYPE_LABELS);
  const evalByRecommendation = toArray(evaluations.byRecommendation);
  const activitiesByType = toArray(activities.byType, TYPE_LABELS);
  const activitiesByStatus = toArray(activities.byStatus);
  const resourcesByStatus = toArray(resources.byStatus);
  const alertsBySeverity = toArray(alerts.bySeverity);
  const alertsByStatus = toArray(alerts.byStatus);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="animate-fade-in space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard General</h1>
        <p className="text-xs sm:text-sm text-muted-foreground">Estadísticas completas de todos los módulos del sistema</p>
      </div>

      {apiError && (
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive animate-fade-in">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium">Error al cargar datos</p>
            <p className="text-destructive/80">Algunas estadísticas pueden no estar disponibles.</p>
          </div>
        </div>
      )}

      {/* Top stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 animate-fade-in">
        <StatCard title="Usuarios" value={users.total || 0} icon={Users} variant="primary" />
        <StatCard title="Propuestas" value={proposals.total || 0} icon={FileText} variant="default" />
        <StatCard title="Evaluaciones" value={evaluations.total || 0} icon={ClipboardCheck} variant="default" />
        <StatCard title="Actividades" value={activities.total || 0} icon={BookOpen} variant="default" />
        <StatCard title="Sesiones" value={sessions.total || 0} icon={Calendar} variant="default" />
        <StatCard title="Recursos" value={resources.total || 0} icon={Box} variant="default" />
        <StatCard title="Alertas" value={alerts.total || 0} icon={AlertTriangle} variant={alerts.total > 0 ? 'warning' : 'default'} />
        <StatCard title="Auditoría" value={system.auditLogs || 0} icon={Server} variant="default" />
      </div>

      {/* Row 1: Users + Proposals by status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Usuarios por Rol</CardTitle>
                <CardDescription className="truncate">{users.total} usuarios ({users.active} activos, {users.inactive} inactivos)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {usersByRole.length === 0 ? (
              <div className="h-48 sm:h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="w-full h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={usersByRole} cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={3} dataKey="value">
                      {usersByRole.map((_: any, i: number) => (
                        <Cell key={i} fill={Object.values(ROLE_COLORS)[i % Object.values(ROLE_COLORS).length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><UserPlus className="h-3 w-3 text-green-500 shrink-0" /> {users.newThisMonth || 0} nuevos</span>
              <span className="inline-flex items-center gap-1"><UserX className="h-3 w-3 text-red-500 shrink-0" /> {users.inactive || 0} inactivos</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Propuestas por Estado</CardTitle>
                <CardDescription className="truncate">{proposals.total} propuestas totales</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {proposalsByStatus.length === 0 ? (
              <div className="h-48 sm:h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="w-full h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={proposalsByStatus} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} className="text-muted-foreground" width={95} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {proposalsByStatus.map((entry: any) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[Object.keys(STATUS_LABELS).find(k => STATUS_LABELS[k] === entry.name) || ''] || '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><FileText className="h-3 w-3 text-blue-500 shrink-0" /> {proposals.newThisMonth || 0} nuevas</span>
              <span className="inline-flex items-center gap-1"><UserCheck className="h-3 w-3 text-purple-500 shrink-0" /> {proposals.evaluatorsAssigned || 0} evaluadores</span>
              <span className="inline-flex items-center gap-1"><FolderOpen className="h-3 w-3 text-amber-500 shrink-0" /> {proposals.documents || 0} docs</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 2: Monthly trends + Proposals by type */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Tendencia Mensual</CardTitle>
                <CardDescription className="truncate">Creadas vs aprobadas por mes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {trendData.length === 0 ? (
              <div className="h-48 sm:h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos de tendencia</div>
            ) : (
              <div className="w-full h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="colorCreadas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} /><stop offset="95%" stopColor="#3b82f6" stopOpacity={0} /></linearGradient>
                      <linearGradient id="colorAprobadas" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} /><stop offset="95%" stopColor="#22c55e" stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={35} />
                    <Tooltip />
                    <Area type="monotone" dataKey="creadas" stroke="#3b82f6" fill="url(#colorCreadas)" name="Creadas" strokeWidth={2} />
                    <Area type="monotone" dataKey="aprobadas" stroke="#22c55e" fill="url(#colorAprobadas)" name="Aprobadas" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Propuestas por Tipo</CardTitle>
                <CardDescription className="truncate">Distribución por tipo de propuesta</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {proposalsByType.length === 0 ? (
              <div className="h-48 sm:h-56 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="w-full h-48 sm:h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={proposalsByType} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {proposalsByType.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 3: Evaluations + Activities status + Activities type */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Evaluaciones</CardTitle>
                <CardDescription className="truncate">{evaluations.total || 0} total · Prom: {Number(evaluations.avgScore || 0).toFixed(1)} pts</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {Object.entries(evaluations.byStatus || {}).length === 0 ? (
              <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="space-y-2">
                {Object.entries(evaluations.byStatus || {}).map(([k, v]: any) => (
                  <div key={k} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: EVAL_STATUS_COLORS[k] || '#9ca3af' }} />
                    <span className="text-xs text-muted-foreground capitalize truncate">{k.replace(/_/g, ' ')}</span>
                    <span className="text-xs font-medium ml-auto">{v}</span>
                    <div className="w-12 sm:w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(v / (evaluations.total || 1)) * 100}%`, background: EVAL_STATUS_COLORS[k] || '#9ca3af' }} />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t mt-2">
                  <span>Criterios: {evaluations.criteria || 0}</span>
                  <span>Puntajes: {evaluations.scores || 0}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Actividades por Estado</CardTitle>
                <CardDescription className="truncate">{activities.total || 0} total · {activities.newThisMonth || 0} nuevas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {activitiesByStatus.length === 0 ? (
              <div className="h-40 sm:h-48 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="w-full h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={activitiesByStatus}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 10 }} className="text-muted-foreground" width={25} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {activitiesByStatus.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Layers className="h-3 w-3 shrink-0" /> {activities.modules || 0} módulos</span>
              <span className="inline-flex items-center gap-1"><BookMarked className="h-3 w-3 shrink-0" /> {proposals.objectives || 0} objetivos</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Actividades por Tipo</CardTitle>
                <CardDescription className="truncate">Distribución por tipo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {activitiesByType.length === 0 ? (
              <div className="h-40 sm:h-48 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="w-full h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={activitiesByType} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                      {activitiesByType.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Sessions + Resources + Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Sesiones y Participantes</CardTitle>
                <CardDescription className="truncate">{sessions.total || 0} sesiones · {sessions.thisMonth || 0} este mes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {parts.total > 0 ? (
              <div className="w-full h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={[
                      { name: 'Presentes', value: parts.present || 0 },
                      { name: 'Ausentes', value: parts.absent || 0 },
                      { name: 'Justificados', value: parts.justified || 0 },
                    ].filter(p => p.value > 0)} cx="50%" cy="50%" innerRadius={25} outerRadius={50} paddingAngle={3} dataKey="value">
                      <Cell fill="#22c55e" />
                      <Cell fill="#ef4444" />
                      <Cell fill="#f59e0b" />
                    </Pie>
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">Sin participantes registrados</div>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Users className="h-3 w-3 text-green-500 shrink-0" /> {parts.present || 0}</span>
              <span className="inline-flex items-center gap-1"><UserX className="h-3 w-3 text-red-500 shrink-0" /> {parts.absent || 0}</span>
              <span className="inline-flex items-center gap-1"><HelpCircle className="h-3 w-3 text-amber-500 shrink-0" /> {parts.justified || 0}</span>
              <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3 shrink-0" /> {sessions.evidences || 0} evids</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Box className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Recursos</CardTitle>
                <CardDescription className="truncate">{resources.total || 0} registrados</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {resourcesByStatus.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="space-y-2">
                {resourcesByStatus.map((r: any) => (
                  <div key={r.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: r.name === 'disponible' ? '#22c55e' : r.name === 'agotado' ? '#ef4444' : r.name === 'bajo' ? '#f59e0b' : '#9ca3af' }} />
                    <span className="text-xs capitalize text-muted-foreground truncate flex-1">{r.name}</span>
                    <span className="text-xs font-medium">{r.value}</span>
                    <div className="w-12 sm:w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                      <div className="h-full rounded-full" style={{ width: `${(r.value / (resources.total || 1)) * 100}%`, background: r.name === 'disponible' ? '#22c55e' : r.name === 'agotado' ? '#ef4444' : r.name === 'bajo' ? '#f59e0b' : '#9ca3af' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Box className="h-3 w-3 shrink-0" /> {resources.activityAssignments || 0} asignaciones</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Alertas</CardTitle>
                <CardDescription className="truncate">{alerts.total || 0} en el sistema</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {alertsBySeverity.length === 0 && alertsByStatus.length === 0 ? (
              <div className="h-36 flex items-center justify-center text-sm text-muted-foreground">Sin alertas</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Por severidad</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['alta', 'media', 'baja'].map(s => (
                      <div key={s} className="p-2 rounded-lg bg-muted/50 text-center">
                        <p className="text-base sm:text-lg font-bold" style={{ color: SEVERITY_COLORS[s] }}>{alerts.bySeverity?.[s] || 0}</p>
                        <p className="text-[10px] uppercase text-muted-foreground truncate">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Por estado</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(alerts.byStatus || {}).map(([k, v]: any) => (
                      <span key={k} className="text-[10px] sm:text-xs px-2 py-1 rounded-full bg-muted">
                        {k}: <strong>{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Row 5: Mini cards (Goals, Reports, Departments, Notifications) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">Metas</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{goals.total || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{goals.departmentGoals || 0} departamentales, {goals.progressRecords || 0} progresos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">Reportes</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{reports.history || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{reports.scheduled?.total || 0} programados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">Departamentos</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{departments.total || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{departments.activityAssignments || 0} asignaciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">Notificaciones</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{notifications.total || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{notifications.unread || 0} sin leer · {notifications.globalActive || 0} globales</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 6: Mini cards (Workflow, Config, KPIs, Audit) + Bottom charts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-fade-in">
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">Workflow</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{workflow.steps || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{workflow.templates || 0} plantillas · {workflow.templateSteps || 0} pasos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">Configuración</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{system.settings || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">{system.userPreferences || 0} preferencias</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">KPIs</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{system.kpis || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Indicadores clave</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary shrink-0" />
              <CardTitle className="text-xs">Auditoría</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6 pt-0">
            <p className="text-xl sm:text-2xl font-bold">{system.auditLogs || 0}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Eventos registrados</p>
          </CardContent>
        </Card>
      </div>

      {/* Row 7: Evaluation recommendations + System summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in">
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Recomendaciones de Evaluación</CardTitle>
                <CardDescription className="truncate">Distribución de recomendaciones emitidas</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            {evalByRecommendation.length === 0 ? (
              <div className="h-40 sm:h-48 flex items-center justify-center text-sm text-muted-foreground">Sin datos</div>
            ) : (
              <div className="w-full h-40 sm:h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={evalByRecommendation}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" width={25} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {evalByRecommendation.map((entry: any) => (
                        <Cell key={entry.name} fill={RECOMMENDATION_COLORS[entry.name?.toLowerCase()] || '#9ca3af'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2 px-3 sm:px-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary shrink-0" />
              <div className="min-w-0">
                <CardTitle className="text-sm sm:text-base truncate">Resumen del Sistema</CardTitle>
                <CardDescription className="truncate">Totales generales de todos los módulos</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="grid grid-cols-2 xs:grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { label: 'Propuestas', value: proposals.total, icon: FileText },
                { label: 'Evaluaciones', value: evaluations.total, icon: ClipboardCheck },
                { label: 'Actividades', value: activities.total, icon: BookOpen },
                { label: 'Sesiones', value: sessions.total, icon: Calendar },
                { label: 'Usuarios', value: users.total, icon: Users },
                { label: 'Recursos', value: resources.total, icon: Box },
                { label: 'Alertas', value: alerts.total, icon: AlertTriangle },
                { label: 'Auditoría', value: system.auditLogs, icon: Server },
                { label: 'Departamentos', value: departments.total, icon: Building },
                { label: 'Metas', value: goals.total, icon: Target },
                { label: 'Reportes', value: reports.history, icon: Download },
                { label: 'Notificaciones', value: notifications.total, icon: Bell },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-lg bg-muted/30">
                  <item.icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">{item.label}</p>
                    <p className="text-xs sm:text-sm font-bold">{item.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
