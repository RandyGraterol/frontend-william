import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Eye, Edit, GitBranch, ArrowUpDown, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
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
import { proposals, users } from '@/data/mockData';
import { 
  ProposalStatus, 
  proposalStatusLabels, 
  proposalTypeLabels 
} from '@/types/proposal';

type SortField = 'id' | 'title' | 'type' | 'createdAt' | 'status';
type SortDirection = 'asc' | 'desc';

const ITEMS_PER_PAGE = 5;

const statusBadgeVariant: Record<ProposalStatus, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'error' | 'info'> = {
  borrador: 'secondary',
  enviada: 'info',
  en_evaluacion: 'warning',
  aprobada: 'success',
  rechazada: 'error',
};

export default function ProposalsList() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [evaluatorFilter, setEvaluatorFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const evaluators = users.filter(u => u.role === 'evaluador');

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

    if (evaluatorFilter !== 'all') {
      result = result.filter(p => 
        p.evaluators.some(e => e.id === evaluatorFilter)
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      let daysAgo = 0;
      switch (dateFilter) {
        case '7days': daysAgo = 7; break;
        case '30days': daysAgo = 30; break;
        case '90days': daysAgo = 90; break;
      }
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
      result = result.filter(p => p.createdAt >= cutoffDate);
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
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [searchTerm, statusFilter, typeFilter, evaluatorFilter, dateFilter, sortField, sortDirection]);

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

  const handleDeleteConfirm = () => {
    console.log('Deleting proposal:', selectedProposalId);
    setDeleteDialogOpen(false);
    setSelectedProposalId(null);
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
            Gestiona y revisa todas las propuestas académicas
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
        <div className="relative sm:col-span-2 lg:col-span-1">
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

        <Select value={evaluatorFilter} onValueChange={handleFilterChange(setEvaluatorFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Evaluador" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Todos los evaluadores</SelectItem>
            {evaluators.map(evaluator => (
              <SelectItem key={evaluator.id} value={evaluator.id}>
                {evaluator.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: '150ms' }}>
        Mostrando {paginatedProposals.length} de {filteredProposals.length} propuestas
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden space-y-4">
        {paginatedProposals.length > 0 ? (
          paginatedProposals.map((proposal, index) => (
            <MobileTableCard key={proposal.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` } as React.CSSProperties}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">{proposal.id}</span>
                <Badge variant={statusBadgeVariant[proposal.status]}>
                  {proposalStatusLabels[proposal.status]}
                </Badge>
              </div>
              <MobileTableRow label="Título">
                <span className="font-medium text-sm truncate max-w-[200px]">{proposal.title}</span>
              </MobileTableRow>
              <MobileTableRow label="Tipo">
                <Badge variant="outline">{proposalTypeLabels[proposal.type]}</Badge>
              </MobileTableRow>
              <MobileTableRow label="Fecha">
                <span className="text-sm text-muted-foreground">
                  {format(proposal.createdAt, 'dd MMM yyyy', { locale: es })}
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
                {proposal.status === 'borrador' && (
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
                setEvaluatorFilter('all');
              },
            }}
          />
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block rounded-lg border bg-card animate-fade-in" style={{ animationDelay: '200ms' }}>
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
                  <TableCell className="font-mono text-sm">{proposal.id}</TableCell>
                  <TableCell className="font-medium max-w-[250px] truncate">
                    {proposal.title}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {proposalTypeLabels[proposal.type]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(proposal.createdAt, 'dd MMM yyyy', { locale: es })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant[proposal.status]}>
                      {proposalStatusLabels[proposal.status]}
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

                      {proposal.status === 'borrador' && (
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

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => console.log('Ver workflow', proposal.id)}
                          >
                            <GitBranch className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Seguir workflow</TooltipContent>
                      </Tooltip>
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
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        onConfirm={handleDeleteConfirm}
        variant="danger"
      />
    </div>
  );
}
