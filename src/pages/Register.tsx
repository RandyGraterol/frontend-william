import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Eye, EyeOff, Loader2, Mail, Lock, User, Building2, ShieldCheck, UserPlus, LayoutGrid, FileText, ClipboardCheck, BarChart3, ClipboardList, BookOpen, CreditCard, Phone, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/lib/api';
import { translateApiError } from '@/lib/utils';

const features = [
  { icon: FileText, text: 'Registra y gestiona tus propuestas' },
  { icon: ClipboardCheck, text: 'Evaluación y seguimiento de proyectos' },
  { icon: BarChart3, text: 'Acceso a indicadores de gestión' },
];

const USER_ROLES = [
  { value: 'proponente', label: 'Proponente', icon: ClipboardList },
  { value: 'evaluador', label: 'Evaluador', icon: BookOpen },
];

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    role: 'proponente',
    dni: '',
    phone: '',
    location: '',
    specialty: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingDepts, setLoadingDepts] = useState(true);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.getDepartments();
        if (res.success && Array.isArray(res.data)) {
          const active = (res.data as Array<Record<string, any>>).filter(d => d.isActive !== false);
          setDepartments(active.map(d => ({ id: d.id as string, name: d.name as string })));
        }
      } catch {
      } finally {
        setLoadingDepts(false);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (field: string, value: string) => {
    if (field === 'dni') {
      setFormData(prev => ({ ...prev, dni: value.replace(/[^0-9]/g, '') }));
    } else if (field === 'phone') {
      setFormData(prev => ({ ...prev, phone: value.replace(/[^0-9+\- ]/g, '') }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const { name, email, password, confirmPassword, dni, phone, location, specialty, department } = formData;

    const fieldErrors: string[] = [];
    if (!name.trim()) fieldErrors.push('nombre');
    if (!email.trim()) fieldErrors.push('correo');
    if (!password) fieldErrors.push('contraseña');
    if (!dni.trim()) fieldErrors.push('cédula');
    if (!phone.trim()) fieldErrors.push('teléfono');
    if (!location.trim()) fieldErrors.push('ubicación');
    if (!specialty.trim()) fieldErrors.push('especialidad');
    if (!department) fieldErrors.push('departamento');
    if (fieldErrors.length > 0) {
      setError(`Campos obligatorios: ${fieldErrors.join(', ')}`);
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await register({
        name,
        email,
        password,
        role: formData.role,
        department,
        dni,
        phone,
        location,
        specialty,
      });
      const role = result?.role;
      if (role === 'evaluador') {
        navigate('/evaluator/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(translateApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Info */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-12 flex-col gap-12">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-white blur-3xl" />
        </div>

        <div className="relative z-10 animate-in fade-in slide-in-from-left-8 duration-700">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/20 shadow-lg mb-6">
            <LayoutGrid className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Únete al Sistema de Propuestas</h1>
          <p className="text-white/80 text-base leading-relaxed max-w-md">
            Registra tu cuenta y accede a herramientas de gestión de propuestas académicas según tu rol.
          </p>
        </div>

        <div className="relative z-10 space-y-5 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-backwards">
          {features.map((f, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur-sm">
                <f.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{f.text}</p>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
        <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-8 duration-700 delay-150 fill-mode-backwards">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-foreground">Crear Cuenta</h2>
            <p className="text-muted-foreground mt-1">Regístrate como proponente o evaluador</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {error && (
              <Alert variant="destructive" className="py-2.5 text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm font-medium">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Dr. Juan Pérez"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@unerg.edu.ve"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="department" className="text-sm font-medium">Departamento</Label>
              <Select
                value={formData.department}
                onValueChange={(value) => handleChange('department', value)}
                disabled={isSubmitting}
              >
                <SelectTrigger className="h-11">
                  <Building2 className="h-4 w-4 text-muted-foreground mr-2" />
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="max-h-60">
                  {loadingDepts ? (
                    <SelectItem value="__loading__" disabled>Cargando departamentos...</SelectItem>
                  ) : departments.length === 0 ? (
                    <SelectItem value="__empty__" disabled>No hay departamentos disponibles</SelectItem>
                  ) : (
                    departments.map((dept) => (
                      <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="dni" className="text-sm font-medium">Cédula / DNI <span className="text-destructive">*</span></Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="dni"
                  type="text"
                  placeholder="12345678"
                  value={formData.dni}
                  onChange={(e) => handleChange('dni', e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm font-medium">Teléfono <span className="text-destructive">*</span></Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0412-1234567"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location" className="text-sm font-medium">Ubicación / Dirección <span className="text-destructive">*</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  type="text"
                  placeholder="San Juan de los Morros, Estado Guárico"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="specialty" className="text-sm font-medium">Especialidad <span className="text-destructive">*</span></Label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="specialty"
                  type="text"
                  placeholder="Ej: Desarrollo Web, Redes, Gestión de Proyectos"
                  value={formData.specialty}
                  onChange={(e) => handleChange('specialty', e.target.value)}
                  disabled={isSubmitting}
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tipo de Usuario</Label>
              <div className="grid grid-cols-2 gap-2">
                {USER_ROLES.map((role) => {
                  const RoleIcon = role.icon;
                  return (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => handleChange('role', role.value)}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2.5 text-sm font-medium transition-colors ${
                        formData.role === role.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-input bg-background text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <RoleIcon className="h-4 w-4 shrink-0" />
                      {role.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className="h-11 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">Confirmar Contraseña</Label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <Button type="submit" className="w-full h-11 mt-1" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creando cuenta...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" /> Crear Cuenta</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">Iniciar Sesión</Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            © 2026 UNERG — Vicerrectorado
          </p>
        </div>
      </div>
    </div>
  );
}
