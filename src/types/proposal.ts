// Status types
export type ProposalStatus = 
  | 'borrador' 
  | 'enviada' 
  | 'en_evaluacion' 
  | 'aprobada' 
  | 'rechazada';

export type ProposalType = 'curso' | 'taller' | 'diplomado';

export type UserRole = 'proponente' | 'evaluador' | 'administrador';

export type EvaluationStatus = 'pendiente' | 'en_progreso' | 'completada';

export type WorkflowStatus = 'pendiente' | 'en_progreso' | 'completado' | 'rechazado';

// User interface
export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
  avatar?: string;
}

// Score item for evaluation rubric
export interface ScoreItem {
  criterion: string;
  maxScore: number;
  score: number;
  comments?: string;
}

// Evaluation interface
export interface Evaluation {
  id: string;
  proposalId: string;
  evaluatorId: string;
  scores: ScoreItem[];
  comments: string;
  status: EvaluationStatus;
  recommendation?: 'aprobar' | 'rechazar' | 'revision';
  createdAt: Date;
  updatedAt: Date;
}

// Workflow step interface
export interface WorkflowStep {
  name: string;
  role: UserRole;
  status: WorkflowStatus;
  date: Date;
  comments?: string;
  userId?: string;
}

// Proposal interface
export interface Proposal {
  id: string;
  title: string;
  description: string;
  type: ProposalType;
  status: ProposalStatus;
  submitter: User;
  evaluators: User[];
  objectives?: string[];
  duration?: string;
  targetAudience?: string;
  methodology?: string;
  workflowHistory: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
}

// Dashboard statistics
export interface DashboardStats {
  totalProposals: number;
  pending: number;
  inEvaluation: number;
  approved: number;
  rejected: number;
}

// Type labels for display
export const proposalTypeLabels: Record<ProposalType, string> = {
  curso: 'Curso',
  taller: 'Taller',
  diplomado: 'Diplomado',
};

export const proposalStatusLabels: Record<ProposalStatus, string> = {
  borrador: 'Borrador',
  enviada: 'Enviada',
  en_evaluacion: 'En Evaluación',
  aprobada: 'Aprobada',
  rechazada: 'Rechazada',
};

export const userRoleLabels: Record<UserRole, string> = {
  proponente: 'Proponente',
  evaluador: 'Evaluador',
  administrador: 'Administrador',
};
