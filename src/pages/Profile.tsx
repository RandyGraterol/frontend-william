import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Loader2, User, Mail, Shield, Building2, Lock, Save, Eye, EyeOff, CheckCircle2, Pencil, X, UserCheck, Phone, MapPin, CreditCard, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { getUserInitials, getRoleLabel, getRoleBadgeColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';



export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  // Edit profile state
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [editDni, setEditDni] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editSpecialty, setEditSpecialty] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.getDepartments();
        if (res.success && Array.isArray(res.data)) {
          const active = (res.data as Array<Record<string, any>>).filter(d => d.isActive !== false);
          setDepartments(active.map(d => ({ id: d.id as string, name: d.name as string })));
        }
      } catch {
        // Silently fail
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, []);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const startEditing = () => {
    setEditName(user.name);
    setEditEmail(user.email);
    setEditDepartment(user.department || '');
    setEditDni(user.dni || '');
    setEditPhone(user.phone || '');
    setEditLocation(user.location || '');
    setEditSpecialty(user.specialty || '');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setError('');
  };

  const handleSaveProfile = async () => {
    setError('');
    if (!editName.trim() || !editEmail.trim()) {
      setError('Nombre y correo son obligatorios');
      return;
    }
    setSavingProfile(true);
    try {
      await api.updateProfile({
        name: editName.trim(),
        email: editEmail.trim(),
        department: editDepartment || null,
        dni: editDni.trim() || null,
        phone: editPhone.trim() || null,
        location: editLocation.trim() || null,
        specialty: editSpecialty.trim() || null,
      });
      updateUser({
        name: editName.trim(),
        email: editEmail.trim(),
        department: editDepartment || null,
        dni: editDni.trim() || null,
        phone: editPhone.trim() || null,
        location: editLocation.trim() || null,
        specialty: editSpecialty.trim() || null,
      });
      setEditing(false);
      toast({ title: 'Perfil actualizado', description: 'Tus datos han sido guardados correctamente.' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Completa todos los campos');
      return;
    }
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada exitosamente.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar la contraseña');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-1 sm:px-0">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Avatar className="h-16 w-16 shrink-0 ring-4 ring-primary/10">
          {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {getUserInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">{user.name}</h1>
          <p className="text-muted-foreground text-sm truncate">{user.email}</p>
        </div>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div>                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <User className="h-5 w-5 text-primary shrink-0" />
                      Información Personal
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">Tus datos registrados en el sistema</CardDescription>
          </div>
          {!editing ? (
            <Button variant="outline" size="sm" onClick={startEditing} className="shrink-0 gap-1.5">
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          ) : null}
        </CardHeader>
        <CardContent>
          {editing ? (
            <div className="space-y-4">
              {error && (
                <Alert variant="destructive" className="py-2.5 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="editName">Nombre</Label>
                  <Input id="editName" value={editName} onChange={(e) => setEditName(e.target.value)} disabled={savingProfile} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editEmail">Correo Electrónico</Label>
                  <Input id="editEmail" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} disabled={savingProfile} className="h-11" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editDni">Cédula / DNI</Label>
                  <Input id="editDni" value={editDni} onChange={(e) => setEditDni(e.target.value)} disabled={savingProfile} className="h-11" placeholder="V12345678" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="editPhone">Teléfono</Label>
                  <Input id="editPhone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} disabled={savingProfile} className="h-11" placeholder="0412-1234567" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="editLocation">Ubicación / Dirección</Label>
                  <Input id="editLocation" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} disabled={savingProfile} className="h-11" placeholder="San Juan de los Morros, Estado Guárico" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="editSpecialty">Especialidad</Label>
                  <Input id="editSpecialty" value={editSpecialty} onChange={(e) => setEditSpecialty(e.target.value)} disabled={savingProfile} className="h-11" placeholder="Ej: Desarrollo Web, Redes, Gestión de Proyectos" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="editDepartment">Departamento</Label>
                  <Select value={editDepartment} onValueChange={setEditDepartment} disabled={savingProfile}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecciona un departamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingDepts ? (
                        <SelectItem value="__loading__" disabled>Cargando departamentos...</SelectItem>
                      ) : departments.length === 0 ? (
                        <SelectItem value="__empty__" disabled>No hay departamentos disponibles</SelectItem>
                      ) : (
                        departments.map((d) => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSaveProfile} disabled={savingProfile}>
                  {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Guardando...</> : <><Save className="h-4 w-4 mr-2" /> Guardar</>}
                </Button>
                <Button variant="outline" onClick={cancelEditing} disabled={savingProfile}>
                  <X className="h-4 w-4 mr-2" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Nombre</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.name}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Correo Electrónico</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Rol</Label>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium', getRoleBadgeColor(user.role))}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cédula / DNI</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.dni || 'No registrado'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Teléfono</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.phone || 'No registrado'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Ubicación / Dirección</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.location || 'No registrado'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Especialidad</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <BookOpen className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.specialty || 'No registrado'}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Departamento</Label>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate">{user.department || 'No asignado'}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary shrink-0" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">Actualiza tu contraseña de acceso al sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5 text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="currentPassword"
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Separator />

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <CheckCircle2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Actualizando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Cambiar Contraseña</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
