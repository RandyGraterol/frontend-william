import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardCheck, Clock, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/StatCard';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { evaluations, proposals, getUserById } from '@/data/mockData';

export default function Evaluations() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const pendingEvaluations = evaluations
    .filter(e => e.status !== 'completada')
    .map(evaluation => {
      const proposal = proposals.find(p => p.id === evaluation.proposalId);
      const evaluator = getUserById(evaluation.evaluatorId);
      return {
        ...evaluation,
        proposal,
        evaluator,
      };
    })
    .filter(e => e.proposal);

  const completedCount = evaluations.filter(e => e.status === 'completada').length;
  const pendingCount = evaluations.filter(e => e.status === 'pendiente').length;
  const inProgressCount = evaluations.filter(e => e.status === 'en_progreso').length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="h-5 w-64 bg-muted rounded animate-pulse" />
        </div>
        <LoadingSkeleton variant="stats" count={3} className="sm:grid-cols-3" />
        <div className="space-y-2">
          <div className="h-6 w-48 bg-muted rounded animate-pulse" />
        </div>
        <LoadingSkeleton variant="list" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-fade-in">
        <h1 className="page-title">Evaluaciones</h1>
        <p className="page-subtitle">
          Revisa y evalúa las propuestas asignadas
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { title: "Pendientes", value: pendingCount + inProgressCount, icon: Clock, variant: 'primary' as const },
          { title: "Completadas", value: completedCount, icon: CheckCircle, variant: 'default' as const },
          { title: "Total Asignadas", value: evaluations.length, icon: ClipboardCheck, variant: 'default' as const },
        ].map((stat, index) => (
          <div 
            key={stat.title} 
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <StatCard
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              variant={stat.variant}
            />
          </div>
        ))}
      </div>

      {/* Pending Evaluations */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          Evaluaciones Pendientes
        </h2>
        
        {pendingEvaluations.length === 0 ? (
          <EmptyState
            title="Sin evaluaciones pendientes"
            description="¡Excelente! No tienes evaluaciones pendientes por realizar."
            variant="inbox"
          />
        ) : (
          <div className="space-y-4">
            {pendingEvaluations.slice(0, 5).map((evaluation, index) => (
              <div
                key={evaluation.id}
                className="stat-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in transition-all duration-200 hover:shadow-md"
                style={{ animationDelay: `${(index + 4) * 50}ms` }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge
                      variant={evaluation.status === 'pendiente' ? 'destructive' : 'secondary'}
                    >
                      {evaluation.status === 'pendiente' ? 'Pendiente' : 'En Progreso'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-foreground">
                    {evaluation.proposal?.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{evaluation.proposal?.submitter.name}</span>
                    <span className="hidden sm:inline">•</span>
                    <span>{evaluation.proposal?.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Creada: {evaluation.createdAt.toLocaleDateString('es-VE')}
                  </p>
                </div>
                <Button 
                  className="gradient-primary text-white hover:opacity-90 w-full sm:w-auto transition-all duration-200 hover:scale-[1.02]"
                  onClick={() => navigate(`/evaluations/${evaluation.proposalId}`)}
                >
                  Evaluar
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
