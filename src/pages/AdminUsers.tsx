import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Save,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LoadingSkeleton } from '@/components/shared';
import { toast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

const mockUsersFallback = [
  { id: "1", name: "Juan García", email: "juan@ejemplo.com", role: "administrador", status: "active", phone: "", dni: "", location: "", specialty: "" },
  { id: "2", name: "María López", email: "maria@ejemplo.com", role: "evaluador", status: "active", phone: "", dni: "", location: "", specialty: "" },
  { id: "3", name: "Carlos Ruiz", email: "carlos@ejemplo.com", role: "proponente", status: "inactive", phone: "", dni: "", location: "", specialty: "" },
  { id: "4", name: "Ana Martínez", email: "ana@ejemplo.com", role: "evaluador", status: "active", phone: "", dni: "", location: "", specialty: "" },
];

function mapApiUser(u: Record<string, any>) {
  return {
    id: u.id,
    name: u.nombre || u.name || 'Sin nombre',
    email: u.email || '',
    role: u.rol || u.role || 'proponente',
    status: u.estado || (u.isActive ? 'active' : 'inactive'),
    phone: u.telefono || u.phone || '',
    dni: u.dni || '',
    location: u.ubicacion || u.location || '',
    specialty: u.especialidad || u.specialty || '',
    department: u.departamento || u.department || '',
  };
}

function getStatusText(user: { status?: string }) {
  return user.status === "active" || user.status === "activo" ? "Activo" : "Inactivo";
}

function getStatusBadgeVariant(status: string) {
  return status === "active" || status === "activo" ? "default" : "outline";
}

function getRoleBadgeVariant(role: string) {
  switch (role) {
    case "admin":
    case "administrador":
      return "destructive";
    case "evaluator":
    case "evaluador":
      return "default";
    case "proponente":
    case "facilitador":
    case "coordinador":
    default:
      return "secondary";
  }
}

function getRoleLabel(role: string) {
  switch (role) {
    case "admin":
    case "administrador":  return "Administrador";
    case "evaluator":
    case "evaluador":      return "Evaluador";
    case "proponente":     return "Proponente";
    case "facilitador":    return "Facilitador";
    case "coordinador":    return "Coordinador";
    default:               return role || "Sin rol";
  }
}

function UserFormFields({ values, onChange, departments, specialties, errors }: {
  values: Record<string, any>;
  onChange: (key: string, value: string) => void;
  departments: string[];
  specialties: string[];
  errors?: Record<string, string>;
}) {
  const roles = ['administrador', 'evaluador', 'proponente', 'facilitador', 'coordinador'];
  const allRoles = values.rol && !roles.includes(values.rol)
    ? [values.rol, ...roles]
    : roles;
  const allDepts = values.departamento && !departments.includes(values.departamento)
    ? [values.departamento, ...departments]
    : departments;
  const allSpecs = values.especialidad && !specialties.includes(values.especialidad)
    ? [values.especialidad, ...specialties]
    : specialties;

  const roleLabels: Record<string, string> = {
    administrador: 'Administrador',
    evaluador: 'Evaluador',
    proponente: 'Proponente',
    facilitador: 'Facilitador',
    coordinador: 'Coordinador',
  };

  const handleInputChange = (field: string, raw: string) => {
    if (field === 'telefono') {
      onChange(field, raw.replace(/[^0-9+\- ]/g, ''));
    } else if (field === 'dni') {
      onChange(field, raw.replace(/[^0-9]/g, ''));
    } else {
      onChange(field, raw);
    }
  };

  const Err = ({ field }: { field: string }) =>
    errors?.[field] ? <p className="text-xs text-destructive mt-1">{errors[field]}</p> : null;

  return (
    <div className="space-y-4 py-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="form-nombre">Nombre Completo <span className="text-destructive">*</span></Label>
          <Input id="form-nombre" placeholder="Juan García" value={values.nombre} onChange={e => handleInputChange('nombre', e.target.value)} className={errors?.nombre ? 'border-destructive' : ''} />
          <Err field="nombre" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-email">Correo Electrónico <span className="text-destructive">*</span></Label>
          <Input id="form-email" type="email" placeholder="juan@ejemplo.com" value={values.email} onChange={e => handleInputChange('email', e.target.value)} className={errors?.email ? 'border-destructive' : ''} />
          <Err field="email" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-rol">Rol <span className="text-destructive">*</span></Label>
        <Select value={values.rol} onValueChange={v => onChange('rol', v)}>
          <SelectTrigger className={errors?.rol ? 'border-destructive' : ''}>
            <SelectValue placeholder="Seleccionar rol" />
          </SelectTrigger>
          <SelectContent>
            {allRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r] || r}</SelectItem>)}
          </SelectContent>
        </Select>
        <Err field="rol" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="form-dni">Cédula / DNI <span className="text-destructive">*</span></Label>
          <Input id="form-dni" placeholder="12345678" value={values.dni} onChange={e => handleInputChange('dni', e.target.value)} className={errors?.dni ? 'border-destructive' : ''} />
          <Err field="dni" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-telefono">Teléfono <span className="text-destructive">*</span></Label>
          <Input id="form-telefono" placeholder="0412-1234567" value={values.telefono} onChange={e => handleInputChange('telefono', e.target.value)} className={errors?.telefono ? 'border-destructive' : ''} />
          <Err field="telefono" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="form-depto">Departamento <span className="text-destructive">*</span></Label>
          <Select value={values.departamento} onValueChange={v => onChange('departamento', v)}>
            <SelectTrigger className={errors?.departamento ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar departamento" />
            </SelectTrigger>
            <SelectContent>
              {allDepts.length === 0 ? (
                <SelectItem value="_loading" disabled>Cargando...</SelectItem>
              ) : (
                allDepts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)
              )}
            </SelectContent>
          </Select>
          <Err field="departamento" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="form-especialidad">Especialidad <span className="text-destructive">*</span></Label>
          <Select value={values.especialidad} onValueChange={v => onChange('especialidad', v)}>
            <SelectTrigger className={errors?.especialidad ? 'border-destructive' : ''}>
              <SelectValue placeholder="Seleccionar especialidad" />
            </SelectTrigger>
            <SelectContent>
              {allSpecs.length === 0 ? (
                <SelectItem value="_loading" disabled>Cargando...</SelectItem>
              ) : (
                allSpecs.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)
              )}
            </SelectContent>
          </Select>
          <Err field="especialidad" />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="form-ubicacion">Ubicación <span className="text-destructive">*</span></Label>
        <Input id="form-ubicacion" placeholder="San Juan de los Morros, Guárico" value={values.ubicacion} onChange={e => handleInputChange('ubicacion', e.target.value)} className={errors?.ubicacion ? 'border-destructive' : ''} />
        <Err field="ubicacion" />
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [isUsersLoading, setIsUsersLoading] = useState(true);
  const [users, setUsers] = useState<Array<Record<string, any>>>(mockUsersFallback);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ nombre: '', email: '', rol: 'proponente', departamento: '', telefono: '', dni: '', ubicacion: '', especialidad: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});
  const [editUser, setEditUser] = useState<Record<string, any>>({ id: '', nombre: '', email: '', rol: '', departamento: '', telefono: '', dni: '', ubicacion: '', especialidad: '', estado: '' });
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [departments, setDepartments] = useState<string[]>([]);
  const [specialties, setSpecialties] = useState<string[]>([]);

  useEffect(() => {
    api.getDepartments().then((res: any) => {
      if (Array.isArray(res)) setDepartments(res.map((d: any) => d.name || d).filter(Boolean));
      else if (res?.data && Array.isArray(res.data)) setDepartments(res.data.map((d: any) => d.name || d).filter(Boolean));
    }).catch(() => {});
    api.getAdminSpecialties().then((res: any) => {
      if (res?.success && Array.isArray(res.data)) setSpecialties(res.data);
    }).catch(() => {});
  }, []);

  const validateUser = (values: Record<string, any>): Record<string, string> => {
    const errs: Record<string, string> = {};
    if (!values.nombre?.trim()) errs.nombre = 'El nombre es obligatorio';
    else if (values.nombre.trim().length < 3) errs.nombre = 'Mínimo 3 caracteres';
    if (!values.email?.trim()) errs.email = 'El email es obligatorio';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) errs.email = 'Formato de email inválido';
    if (!values.rol) errs.rol = 'Selecciona un rol';
    if (!values.dni?.trim()) errs.dni = 'La cédula es obligatoria';
    else if (!/^\d{5,15}$/.test(values.dni)) errs.dni = 'Solo números (ej: 12345678)';
    if (!values.telefono?.trim()) errs.telefono = 'El teléfono es obligatorio';
    else if (!/^[\d\- +]{7,15}$/.test(values.telefono)) errs.telefono = 'Solo números y guiones';
    if (!values.departamento?.trim()) errs.departamento = 'Selecciona un departamento';
    if (!values.especialidad?.trim()) errs.especialidad = 'Selecciona una especialidad';
    if (!values.ubicacion?.trim()) errs.ubicacion = 'La ubicación es obligatoria';
    return errs;
  };

  const fetchUsers = useCallback(async () => {
    setIsUsersLoading(true);
    try {
      const res = await api.getAdminUsers();
      const responseData = res as Record<string, any>;
      if (responseData.success && Array.isArray(responseData.data)) {
        setUsers(responseData.data.map(mapApiUser));
      } else {
        throw new Error('Formato inesperado');
      }
    } catch {
      setUsers(mockUsersFallback);
      toast({ title: 'Usuarios', description: 'Mostrando datos de demostración — servidor no disponible', duration: 4000 });
    } finally {
      setIsUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async () => {
    const validationErrors = validateUser(newUser);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsCreating(true);
    try {
      const response = await api.createAdminUser(newUser as Record<string, unknown>);
      const userData = response.data as Record<string, any>;
      if (userData?.id) {
        setUsers(prev => [...prev, mapApiUser(userData)]);
        toast({ title: 'Usuario creado', description: `${userData.nombre || newUser.nombre} fue creado exitosamente` });
      }
      setIsUserDialogOpen(false);
      setNewUser({ nombre: '', email: '', rol: 'proponente', departamento: '', telefono: '', dni: '', ubicacion: '', especialidad: '' });
    } catch {
      const localUser = { id: `local-${Date.now()}`, name: newUser.nombre, email: newUser.email, role: newUser.rol, status: 'active', phone: newUser.telefono, dni: newUser.dni, location: newUser.ubicacion, specialty: newUser.especialidad };
      setUsers(prev => [...prev, localUser]);
      setIsUserDialogOpen(false);
      toast({ title: 'Usuario creado (local)', description: 'La API no estaba disponible, se guardó localmente' });
      setNewUser({ nombre: '', email: '', rol: 'proponente', departamento: '', telefono: '', dni: '', ubicacion: '', especialidad: '' });
    } finally {
      setIsCreating(false);
    }
  };

  const openEditDialog = (userItem: Record<string, any>) => {
    setEditErrors({});
    setEditUser({
      id: userItem.id,
      nombre: userItem.name || '',
      email: userItem.email || '',
      rol: userItem.role || 'proponente',
      departamento: userItem.department || '',
      telefono: userItem.phone || '',
      dni: userItem.dni || '',
      ubicacion: userItem.location || '',
      especialidad: userItem.specialty || '',
      estado: userItem.status === 'active' || userItem.status === 'activo' ? 'activo' : 'inactivo',
    });
    setIsEditDialogOpen(true);
  };

  const handleEditUser = async () => {
    const validationErrors = validateUser(editUser);
    setEditErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    setIsUpdating(true);
    try {
      const { id, ...data } = editUser;
      await api.updateAdminUser(id, data as Record<string, unknown>);
      setUsers(prev => prev.map(u => u.id === id ? {
        ...u,
        name: editUser.nombre,
        email: editUser.email,
        role: editUser.rol,
        status: editUser.estado === 'activo' ? 'active' : 'inactive',
        phone: editUser.telefono,
        dni: editUser.dni,
        location: editUser.ubicacion,
        specialty: editUser.especialidad,
        department: editUser.departamento,
      } : u));
      toast({ title: 'Usuario actualizado', description: `${editUser.nombre} fue actualizado exitosamente` });
      setIsEditDialogOpen(false);
    } catch {
      toast({ title: 'Error al actualizar', description: 'No se pudo actualizar el usuario', variant: 'destructive' });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await api.deleteAdminUser(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      toast({ title: 'Usuario eliminado' });
    } catch {
      setUsers(prev => prev.filter(u => u.id !== id));
      toast({ title: 'Usuario eliminado (local)', description: 'La API no estaba disponible' });
    }
  };

  const handleToggleUserActive = async (id: string, currentStatus: string) => {
    const isActive = !(currentStatus === 'active' || currentStatus === 'activo');
    try {
      await api.updateAdminUser(id, { estado: isActive ? 'activo' : 'inactivo' });
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive, status: isActive ? 'active' : 'inactive' } : u));
      toast({ title: isActive ? 'Usuario activado' : 'Usuario desactivado' });
    } catch {
      setUsers(prev => prev.map(u => u.id === id ? { ...u, isActive: !isActive, status: !isActive ? 'active' : 'inactive' } : u));
      toast({ title: 'Error al cambiar estado', variant: 'destructive' });
    }
  };



  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="page-title">Gestión de Usuarios</h1>
        <p className="page-subtitle">Administra usuarios y sus roles en el sistema</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-3 sm:px-6">
          <div className="min-w-0">
            <CardTitle className="text-sm sm:text-base truncate">Usuarios del Sistema</CardTitle>
            <CardDescription className="truncate">{users.length} usuarios registrados</CardDescription>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setIsUsersLoading(true); fetchUsers(); }}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={isUserDialogOpen} onOpenChange={(open) => { setIsUserDialogOpen(open); if (open) setErrors({}); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nuevo Usuario</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                  <DialogDescription>Añade un nuevo usuario al sistema</DialogDescription>
                </DialogHeader>
                <UserFormFields values={newUser} onChange={(k, v) => setNewUser(p => ({ ...p, [k]: v }))} departments={departments} specialties={specialties} errors={errors} />
                <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
                  <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
                  <Button onClick={handleCreateUser} disabled={isCreating} className="w-full sm:w-auto">
                    {isCreating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Crear Usuario
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6">
          {isUsersLoading ? (
            <LoadingSkeleton variant="table" count={4} />
          ) : (
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Nombre</TableHead>
                    <TableHead className="text-xs hidden sm:table-cell">Email</TableHead>
                    <TableHead className="text-xs hidden md:table-cell">Rol</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Cédula</TableHead>
                    <TableHead className="text-xs hidden xl:table-cell">Teléfono</TableHead>
                    <TableHead className="text-xs">Estado</TableHead>
                    <TableHead className="text-xs text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8 text-sm">
                        No hay usuarios registrados
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((userItem: Record<string, any>) => (
                      <TableRow key={userItem.id}>
                        <TableCell>
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-none">{userItem.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate sm:hidden max-w-[120px]">{userItem.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm">{userItem.email}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant={getRoleBadgeVariant(userItem.role)} className="text-[10px] sm:text-xs">
                            {getRoleLabel(userItem.role)}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{userItem.dni || '—'}</TableCell>
                        <TableCell className="hidden xl:table-cell text-xs text-muted-foreground">{userItem.phone || '—'}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(userItem.status)} className="text-[10px] sm:text-xs">
                            {getStatusText(userItem)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right whitespace-nowrap">
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => openEditDialog(userItem)}>
                            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8"
                            onClick={() => handleToggleUserActive(userItem.id, userItem.status || (userItem.isActive ? 'active' : 'inactive'))}
                            title={userItem.isActive !== false ? 'Desactivar' : 'Activar'}
                          >
                            {userItem.isActive !== false ? (
                              <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-amber-500" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                            )}
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleDeleteUser(userItem.id)}>
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditDialogOpen} onOpenChange={(open) => { setIsEditDialogOpen(open); if (open) setEditErrors({}); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>Actualiza los datos del usuario</DialogDescription>
          </DialogHeader>
                <UserFormFields values={editUser} onChange={(k, v) => setEditUser(p => ({ ...p, [k]: v }))} departments={departments} specialties={specialties} errors={editErrors} />
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">Cancelar</Button>
            <Button onClick={handleEditUser} disabled={isUpdating} className="w-full sm:w-auto">
              {isUpdating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              <Save className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Guardar Cambios</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}