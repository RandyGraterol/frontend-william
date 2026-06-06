import { useState, useEffect } from 'react';
import { ExternalLink, Calendar, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface Activity {
  id: string;
  name: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  progress: number;
  sessionsCount: number;
  participantCount: number;
}

const typeLabels: Record<string, string> = {
  curso: 'Curso',
  taller: 'Taller',
  diplomado: 'Diplomado',
};

const statusColors: Record<string, string> = {
  por_iniciar: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  en_curso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  completado: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
};

const CRISTOPHER_URL = import.meta.env.VITE_CRISTOPHER_URL || 'http://localhost:5174';

export default function FacilitatorDashboard() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(false);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await api.getMyActivities();
        if (response.success && response.data) {
          setActivities(response.data as unknown as Activity[]);
        }
      } catch {
        setApiError(true);
      } finally {
        setIsLoading(false);
      }
    };
    fetchActivities();
  }, []);

  const stats = {
    total: activities.length,
    enCurso: activities.filter(a => a.status === 'en_curso').length,
    completadas: activities.filter(a => a.status === 'completado').length,
    porIniciar: activities.filter(a => a.status === 'por_iniciar').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Hola, {user?.name}
          </h1>
          <p className="text-muted-foreground">
            Panel de Facilitador - Sistema William
          </p>
        </div>
        <Button variant="default" asChild>
          <a href={CRISTOPHER_URL} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4 mr-2" />
            Ir al Sistema Cristopher
          </a>
        </Button>
      </div>

      {apiError && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-medium">Error al cargar actividades</p>
            <p className="text-destructive/80">No se pudieron obtener tus actividades asignadas.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actividades</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Curso</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">{stats.enCurso}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <Calendar className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completadas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Iniciar</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.porIniciar}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mis Actividades</CardTitle>
          <CardDescription>
            Actividades asignadas como facilitador
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton variant="list" count={3} />
          ) : activities.length === 0 ? (
            <EmptyState
              icon={Calendar}
              title="No hay actividades"
              description="No tienes actividades asignadas como facilitador en el sistema William."
              action={{
                label: 'Ir al Dashboard Cristopher',
                onClick: () => window.open(`${CRISTOPHER_URL}/facilitador-dashboard`, '_blank'),
              }}
            />
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{activity.name}</span>
                      <Badge
                        className={statusColors[activity.status] || ''}
                        variant="secondary"
                      >
                        {activity.status === 'por_iniciar' ? 'Por Iniciar' :
                         activity.status === 'en_curso' ? 'En Curso' : 'Completado'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{typeLabels[activity.type] || activity.type}</span>
                      <span>{activity.sessionsCount || 0} sesiones</span>
                      <span>{activity.participantCount || 0} participantes</span>
                    </div>
                  </div>
                  {activity.progress != null && (
                    <div className="text-sm font-medium">
                      {activity.progress}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" />
            Sistema de Gestión de Actividades
          </CardTitle>
          <CardDescription>
            La gestión completa de actividades, sesiones, evidencias y participantes
            se realiza desde el Sistema Cristopher.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <a href={CRISTOPHER_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Sistema Cristopher
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href={`${CRISTOPHER_URL}/facilitador-dashboard`} target="_blank" rel="noopener noreferrer">
              Ir al Dashboard
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
