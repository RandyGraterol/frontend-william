import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronUp,
  ChevronDown,
  Save,
  X,
  ArrowLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSkeleton, EmptyState } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Objective {
  id: string;
  proposalId: string;
  objective: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export default function ProposalObjectives() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [proposalTitle, setProposalTitle] = useState('');
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [newObjective, setNewObjective] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  // Fetch proposal details and objectives
  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch proposal for title
        const propRes = await api.getProposal(id);
        if (propRes.success && propRes.data) {
          const p = propRes.data as Record<string, any>;
          setProposalTitle(p.title || 'Propuesta #' + id);
        }

        // Fetch objectives
        const objRes = await api.getObjectives(id);
        if (objRes.success && objRes.data) {
          setObjectives((objRes.data as unknown as Objective[]) || []);
        }
      } catch {
        toast({
          title: 'Error al cargar',
          description: 'No se pudieron cargar los objetivos.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [id]);

  // Add new objective
  const handleAdd = async () => {
    if (!newObjective.trim() || !id) return;

    setIsSaving(true);
    try {
      const res = await api.addObjective(id, {
        objective: newObjective.trim(),
        order: objectives.length + 1,
      });

      if (res.success && res.data) {
        setObjectives(prev => [...prev, res.data as unknown as Objective]);
        setNewObjective('');
        toast({
          title: 'Objetivo agregado',
          description: 'El objetivo se ha agregado correctamente.',
        });
      }
    } catch {
      toast({
        title: 'Error al agregar',
        description: 'No se pudo agregar el objetivo.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  // Start editing an objective
  const handleStartEdit = (obj: Objective) => {
    setEditingId(obj.id);
    setEditText(obj.objective);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  // Save edited objective
  const handleSaveEdit = async (objectiveId: string) => {
    if (!editText.trim()) return;

    setIsSaving(true);
    try {
      const res = await api.updateObjective(objectiveId, {
        objective: editText.trim(),
      });

      if (res.success && res.data) {
        setObjectives(prev =>
          prev.map(o => (o.id === objectiveId ? (res.data as unknown as Objective) : o))
        );
        setEditingId(null);
        setEditText('');
        toast({
          title: 'Objetivo actualizado',
          description: 'Los cambios se han guardado correctamente.',
        });
      }
    } catch {
      toast({
        title: 'Error al actualizar',
        description: 'No se pudo actualizar el objetivo.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  // Delete objective
  const handleDelete = async (objectiveId: string) => {
    setIsSaving(true);
    try {
      await api.deleteObjective(objectiveId);

      setObjectives(prev => prev.filter(o => o.id !== objectiveId));
      if (editingId === objectiveId) {
        setEditingId(null);
        setEditText('');
      }
      toast({
        title: 'Objetivo eliminado',
        description: 'El objetivo se ha eliminado correctamente.',
      });
    } catch {
      toast({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el objetivo.',
        variant: 'destructive',
      });
    }
    setIsSaving(false);
  };

  // Move objective up/down (reorder)
  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= objectives.length) return;

    const reordered = [...objectives];
    [reordered[index], reordered[newIndex]] = [reordered[newIndex], reordered[index]];

    // Update local state optimistically
    setObjectives(reordered);

    // Persist reorder to backend
    try {
      const orders = reordered.map((obj, i) => ({
        id: obj.id,
        order: i + 1,
      }));

      await api.reorderObjectives(id!, { orders: orders.map(o => ({ id: o.id, order: o.order })) });
    } catch {
      // Revert on error
      const reverted = [...reordered];
      [reverted[newIndex], reverted[index]] = [reverted[index], reverted[newIndex]];
      setObjectives(reverted);

      toast({
        title: 'Error al reordenar',
        description: 'No se pudo guardar el nuevo orden.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-56 bg-muted rounded animate-pulse" />
            <div className="h-5 w-64 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <LoadingSkeleton variant="card" count={1} />
        <LoadingSkeleton variant="list" count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="page-title">Objetivos de Propuesta</h1>
            <p className="page-subtitle line-clamp-1">{proposalTitle}</p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm px-3 py-1 whitespace-nowrap">
          {objectives.length} objetivo{objectives.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      {/* Add Objective Form */}
      <Card className="animate-fade-in">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-4 w-4 text-primary" />
            Agregar Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Textarea
              value={newObjective}
              onChange={(e) => setNewObjective(e.target.value)}
              placeholder="Escribe el objetivo de la propuesta..."
              className="resize-none min-h-[80px] flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleAdd();
                }
              }}
            />
            <Button
              onClick={handleAdd}
              disabled={!newObjective.trim() || isSaving}
              className="shrink-0 self-start gradient-primary text-white hover:opacity-90"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-1" />
                  Agregar
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Presiona Ctrl+Enter para agregar rápidamente
          </p>
        </CardContent>
      </Card>

      {/* Objectives List */}
      {objectives.length === 0 ? (
        <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <EmptyState
            title="Sin objetivos"
            description="Aún no se han agregado objetivos a esta propuesta. Usa el formulario de arriba para agregar el primero."
            action={{
              label: 'Agregar Objetivo',
              onClick: () => {
                document.querySelector('textarea')?.focus();
              },
            }}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {objectives.map((obj, index) => {
            const isEditing = editingId === obj.id;
            const isFirst = index === 0;
            const isLast = index === objectives.length - 1;

            return (
              <div
                key={obj.id}
                className={cn(
                  'stat-card flex items-start gap-3 animate-fade-in transition-all duration-200',
                  isEditing && 'ring-2 ring-primary/50 shadow-md',
                )}
                style={{ animationDelay: `${(index + 1) * 50}ms` }}
              >
                {/* Order number */}
                <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {obj.order || index + 1}
                  </span>
                </div>

                {/* Objective content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div className="space-y-3">
                      <Textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="resize-none min-h-[80px]"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(obj.id)}
                          disabled={!editText.trim() || isSaving}
                          className="gradient-primary text-white hover:opacity-90"
                        >
                          <Save className="h-3.5 w-3.5 mr-1" />
                          Guardar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                          disabled={isSaving}
                        >
                          <X className="h-3.5 w-3.5 mr-1" />
                          Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-foreground whitespace-pre-wrap break-words">
                        {obj.objective}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(obj.createdAt).toLocaleDateString('es-VE', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </>
                  )}
                </div>

                {/* Action buttons */}
                {!isEditing && (
                  <div className="flex flex-col gap-1 shrink-0">
                    {/* Reorder buttons */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        disabled={isFirst}
                        onClick={() => handleMove(index, 'up')}
                        title="Mover arriba"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        disabled={isLast}
                        onClick={() => handleMove(index, 'down')}
                        title="Mover abajo"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </div>
                    {/* Edit / Delete */}
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        onClick={() => handleStartEdit(obj)}
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(obj.id)}
                        disabled={isSaving}
                        title="Eliminar"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Card */}
      {objectives.length > 0 && (
        <Card className="animate-fade-in bg-muted/30" style={{ animationDelay: `${(objectives.length + 2) * 50}ms` }}>
          <CardContent className="flex items-center gap-4 p-5">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-foreground text-sm">
                {objectives.length} objetivo{objectives.length !== 1 ? 's' : ''} definido{objectives.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Los objetivos se muestran en orden de prioridad. Puedes reorganizarlos usando los botones de flecha.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
