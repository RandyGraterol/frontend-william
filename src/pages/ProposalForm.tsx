import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FileText, 
  BookOpen, 
  Wallet, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send,
  Upload,
  Download,
  X,
  Check,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { ProposalType, proposalTypeLabels } from '@/types/proposal';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

// Form data interface (alineada con ActivityFormPage de Cristopher)
interface ProposalFormData {
  // Información básica
  titulo: string;
  tipo: ProposalType | '';
  duracion: string;
  modalidad: string;
  
  // Contenido curricular
  objetivos: string;
  competencias: string;
  programa: string;
  presentacion: string;
  justificacion: string;
  perfilIngreso: string;
  perfilEgreso: string;
  ejesTransversales: string;
  
  // Recursos y administración
  presupuesto: string;
  requisitos: string;
  requisitosEgreso: string;
  credencialOtorgar: string;
  cupoMinimo: string;
  cupoMaximo: string;
  
  // Documentos
  documentos: File[];
}

const initialFormData: ProposalFormData = {
  titulo: '',
  tipo: '',
  duracion: '',
  modalidad: '',
  objetivos: '',
  competencias: '',
  programa: '',
  presentacion: '',
  justificacion: '',
  perfilIngreso: '',
  perfilEgreso: '',
  ejesTransversales: '',
  presupuesto: '',
  requisitos: '',
  requisitosEgreso: '',
  credencialOtorgar: '',
  cupoMinimo: '',
  cupoMaximo: '',
  documentos: [],
};

// Validation errors interface
interface ValidationErrors {
  [key: string]: string;
}

// Step configuration
const steps = [
  { id: 1, title: 'Información Básica', icon: FileText },
  { id: 2, title: 'Contenido Curricular', icon: BookOpen },
  { id: 3, title: 'Recursos y Administración', icon: Wallet },
];

// ============ Stable FormField component (defined OUTSIDE to prevent focus loss on re-render) ============

interface FormFieldProps {
  label: string;
  name: keyof ProposalFormData;
  type?: string;
  placeholder?: string;
  required?: boolean;
  multiline?: boolean;
  rows?: number;
  formData: ProposalFormData;
  errors: ValidationErrors;
  onUpdate: (field: keyof ProposalFormData, value: string | File[]) => void;
}

const FormField = ({
  label,
  name,
  type = 'text',
  placeholder,
  required = false,
  multiline = false,
  rows = 4,
  formData,
  errors,
  onUpdate,
}: FormFieldProps) => {
  const hasError = !!errors[name];
  const value = formData[name] as string;

  return (
    <div className="space-y-4">
      <Label htmlFor={name} className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {multiline ? (
        <Textarea
          id={name}
          value={value}
          onChange={(e) => onUpdate(name, e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={cn(
            'resize-none transition-colors',
            hasError && 'border-destructive focus-visible:ring-destructive'
          )}
        />
      ) : (
        <Input
          id={name}
          type={type}
          value={value}
          onChange={(e) => onUpdate(name, e.target.value)}
          placeholder={placeholder}
          className={cn(
            'transition-colors',
            hasError && 'border-destructive focus-visible:ring-destructive'
          )}
        />
      )}
      {hasError && (
        <p className="text-sm text-destructive">{errors[name]}</p>
      )}
    </div>
  );
};

export default function ProposalForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  const isEditMode = !!id;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [existingDocuments, setExistingDocuments] = useState<Record<string, any>[]>([]);
  const [originalStatus, setOriginalStatus] = useState<string | null>(null);

  // ============ Load existing proposal for edit mode ============
  useEffect(() => {
    if (!id) return;

    const fetchProposal = async () => {
      setIsLoading(true);
      try {
        const response = await api.getProposal(id);
        if (response.success && response.data) {
          const p = response.data as Record<string, any>;
          setFormData({
            titulo: p.title || '',
            tipo: (p.type as ProposalType) || '',
            duracion: p.duration || '',
            modalidad: (p.modality || '').toLowerCase(),
            objetivos: Array.isArray(p.objectives) ? p.objectives.join('\n') : (typeof p.objectives === 'string' ? p.objectives : ''),
            competencias: p.competencias || '',
            programa: p.programa || '',
            presentacion: p.presentation || '',
            justificacion: p.justification || '',
            perfilIngreso: p.entryProfile || '',
            perfilEgreso: p.graduationProfile || '',
            ejesTransversales: p.transversalAxes || '',
            presupuesto: p.budget ? String(p.budget) : '',
            requisitos: p.requirements || '',
            requisitosEgreso: p.exitRequirements || '',
            credencialOtorgar: p.credentialToAward || '',
            cupoMinimo: p.minQuota != null ? String(p.minQuota) : '',
            cupoMaximo: p.maxQuota != null ? String(p.maxQuota) : '',
            documentos: [],
          });
          if (Array.isArray(p.documents)) {
            setExistingDocuments(p.documents);
          }
          setOriginalStatus(p.status || null);
        }
      } catch {
        toast({
          title: 'Error al cargar',
          description: 'No se pudo cargar la propuesta para edición.',
          variant: 'destructive',
        });
        navigate('/proposals/list', { replace: true });
        return;
      } finally {
        setIsLoading(false);
      }
    };
    fetchProposal();
  }, [id]);

  // Update form field
  const updateField = (field: keyof ProposalFormData, value: string | File[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (step === 1) {
      if (!formData.titulo.trim()) newErrors.titulo = 'El título es requerido';
      if (!formData.tipo) newErrors.tipo = 'Seleccione un tipo';
      if (!formData.duracion.trim()) newErrors.duracion = 'La duración es requerida';
      if (!formData.modalidad) newErrors.modalidad = 'Seleccione una modalidad';
    }

    if (step === 2) {
      if (!formData.objetivos.trim()) newErrors.objetivos = 'Los objetivos son requeridos';
      if (!formData.competencias.trim()) newErrors.competencias = 'Las competencias son requeridas';
      if (!formData.programa.trim()) newErrors.programa = 'El programa es requerido';
      if (!formData.perfilIngreso.trim()) newErrors.perfilIngreso = 'El perfil de ingreso es requerido';
      if (!formData.perfilEgreso.trim()) newErrors.perfilEgreso = 'El perfil de egreso es requerido';
    }

    if (step === 3) {
      if (!formData.presupuesto.trim()) newErrors.presupuesto = 'El presupuesto es requerido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        setShowPreview(true);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Handle file upload (simulated)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles = [...formData.documentos, ...Array.from(files)];
      updateField('documentos', newFiles);
      toast({
        title: 'Documentos agregados',
        description: `${files.length} archivo(s) agregado(s) exitosamente`,
      });
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    const newFiles = formData.documentos.filter((_, i) => i !== index);
    updateField('documentos', newFiles);
  };

  // Delete an existing document from the server
  const handleDeleteExistingDocument = async (doc: Record<string, any>) => {
    if (!id || !user?.id) return;
    try {
      await api.deleteProposalDocument(id, doc.id, user.id);
      setExistingDocuments(prev => prev.filter(d => d.id !== doc.id));
      toast({
        title: 'Documento eliminado',
        description: `"${doc.name}" ha sido eliminado.`,
      });
    } catch {
      toast({
        title: 'Error al eliminar',
        description: 'No se pudo eliminar el documento.',
        variant: 'destructive',
      });
    }
  };

  // ============ Build API payload from form ============
  const buildProposalPayload = (options?: { withSubmittedAt?: boolean; status?: string }) => {
    const payload: Record<string, any> = {
      title: formData.titulo,
      type: formData.tipo,
      duration: formData.duracion,
      modality: formData.modalidad,
      objectives: (formData.objetivos || '').split('\n').filter((o: string) => o.trim()),
      competencias: formData.competencias,
      programa: formData.programa,
      presentation: formData.presentacion,
      justification: formData.justificacion,
      entryProfile: formData.perfilIngreso,
      graduationProfile: formData.perfilEgreso,
      transversalAxes: formData.ejesTransversales,
      budget: formData.presupuesto,
      requirements: formData.requisitos,
      exitRequirements: formData.requisitosEgreso,
      credentialToAward: formData.credencialOtorgar,
      minQuota: formData.cupoMinimo ? parseInt(formData.cupoMinimo) : null,
      maxQuota: formData.cupoMaximo ? parseInt(formData.cupoMaximo) : null,
      proposerId: user?.id,
      proposerRole: user?.role,
    };
    if (options?.status) {
      payload.status = options.status;
    }
    if (options?.withSubmittedAt) {
      payload.submittedAt = new Date().toISOString();
    }
    return payload;
  };

  const uploadDocuments = async (proposalId: string) => {
    if (formData.documentos.length === 0) return;
    const formDataObj = new FormData();
    formData.documentos.forEach(file => formDataObj.append('files', file));
    formDataObj.append('requestedByUserId', user?.id || '');
    await api.uploadProposalDocuments(proposalId, formDataObj);
  };

  // Save as draft
  const handleSaveDraft = async () => {
    if (!user?.id) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para guardar una propuesta.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let proposalId = id;
      if (isEditMode && id) {
        await api.updateProposal(id, {
          ...buildProposalPayload(),
          requestedByUserId: user.id,
        });
        await uploadDocuments(id);
        toast({
          title: 'Borrador actualizado',
          description: 'La propuesta ha sido actualizada como borrador.',
        });
      } else {
        const res = await api.createProposal(buildProposalPayload());
        const created = res.data as Record<string, any>;
        proposalId = created?.id;
        if (proposalId) await uploadDocuments(proposalId);
        toast({
          title: 'Borrador guardado',
          description: 'La propuesta ha sido guardada como borrador.',
        });
      }
      setTimeout(() => window.location.href = '/proposals/list', 0);
      return;
    } catch (error: any) {
      toast({
        title: 'Error al guardar',
        description: error?.message || 'No se pudo guardar la propuesta. Intente nuevamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  // Submit proposal
  const validateAll = (): boolean => {
    const allErrors: ValidationErrors = {};
    if (!formData.titulo.trim()) allErrors.titulo = 'El título es requerido';
    if (!formData.tipo) allErrors.tipo = 'Seleccione un tipo';
    if (!formData.duracion.trim()) allErrors.duracion = 'La duración es requerida';
    if (!formData.modalidad) allErrors.modalidad = 'Seleccione una modalidad';
    if (!formData.objetivos.trim()) allErrors.objetivos = 'Los objetivos son requeridos';
    if (!formData.competencias.trim()) allErrors.competencias = 'Las competencias son requeridas';
    if (!formData.programa.trim()) allErrors.programa = 'El programa es requerido';
    if (!formData.perfilIngreso.trim()) allErrors.perfilIngreso = 'El perfil de ingreso es requerido';
    if (!formData.perfilEgreso.trim()) allErrors.perfilEgreso = 'El perfil de egreso es requerido';
    if (!formData.presupuesto.trim()) allErrors.presupuesto = 'El presupuesto es requerido';
    setErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para enviar una propuesta.',
        variant: 'destructive',
      });
      return;
    }
    if (!validateAll()) {
      toast({
        title: 'Campos incompletos',
        description: 'Revisa todos los pasos, hay campos obligatorios sin completar.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      let proposalId = id;
      if (!isEditMode || !proposalId) {
        const res = await api.createProposal(buildProposalPayload({ withSubmittedAt: true }));
        const created = res.data as Record<string, any>;
        proposalId = created?.id;
        if (!proposalId) throw new Error('No se recibió ID de la propuesta');
      } else {
        await api.updateProposal(proposalId, {
          ...buildProposalPayload({ withSubmittedAt: true }),
          requestedByUserId: user.id,
        });
      }
      await uploadDocuments(proposalId);
      await api.updateProposalStatus(proposalId, {
        status: 'enviada',
        userId: user.id,
        comments: 'Propuesta enviada para evaluación',
        role: user.role,
      });
      console.log('[ProposalForm] Navigating to /proposals/list');
      window.location.href = '/proposals/list?toast=propuesta_enviada';
    } catch (error: any) {
      toast({
        title: 'Error al enviar',
        description: error?.message || 'No se pudo enviar la propuesta. Intente nuevamente.',
        variant: 'destructive',
      });
      setIsSubmitting(false);
    }
  };

  // Step 1: Información Básica
  const renderStep1 = () => (
    <div className="space-y-6">
      <FormField
        label="Título de la Propuesta"
        name="titulo"
        placeholder="Ingrese el título de la propuesta"
        required
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="flex items-center gap-1">
            Tipo de Programa
            <span className="text-destructive">*</span>
          </Label>
          <Select
            value={formData.tipo}
            onValueChange={(value) => updateField('tipo', value as ProposalType)}
          >
            <SelectTrigger
              className={cn(
                errors.tipo && 'border-destructive focus:ring-destructive'
              )}
            >
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              {Object.entries(proposalTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.tipo && (
            <p className="text-sm text-destructive">{errors.tipo}</p>
          )}
        </div>

        <FormField
          label="Duración"
          name="duracion"
          placeholder="Ej: 40 horas, 3 meses"
          required
          formData={formData}
          errors={errors}
          onUpdate={updateField}
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-1">
          Modalidad
          <span className="text-destructive">*</span>
        </Label>
        <Select
          value={formData.modalidad}
          onValueChange={(value) => updateField('modalidad', value)}
        >
          <SelectTrigger
            className={cn(
              errors.modalidad && 'border-destructive focus:ring-destructive'
            )}
          >
            <SelectValue placeholder="Seleccionar modalidad" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="presencial">Presencial</SelectItem>
            <SelectItem value="virtual">Virtual</SelectItem>
            <SelectItem value="mixta">Mixta</SelectItem>
          </SelectContent>
        </Select>
        {errors.modalidad && (
          <p className="text-sm text-destructive">{errors.modalidad}</p>
        )}
      </div>
    </div>
  );

  // Step 2: Contenido Curricular
  const renderStep2 = () => (
    <div className="space-y-6">
      <FormField
        label="Objetivos"
        name="objetivos"
        placeholder="Describa los objetivos del programa (uno por línea)"
        required
        multiline
        rows={4}
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      <FormField
        label="Competencias a Desarrollar"
        name="competencias"
        placeholder="Liste las competencias que se desarrollarán"
        required
        multiline
        rows={4}
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      <FormField
        label="Programa / Contenido Temático"
        name="programa"
        placeholder="Detalle el contenido programático"
        required
        multiline
        rows={6}
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      {/* --- Nuevos campos curriculares --- */}
      <div className="border-t pt-6 mt-6 space-y-6">
        <h3 className="text-sm font-semibold text-foreground mb-4">Perfiles y Fundamentación</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Perfil de Ingreso"
            name="perfilIngreso"
            placeholder="Conocimientos y habilidades previas requeridas"
            required
            multiline
            rows={4}
            formData={formData}
            errors={errors}
            onUpdate={updateField}
          />
          <FormField
            label="Perfil de Egreso"
            name="perfilEgreso"
            placeholder="Competencias a desarrollar al finalizar"
            required
            multiline
            rows={4}
            formData={formData}
            errors={errors}
            onUpdate={updateField}
          />
        </div>

        <FormField
          label="Ejes Transversales"
          name="ejesTransversales"
          placeholder="TIC, Investigación, Ética, etc."
          multiline
          rows={3}
          formData={formData}
          errors={errors}
          onUpdate={updateField}
        />

        <FormField
          label="Presentación"
          name="presentacion"
          placeholder="Propósitos, componentes y estructura de la actividad formativa"
          multiline
          rows={4}
          formData={formData}
          errors={errors}
          onUpdate={updateField}
        />

        <FormField
          label="Justificación"
          name="justificacion"
          placeholder="Relevancia y beneficios de la actividad"
          multiline
          rows={4}
          formData={formData}
          errors={errors}
          onUpdate={updateField}
        />
      </div>
    </div>
  );

  // Step 3: Recursos y Administración
  const renderStep3 = () => (
    <div className="space-y-6">
      <FormField
        label="Presupuesto Estimado"
        name="presupuesto"
        placeholder="Ingrese el presupuesto estimado"
        required
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      {/* --- Campos administrativos --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          label="Cupo Mínimo de Participantes"
          name="cupoMinimo"
          type="number"
          placeholder="Ej: 15"
          formData={formData}
          errors={errors}
          onUpdate={updateField}
        />
        <FormField
          label="Cupo Máximo de Participantes"
          name="cupoMaximo"
          type="number"
          placeholder="Ej: 35"
          formData={formData}
          errors={errors}
          onUpdate={updateField}
        />
      </div>

      <FormField
        label="Credencial a Otorgar"
        name="credencialOtorgar"
        placeholder="Ej: Certificado de Aprobación"
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      <FormField
        label="Requisitos de Ingreso"
        name="requisitos"
        placeholder="Requisitos para los participantes"
        multiline
        rows={3}
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      <FormField
        label="Requisitos de Egreso"
        name="requisitosEgreso"
        placeholder="Requisitos para completar y obtener la credencial"
        multiline
        rows={3}
        formData={formData}
        errors={errors}
        onUpdate={updateField}
      />

      {/* Document upload section */}
    <div className="space-y-6">
        <Label>Documentos de Soporte</Label>

        {/* Existing documents (read-only from server) */}
        {existingDocuments.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Documentos actuales:</p>
            {existingDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{doc.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : ''}
                  </Badge>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      const fp = doc.filePath || '';
                      if (fp.startsWith('http')) { window.open(fp, '_blank'); return; }
                      const base = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/api\/?$/, '');
                      window.open(`${base}${fp.startsWith('/') ? '' : '/'}${fp}`, '_blank');
                    }}
                    title="Descargar"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDeleteExistingDocument(doc)}
                    title="Eliminar"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload new files */}
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            onChange={handleFileUpload}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center gap-2"
          >
            <Upload className="h-10 w-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {existingDocuments.length > 0 ? 'Agregar más archivos' : 'Haga clic para subir archivos'}
            </span>
            <span className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, XLS, XLSX (máx. 10MB)
            </span>
          </label>
        </div>

        {/* Newly added files */}
        {formData.documentos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Nuevos archivos:</p>
            {formData.documentos.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Preview component
  const renderPreview = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <h3 className="text-base sm:text-lg font-semibold">Vista Previa de la Propuesta</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(false)}
          className="self-start sm:self-auto"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a editar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4 p-4 sm:p-6">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg sm:text-xl">{formData.titulo}</CardTitle>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <Badge>{proposalTypeLabels[formData.tipo as ProposalType]}</Badge>
                <Badge variant="outline">{formData.modalidad}</Badge>
                <Badge variant="secondary">{formData.duracion}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium text-foreground mb-2">Objetivos</h4>
            <p className="text-muted-foreground whitespace-pre-line">
              {formData.objetivos}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Competencias</h4>
            <p className="text-muted-foreground whitespace-pre-line">
              {formData.competencias}
            </p>
          </div>

          <div>
            <h4 className="font-medium text-foreground mb-2">Programa</h4>
            <p className="text-muted-foreground whitespace-pre-line">
              {formData.programa}
            </p>
          </div>

          {formData.perfilIngreso && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Perfil de Ingreso</h4>
              <p className="text-muted-foreground whitespace-pre-line">{formData.perfilIngreso}</p>
            </div>
          )}

          {formData.perfilEgreso && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Perfil de Egreso</h4>
              <p className="text-muted-foreground whitespace-pre-line">{formData.perfilEgreso}</p>
            </div>
          )}

          {formData.ejesTransversales && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Ejes Transversales</h4>
              <p className="text-muted-foreground whitespace-pre-line">{formData.ejesTransversales}</p>
            </div>
          )}

          <div>
              <h4 className="font-medium text-foreground mb-2">Presupuesto</h4>
              <p className="text-muted-foreground">{formData.presupuesto}</p>
            </div>

          {formData.requisitos && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Requisitos de Ingreso</h4>
              <p className="text-muted-foreground whitespace-pre-line">
                {formData.requisitos}
              </p>
            </div>
          )}

          {formData.requisitosEgreso && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Requisitos de Egreso</h4>
              <p className="text-muted-foreground whitespace-pre-line">{formData.requisitosEgreso}</p>
            </div>
          )}

          {formData.credencialOtorgar && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Credencial a Otorgar</h4>
              <p className="text-muted-foreground">{formData.credencialOtorgar}</p>
            </div>
          )}

          {(formData.cupoMinimo || formData.cupoMaximo) && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Cupos</h4>
              <p className="text-muted-foreground">
                Mínimo: {formData.cupoMinimo || 'No especificado'} — Máximo: {formData.cupoMaximo || 'No especificado'}
              </p>
            </div>
          )}

          {formData.documentos.length > 0 && (
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Documentos Adjuntos ({formData.documentos.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {formData.documentos.map((file, index) => (
                  <Badge key={index} variant="secondary">
                    <FileText className="h-3 w-3 mr-1" />
                    {file.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-4 sticky bottom-0 bg-background pb-2">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="w-full sm:flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Guardar como Borrador
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full sm:flex-1"
        >
          <Send className="h-4 w-4 mr-2" />
          {isEditMode && originalStatus === 'en_evaluacion' ? 'Reenviar Propuesta' : 'Enviar Propuesta'}
        </Button>
      </div>
    </div>
  );

  // ============ Loading State (edit mode) ============

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-muted rounded animate-pulse" />
          <div className="space-y-2 flex-1">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-5 w-72 bg-muted rounded animate-pulse" />
          </div>
        </div>
        <div className="h-16 bg-muted rounded animate-pulse" />
        <div className="h-96 bg-muted rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-semibold text-foreground truncate">{isEditMode ? 'Editar Propuesta' : 'Nueva Propuesta'}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1 truncate">
            {isEditMode ? 'Modifique los campos de la propuesta existente' : 'Complete el formulario para crear una nueva propuesta de programa'}
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/proposals/list')} className="shrink-0 self-start sm:self-auto">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>

      {/* Step indicator */}
      {!showPreview && (
        <div className="flex items-center justify-center overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
          <div className="flex items-center gap-1 sm:gap-2">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;

              return (
                <div key={step.id} className="flex items-center">
                  <button
                    onClick={() => {
                      if (isCompleted) setCurrentStep(step.id);
                    }}
                    className={cn(
                      'flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-all text-xs sm:text-sm whitespace-nowrap',
                      isActive && 'bg-primary text-primary-foreground',
                      isCompleted && 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                    <span className="hidden sm:inline font-medium">
                      {step.title}
                    </span>
                    <span className="sm:hidden font-medium">
                      {step.id}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 mx-1 sm:mx-2 text-muted-foreground shrink-0" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form content */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            {showPreview ? (
              <>
                <Eye className="h-5 w-5" />
                Revisión Final
              </>
            ) : (
              <>
                {(() => {
                  const StepIcon = steps[currentStep - 1].icon;
                  return <StepIcon className="h-5 w-5" />;
                })()}
                {steps[currentStep - 1].title}
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {showPreview ? (
            renderPreview()
          ) : (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation buttons */}
              <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                  className="w-full sm:w-auto order-2 sm:order-1"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button onClick={handleNext} className="w-full sm:w-auto order-1 sm:order-2">
                  {currentStep === 3 ? (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Vista Previa
                    </>
                  ) : (
                    <>
                      Siguiente
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
