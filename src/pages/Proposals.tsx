import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ProposalCard } from '@/components/ProposalCard';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { proposals } from '@/data/mockData';

export default function Proposals() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const filteredProposals = proposals.filter((proposal) => {
    const matchesSearch = proposal.title
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || proposal.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="h-10 flex-1 bg-muted rounded animate-pulse" />
          <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        </div>
        <LoadingSkeleton variant="card" count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-title">Mis Propuestas</h1>
          <p className="page-subtitle">
            Gestiona tus propuestas académicas
          </p>
        </div>
        <Button 
          className="gradient-primary text-white hover:opacity-90 w-full sm:w-auto transition-all duration-200 hover:scale-[1.02]"
          onClick={() => navigate('/proposals/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Propuesta
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar propuestas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="enviada">Enviada</SelectItem>
            <SelectItem value="en_evaluacion">En Evaluación</SelectItem>
            <SelectItem value="aprobada">Aprobada</SelectItem>
            <SelectItem value="rechazada">Rechazada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Proposals Grid */}
      {filteredProposals.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProposals.map((proposal, index) => (
            <div 
              key={proposal.id} 
              className="animate-fade-in"
              style={{ animationDelay: `${(index + 2) * 50}ms` }}
            >
              <ProposalCard
                proposal={proposal}
                onView={() => navigate(`/proposals/${proposal.id}`)}
              />
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No se encontraron propuestas"
          description={
            searchTerm || statusFilter !== 'all'
              ? "No hay propuestas que coincidan con los filtros aplicados."
              : "Aún no has creado ninguna propuesta. ¡Comienza creando una!"
          }
          variant={searchTerm || statusFilter !== 'all' ? 'search' : 'default'}
          action={
            searchTerm || statusFilter !== 'all'
              ? {
                  label: 'Limpiar filtros',
                  onClick: () => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  },
                }
              : {
                  label: 'Crear Propuesta',
                  onClick: () => navigate('/proposals/new'),
                }
          }
        />
      )}
    </div>
  );
}
