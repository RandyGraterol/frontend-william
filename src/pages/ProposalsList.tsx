import { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Plus, Search, Filter, Eye, Edit, ArrowUpDown, ChevronLeft, ChevronRight, Trash2, ClipboardCheck } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { LoadingSkeleton, EmptyState, ConfirmDialog, MobileTableCard, MobileTableRow, MobileTableActions } from '@/components/shared';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { 
  ProposalStatus, 
  proposalStatusLabels, 
  proposalTypeLabels 
} from '@/types/proposal';

type SortField = 'id' | 'title' | 'type' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 5;

// Transform API proposal to the format expected by the component
const mapApiProposal = (p: Record<string, any>): Record<string, any> => ({
  ...p,
  // API uses `proposer`, mock uses `submitter` — make both available
  submitter: p.proposer || p.submitter,
  proposer: p.proposer || p.submitter,
  createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
  updatedAt: p.updatedAt ? new Date(p.updatedAt) : new Date(),
  submittedAt: p.submittedAt ? new Date(p.submittedAt) : undefined,
});

const statusBadgeVariant: Record<ProposalStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'error' | 'info'> = {
  borrador: 'secondary',
  enviada: 'info',
  en_evaluacion: 'warning',
  aprobada: 'success',
  rechazada: 'error',
};

export default function ProposalsList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  
  // Filters — initialize searchTerm from URL query param (from header search)
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [evaluatorFilter, setEvaluatorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  const [proposals, setProposals] = useState<Array<Record<string, any>>>([]);

  const fetchProposals = useCallback(async (showLoader = true) => {
    if (showLoader) setIsLoading(true);
    try {
      const params: { proposerId?: string } = {};
      if (user?.role === 'proponente' && user?.id) {
        params.proposerId = user.id;
      }
      const response = await api.getProposals(params);
      if (response.success && response.data) {
        let mapped = (response.data as Array<Record<string, any>>).map(mapApiProposal);
        if (user?.role !== 'proponente') {
          mapped = mapped.filter(p => p.status !== 'borrador');
        }
        setProposals(mapped);
      } else {
        throw new Error('Respuesta inválida');
      }
    } catch (err) {
      console.error('[ProposalsList] Error al obtener propuestas:', err instanceof Error ? err.message : err);
    }
    setIsLoading(false);
  }, [user?.role, user?.id]);

  // Auto-refresh on navigation and window focus
  useAutoRefresh(() => { fetchProposals(false); });

  // Pending toast from other pages (e.g. after proposal submission via query param)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('toast') === 'propuesta_enviada') {
      toast({
        title: 'Propuesta enviada',
        description: 'La propuesta ha sido enviada para evaluación.',
      });
      window.history.replaceState({}, '', '/proposals/list');
    }
  }, [toast]);

  const filteredProposals = useMemo(() => {
    let result = [...proposals];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.title.toLowerCase().includes(term) || 
        p.id.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(p => p.status === statusFilter);
    }

    if (typeFilter !== 'all') {
      result = result.filter(p => p.type === typeFilter);
    }

    // Evaluator filtering removed - available from API data

    if (dateFilter !== 'all') {
      const now = new Date();
      let daysAgo = 0;
      switch (dateFilter) {
        case '7days': daysAgo = 7; break;
        case '30days': daysAgo = 30; break;
        case '90days': daysAgo = 90; break;
      }
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      result = result.filter(p => new Date(p.createdAt) >= cutoffDate);
    }

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'id':
          comparison = a.id.localeCompare(b.id);
          break;
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [proposals, searchTerm, statusFilter, typeFilter, dateFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredProposals.length / ITEMS_PER_PAGE);
  const paginatedProposals = filteredProposals.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleFilterChange = (setter: (value: string) => void) => (value: string) => {
    setter(value);
    setCurrentPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleDeleteClick = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedProposalId || !user?.id) return;
    setIsDeleting(true);
    try {
      await api.deleteProposal(selectedProposalId, user.id);
      setProposals(prev => prev.filter(p => p.id !== selectedProposalId));
      toast({
        title: 'Propuesta eliminada',
        description: 'La propuesta ha sido eliminada correctamente.',
      });
    } catch {
      toast({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar la propuesta. Verifica que tengas permisos o que no tenga evaluaciones completadas.',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setSelectedProposalId(null);
    }
  };

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <TableHead 
      className="cursor-pointer select-none hover:bg-muted/70 transition-colors"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {children}
        <ArrowUpDown className={`h-4 w-4 ${sortField === field ? 'text-primary' : 'text-muted-foreground'}`} />
      </div>
    </TableHead>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-5 w-72 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-10 w-40 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-muted rounded animate-pulse" />
          ))}
        </div>
        <LoadingSkeleton variant="table" count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="page-title">Lista de Propuestas</h1>
            <p className="page-subtitle">
              {user?.role === 'proponente' ? 'Gestiona tus propuestas académicas' : user?.role === 'evaluador' ? 'Revisa y evalúa las propuestas académicas' : 'Gestiona y revisa todas las propuestas académicas'}
            </p>
        </div>
        {user?.role !== 'evaluador' && (
          <Button 
            className="gradient-primary text-white hover:opacity-90 w-full sm:w-auto transition-all duration-200 hover:scale-[1.02]"
            onClick={() => navigate('/proposals/new')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Nueva Propuesta
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="relative col-span-2 sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por ID o título..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10"
          />
        </div>

        <Select value={statusFilter} onValueChange={handleFilterChange(setStatusFilter)}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Estado" />
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

        <Select value={typeFilter} onValueChange={handleFilterChange(setTypeFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="curso">Curso</SelectItem>
            <SelectItem value="taller">Taller</SelectItem>
            <SelectItem value="diplomado">Diplomado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={dateFilter} onValueChange={handleFilterChange(setDateFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Fecha" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Todas las fechas</SelectItem>
            <SelectItem value="7days">Últimos 7 días</SelectItem>
            <SelectItem value="30days">Últimos 30 días</SelectItem>
            <SelectItem value="90days">Últimos 90 días</SelectItem>
          </SelectContent>
        </Select>

      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '150ms' }}>
        Mostrando {paginatedProposals.length} de {filteredProposals.length} propuestas
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4">
        {paginatedProposals.length > 0 ? (
          paginatedProposals.map((proposal, index) => (
            <MobileTableCard key={proposal.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[140px] sm:max-w-[200px]" title={proposal.id}>
                  {proposal.id}
                </span>
                <Badge variant={statusBadgeVariant[proposal.status as ProposalStatus] || 'secondary'} className="shrink-0 text-xs whitespace-nowrap">
                  {proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels] || proposal.status}
                </Badge>
              </div>
              <MobileTableRow label="Título">
                <span className="font-medium text-sm truncate max-w-[160px] sm:max-w-[250px]">{proposal.title}</span>
              </MobileTableRow>
              <MobileTableRow label="Tipo">
                <Badge variant="outline" className="text-xs">{proposalTypeLabels[proposal.type as keyof typeof proposalTypeLabels] || proposal.type}</Badge>
              </MobileTableRow>
              <MobileTableRow label="Fecha">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(proposal.createdAt), 'dd MMM yyyy', { locale: es })}
                </span>
              </MobileTableRow>
              <MobileTableActions>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/proposals/${proposal.id}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Ver detalle</TooltipContent>
                </Tooltip>
                {user?.role === 'evaluador' && ['enviada', 'en_evaluacion'].includes(proposal.status) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/evaluations/${proposal.id}`)}
                      >
                        <ClipboardCheck className="h-4 w-4 text-primary" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Evaluar</TooltipContent>
                  </Tooltip>
                )}
                {user?.role === 'proponente' && (proposal.status === 'borrador' || proposal.status === 'en_evaluacion') && (
                  <>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Editar</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(proposal.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Eliminar</TooltipContent>
                    </Tooltip>
                  </>
                )}
              </MobileTableActions>
            </MobileTableCard>
          ))
        ) : (
          <EmptyState
            title="No se encontraron propuestas"
            description="No hay propuestas que coincidan con los filtros aplicados."
            variant="search"
            action={{
              label: 'Limpiar filtros',
              onClick: () => {
                setSearchTerm('');
                setStatusFilter('all');
                setTypeFilter('all');
                setDateFilter('all');
              },
            }}
          />
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-lg border bg-card overflow-x-auto animate-fade-in" style={{ animationDelay: '200ms' }}>
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHeader field="id">ID</SortableHeader>
              <SortableHeader field="title">Título</SortableHeader>
              <SortableHeader field="type">Tipo</SortableHeader>
              <SortableHeader field="createdAt">Fecha</SortableHeader>
              <SortableHeader field="status">Estado</SortableHeader>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProposals.length > 0 ? (
              paginatedProposals.map((proposal) => (
                <TableRow key={proposal.id} className="transition-colors hover:bg-muted/50">
                  <TableCell className="font-mono text-xs max-w-[120px] truncate" title={proposal.id}>
                    {proposal.id}
                  </TableCell>
                  <TableCell className="font-medium max-w-[200px] xl:max-w-[300px] truncate">
                    {proposal.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {proposalTypeLabels[proposal.type as keyof typeof proposalTypeLabels] || proposal.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap text-sm">
                    {format(proposal.createdAt, 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[proposal.status as ProposalStatus] || 'secondary'} className="text-xs whitespace-nowrap text-center">
                      {proposalStatusLabels[proposal.status as keyof typeof proposalStatusLabels] || proposal.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => navigate(`/proposals/${proposal.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Ver detalle</TooltipContent>
                      </Tooltip>

                {user?.role === 'proponente' && (proposal.status === 'borrador' || proposal.status === 'en_evaluacion') && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => navigate(`/proposals/${proposal.id}/edit`)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Editar propuesta</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(proposal.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Eliminar propuesta</TooltipContent>
                          </Tooltip>
                        </>
                      )}
 
                      {user?.role === 'evaluador' && ['enviada', 'en_evaluacion'].includes(proposal.status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => navigate(`/evaluations/${proposal.id}`)}
                            >
                              <ClipboardCheck className="h-4 w-4 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Evaluar propuesta</TooltipContent>
                        </Tooltip>
                      )}

                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <EmptyState
                    title="No se encontraron propuestas"
                    description="No hay propuestas que coincidan con los filtros aplicados."
                    variant="search"
                    action={{
                      label: 'Limpiar filtros',
                      onClick: () => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                        setDateFilter('all');
                        setEvaluatorFilter('all');
                      },
                    }}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <p className="text-sm text-muted-foreground">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline ml-1">Anterior</span>
            </Button>
            <div className="hidden sm:flex gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let page: number;
                if (totalPages <= 5) {
                  page = i + 1;
                } else if (currentPage <= 3) {
                  page = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  page = totalPages - 4 + i;
                } else {
                  page = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8"
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            <span className="sm:hidden text-sm text-muted-foreground">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <span className="hidden sm:inline mr-1">Siguiente</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="¿Eliminar propuesta?"
        description="Esta acción no se puede deshacer. La propuesta será eliminada permanentemente del sistema."
        confirmLabel={isDeleting ? 'Eliminando...' : 'Eliminar'}
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        variant="danger"
      />
    </div>
  );
}
