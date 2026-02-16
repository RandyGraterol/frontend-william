import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Send } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Proposal, ProposalStatus, proposalTypeLabels, proposalStatusLabels } from '@/types/proposal';
import { cn } from '@/lib/utils';

interface ProposalCardProps {
  proposal: Proposal;
  onView?: () => void;
}

const statusConfig: Record<ProposalStatus, { 
  label: string; 
  icon: typeof CheckCircle;
  className: string;
}> = {
  borrador: { 
    label: 'Borrador', 
    icon: FileText,
    className: 'bg-muted text-muted-foreground'
  },
  enviada: { 
    label: 'Enviada', 
    icon: Send,
    className: 'bg-blue-100 text-blue-700'
  },
  en_evaluacion: { 
    label: 'En Evaluación', 
    icon: Clock,
    className: 'bg-amber-100 text-amber-700'
  },
  aprobada: { 
    label: 'Aprobada', 
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700'
  },
  rechazada: { 
    label: 'Rechazada', 
    icon: XCircle,
    className: 'bg-red-100 text-red-700'
  },
};

export function ProposalCard({ proposal, onView }: ProposalCardProps) {
  const status = statusConfig[proposal.status];
  const StatusIcon = status.icon;

  return (
    <div className="stat-card group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {proposalTypeLabels[proposal.type]}
            </Badge>
            <Badge className={cn('text-xs', status.className)}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {status.label}
            </Badge>
          </div>
          
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {proposal.title}
          </h3>
          
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {proposal.description}
          </p>

          <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
            <span>{proposal.submitter.name}</span>
            {proposal.duration && (
              <>
                <span>•</span>
                <span>{proposal.duration}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <span className="text-xs text-muted-foreground">
          Actualizado: {proposal.updatedAt.toLocaleDateString('es-VE')}
        </span>
        <Button variant="ghost" size="sm" onClick={onView}>
          Ver detalles
        </Button>
      </div>
    </div>
  );
}
