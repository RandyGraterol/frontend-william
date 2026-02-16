import { 
  User, 
  Proposal, 
  Evaluation, 
  WorkflowStep, 
  DashboardStats 
} from '@/types/proposal';

// ============ USERS (5 usuarios) ============
export const users: User[] = [
  {
    id: 'user-1',
    name: 'Dr. María González',
    email: 'maria.gonzalez@unerg.edu.ve',
    role: 'proponente',
    department: 'Ingeniería de Sistemas',
  },
  {
    id: 'user-2',
    name: 'Prof. Carlos Mendoza',
    email: 'carlos.mendoza@unerg.edu.ve',
    role: 'proponente',
    department: 'Educación',
  },
  {
    id: 'user-3',
    name: 'Dra. Ana Rodríguez',
    email: 'ana.rodriguez@unerg.edu.ve',
    role: 'evaluador',
    department: 'Ciencias',
  },
  {
    id: 'user-4',
    name: 'Dr. Luis Pérez',
    email: 'luis.perez@unerg.edu.ve',
    role: 'evaluador',
    department: 'Ingeniería',
  },
  {
    id: 'user-5',
    name: 'Ing. Roberto Martínez',
    email: 'roberto.martinez@unerg.edu.ve',
    role: 'administrador',
    department: 'Coordinación Académica',
  },
];

// Current logged-in user
export const currentUser: User = users[0];

// Helper to get user by ID
export const getUserById = (id: string): User | undefined => 
  users.find(u => u.id === id);

// ============ WORKFLOW HISTORIES ============
const workflowHistory1: WorkflowStep[] = [
  {
    name: 'Creación de propuesta',
    role: 'proponente',
    status: 'completado',
    date: new Date('2024-01-10'),
    userId: 'user-1',
  },
  {
    name: 'Envío para revisión',
    role: 'proponente',
    status: 'completado',
    date: new Date('2024-01-12'),
    userId: 'user-1',
  },
  {
    name: 'Asignación de evaluadores',
    role: 'administrador',
    status: 'completado',
    date: new Date('2024-01-13'),
    userId: 'user-5',
  },
  {
    name: 'Evaluación técnica',
    role: 'evaluador',
    status: 'completado',
    date: new Date('2024-01-18'),
    userId: 'user-3',
    comments: 'Propuesta bien estructurada',
  },
  {
    name: 'Aprobación final',
    role: 'administrador',
    status: 'completado',
    date: new Date('2024-01-20'),
    userId: 'user-5',
  },
];

const workflowHistory2: WorkflowStep[] = [
  {
    name: 'Creación de propuesta',
    role: 'proponente',
    status: 'completado',
    date: new Date('2024-01-15'),
    userId: 'user-2',
  },
  {
    name: 'Envío para revisión',
    role: 'proponente',
    status: 'completado',
    date: new Date('2024-01-16'),
    userId: 'user-2',
  },
  {
    name: 'Asignación de evaluadores',
    role: 'administrador',
    status: 'completado',
    date: new Date('2024-01-17'),
    userId: 'user-5',
  },
  {
    name: 'Evaluación técnica',
    role: 'evaluador',
    status: 'en_progreso',
    date: new Date('2024-01-19'),
    userId: 'user-4',
  },
];

const workflowHistory3: WorkflowStep[] = [
  {
    name: 'Creación de propuesta',
    role: 'proponente',
    status: 'completado',
    date: new Date('2024-01-08'),
    userId: 'user-1',
  },
  {
    name: 'Envío para revisión',
    role: 'proponente',
    status: 'completado',
    date: new Date('2024-01-09'),
    userId: 'user-1',
  },
  {
    name: 'Asignación de evaluadores',
    role: 'administrador',
    status: 'completado',
    date: new Date('2024-01-10'),
    userId: 'user-5',
  },
  {
    name: 'Evaluación técnica',
    role: 'evaluador',
    status: 'completado',
    date: new Date('2024-01-14'),
    userId: 'user-3',
    comments: 'No cumple con requisitos mínimos',
  },
  {
    name: 'Decisión final',
    role: 'administrador',
    status: 'rechazado',
    date: new Date('2024-01-15'),
    userId: 'user-5',
    comments: 'Requiere reestructuración completa',
  },
];

// ============ PROPOSALS (10 propuestas) ============
export const proposals: Proposal[] = [
  {
    id: 'prop-1',
    title: 'Diplomado en Inteligencia Artificial Aplicada',
    description: 'Programa de formación avanzada en técnicas de IA y Machine Learning orientado a profesionales del área tecnológica.',
    type: 'diplomado',
    status: 'aprobada',
    submitter: users[0],
    evaluators: [users[2], users[3]],
    objectives: [
      'Formar profesionales en técnicas de IA',
      'Desarrollar proyectos aplicados',
      'Certificar competencias técnicas',
    ],
    duration: '6 meses',
    targetAudience: 'Ingenieros y profesionales de TI',
    methodology: 'Modalidad semipresencial con proyectos prácticos',
    workflowHistory: workflowHistory1,
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    submittedAt: new Date('2024-01-12'),
  },
  {
    id: 'prop-2',
    title: 'Taller de Desarrollo Web Moderno',
    description: 'Capacitación intensiva en tecnologías web actuales: React, Node.js y bases de datos.',
    type: 'taller',
    status: 'en_evaluacion',
    submitter: users[1],
    evaluators: [users[3]],
    objectives: [
      'Enseñar fundamentos de React',
      'Implementar APIs con Node.js',
      'Desplegar aplicaciones en la nube',
    ],
    duration: '40 horas',
    targetAudience: 'Estudiantes y desarrolladores junior',
    methodology: 'Taller práctico con ejercicios guiados',
    workflowHistory: workflowHistory2,
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-19'),
    submittedAt: new Date('2024-01-16'),
  },
  {
    id: 'prop-3',
    title: 'Curso de Metodologías Ágiles',
    description: 'Formación en Scrum, Kanban y prácticas ágiles para equipos de desarrollo.',
    type: 'curso',
    status: 'rechazada',
    submitter: users[0],
    evaluators: [users[2]],
    objectives: [
      'Comprender principios ágiles',
      'Aplicar Scrum en proyectos reales',
    ],
    duration: '20 horas',
    targetAudience: 'Líderes de proyectos y equipos',
    methodology: 'Clases teórico-prácticas',
    workflowHistory: workflowHistory3,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-15'),
    submittedAt: new Date('2024-01-09'),
  },
  {
    id: 'prop-4',
    title: 'Diplomado en Gestión de Proyectos',
    description: 'Programa integral de formación en gestión de proyectos bajo estándares PMI.',
    type: 'diplomado',
    status: 'enviada',
    submitter: users[1],
    evaluators: [],
    objectives: [
      'Dominar metodologías PMI',
      'Gestionar recursos y cronogramas',
      'Preparar para certificación PMP',
    ],
    duration: '4 meses',
    targetAudience: 'Gerentes y coordinadores de proyectos',
    methodology: 'Modalidad online con casos de estudio',
    workflowHistory: [
      {
        name: 'Creación de propuesta',
        role: 'proponente',
        status: 'completado',
        date: new Date('2024-01-20'),
        userId: 'user-2',
      },
      {
        name: 'Envío para revisión',
        role: 'proponente',
        status: 'completado',
        date: new Date('2024-01-21'),
        userId: 'user-2',
      },
    ],
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-21'),
    submittedAt: new Date('2024-01-21'),
  },
  {
    id: 'prop-5',
    title: 'Taller de Ciberseguridad Básica',
    description: 'Introducción a conceptos fundamentales de seguridad informática y protección de datos.',
    type: 'taller',
    status: 'borrador',
    submitter: users[0],
    evaluators: [],
    objectives: [
      'Identificar amenazas comunes',
      'Implementar medidas de protección básicas',
    ],
    duration: '16 horas',
    targetAudience: 'Personal administrativo y técnico',
    methodology: 'Talleres prácticos con simulaciones',
    workflowHistory: [
      {
        name: 'Creación de propuesta',
        role: 'proponente',
        status: 'en_progreso',
        date: new Date('2024-01-22'),
        userId: 'user-1',
      },
    ],
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'prop-6',
    title: 'Curso de Excel Avanzado',
    description: 'Capacitación en funciones avanzadas de Excel: macros, tablas dinámicas y automatización.',
    type: 'curso',
    status: 'aprobada',
    submitter: users[1],
    evaluators: [users[2], users[3]],
    objectives: [
      'Dominar funciones avanzadas',
      'Crear macros y automatizaciones',
      'Analizar datos con tablas dinámicas',
    ],
    duration: '24 horas',
    targetAudience: 'Personal administrativo',
    methodology: 'Clases prácticas en laboratorio',
    workflowHistory: [],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-18'),
    submittedAt: new Date('2024-01-06'),
  },
  {
    id: 'prop-7',
    title: 'Diplomado en Marketing Digital',
    description: 'Formación completa en estrategias de marketing digital, SEO, SEM y redes sociales.',
    type: 'diplomado',
    status: 'en_evaluacion',
    submitter: users[0],
    evaluators: [users[3]],
    objectives: [
      'Diseñar estrategias de marketing digital',
      'Gestionar campañas en redes sociales',
      'Optimizar presencia web',
    ],
    duration: '5 meses',
    targetAudience: 'Profesionales de marketing y comunicación',
    methodology: 'Modalidad virtual con proyectos reales',
    workflowHistory: [],
    createdAt: new Date('2024-01-18'),
    updatedAt: new Date('2024-01-23'),
    submittedAt: new Date('2024-01-19'),
  },
  {
    id: 'prop-8',
    title: 'Taller de Redacción Científica',
    description: 'Técnicas y normas para la redacción de artículos y documentos científicos.',
    type: 'taller',
    status: 'enviada',
    submitter: users[1],
    evaluators: [],
    objectives: [
      'Aplicar normas APA',
      'Estructurar documentos científicos',
      'Preparar artículos para publicación',
    ],
    duration: '12 horas',
    targetAudience: 'Docentes e investigadores',
    methodology: 'Taller con ejercicios de escritura',
    workflowHistory: [],
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-20'),
    submittedAt: new Date('2024-01-20'),
  },
  {
    id: 'prop-9',
    title: 'Curso de Liderazgo Organizacional',
    description: 'Desarrollo de habilidades de liderazgo y gestión de equipos de trabajo.',
    type: 'curso',
    status: 'borrador',
    submitter: users[0],
    evaluators: [],
    objectives: [
      'Desarrollar competencias de liderazgo',
      'Gestionar equipos de alto rendimiento',
    ],
    duration: '30 horas',
    targetAudience: 'Supervisores y gerentes',
    methodology: 'Sesiones interactivas con role-playing',
    workflowHistory: [],
    createdAt: new Date('2024-01-23'),
    updatedAt: new Date('2024-01-23'),
  },
  {
    id: 'prop-10',
    title: 'Taller de Innovación y Emprendimiento',
    description: 'Fomento del espíritu emprendedor y metodologías de innovación como Design Thinking.',
    type: 'taller',
    status: 'aprobada',
    submitter: users[1],
    evaluators: [users[2]],
    objectives: [
      'Aplicar metodología Design Thinking',
      'Desarrollar modelo de negocio Canvas',
      'Presentar pitch de proyectos',
    ],
    duration: '20 horas',
    targetAudience: 'Estudiantes y emprendedores',
    methodology: 'Bootcamp intensivo con mentores',
    workflowHistory: [],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-16'),
    submittedAt: new Date('2024-01-03'),
  },
];

// ============ EVALUATIONS (15 evaluaciones) ============
export const evaluations: Evaluation[] = [
  // Evaluaciones para prop-1 (Diplomado IA - Aprobada)
  {
    id: 'eval-1',
    proposalId: 'prop-1',
    evaluatorId: 'user-3',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 18, comments: 'Muy relevante para el contexto actual' },
      { criterion: 'Metodología', maxScore: 20, score: 17 },
      { criterion: 'Objetivos', maxScore: 20, score: 19, comments: 'Bien definidos y medibles' },
      { criterion: 'Recursos', maxScore: 20, score: 16 },
      { criterion: 'Impacto', maxScore: 20, score: 18 },
    ],
    comments: 'Excelente propuesta con gran potencial de impacto en la formación tecnológica regional.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'eval-2',
    proposalId: 'prop-1',
    evaluatorId: 'user-4',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 17 },
      { criterion: 'Metodología', maxScore: 20, score: 18, comments: 'Metodología innovadora' },
      { criterion: 'Objetivos', maxScore: 20, score: 18 },
      { criterion: 'Recursos', maxScore: 20, score: 15, comments: 'Revisar presupuesto de equipos' },
      { criterion: 'Impacto', maxScore: 20, score: 17 },
    ],
    comments: 'Propuesta sólida. Recomiendo revisar el presupuesto asignado a equipamiento.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-17'),
  },
  // Evaluaciones para prop-2 (Taller Web - En evaluación)
  {
    id: 'eval-3',
    proposalId: 'prop-2',
    evaluatorId: 'user-4',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 16 },
      { criterion: 'Metodología', maxScore: 20, score: 14 },
      { criterion: 'Objetivos', maxScore: 20, score: 15 },
      { criterion: 'Recursos', maxScore: 20, score: 0 },
      { criterion: 'Impacto', maxScore: 20, score: 0 },
    ],
    comments: 'Evaluación en progreso. Pendiente revisión de recursos e impacto.',
    status: 'en_progreso',
    createdAt: new Date('2024-01-19'),
    updatedAt: new Date('2024-01-19'),
  },
  // Evaluaciones para prop-3 (Curso Ágiles - Rechazada)
  {
    id: 'eval-4',
    proposalId: 'prop-3',
    evaluatorId: 'user-3',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 10, comments: 'Contenido muy básico' },
      { criterion: 'Metodología', maxScore: 20, score: 8, comments: 'Falta innovación pedagógica' },
      { criterion: 'Objetivos', maxScore: 20, score: 9 },
      { criterion: 'Recursos', maxScore: 20, score: 12 },
      { criterion: 'Impacto', maxScore: 20, score: 8, comments: 'Impacto limitado' },
    ],
    comments: 'La propuesta requiere una reestructuración significativa. Los contenidos son muy básicos para el público objetivo.',
    status: 'completada',
    recommendation: 'rechazar',
    createdAt: new Date('2024-01-11'),
    updatedAt: new Date('2024-01-14'),
  },
  // Evaluaciones para prop-6 (Excel - Aprobada)
  {
    id: 'eval-5',
    proposalId: 'prop-6',
    evaluatorId: 'user-3',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 19 },
      { criterion: 'Metodología', maxScore: 20, score: 18 },
      { criterion: 'Objetivos', maxScore: 20, score: 17 },
      { criterion: 'Recursos', maxScore: 20, score: 18 },
      { criterion: 'Impacto', maxScore: 20, score: 16 },
    ],
    comments: 'Curso muy necesario para el personal administrativo. Bien estructurado.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-12'),
  },
  {
    id: 'eval-6',
    proposalId: 'prop-6',
    evaluatorId: 'user-4',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 18 },
      { criterion: 'Metodología', maxScore: 20, score: 17 },
      { criterion: 'Objetivos', maxScore: 20, score: 18 },
      { criterion: 'Recursos', maxScore: 20, score: 16 },
      { criterion: 'Impacto', maxScore: 20, score: 17 },
    ],
    comments: 'Aprobado. Contenido práctico y aplicable.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-09'),
    updatedAt: new Date('2024-01-13'),
  },
  // Evaluaciones para prop-7 (Marketing Digital - En evaluación)
  {
    id: 'eval-7',
    proposalId: 'prop-7',
    evaluatorId: 'user-4',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 17 },
      { criterion: 'Metodología', maxScore: 20, score: 15 },
      { criterion: 'Objetivos', maxScore: 20, score: 16 },
      { criterion: 'Recursos', maxScore: 20, score: 0 },
      { criterion: 'Impacto', maxScore: 20, score: 0 },
    ],
    comments: 'En proceso de evaluación.',
    status: 'en_progreso',
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-23'),
  },
  // Evaluaciones para prop-10 (Innovación - Aprobada)
  {
    id: 'eval-8',
    proposalId: 'prop-10',
    evaluatorId: 'user-3',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 19 },
      { criterion: 'Metodología', maxScore: 20, score: 20, comments: 'Excelente enfoque práctico' },
      { criterion: 'Objetivos', maxScore: 20, score: 18 },
      { criterion: 'Recursos', maxScore: 20, score: 17 },
      { criterion: 'Impacto', maxScore: 20, score: 19 },
    ],
    comments: 'Propuesta innovadora y muy bien estructurada. Altamente recomendada.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-10'),
  },
  // Evaluaciones adicionales pendientes
  {
    id: 'eval-9',
    proposalId: 'prop-4',
    evaluatorId: 'user-3',
    scores: [],
    comments: '',
    status: 'pendiente',
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'eval-10',
    proposalId: 'prop-4',
    evaluatorId: 'user-4',
    scores: [],
    comments: '',
    status: 'pendiente',
    createdAt: new Date('2024-01-22'),
    updatedAt: new Date('2024-01-22'),
  },
  {
    id: 'eval-11',
    proposalId: 'prop-8',
    evaluatorId: 'user-3',
    scores: [],
    comments: '',
    status: 'pendiente',
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
  },
  {
    id: 'eval-12',
    proposalId: 'prop-8',
    evaluatorId: 'user-4',
    scores: [],
    comments: '',
    status: 'pendiente',
    createdAt: new Date('2024-01-21'),
    updatedAt: new Date('2024-01-21'),
  },
  // Más evaluaciones completadas históricas
  {
    id: 'eval-13',
    proposalId: 'prop-1',
    evaluatorId: 'user-3',
    scores: [
      { criterion: 'Viabilidad técnica', maxScore: 25, score: 22 },
      { criterion: 'Innovación', maxScore: 25, score: 23 },
      { criterion: 'Factibilidad económica', maxScore: 25, score: 20 },
      { criterion: 'Cronograma', maxScore: 25, score: 21 },
    ],
    comments: 'Segunda ronda de evaluación completada satisfactoriamente.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-16'),
    updatedAt: new Date('2024-01-18'),
  },
  {
    id: 'eval-14',
    proposalId: 'prop-6',
    evaluatorId: 'user-3',
    scores: [
      { criterion: 'Calidad del contenido', maxScore: 30, score: 27 },
      { criterion: 'Material didáctico', maxScore: 35, score: 32 },
      { criterion: 'Evaluación propuesta', maxScore: 35, score: 30 },
    ],
    comments: 'Revisión de materiales aprobada.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-16'),
  },
  {
    id: 'eval-15',
    proposalId: 'prop-10',
    evaluatorId: 'user-4',
    scores: [
      { criterion: 'Pertinencia', maxScore: 20, score: 18 },
      { criterion: 'Metodología', maxScore: 20, score: 19 },
      { criterion: 'Objetivos', maxScore: 20, score: 17 },
      { criterion: 'Recursos', maxScore: 20, score: 16 },
      { criterion: 'Impacto', maxScore: 20, score: 18 },
    ],
    comments: 'Evaluación complementaria positiva.',
    status: 'completada',
    recommendation: 'aprobar',
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-12'),
  },
];

// ============ DASHBOARD STATS ============
export const dashboardStats: DashboardStats = {
  totalProposals: proposals.length,
  pending: proposals.filter(p => p.status === 'enviada').length,
  inEvaluation: proposals.filter(p => p.status === 'en_evaluacion').length,
  approved: proposals.filter(p => p.status === 'aprobada').length,
  rejected: proposals.filter(p => p.status === 'rechazada').length,
};

// ============ PROPOSALS BY TYPE STATS ============
export const proposalsByType = {
  curso: proposals.filter(p => p.type === 'curso').length,
  taller: proposals.filter(p => p.type === 'taller').length,
  diplomado: proposals.filter(p => p.type === 'diplomado').length,
};

// ============ UPCOMING DEADLINES ============
export interface Deadline {
  id: string;
  title: string;
  proposalId: string;
  date: Date;
  type: 'evaluacion' | 'revision' | 'entrega';
}

export const upcomingDeadlines: Deadline[] = [
  {
    id: 'deadline-1',
    title: 'Evaluación - Taller Desarrollo Web',
    proposalId: 'prop-2',
    date: new Date('2024-01-28'),
    type: 'evaluacion',
  },
  {
    id: 'deadline-2',
    title: 'Revisión - Diplomado Marketing Digital',
    proposalId: 'prop-7',
    date: new Date('2024-01-30'),
    type: 'revision',
  },
  {
    id: 'deadline-3',
    title: 'Entrega documentos - Gestión de Proyectos',
    proposalId: 'prop-4',
    date: new Date('2024-02-02'),
    type: 'entrega',
  },
  {
    id: 'deadline-4',
    title: 'Evaluación - Redacción Científica',
    proposalId: 'prop-8',
    date: new Date('2024-02-05'),
    type: 'evaluacion',
  },
  {
    id: 'deadline-5',
    title: 'Revisión final - Ciberseguridad',
    proposalId: 'prop-5',
    date: new Date('2024-02-10'),
    type: 'revision',
  },
];

// ============ SYSTEM NOTIFICATIONS ============
export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: Date;
}

export const systemNotifications: SystemNotification[] = [
  {
    id: 'notif-1',
    title: 'Propuesta aprobada',
    message: 'El Diplomado en IA Aplicada ha sido aprobado oficialmente.',
    type: 'success',
    read: false,
    createdAt: new Date('2024-01-20T10:30:00'),
  },
  {
    id: 'notif-2',
    title: 'Nueva evaluación asignada',
    message: 'Se le ha asignado la evaluación del Taller de Desarrollo Web.',
    type: 'info',
    read: false,
    createdAt: new Date('2024-01-19T14:15:00'),
  },
  {
    id: 'notif-3',
    title: 'Plazo próximo a vencer',
    message: 'La evaluación del Diplomado en Marketing Digital vence en 3 días.',
    type: 'warning',
    read: true,
    createdAt: new Date('2024-01-18T09:00:00'),
  },
  {
    id: 'notif-4',
    title: 'Propuesta rechazada',
    message: 'El Curso de Metodologías Ágiles requiere modificaciones.',
    type: 'error',
    read: true,
    createdAt: new Date('2024-01-15T16:45:00'),
  },
  {
    id: 'notif-5',
    title: 'Recordatorio de sistema',
    message: 'Actualice su perfil con información de contacto actualizada.',
    type: 'info',
    read: true,
    createdAt: new Date('2024-01-14T11:00:00'),
  },
];

// ============ HELPER FUNCTIONS ============
export const getProposalsByStatus = (status: string) => 
  proposals.filter(p => p.status === status);

export const getProposalsByUser = (userId: string) => 
  proposals.filter(p => p.submitter.id === userId);

export const getEvaluationsByProposal = (proposalId: string) => 
  evaluations.filter(e => e.proposalId === proposalId);

export const getEvaluationsByEvaluator = (evaluatorId: string) => 
  evaluations.filter(e => e.evaluatorId === evaluatorId);

export const getPendingEvaluationsForUser = (userId: string) => 
  evaluations.filter(e => e.evaluatorId === userId && e.status !== 'completada');

export const getAverageApprovalTime = (): number => {
  const approvedProposals = proposals.filter(p => p.status === 'aprobada' && p.submittedAt);
  if (approvedProposals.length === 0) return 0;
  
  const totalDays = approvedProposals.reduce((sum, p) => {
    const submittedDate = p.submittedAt!.getTime();
    const approvedDate = p.updatedAt.getTime();
    const diffDays = Math.ceil((approvedDate - submittedDate) / (1000 * 60 * 60 * 24));
    return sum + diffDays;
  }, 0);
  
  return Math.round(totalDays / approvedProposals.length);
};
