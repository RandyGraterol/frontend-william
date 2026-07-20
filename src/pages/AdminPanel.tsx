import { useState, useEffect, useCallback } from "react";
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSkeleton } from '@/components/shared';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { 
  Settings, 
  FileText, 
  BarChart3, 
  Bell, 
  Plus, 
  Pencil, 
  Trash2, 
  Download,
  ArrowRight,
  GripVertical,
  RefreshCw,
  ClipboardList,
  UserCheck,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  UserPlus,
  Server,
  Database,
  HardDrive,
  Wifi,
  ScrollText,
  ShieldAlert,
  X,
  ClipboardCheck,
  Search,
  ChevronLeft,
  Users,
  ChevronRight,
} from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import { generateAdminReport } from '@/lib/pdfGenerator';

// ============ MOCK DATA FALLBACKS ============

const mockWorkflowSteps = [
  { id: "1", name: "Borrador", order: 1, role: "user", conditions: "Ninguna" },
  { id: "2", name: "Revisión Inicial", order: 2, role: "evaluator", conditions: "Propuesta completa" },
  { id: "3", name: "Evaluación Técnica", order: 3, role: "evaluator", conditions: "Aprobación inicial" },
  { id: "4", name: "Aprobación Final", order: 4, role: "admin", conditions: "Puntuación >= 70%" },
];

const mockRubricFallback = [
  { id: "1", name: "Innovación", description: "Grado de novedad de la propuesta", weight: 25, maxScore: 10 },
  { id: "2", name: "Viabilidad", description: "Factibilidad técnica y financiera", weight: 30, maxScore: 10 },
  { id: "3", name: "Impacto", description: "Beneficio esperado para la organización", weight: 25, maxScore: 10 },
  { id: "4", name: "Claridad", description: "Calidad de la documentación", weight: 20, maxScore: 10 },
];

const mockStatsFallback = {
  totalProposals: 156,
  approved: 89,
  rejected: 42,
  pending: 25,
  avgEvaluationTime: "3.5 días",
  avgScore: 7.2,
};

const mockAssignmentStats = {
  totalEvaluators: 12,
  availableEvaluators: 5,
  pendingProposals: 8,
  activeAssignments: 15,
  completedAssignments: 45,
  overdueAssignments: 3,
  avgCargaPorEvaluador: 3.2,
  tasaAsignacion: 65,
};

const mockAssignmentQueue = [
  { id: "q1", titulo: "Curso de Inteligencia Artificial", tipo: "curso", prioridad: "alta", especialidadRequerida: "tecnología" },
  { id: "q2", titulo: "Taller de Metodología Científica", tipo: "taller", prioridad: "media", especialidadRequerida: "investigación" },
  { id: "q3", titulo: "Diplomado en Gerencia Pública", tipo: "diplomado", prioridad: "baja", especialidadRequerida: "gerencia" },
];

const mockAvailableEvaluators = [
  { id: "e1", nombre: "Dra. María López", email: "maria@unerg.edu.ve", especialidad: "Investigación", cargaActual: 3, maxCarga: 10, disponible: true },
  { id: "e2", nombre: "Dr. Carlos Ruiz", email: "carlos@unerg.edu.ve", especialidad: "Tecnología", cargaActual: 5, maxCarga: 10, disponible: true },
  { id: "e3", nombre: "Prof. Ana Martínez", email: "ana@unerg.edu.ve", especialidad: "Educación", cargaActual: 2, maxCarga: 10, disponible: true },
];

const mockAllProposals = [
  { id: "p1", titulo: "Curso de Inteligencia Artificial", codigo: "PROP-001", tipo: "curso", estado: "enviada", proponente: { nombre: "Dr. Juan Pérez" }, evaluadores: [{ id: "e1", nombre: "Dra. María López" }, { id: "e2", nombre: "Dr. Carlos Ruiz" }] },
  { id: "p2", titulo: "Taller de Metodología", codigo: "PROP-002", tipo: "taller", estado: "enviada", proponente: { nombre: "Prof. María García" }, evaluadores: [{ id: "e3", nombre: "Prof. Ana Martínez" }] },
  { id: "p3", titulo: "Diplomado en Gerencia Pública", codigo: "PROP-003", tipo: "diplomado", estado: "en evaluacion", proponente: { nombre: "Dr. Pedro Gómez" }, evaluadores: [] },
];

function SortableStep({
  step,
  onEdit,
  onDelete,
  deleteLoading,
}: {
  step: Record<string, any>;
  onEdit: (s: Record<string, any>) => void;
  onDelete: (id: string) => void;
  deleteLoading: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={`flex items-center gap-4 ${isDragging ? 'z-50' : ''}`}>
      <div className="flex items-center gap-2 text-muted-foreground" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4 cursor-grab" />
        <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
          {step.order}
        </span>
      </div>
      <Card className="flex-1">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <h4 className="font-medium">{step.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="outline">{step.role}</Badge>
              {step.conditions && step.conditions !== 'Ninguna' && (
                <>
                  <span>•</span>
                  <span>{step.conditions}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(step)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Eliminar Paso</AlertDialogTitle>
                  <AlertDialogDescription>¿Estás seguro de eliminar este paso del workflow?</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(step.id)} disabled={deleteLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {deleteLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const AdminPanel = () => {
  // Loading states per tab
  const [isReportsLoading, setIsReportsLoading] = useState(true);
  const [isRubricsLoading, setIsRubricsLoading] = useState(true);
  const [isNotifsLoading, setIsNotifsLoading] = useState(true);
  const [isWorkflowsLoading, setIsWorkflowsLoading] = useState(true);

  // Data states
  const [workflowSteps, setWorkflowSteps] = useState(mockWorkflowSteps);
  const [rubricCriteria, setRubricCriteria] = useState<Array<Record<string, any>>>(mockRubricFallback);
  const [stats, setStats] = useState(mockStatsFallback);
  const [availableReports, setAvailableReports] = useState<Array<Record<string, any>>>([]);
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    newProposal: true,
    statusChange: true,
    evaluationComplete: true,
    deadlineReminder: true,
    emailDigest: false,
  });
  const [emailConfig, setEmailConfig] = useState({
    senderName: '',
    replyTo: '',
    digestTime: '08:00',
  });

  // Personal notification preferences (admin user's own prefs)
  const [personalPrefs, setPersonalPrefs] = useState<Record<string, boolean>>({
    newProposal: true,
    statusChange: true,
    evaluationComplete: true,
    deadlineReminder: true,
    emailDigest: false,
  });
  const [isPersonalPrefsLoading, setIsPersonalPrefsLoading] = useState(false);
  const [togglePrefLoading, setTogglePrefLoading] = useState<string | null>(null);

  const { user: adminUser } = useAuth();

  // Assignment state
  const [isAssignmentsLoading, setIsAssignmentsLoading] = useState(true);
  const [assignmentQueue, setAssignmentQueue] = useState<Array<Record<string, any>>>(mockAssignmentQueue);
  const [assignmentStatsData, setAssignmentStatsData] = useState<Record<string, any> | null>(null);
  const [availableEvaluators, setAvailableEvaluators] = useState<Array<Record<string, any>>>(mockAvailableEvaluators);
  const [allProposals, setAllProposals] = useState<Array<Record<string, any>>>(mockAllProposals);
  const [evaluatorPerformance, setEvaluatorPerformance] = useState<Array<Record<string, any>>>([]);

  // Assignment dialog state
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedProposalId, setSelectedProposalId] = useState<string>('');
  const [selectedEvaluatorIds, setSelectedEvaluatorIds] = useState<string[]>([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Remove evaluator state
  const [removingEval, setRemovingEval] = useState<{ proposalId: string; evaluatorId: string } | null>(null);

  // System & Audit state
  const [isSystemLoading, setIsSystemLoading] = useState(true);
  const [isAuditLoading, setIsAuditLoading] = useState(true);
  const [systemStatus, setSystemStatus] = useState<Record<string, any> | null>(null);
  const [systemConfig, setSystemConfig] = useState<Record<string, any> | null>(null);
  const [securitySettings, setSecuritySettings] = useState<Record<string, any> | null>(null);
  const [integrationSettings, setIntegrationSettings] = useState<Record<string, any> | null>(null);
  const [auditLogs, setAuditLogs] = useState<Array<Record<string, any>>>([]);
  const [auditStats, setAuditStats] = useState<Record<string, any> | null>(null);
  const [securityEvents, setSecurityEvents] = useState<Array<Record<string, any>>>([]);
  const [complianceReport, setComplianceReport] = useState<Record<string, any> | null>(null);

  // Workflow template state
  const [workflowTemplates, setWorkflowTemplates] = useState<Array<Record<string, any>>>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Workflow step form state
  const [stepForm, setStepForm] = useState({ name: '', role: 'evaluator', conditions: '', description: '' });
  const [isStepLoading, setIsStepLoading] = useState(false);
  const [deleteStepId, setDeleteStepId] = useState<string | null>(null);
  const [isDeletingStep, setIsDeletingStep] = useState(false);

  // Template creation / editing
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: '', description: '' });
  const [isTemplateLoading, setIsTemplateLoading] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<string | null>(null);

  // Step editing
  const [editStepId, setEditStepId] = useState<string | null>(null);
  const [editStepForm, setEditStepForm] = useState({ name: '', role: 'evaluator', conditions: '', description: '' });
  const [isEditStepLoading, setIsEditStepLoading] = useState(false);

  // Drag-and-drop reorder state
  const [reorderLoading, setReorderLoading] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Rubric form state
  const [rubricForm, setRubricForm] = useState({ name: '', description: '', weight: 0, maxScore: 10 });
  const [editRubricId, setEditRubricId] = useState<string | null>(null);
  const [isRubricLoading, setIsRubricLoading] = useState(false);
  const [deleteRubricId, setDeleteRubricId] = useState<string | null>(null);
  const [isDeletingRubric, setIsDeletingRubric] = useState(false);

  // Dialog states
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isRubricDialogOpen, setIsRubricDialogOpen] = useState(false);

  // ============ DATA FETCHING ============

  useEffect(() => {
    async function fetchReportsData() {
      setIsReportsLoading(true);
      try {
        const [statsRes, reportsRes] = await Promise.all([
          api.getAdminGlobalStats(),
          api.getAvailableReports().catch(() => ({ reportes: [] })),
        ]);

        const s = statsRes as Record<string, any>;
        const statsData = s?.data as Record<string, any> | undefined;
        if (statsData) {
          setStats({
            totalProposals: statsData.totalPropuestas ?? mockStatsFallback.totalProposals,
            approved: statsData.aprobadasEsteAño ?? mockStatsFallback.approved,
            rejected: statsData.rechazadasEsteAño ?? mockStatsFallback.rejected,
            pending: statsData.enEvaluacion ?? (statsData.totalPropuestas - (statsData.aprobadasEsteAño || 0) - (statsData.rechazadasEsteAño || 0)) ?? mockStatsFallback.pending,
            avgEvaluationTime: "3.5 días",
            avgScore: 7.2,
          });
        }
        const r = reportsRes as Record<string, any>;
        if (r?.success && Array.isArray(r?.data)) setAvailableReports(r.data);
      } catch {
        setStats(mockStatsFallback);
        toast({ title: 'Reportes', description: 'Mostrando datos de demostración — servidor no disponible', duration: 4000 });
      } finally {
        setIsReportsLoading(false);
      }
    }
    fetchReportsData();
  }, []);

  useEffect(() => {
    async function fetchRubrics() {
      setIsRubricsLoading(true);
      try {
        const res = await api.getEvaluationCriteria();
        const data = res.data as Array<Record<string, any>>;
        if (Array.isArray(data) && data.length > 0) {
          setRubricCriteria(data.map((c: Record<string, any>) => ({
            id: c.id,
            name: c.name || c.nombre || 'Sin nombre',
            description: c.description || c.descripcion || '',
            weight: c.weight || c.ponderacion || 0,
            maxScore: c.maxScore || c.puntuacionMaxima || c.maxScore || 10,
          })));
        } else {
          throw new Error('No criteria data');
        }
      } catch {
        setRubricCriteria(mockRubricFallback);
        toast({ title: 'Rúbricas', description: 'Mostrando datos de demostración — servidor no disponible', duration: 4000 });
      } finally {
        setIsRubricsLoading(false);
      }
    }
    fetchRubrics();
  }, []);

  useEffect(() => {
    async function fetchWorkflowTemplates() {
      setIsWorkflowsLoading(true);
      try {
        const res = await api.getWorkflowTemplates();
        const data = res.data as Array<Record<string, any>>;
        if (Array.isArray(data) && data.length > 0) {
          setWorkflowTemplates(data);
          const defaultTpl = data.find((t: Record<string, any>) => t.isDefault) || data[0];
          setSelectedTemplateId(defaultTpl.id);
          if (defaultTpl?.steps && Array.isArray(defaultTpl.steps) && defaultTpl.steps.length > 0) {
            setWorkflowSteps(defaultTpl.steps.map((s: Record<string, any>, i: number) => ({
              id: s.id || `step-${i}`,
              name: s.name,
              order: s.order || i + 1,
              role: s.role || 'user',
              conditions: s.conditions || 'Ninguna',
            })));
          } else {
            setWorkflowSteps([]);
          }
        } else {
          setWorkflowSteps(mockWorkflowSteps);
        }
      } catch {
        setWorkflowSteps(mockWorkflowSteps);
      } finally {
        setIsWorkflowsLoading(false);
      }
    }
    fetchWorkflowTemplates();
  }, []);

  // Fetch steps when template changes
  const handleTemplateChange = async (templateId: string) => {
    setSelectedTemplateId(templateId);
    setIsWorkflowsLoading(true);
    try {
      const res = await api.getWorkflowTemplate(templateId);
      const tpl = res.data as Record<string, any>;
      if (tpl?.steps && Array.isArray(tpl.steps)) {
        setWorkflowSteps(tpl.steps.map((s: Record<string, any>, i: number) => ({
          id: s.id,
          name: s.name,
          order: s.order || i + 1,
          role: s.role || 'user',
          conditions: s.conditions || 'Ninguna',
        })));
      }
    } catch {
      // Keep current steps
    } finally {
      setIsWorkflowsLoading(false);
    }
  };

  useEffect(() => {
    async function fetchNotificationSettings() {
      setIsNotifsLoading(true);
      try {
        const [notifRes, emailRes] = await Promise.all([
          api.getNotificationSettings().catch(() => null),
          api.getEmailSettings().catch(() => null),
        ]);
        const n = notifRes as Record<string, any>;
        const notifData = n?.data as Record<string, any> | undefined;
        if (notifData?.eventos) {
          setNotifications({
            newProposal: notifData.eventos.nuevaPropuesta ?? true,
            statusChange: notifData.eventos.cambioEstado ?? true,
            evaluationComplete: notifData.eventos.evaluacionCompletada ?? true,
            deadlineReminder: notifData.eventos.recordatorio ?? true,
            emailDigest: notifications.emailDigest,
          });
        }
        const e = emailRes as Record<string, any>;
        const emailData = e?.data as Record<string, any> | undefined;
        if (emailData?.remitente) {
          setEmailConfig(prev => ({
            ...prev,
            senderName: emailData.remitente.nombre || prev.senderName,
            replyTo: emailData.remitente.email || prev.replyTo,
          }));
        }
      } catch {
        // Keep defaults
      } finally {
        setIsNotifsLoading(false);
      }
    }
    fetchNotificationSettings();

    // Fetch personal notification preferences for admin user
    async function fetchPersonalPrefs() {
      if (!adminUser?.id) return;
      setIsPersonalPrefsLoading(true);
      try {
        const prefsRes = await api.getNotificationPreferences(adminUser.id);
        if (prefsRes.success && prefsRes.data) {
          const prefs = prefsRes.data as Record<string, any>;
          setPersonalPrefs({
            newProposal: prefs.newProposal ?? true,
            statusChange: prefs.statusChange ?? true,
            evaluationComplete: prefs.evaluationComplete ?? true,
            deadlineReminder: prefs.deadlineReminder ?? true,
            emailDigest: prefs.emailDigest ?? false,
          });
        }
      } catch {
        // Keep defaults
      } finally {
        setIsPersonalPrefsLoading(false);
      }
    }
    fetchPersonalPrefs();
  }, [adminUser?.id]);

  // ============ SYSTEM FETCHING ============

  useEffect(() => {
    async function fetchSystemData() {
      setIsSystemLoading(true);
      try {
        const [statusRes, configRes, securityRes, integrationsRes] = await Promise.all([
          api.getSystemStatus().catch(() => null),
          api.getSystemConfig().catch(() => null),
          api.getSecuritySettings().catch(() => null),
          api.getIntegrationSettings().catch(() => null),
        ]);
        const st = (statusRes as Record<string, any>)?.data as Record<string, any> | undefined;
        if (st?.database) setSystemStatus(st);
        const cfg = (configRes as Record<string, any>)?.data as Record<string, any> | undefined;
        if (cfg?.nombreSistema) setSystemConfig(cfg);
        const sec = (securityRes as Record<string, any>)?.data as Record<string, any> | undefined;
        if (sec?.contrasena) setSecuritySettings(sec);
        const integ = (integrationsRes as Record<string, any>)?.data as Record<string, any> | undefined;
        if (integ?.servicios) setIntegrationSettings(integ);
      } catch {
        // Keep as null
      } finally {
        setIsSystemLoading(false);
      }
    }
    fetchSystemData();
  }, []);

  // ============ AUDIT FETCHING ============

  useEffect(() => {
    async function fetchAuditData() {
      setIsAuditLoading(true);
      try {
        const [logsRes, statsRes, eventsRes, complianceRes] = await Promise.all([
          api.getAdminAuditLogs().catch(() => null),
          api.getAdminAuditStats().catch(() => null),
          api.getSecurityEvents().catch(() => null),
          api.getComplianceReport().catch(() => null),
        ]);

        const l = logsRes as Record<string, any>;
        if (l?.success && Array.isArray(l?.data)) setAuditLogs(l.data);
        const s = (statsRes as Record<string, any>)?.data as Record<string, any> | undefined;
        if (s?.totalEventos) setAuditStats(s);
        const ev = (eventsRes as Record<string, any>)?.data as Record<string, any> | undefined;
        if (ev?.eventos) setSecurityEvents(ev.eventos);
        const c = (complianceRes as Record<string, any>)?.data as Record<string, any> | undefined;
        if (c) setComplianceReport(c);
      } catch {
        // Keep defaults
      } finally {
        setIsAuditLoading(false);
      }
    }
    fetchAuditData();
  }, []);

  // ============ ASSIGNMENTS FETCHING ============

  const fetchAssignmentsData = useCallback(async () => {
    setIsAssignmentsLoading(true);
    try {
      const [queueRes, statsRes, evaluatorsRes, proposalsRes, perfRes] = await Promise.all([
          api.getAssignmentQueue().catch(() => null),
          api.getAssignmentStats().catch(() => null),
          api.getAvailableEvaluators().catch(() => null),
          api.getAllProposalsAdmin().catch(() => null),
          api.getEvaluatorPerformance().catch(() => null),
        ]);

        // Queue
      const q = queueRes as Record<string, any>;
      if (q?.success && Array.isArray(q?.data)) setAssignmentQueue(q.data);
      else if (Array.isArray(queueRes)) setAssignmentQueue(queueRes);

      // Stats
      const s = (statsRes as Record<string, any>)?.data as Record<string, any> | undefined;
      if (s && s.totalEvaluators !== undefined) setAssignmentStatsData(s);

      // Evaluators
      const e = (evaluatorsRes as Record<string, any>)?.data as Array<Record<string, any>> | undefined;
      if (Array.isArray(e) && e.length > 0) setAvailableEvaluators(e);

      // All proposals
      const p = proposalsRes as Record<string, any>;
      if (p?.success && Array.isArray(p?.data)) setAllProposals(p.data);
      else if (Array.isArray(proposalsRes)) setAllProposals(proposalsRes);

      // Performance
      const perf = (perfRes as Record<string, any>)?.data as Array<Record<string, any>> | undefined;
      if (Array.isArray(perf) && perf.length > 0) setEvaluatorPerformance(perf);
    } catch {
      // Use mock fallbacks (already set as initial state)
    } finally {
      setIsAssignmentsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssignmentsData();
  }, [fetchAssignmentsData]);

  // ============ ASSIGNMENT HANDLERS ============

  const handleAssignEvaluators = async () => {
    if (!selectedProposalId || selectedEvaluatorIds.length === 0) return;
    setIsAssigning(true);
    try {
      let res;
      try {
        res = await api.adminAssignEvaluators({
          proposalId: selectedProposalId,
          evaluatorIds: selectedEvaluatorIds,
        });
      } catch {
        res = await api.assignEvaluators(selectedProposalId, { evaluatorIds: selectedEvaluatorIds });
      }
      toast({
        title: 'Evaluadores asignados',
        description: `${selectedEvaluatorIds.length} evaluador(es) asignado(s) a la propuesta`,
      });
      setIsAssignDialogOpen(false);
      setSelectedProposalId('');
      setSelectedEvaluatorIds([]);
      fetchAssignmentsData();
    } catch {
      toast({
        title: 'Error al asignar',
        description: 'No se pudieron asignar los evaluadores',
        variant: 'destructive',
      });
    }
    setIsAssigning(false);
  };

  const handleOpenAssignDialog = (proposalId: string) => {
    setSelectedProposalId(proposalId);
    setSelectedEvaluatorIds([]);
    setIsAssignDialogOpen(true);
  };

  const toggleEvaluatorSelection = (evaluatorId: string) => {
    setSelectedEvaluatorIds(prev =>
      prev.includes(evaluatorId)
        ? prev.filter(id => id !== evaluatorId)
        : [...prev, evaluatorId]
    );
  };

  const handleRemoveEvaluator = async (proposalId: string, evaluatorId: string) => {
    setRemovingEval({ proposalId, evaluatorId });
    try {
      await api.removeEvaluator(proposalId, evaluatorId);
      toast({ title: 'Evaluador removido', description: 'El evaluador se ha desasignado de la propuesta.' });
      fetchAssignmentsData();
    } catch {
      toast({ title: 'Error', description: 'No se pudo remover el evaluador.', variant: 'destructive' });
    } finally {
      setRemovingEval(null);
    }
  };

  // ============ GLOBAL NOTIFICATIONS ============

  const [globalNotifs, setGlobalNotifs] = useState<Record<string, any>[]>([]);
  const [globalNotifsLoading, setGlobalNotifsLoading] = useState(false);
  const [notifDialogOpen, setNotifDialogOpen] = useState(false);
  const [notifForm, setNotifForm] = useState({ title: '', message: '', type: 'system', priority: 'normal' });

  const fetchGlobalNotifs = useCallback(async () => {
    setGlobalNotifsLoading(true);
    try {
      const res = await api.getGlobalNotifications();
      if (res.success && res.data) setGlobalNotifs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGlobalNotifs([]);
    }
    setGlobalNotifsLoading(false);
  }, []);

  useEffect(() => {
    fetchGlobalNotifs();
  }, [fetchGlobalNotifs]);

  const handleCreateGlobalNotif = async () => {
    if (!notifForm.title || !notifForm.message) return;
    try {
      const res = await api.createGlobalNotification(notifForm);
      if (res.success) {
        setGlobalNotifs(prev => [res.data as Record<string, any>, ...prev]);
        setNotifDialogOpen(false);
        setNotifForm({ title: '', message: '', type: 'system', priority: 'normal' });
        toast({ title: 'Notificación global creada' });
      }
    } catch {
      toast({ title: 'Error al crear notificación', variant: 'destructive' });
    }
  };

  const handleToggleGlobalNotif = async (id: string, isActive: boolean) => {
    try {
      await api.toggleGlobalNotification(id, !isActive);
      setGlobalNotifs(prev => prev.map(n => n.id === id ? { ...n, isActive: !isActive } : n));
    } catch {
      toast({ title: 'Error al cambiar estado', variant: 'destructive' });
    }
  };

  const handleDeleteGlobalNotif = async (id: string) => {
    try {
      await api.deleteGlobalNotification(id);
      setGlobalNotifs(prev => prev.filter(n => n.id !== id));
      toast({ title: 'Notificación eliminada' });
    } catch {
      toast({ title: 'Error al eliminar', variant: 'destructive' });
    }
  };

  // ============ NOTIFICATION SAVE HANDLER ============

  const handleSaveNotificationSettings = async () => {
    try {
      await api.updateNotificationSettings({ eventos: notifications });
      toast({ title: 'Configuración guardada', description: 'Preferencias de notificaciones actualizadas' });
    } catch {
      toast({ title: 'Guardado local', description: 'La API no estaba disponible, cambios guardados localmente' });
    }
  };

  // ============ PERSONAL PREFERENCE HANDLERS ============

  const handleTogglePersonalPref = async (key: string, checked: boolean) => {
    if (!adminUser?.id) return;
    const previous = personalPrefs[key];
    // Optimistic update
    setPersonalPrefs(prev => ({ ...prev, [key]: checked }));
    setTogglePrefLoading(key);
    try {
      await api.updateNotificationPreferences(adminUser.id, { [key]: checked });
    } catch {
      // Revert on error
      setPersonalPrefs(prev => ({ ...prev, [key]: previous }));
      toast({
        title: 'Error',
        description: 'No se pudo guardar la preferencia.',
        variant: 'destructive',
      });
    } finally {
      setTogglePrefLoading(null);
    }
  };

  // ============ WORKFLOW STEP HANDLERS ============

  const handleAddStep = async () => {
    if (!stepForm.name.trim() || !selectedTemplateId) return;
    setIsStepLoading(true);
    try {
      const res = await api.addWorkflowTemplateStep(selectedTemplateId, {
        name: stepForm.name,
        role: stepForm.role,
        conditions: stepForm.conditions || undefined,
        description: stepForm.description || undefined,
      });
      if (res.success && res.data) {
        const newStep = res.data as Record<string, any>;
        setWorkflowSteps(prev => [...prev, {
          id: newStep.id,
          name: newStep.name,
          order: newStep.order || prev.length + 1,
          role: newStep.role || 'user',
          conditions: newStep.conditions || 'Ninguna',
        }]);
        setIsWorkflowDialogOpen(false);
        setStepForm({ name: '', role: 'evaluator', conditions: '', description: '' });
        toast({ title: 'Paso agregado', description: `"${stepForm.name}" se ha agregado al workflow.` });
      }
    } catch {
      toast({ title: 'Error', description: 'No se pudo agregar el paso.', variant: 'destructive' });
    } finally {
      setIsStepLoading(false);
    }
  };

  const handleDeleteStep = async (stepId: string) => {
    setIsDeletingStep(true);
    try {
      await api.deleteWorkflowTemplateStep(stepId);
      setWorkflowSteps(prev => prev.filter(s => s.id !== stepId));
      setDeleteStepId(null);
      toast({ title: 'Paso eliminado', description: 'El paso se ha eliminado correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el paso.', variant: 'destructive' });
    } finally {
      setIsDeletingStep(false);
    }
  };

  const openCreateTemplateDialog = () => {
    setEditTemplateId(null);
    setTemplateForm({ name: '', description: '' });
    setIsTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (tpl: Record<string, any>) => {
    setEditTemplateId(tpl.id);
    setTemplateForm({ name: tpl.name || '', description: tpl.description || '' });
    setIsTemplateDialogOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) return;
    setIsTemplateLoading(true);
    try {
      if (editTemplateId) {
        await api.updateWorkflowTemplate(editTemplateId, templateForm);
        setWorkflowTemplates(prev => prev.map(t => t.id === editTemplateId ? { ...t, ...templateForm } : t));
        toast({ title: 'Template actualizado', description: `"${templateForm.name}" actualizado correctamente.` });
      } else {
        const res = await api.createWorkflowTemplate({
          name: templateForm.name,
          description: templateForm.description,
        });
        if (res.success && res.data) {
          const newTpl = res.data as Record<string, any>;
          setWorkflowTemplates(prev => [...prev, newTpl]);
          setSelectedTemplateId(newTpl.id);
        }
        toast({ title: 'Template creado', description: `"${templateForm.name}" creado correctamente.` });
      }
      setIsTemplateDialogOpen(false);
      setTemplateForm({ name: '', description: '' });
      setEditTemplateId(null);
    } catch {
      toast({ title: 'Error', description: editTemplateId ? 'No se pudo actualizar el template.' : 'No se pudo crear el template.', variant: 'destructive' });
    } finally {
      setIsTemplateLoading(false);
    }
  };

  const handleEditStep = async () => {
    if (!editStepForm.name.trim() || !editStepId) return;
    setIsEditStepLoading(true);
    try {
      await api.updateWorkflowTemplateStep(editStepId, {
        name: editStepForm.name,
        role: editStepForm.role,
        conditions: editStepForm.conditions || undefined,
        description: editStepForm.description || undefined,
      });
      setWorkflowSteps(prev => prev.map(s => s.id === editStepId ? { ...s, ...editStepForm } : s));
      setEditStepId(null);
      toast({ title: 'Paso actualizado', description: 'Los cambios se han guardado correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el paso.', variant: 'destructive' });
    } finally {
      setIsEditStepLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = workflowSteps.findIndex(s => s.id === active.id);
    const newIndex = workflowSteps.findIndex(s => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(workflowSteps, oldIndex, newIndex).map((s, i) => ({
      ...s,
      order: i + 1,
    }));
    setWorkflowSteps(reordered);
    setReorderLoading(true);
    try {
      await api.reorderWorkflowTemplateSteps(selectedTemplateId, {
        stepOrders: reordered.map(s => ({ id: s.id, order: s.order })),
      });
    } catch {
      toast({ title: 'Error', description: 'No se pudo reordenar los pasos.', variant: 'destructive' });
    } finally {
      setReorderLoading(false);
    }
  };

  const openCreateRubricDialog = () => {
    setEditRubricId(null);
    setRubricForm({ name: '', description: '', weight: 0, maxScore: 10 });
    setIsRubricDialogOpen(true);
  };

  const openEditRubricDialog = (c: Record<string, any>) => {
    setEditRubricId(c.id);
    setRubricForm({ name: c.name || '', description: c.description || '', weight: Number(c.weight) || 0, maxScore: Number(c.maxScore) || 10 });
    setIsRubricDialogOpen(true);
  };

  const handleSaveRubric = async () => {
    if (!rubricForm.name.trim()) return;
    setIsRubricLoading(true);
    try {
      if (editRubricId) {
        await api.updateEvaluationCriterion(editRubricId, rubricForm);
        setRubricCriteria(prev => prev.map(c => c.id === editRubricId ? { ...c, ...rubricForm } : c));
        toast({ title: 'Criterio actualizado', description: `"${rubricForm.name}" actualizado correctamente.` });
      } else {
        const res = await api.createEvaluationCriterion(rubricForm);
        if (res.success && res.data) {
          setRubricCriteria(prev => [...prev, res.data as Record<string, any>]);
        }
        toast({ title: 'Criterio creado', description: `"${rubricForm.name}" creado correctamente.` });
      }
      setIsRubricDialogOpen(false);
      setEditRubricId(null);
      setRubricForm({ name: '', description: '', weight: 0, maxScore: 10 });
    } catch {
      toast({ title: 'Error', description: editRubricId ? 'No se pudo actualizar el criterio.' : 'No se pudo crear el criterio.', variant: 'destructive' });
    } finally {
      setIsRubricLoading(false);
    }
  };

  const handleDeleteRubric = async (id: string) => {
    setIsDeletingRubric(true);
    try {
      await api.deleteEvaluationCriterion(id);
      setRubricCriteria(prev => prev.filter(c => c.id !== id));
      setDeleteRubricId(null);
      toast({ title: 'Criterio eliminado', description: 'El criterio se ha eliminado correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar el criterio.', variant: 'destructive' });
    } finally {
      setIsDeletingRubric(false);
    }
  };

  // ============ ASSIGN DIALOG ============

  function renderAssignDialog() {
    return (
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Asignar Evaluadores</DialogTitle>
            <DialogDescription>
              Selecciona los evaluadores para asignarlos a la propuesta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-sm font-medium">Propuesta Seleccionada</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {allProposals.find(p => p.id === selectedProposalId)?.titulo || 'Propuesta #' + selectedProposalId.slice(0, 8)}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Evaluadores Disponibles</Label>
              {availableEvaluators.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No hay evaluadores disponibles
                </p>
              ) : (
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {availableEvaluators.map((ev) => {
                    const isSelected = selectedEvaluatorIds.includes(ev.id);
                    return (
                      <div
                        key={ev.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleEvaluatorSelection(ev.id)}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-primary border-primary' : 'border-muted-foreground'
                        }`}>
                          {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-foreground truncate">
                            {ev.nombre || ev.name || 'Evaluador'}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{ev.email || ''}</span>
                            <span>•</span>
                            <span>{ev.especialidad || ev.department || 'General'}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          {ev.cargaActual ?? 0}/{ev.maxCarga ?? 10}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAssignEvaluators}
              disabled={!selectedProposalId || selectedEvaluatorIds.length === 0 || isAssigning}
            >
              {isAssigning ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Asignando...</>
              ) : (
                <><UserPlus className="h-4 w-4 mr-2" />Asignar ({selectedEvaluatorIds.length})</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  const handleExportReporteCompleto = () => {
    const fullStats = {
      ...stats,
      ...(assignmentStatsData || mockAssignmentStats),
    };
    generateAdminReport(fullStats);
    toast({
      title: 'Reporte generado',
      description: 'El reporte completo en PDF se ha descargado correctamente.',
    });
  };

  // ============ JSX ============

  const displayAssignmentStats = assignmentStatsData || mockAssignmentStats;

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gestiona la configuración del sistema, reportes y auditoría</p>
        </div>
      </div>

      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="flex flex-wrap gap-1">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            <span className="hidden sm:inline">Sistema</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reportes</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <ScrollText className="h-4 w-4" />
            <span className="hidden sm:inline">Auditoría</span>
          </TabsTrigger>
          </TabsList>

        <TabsContent value="reports" className="space-y-4">
          {isReportsLoading ? (
            <LoadingSkeleton variant="card" count={3} className="md:grid-cols-3" />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Propuestas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalProposals}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Tiempo Promedio Evaluación
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgEvaluationTime}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Puntuación Promedio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.avgScore}/10</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas de Propuestas</CardTitle>
                  <CardDescription>Resumen del estado de las propuestas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { label: 'Aprobadas', value: stats.approved, color: 'bg-green-500' },
                      { label: 'Rechazadas', value: stats.rejected, color: 'bg-red-500' },
                      { label: 'Pendientes', value: stats.pending, color: 'bg-yellow-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center justify-between">
                        <span>{item.label}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${item.color}`}
                              style={{ width: `${stats.totalProposals > 0 ? (item.value / stats.totalProposals) * 100 : 0}%` }}
                            />
                          </div>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {availableReports.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reportes Disponibles</CardTitle>
                    <CardDescription>Selecciona un reporte para generar</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {availableReports.map((report: Record<string, any>) => (
                        <Card key={report.id} className="hover:shadow-md transition-shadow cursor-pointer">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">{report.nombre || report.name}</CardTitle>
                            <CardDescription className="text-xs">
                              {report.descripcion || report.description || report.tipo || ''}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Button variant="outline" size="sm" className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Generar Reporte
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Exportar Datos</CardTitle>
                    <CardDescription>Descarga reportes en diferentes formatos</CardDescription>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                      <Download className="h-6 w-6" />
                      <span>Exportar Propuestas (CSV)</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                      <Download className="h-6 w-6" />
                      <span>Exportar Evaluaciones (CSV)</span>
                    </Button>
                    <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={handleExportReporteCompleto}>
                      <Download className="h-6 w-6" />
                      <span>Reporte Completo (PDF)</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ============ SYSTEM TAB ============ */}
        <TabsContent value="system" className="space-y-4">
          {isSystemLoading ? (
            <LoadingSkeleton variant="card" count={3} />
          ) : (
            <>
              {/* System Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Estado del Sistema</CardTitle>
                  <CardDescription>Monitoreo de servicios y recursos</CardDescription>
                </CardHeader>
                <CardContent>
                  {systemStatus ? (
                    <div className="space-y-6">
                      {/* Service Status */}
                      <div className="grid gap-4 md:grid-cols-4">
                        {[
                          { label: 'Base de Datos', status: systemStatus.database, icon: Database },
                          { label: 'Web Server', status: systemStatus.webserver, icon: Server },
                          { label: 'Almacenamiento', status: systemStatus.storage, icon: HardDrive },
                          { label: 'API Externa', status: systemStatus.externalAPI, icon: Wifi },
                        ].map((svc) => (
                          <div key={svc.label} className="flex items-center gap-3 p-3 rounded-lg border">
                            <div className={`w-3 h-3 rounded-full ${svc.status === 'healthy' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <div>
                              <p className="text-sm font-medium">{svc.label}</p>
                              <p className="text-xs text-muted-foreground">{svc.status === 'healthy' ? 'Saludable' : 'Error'}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Resource Usage */}
                      {systemStatus.recursos && (
                        <div>
                          <h4 className="text-sm font-medium mb-3">Uso de Recursos</h4>
                          <div className="space-y-3">
                            {[
                              { label: 'CPU', value: systemStatus.recursos.cpu, color: 'bg-blue-500' },
                              { label: 'Memoria', value: systemStatus.recursos.memory, color: 'bg-emerald-500' },
                              { label: 'Disco', value: systemStatus.recursos.disk, color: 'bg-amber-500' },
                              { label: 'Red', value: systemStatus.recursos.network, color: 'bg-purple-500' },
                            ].map((res) => (
                              <div key={res.label} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-muted-foreground">{res.label}</span>
                                  <span className="font-medium">{res.value}%</span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                  <div className={`h-full ${res.color} rounded-full transition-all`} style={{ width: `${res.value}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {systemStatus.uptime && (
                        <p className="text-xs text-muted-foreground">
                          Uptime: {Math.floor(systemStatus.uptime / 3600)}h {Math.floor((systemStatus.uptime % 3600) / 60)}m
                          {systemStatus.version && ` • Versión: ${systemStatus.version}`}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-4">No disponible</p>
                  )}
                </CardContent>
              </Card>

              {/* System Config */}
              {systemConfig && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración del Sistema</CardTitle>
                    <CardDescription>Parámetros generales de la aplicación</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {[
                        { label: 'Nombre', value: systemConfig.nombreSistema },
                        { label: 'Versión', value: systemConfig.version },
                        { label: 'Idioma', value: systemConfig.idiomaDefecto },
                        { label: 'Zona Horaria', value: systemConfig.zonaHoraria },
                        { label: 'Registro Abierto', value: systemConfig.permitirRegistro ? 'Sí' : 'No' },
                        { label: 'Modo Mantenimiento', value: systemConfig.mantenimiento ? 'Sí' : 'No' },
                      ].map((item) => (
                        <div key={item.label} className="flex justify-between p-2 rounded bg-muted/50">
                          <span className="text-sm text-muted-foreground">{item.label}</span>
                          <span className="text-sm font-medium">{item.value || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Security Settings */}
              {securitySettings && (
                <Card>
                  <CardHeader>
                    <CardTitle>Configuración de Seguridad</CardTitle>
                    <CardDescription>Políticas de contraseñas y sesiones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Política de Contraseñas</h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          {[
                            { label: 'Longitud Mínima', value: `${securitySettings.contrasena?.longitudMinima || 8} caracteres` },
                            { label: 'Requiere Mayúsculas', value: securitySettings.contrasena?.requerirMayusculas ? 'Sí' : 'No' },
                            { label: 'Requiere Números', value: securitySettings.contrasena?.requerirNumeros ? 'Sí' : 'No' },
                            { label: 'Expiración', value: `${securitySettings.contrasena?.diasExpiracion || 90} días` },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between p-2 rounded bg-muted/50">
                              <span className="text-sm text-muted-foreground">{item.label}</span>
                              <Badge variant={item.value.startsWith('Sí') ? 'success' : 'secondary'}>{item.value}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Sesiones</h4>
                        <div className="grid gap-3 md:grid-cols-2">
                          {[
                            { label: 'Tiempo de Inactividad', value: `${securitySettings.sesion?.tiempoInactividad || 30} min` },
                            { label: 'Intentos Máximos', value: `${securitySettings.sesion?.intentosMaximosLogin || 5} intentos` },
                            { label: 'Bloqueo Automático', value: securitySettings.sesion?.bloquearIntentosFallidos ? 'Sí' : 'No' },
                            { label: '2FA', value: securitySettings.sesion?.dosFactores ? 'Activo' : 'Inactivo' },
                          ].map((item) => (
                            <div key={item.label} className="flex justify-between p-2 rounded bg-muted/50">
                              <span className="text-sm text-muted-foreground">{item.label}</span>
                              <Badge variant={item.value.startsWith('Sí') || item.value.startsWith('Activo') ? 'success' : 'secondary'}>{item.value}</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Integrations */}
              {integrationSettings?.servicios && integrationSettings.servicios.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Integraciones</CardTitle>
                    <CardDescription>Servicios externos conectados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {integrationSettings.servicios.map((s: Record<string, any>) => (
                        <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                          <div>
                            <p className="font-medium text-sm">{s.nombre}</p>
                            <p className="text-xs text-muted-foreground">{s.tipo} • {s.url || 'Sin URL'}</p>
                          </div>
                          <Badge variant={s.activo ? 'success' : 'destructive'}>
                            {s.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        {/* ============ AUDIT TAB ============ */}
        <TabsContent value="audit" className="space-y-4">
          {isAuditLoading ? (
            <LoadingSkeleton variant="card" count={2} />
          ) : (
            <>
              {/* Audit Stats */}
              {auditStats && (
                <div className="grid gap-4 md:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{auditStats.totalEventos}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Eventos Críticos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-destructive">{auditStats.eventosCriticos}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Eventos por Módulo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {auditStats.eventosPorModulo?.slice(0, 3).map((m: Record<string, any>) => (
                          <div key={m.modulo} className="flex justify-between text-xs">
                            <span className="text-muted-foreground capitalize">{m.modulo}</span>
                            <span className="font-medium">{m.total}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Eventos por Día</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-1">
                        {auditStats.eventosPorDia?.slice(0, 3).map((d: Record<string, any>) => (
                          <div key={d.fecha} className="flex justify-between text-xs">
                            <span className="text-muted-foreground">{d.fecha}</span>
                            <span className="font-medium">{d.total}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Audit Logs */}
              <Card>
                <CardHeader>
                  <CardTitle>Registro de Auditoría</CardTitle>
                  <CardDescription>Actividad reciente en el sistema</CardDescription>
                </CardHeader>
                <CardContent>
                  {auditLogs.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">No hay registros de auditoría</p>
                  ) : (
<div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Usuario</TableHead>
                          <TableHead>Acción</TableHead>
                          <TableHead>Módulo</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-right">Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs.slice(0, 20).map((log: Record<string, any>) => (
                          <TableRow key={log.id}>
                            <TableCell className="font-medium text-xs">{log.usuario || log.user?.name || '—'}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">{log.accion || log.action}</Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground capitalize">{log.modulo || log.module}</TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                              {log.mensaje || log.message || log.descripcion}
                            </TableCell>
                            <TableCell className="text-xs text-right text-muted-foreground">
                              {new Date(log.timestamp || log.fecha || log.createdAt).toLocaleDateString('es-VE')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                  </div>                  )}
                </CardContent>
              </Card>

              {/* Security Events */}
              {securityEvents.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="h-5 w-5 text-destructive" />
                      <CardTitle>Eventos de Seguridad</CardTitle>
                    </div>
                    <CardDescription>Incidentes y alertas de seguridad</CardDescription>
                  </CardHeader>
                  <CardContent>
<div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Severidad</TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead className="text-center">Estado</TableHead>
                          <TableHead className="text-right">Fecha</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {securityEvents.slice(0, 10).map((ev: Record<string, any>) => (
                          <TableRow key={ev.id}>
                            <TableCell className="text-xs font-medium">{ev.tipo}</TableCell>
                            <TableCell>
                              <Badge variant={
                                ev.severidad === 'alta' ? 'destructive' :
                                ev.severidad === 'media' ? 'warning' : 'secondary'
                              } className="text-xs">
                                {ev.severidad}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground max-w-[250px] truncate">{ev.descripcion}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={ev.resuelto ? 'success' : 'destructive'} className="text-xs">
                                {ev.resuelto ? 'Resuelto' : 'Pendiente'}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-xs text-right text-muted-foreground">
                              {new Date(ev.fecha).toLocaleDateString('es-VE')}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                  </div>                  </CardContent>
                </Card>
              )}

              {/* Compliance Report */}
              {complianceReport && (
                <Card>
                  <CardHeader>
                    <CardTitle>Reporte de Cumplimiento</CardTitle>
                    <CardDescription>Evaluación de conformidad del sistema</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-bold">{complianceReport.puntuacionGeneral || 0}%</div>
                        <div className="text-sm text-muted-foreground">Puntuación General</div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                        {complianceReport.cumplimientoPorCategoria?.map((cat: Record<string, any>) => (
                          <div key={cat.categoria} className="flex justify-between p-2 rounded bg-muted/50">
                            <span className="text-sm text-muted-foreground">{cat.categoria}</span>
                            <Badge variant={cat.estado === 'cumple' ? 'success' : cat.estado === 'parcial' ? 'warning' : 'destructive'}>
                              {cat.puntuacion}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>


      </Tabs>

      {/* Assign Dialog (rendered outside tabs so it persists) */}
      {renderAssignDialog()}

      {/* Global Notification Dialog */}
      <Dialog open={notifDialogOpen} onOpenChange={setNotifDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nueva Notificación Global</DialogTitle>
            <DialogDescription>Este anuncio será visible para todos los usuarios del sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notifTitle">Título *</Label>
              <Input id="notifTitle" value={notifForm.title} onChange={e => setNotifForm(p => ({ ...p, title: e.target.value }))} placeholder="Ej: Mantenimiento programado" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notifMessage">Mensaje *</Label>
              <Textarea id="notifMessage" value={notifForm.message} onChange={e => setNotifForm(p => ({ ...p, message: e.target.value }))} rows={4} placeholder="Descripción del anuncio..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="notifType">Tipo</Label>
                <Select value={notifForm.type} onValueChange={v => setNotifForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger id="notifType"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">Sistema</SelectItem>
                    <SelectItem value="announcement">Anuncio</SelectItem>
                    <SelectItem value="maintenance">Mantenimiento</SelectItem>
                    <SelectItem value="alert">Alerta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notifPriority">Prioridad</Label>
                <Select value={notifForm.priority} onValueChange={v => setNotifForm(p => ({ ...p, priority: v }))}>
                  <SelectTrigger id="notifPriority"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreateGlobalNotif} disabled={!notifForm.title || !notifForm.message}>
              <Plus className="h-4 w-4 mr-1" />
              Crear Notificación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============ ALL EVALUATIONS VIEW ============
function AllEvaluationsView() {
  const [evaluations, setEvaluations] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const perPage = 50;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api.getAdminAllEvaluations({ page, limit: perPage })
      .then((res: any) => {
        if (cancelled) return;
        if (res?.success) {
          const items = Array.isArray(res.data) ? res.data : (Array.isArray(res) ? res : []);
          setEvaluations(items);
          setTotal(res.pagination?.total || items.length || 0);
        } else {
          setError('Error al cargar evaluaciones');
        }
      })
      .catch((err: any) => {
        if (!cancelled) setError(err?.message || 'Error de conexión');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page]);

  const totalPages = Math.ceil(total / perPage) || 1;

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      pendiente: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
      en_progreso: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
      completada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    };
    const labels: Record<string, string> = {
      pendiente: 'Pendiente',
      en_progreso: 'En Progreso',
      completada: 'Completada',
    };
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    );
  };

  const getRecBadge = (rec: string | null) => {
    if (!rec) return <span className="text-xs text-muted-foreground">—</span>;
    const colors: Record<string, string> = {
      aprobar: 'text-green-600',
      rechazar: 'text-red-600',
      revision: 'text-amber-600',
    };
    return <span className={`text-xs font-medium ${colors[rec] || ''}`}>{rec}</span>;
  };

  if (loading) {
    return <LoadingSkeleton variant="table" count={5} />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between px-3 sm:px-6">
        <div className="min-w-0">
          <CardTitle className="text-sm sm:text-base truncate">Todas las Evaluaciones</CardTitle>
          <CardDescription className="truncate">
            {error ? 'Error al cargar' : total > 0 ? `Total: ${total} evaluaciones` : 'Sin evaluaciones'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-2 sm:px-6">
        {error ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : evaluations.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No hay evaluaciones registradas</p>
        ) : (
          <>
            <div className="overflow-x-auto -mx-2 sm:mx-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs whitespace-nowrap">Evaluador</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Propuesta</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Estado</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Puntaje</TableHead>
                    <TableHead className="text-xs whitespace-nowrap">Recomendación</TableHead>
                    <TableHead className="text-xs whitespace-nowrap hidden sm:table-cell">Fecha</TableHead>
                    <TableHead className="text-xs whitespace-nowrap hidden md:table-cell">Criterios</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {evaluations.map((ev: Record<string, any>) => (
                    <TableRow key={ev.id}>
                      <TableCell>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[180px]">{ev.evaluator?.name || '—'}</p>
                          <p className="text-[10px] text-muted-foreground truncate max-w-[120px] sm:max-w-[180px]">{ev.evaluator?.email || ''}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[250px]">{ev.proposal?.title || '—'}</p>
                        <span className="text-[10px] text-muted-foreground">{ev.proposal?.type || ''}</span>
                      </TableCell>
                      <TableCell>{getStatusBadge(ev.status)}</TableCell>
                      <TableCell>
                        <span className="text-xs sm:text-sm font-medium">
                          {ev.totalScore != null ? Number(ev.totalScore).toFixed(1) : '—'}
                        </span>
                      </TableCell>
                      <TableCell>{getRecBadge(ev.recommendation)}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {ev.createdAt ? new Date(ev.createdAt).toLocaleDateString('es-ES') : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="text-xs text-muted-foreground">{ev.scores?.length || 0}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 mt-4">
                <p className="text-xs text-muted-foreground">
                  Página {page} de {totalPages}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline ml-1">Anterior</span>
                  </Button>
                  <span className="text-xs text-muted-foreground sm:hidden">{page}/{totalPages}</span>
                  <div className="hidden sm:flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let p = i + 1;
                      if (totalPages > 5 && page > 3) p = Math.min(Math.max(page - 2 + i, 1), totalPages - 4 + i);
                      return (
                        <Button key={p} variant={page === p ? 'default' : 'outline'} size="sm" className="w-7 h-8 text-xs" onClick={() => setPage(p)}>
                          {p}
                        </Button>
                      );
                    })}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 text-xs px-2" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                    <span className="hidden sm:inline mr-1">Siguiente</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AdminPanel;
