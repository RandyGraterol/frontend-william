import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ERROR_TRANSLATIONS: Record<string, string> = {
  'User already exists with this email': 'Ya existe un usuario con este correo electrónico',
  'Email already in use': 'El correo electrónico ya está en uso',
  'Email, password and name are required': 'Correo, contraseña y nombre son obligatorios',
  'Email and password are required': 'Correo y contraseña son obligatorios',
  'Invalid email or password': 'Correo electrónico o contraseña incorrectos',
  'Invalid credentials': 'Credenciales inválidas',
  'User not found': 'Usuario no encontrado',
  'Email is required': 'El correo electrónico es obligatorio',
  'Password is required': 'La contraseña es obligatoria',
  'Password must be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres',
  'New password must be at least 6 characters': 'La nueva contraseña debe tener al menos 6 caracteres',
  'Current password and new password are required': 'Contraseña actual y nueva son obligatorias',
  'Current password is incorrect': 'La contraseña actual es incorrecta',
  'No data to update': 'No hay datos para actualizar',
  'Unauthorized': 'No autorizado',
  'Forbidden': 'Acceso denegado',
  'Not found': 'No encontrado',
  'Internal server error': 'Error interno del servidor',
  'Token is required': 'Token requerido',
  'Invalid token': 'Token inválido',
  'Department not found': 'Departamento no encontrado',
  'Activity not found': 'Actividad no encontrada',
  'Notification not found': 'Notificación no encontrada',
  'Alert not found': 'Alerta no encontrada',
  'Goal not found': 'Meta no encontrada',
  'Resource not found': 'Recurso no encontrado',
  'Evaluation not found': 'Evaluación no encontrada',
  'Proposal not found': 'Propuesta no encontrada',
  'Session not found': 'Sesión no encontrada',
  'Evidence not found': 'Evidencia no encontrada',
  'Setting not found': 'Configuración no encontrada',
  'Evaluator ID required': 'ID del evaluador requerido',
  'Evaluator not found': 'Evaluador no encontrado',
  'Invalid preference type': 'Tipo de preferencia inválido',
  'Workflow template not found': 'Plantilla de flujo no encontrada',
  'No default workflow template found': 'No hay plantilla de flujo por defecto',
  'Scheduled report not found': 'Reporte programado no encontrado',
};

export function translateApiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return ERROR_TRANSLATIONS[message] || message;
}

export function getUserInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const ROLE_CONFIG: Record<string, { label: string; color: string }> = {
  proponente: { label: 'Proponente', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  evaluador: { label: 'Evaluador', color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
  administrador: { label: 'Administrador', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

export function getRoleLabel(role: string): string {
  return ROLE_CONFIG[role]?.label || role;
}

export function getRoleBadgeColor(role: string): string {
  return ROLE_CONFIG[role]?.color || 'bg-muted text-muted-foreground';
}
