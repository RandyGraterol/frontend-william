import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Bell,
  ArrowLeft,
  Save,
  Loader2,
  AlertTriangle,
  Clock,
  BadgeCheck,
  Sparkles,
  Briefcase,
  ShieldCheck,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { LoadingSkeleton } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

// ============ TYPES ============

interface EvaluatorProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department?: string;
  expertise: string[];
  availability: string;
}

interface NotificationPrefs {
  newProposal: boolean;
  statusChange: boolean;
  evaluationComplete: boolean;
  deadlineReminder: boolean;
  emailDigest: boolean;
  digestFrequency?: string;
}

// ============ COMPONENT ============

export default function EvaluatorProfile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [profile, setProfile] = useState<EvaluatorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [apiError, setApiError] = useState(false);

  // Editable fields
  const [department, setDepartment] = useState('');
  const [notifPrefs, setNotifPrefs] = useState<NotificationPrefs>({
    newProposal: true,
    deadlineReminder: true,
    statusChange: true,
    evaluationComplete: true,
    emailDigest: false,
  });

  // Availability & Expertise states (UI-only until backend is implemented)
  const [isAvailable, setIsAvailable] = useState(true);
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  const [newExpertise, setNewExpertise] = useState('');

  // Fetch profile
  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const response = await api.getEvaluatorProfile() as unknown as EvaluatorProfile;
        if (response && response.id) {
          setProfile(response);
          setDepartment(response.department || '');
          setIsAvailable(response.availability === 'available');
          setExpertiseAreas(response.expertise || []);

          // Fetch real notification preferences from dedicated endpoint
          try {
            const prefsRes = await api.getNotificationPreferences(response.id);
            if (prefsRes.success && prefsRes.data) {
              const prefs = prefsRes.data as unknown as NotificationPrefs;
              setNotifPrefs({
                newProposal: prefs.newProposal ?? true,
                deadlineReminder: prefs.deadlineReminder ?? true,
                statusChange: prefs.statusChange ?? true,
                evaluationComplete: prefs.evaluationComplete ?? true,
                emailDigest: prefs.emailDigest ?? false,
              });
            }
          } catch {
            // Silently fall back to defaults
          }
        } else {
          throw new Error('Invalid profile data');
        }
      } catch {
        setApiError(true);
        toast({
          title: 'Error',
          description: 'No se pudo cargar el perfil del evaluador.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [toast, user]);

  // Save department
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const response = await api.updateEvaluatorProfile({ department }) as unknown as EvaluatorProfile;
      if (response && response.id) {
        setProfile(response);
        toast({
          title: 'Perfil actualizado',
          description: 'Los cambios se han guardado correctamente.',
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle availability (placeholder - backend field not in schema)
  const handleToggleAvailability = async () => {
    const newState = !isAvailable;
    // Optimistic update
    setIsAvailable(newState);
    try {
      await api.updateAvailability({ available: newState });
      toast({
        title: newState ? 'Disponible' : 'No disponible',
        description: newState
          ? 'Ahora estás disponible para nuevas evaluaciones.'
          : 'Has marcado tu estado como no disponible.',
      });
    } catch {
      // Revert on error
      setIsAvailable(!newState);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la disponibilidad. (Funcionalidad en desarrollo)',
        variant: 'destructive',
      });
    }
  };

  // Add expertise area (placeholder - backend field not in schema)
  const handleAddExpertise = async () => {
    const area = newExpertise.trim();
    if (!area || expertiseAreas.includes(area)) return;

    const updated = [...expertiseAreas, area];
    setExpertiseAreas(updated);
    setNewExpertise('');

    try {
      await api.updateExpertise({ areas: updated });
    } catch {
      // Revert
      setExpertiseAreas(expertiseAreas);
      toast({
        title: 'Error',
        description: 'No se pudo guardar el área de expertise. (Funcionalidad en desarrollo)',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveExpertise = async (area: string) => {
    const updated = expertiseAreas.filter(a => a !== area);
    setExpertiseAreas(updated);
    try {
      await api.updateExpertise({ areas: updated });
    } catch {
      setExpertiseAreas(expertiseAreas);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddExpertise();
    }
  };

  // ============ LOADING ============

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="space-y-2">
            <div className="h-8 w-56 bg-muted rounded" />
            <div className="h-5 w-40 bg-muted rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <LoadingSkeleton variant="card" count={1} />
          </div>
          <div className="lg:col-span-2 space-y-6">
            <LoadingSkeleton variant="card" count={2} />
          </div>
        </div>
      </div>
    );
  }

  // ============ ERROR ============

  if (apiError && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 animate-fade-in">
        <AlertTriangle className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Error al cargar perfil</h2>
        <p className="text-muted-foreground text-sm">
          No se pudo obtener la información del evaluador. Intente nuevamente.
        </p>
        <Button onClick={() => window.location.reload()}>
          Reintentar
        </Button>
      </div>
    );
  }

  const displayProfile = profile || {
    id: user?.id || '',
    name: user?.name || 'Evaluador',
    email: user?.email || '',
    department: '',
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'EV';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="page-title">Perfil del Evaluador</h1>
          <p className="page-subtitle">Gestiona tu información personal y preferencias</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Avatar & Summary */}
        <div className="space-y-6">
          {/* Profile Card */}
          <Card className="animate-fade-in">
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                <Avatar className="h-24 w-24 mb-4">
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(displayProfile.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-lg font-semibold text-foreground">{displayProfile.name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{displayProfile.email}</p>
                {displayProfile.department && (
                  <Badge variant="secondary" className="mt-2 text-xs">
                    <Building2 className="h-3 w-3 mr-1" />
                    {displayProfile.department}
                  </Badge>
                )}
                <Badge className="mt-2 bg-primary/10 text-primary border-primary/20 text-xs">
                  <BadgeCheck className="h-3 w-3 mr-1" />
                  Evaluador
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="animate-fade-in" style={{ animationDelay: '80ms' } as React.CSSProperties}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Estado
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Disponibilidad</span>
                <Badge
                  variant={isAvailable ? 'default' : 'secondary'}
                  className={cn(
                    'text-xs',
                    isAvailable && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  )}
                >
                  {isAvailable ? 'Disponible' : 'No disponible'}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Áreas de expertise</span>
                <Badge variant="outline" className="text-xs">
                  {expertiseAreas.length}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Navigation */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' } as React.CSSProperties}>
            <CardContent className="p-4 space-y-1">
              <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => navigate('/evaluator/dashboard')}>
                <Settings className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button variant="ghost" className="w-full justify-start text-sm" onClick={() => navigate('/evaluations')}>
                <ShieldCheck className="h-4 w-4 mr-2" />
                Mis Evaluaciones
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Editable Sections */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información Personal */}
          <Card className="animate-fade-in" style={{ animationDelay: '50ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre completo</Label>
                  <Input id="name" value={displayProfile.name} disabled className="bg-muted" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo electrónico</Label>
                  <Input id="email" value={displayProfile.email} disabled className="bg-muted" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento / Unidad</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="Ej: Ingeniería de Sistemas"
                />
                <p className="text-xs text-muted-foreground">
                  Actualiza el departamento al que perteneces.
                </p>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Disponibilidad */}
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Disponibilidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
                <div className="space-y-1">
                  <p className="font-medium text-foreground text-sm">Estado de disponibilidad</p>
                  <p className="text-xs text-muted-foreground">
                    {isAvailable
                      ? 'Estás visible para recibir nuevas asignaciones de evaluación.'
                      : 'No recibirás nuevas asignaciones hasta que actives tu disponibilidad.'}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {isAvailable ? 'Disponible' : 'No disponible'}
                  </span>
                  <Switch
                    checked={isAvailable}
                    onCheckedChange={handleToggleAvailability}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                La persistencia de disponibilidad estará disponible próximamente.
              </p>
            </CardContent>
          </Card>

          {/* Áreas de Expertise */}
          <Card className="animate-fade-in" style={{ animationDelay: '150ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Áreas de Expertise
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {expertiseAreas.length === 0 ? (
                  <p className="text-sm text-muted-foreground w-full py-2">
                    No has agregado áreas de expertise. Añade las áreas en las que te especializas.
                  </p>
                ) : (
                  expertiseAreas.map((area) => (
                    <Badge key={area} variant="secondary" className="text-xs py-1 px-3 gap-1 group">
                      {area}
                      <button
                        onClick={() => handleRemoveExpertise(area)}
                        className="ml-1 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        ×
                      </button>
                    </Badge>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newExpertise}
                  onChange={e => setNewExpertise(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ej: Inteligencia Artificial, Educación, ..."
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={handleAddExpertise}
                  disabled={!newExpertise.trim()}
                >
                  Agregar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertTriangle className="h-3 w-3 text-amber-500" />
                La persistencia de áreas de expertise estará disponible próximamente.
              </p>
            </CardContent>
          </Card>

          {/* Preferencias de Notificación */}
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' } as React.CSSProperties}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Preferencias de Notificación
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  id: 'newProposal',
                  label: 'Nuevas asignaciones',
                  description: 'Recibir correo cuando te asignen una nueva evaluación',
                  checked: notifPrefs.newProposal,
                },
                {
                  id: 'deadlineReminder',
                  label: 'Recordatorios de plazo',
                  description: 'Recibir correo cuando se acerque la fecha límite',
                  checked: notifPrefs.deadlineReminder,
                },
                {
                  id: 'statusChange',
                  label: 'Cambios de estado',
                  description: 'Notificar cuando cambie el estado de una propuesta',
                  checked: notifPrefs.statusChange,
                },
                {
                  id: 'evaluationComplete',
                  label: 'Evaluaciones completadas',
                  description: 'Notificar cuando un evaluador complete una evaluación',
                  checked: notifPrefs.evaluationComplete,
                },
              ].map((pref) => (
                <div key={pref.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="space-y-0.5">
                    <p className="font-medium text-foreground text-sm">{pref.label}</p>
                    <p className="text-xs text-muted-foreground">{pref.description}</p>
                  </div>
                  <Switch
                    checked={pref.checked}
                    onCheckedChange={(checked) => {
                      const previous = notifPrefs[pref.id as keyof NotificationPrefs];
                      // Optimistic update
                      setNotifPrefs(prev => ({ ...prev, [pref.id]: checked }));
                      // Persist to backend
                      api.updateNotificationPreferences(displayProfile.id, { [pref.id]: checked })
                        .then(() => {
                          toast({
                            title: checked ? 'Activado' : 'Desactivado',
                            description: `Preferencia "${pref.label}" actualizada.`,
                          });
                        })
                        .catch(() => {
                          // Revert on error
                          setNotifPrefs(prev => ({ ...prev, [pref.id]: previous }));
                          toast({
                            title: 'Error',
                            description: 'No se pudo guardar la preferencia.',
                            variant: 'destructive',
                          });
                        });
                    }}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
