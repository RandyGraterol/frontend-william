import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, LayoutGrid, FileText, ClipboardCheck, BarChart3, Ban } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { translateApiError } from '@/lib/utils';

const features = [
  { icon: FileText, text: 'Gestión de propuestas académicas' },
  { icon: ClipboardCheck, text: 'Evaluación y seguimiento de proyectos' },
  { icon: BarChart3, text: 'Indicadores y reportes en tiempo real' },
];

const DESACTIVATED_MSG = 'Tu cuenta ha sido desactivada por el administrador';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeactivatedModal, setShowDeactivatedModal] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Completa todos los campos');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await login(email, password);
      const role = result?.role;
      if (role === 'evaluador') {
        navigate('/evaluator/dashboard', { replace: true });
      } else if (role === 'administrador') {
        navigate('/admin', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      const msg = translateApiError(err);
      if (msg === DESACTIVATED_MSG) {
        setShowDeactivatedModal(true);
      } else {
        setError(msg);
      }
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
          <h1 className="text-3xl font-bold text-white mb-2">Sistema de Propuestas UNERG</h1>
          <p className="text-white/80 text-base leading-relaxed max-w-md">
            Plataforma integral para la gestión, evaluación y seguimiento de propuestas académicas del Vicerrectorado.
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
            <h2 className="text-2xl font-bold text-foreground">Iniciar Sesión</h2>
            <p className="text-muted-foreground mt-1">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="py-2.5 text-sm">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium">Correo Electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@unerg.edu.ve"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="email"
                  className="h-11 pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isSubmitting}
                  autoComplete="current-password"
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

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Ingresando...</>
              ) : (
                <><ArrowRight className="h-4 w-4 mr-2" /> Ingresar</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">Registrarse</Link>
            </p>
          </div>

          <p className="text-center text-xs text-muted-foreground/60 mt-8">
            © 2026 UNERG — Vicerrectorado
          </p>
        </div>
      </div>

      <Dialog open={showDeactivatedModal} onOpenChange={setShowDeactivatedModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10 mb-2">
              <Ban className="h-7 w-7 text-destructive" />
            </div>
            <DialogTitle className="text-center text-xl">Cuenta Desactivada</DialogTitle>
            <DialogDescription className="text-center text-base pt-1">
              Tu cuenta ha sido desactivada por el administrador del sistema.
              No puedes iniciar sesión hasta que un administrador la reactive.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center pb-2">
            <Button onClick={() => setShowDeactivatedModal(false)} className="w-full sm:w-auto">
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
