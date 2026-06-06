import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'proponente' | 'evaluador' | 'administrador';
  department: string | null;
  avatar: string | null;
  dni?: string;
  phone?: string;
  location?: string;
  specialty?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ role: string }>;
  register: (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
    dni?: string;
    phone?: string;
    location?: string;
    specialty?: string;
  }) => Promise<{ role: string }>;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(() => {
    api.removeToken();
    setUser(null);
    toast({
      title: 'Sesión cerrada',
      description: 'Has cerrado sesión correctamente.',
    });
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      if (api.hasToken()) {
        try {
          const response = await api.getMe();
          if (response.success && response.data) {
            const userData: AuthUser = {
              id: response.data.id,
              email: response.data.email,
              name: response.data.name,
              role: response.data.role as AuthUser['role'],
              department: response.data.department,
              avatar: response.data.avatar,
              dni: response.data.dni,
              phone: response.data.phone,
              location: response.data.location,
              specialty: response.data.specialty,
            };
            setUser(userData);
          } else {
            api.removeToken();
          }
        } catch {
          api.removeToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login(email, password);
    if (response.token && response.user) {
      api.setToken(response.token);
      const userData: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as AuthUser['role'],
        department: response.user.department,
        avatar: response.user.avatar,
        dni: response.user.dni,
        phone: response.user.phone,
        location: response.user.location,
        specialty: response.user.specialty,
      };
      setUser(userData);
      toast({
        title: 'Inicio de sesión exitoso',
        description: `Bienvenido, ${userData.name}`,
      });
      return { role: userData.role };
    } else {
      throw new Error('Respuesta inválida del servidor');
    }
  }, []);

  const register = useCallback(async (data: {
    email: string;
    password: string;
    name: string;
    role?: string;
    department?: string;
    dni?: string;
    phone?: string;
    location?: string;
    specialty?: string;
  }) => {
    const response = await api.register(data);
    if (response.token && response.user) {
      api.setToken(response.token);
      const userData: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
        role: response.user.role as AuthUser['role'],
        department: response.user.department,
        avatar: null,
        dni: response.user.dni,
        phone: response.user.phone,
        location: response.user.location,
        specialty: response.user.specialty,
      };
      setUser(userData);
      toast({
        title: 'Registro exitoso',
        description: `Bienvenido, ${userData.name}`,
      });
      return { role: userData.role };
    } else {
      throw new Error('Respuesta inválida del servidor');
    }
  }, []);

  const updateUser = useCallback((data: Partial<AuthUser>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
