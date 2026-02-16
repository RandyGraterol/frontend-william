import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  BookOpen, 
  Wallet, 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Send,
  Upload,
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

// Form data interface
interface ProposalFormData {
  // Información básica
  titulo: string;
  tipo: ProposalType | '';
  duracion: string;
  modalidad: string;
  
  // Contenido
  objetivos: string;
  competencias: string;
  programa: string;
  
  // Recursos
  presupuesto: string;
  facilitadores: string;
  requisitos: string;
  
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
  presupuesto: '',
  facilitadores: '',
  requisitos: '',
  documentos: [],
};

// Validation errors interface
interface ValidationErrors {
  [key: string]: string;
}

// Step configuration
const steps = [
  { id: 1, title: 'Información Básica', icon: FileText },
  { id: 2, title: 'Contenido', icon: BookOpen },
  { id: 3, title: 'Recursos', icon: Wallet },
];

export default function ProposalForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProposalFormData>(initialFormData);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    }

    if (step === 3) {
      if (!formData.presupuesto.trim()) newErrors.presupuesto = 'El presupuesto es requerido';
      if (!formData.facilitadores.trim()) newErrors.facilitadores = 'Los facilitadores son requeridos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
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

  // Save as draft
  const handleSaveDraft = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Borrador guardado',
        description: 'La propuesta ha sido guardada como borrador',
      });
      navigate('/proposals');
    }, 1000);
  };

  // Submit proposal
  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: 'Propuesta enviada',
        description: 'La propuesta ha sido enviada para evaluación',
      });
      navigate('/proposals');
    }, 1500);
  };

  // Input field component with validation
  const FormField = ({
    label,
    name,
    type = 'text',
    placeholder,
    required = false,
    multiline = false,
    rows = 4,
  }: {
    label: string;
    name: keyof ProposalFormData;
    type?: string;
    placeholder?: string;
    required?: boolean;
    multiline?: boolean;
    rows?: number;
  }) => {
    const hasError = !!errors[name];
    const value = formData[name] as string;

    return (
      <div className="space-y-2">
        <Label htmlFor={name} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>
        {multiline ? (
          <Textarea
            id={name}
            value={value}
            onChange={(e) => updateField(name, e.target.value)}
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
            onChange={(e) => updateField(name, e.target.value)}
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

  // Step 1: Información Básica
  const renderStep1 = () => (
    <div className="space-y-6">
      <FormField
        label="Título de la Propuesta"
        name="titulo"
        placeholder="Ingrese el título de la propuesta"
        required
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

  // Step 2: Contenido
  const renderStep2 = () => (
    <div className="space-y-6">
      <FormField
        label="Objetivos"
        name="objetivos"
        placeholder="Describa los objetivos del programa (uno por línea)"
        required
        multiline
        rows={4}
      />

      <FormField
        label="Competencias a Desarrollar"
        name="competencias"
        placeholder="Liste las competencias que se desarrollarán"
        required
        multiline
        rows={4}
      />

      <FormField
        label="Programa / Contenido Temático"
        name="programa"
        placeholder="Detalle el contenido programático"
        required
        multiline
        rows={6}
      />
    </div>
  );

  // Step 3: Recursos
  const renderStep3 = () => (
    <div className="space-y-6">
      <FormField
        label="Presupuesto Estimado"
        name="presupuesto"
        placeholder="Ingrese el presupuesto estimado"
        required
      />

      <FormField
        label="Facilitadores / Instructores"
        name="facilitadores"
        placeholder="Nombres y credenciales de los facilitadores"
        required
        multiline
        rows={3}
      />

      <FormField
        label="Requisitos de Ingreso"
        name="requisitos"
        placeholder="Requisitos para los participantes (opcional)"
        multiline
        rows={3}
      />

      {/* Document upload section */}
      <div className="space-y-4">
        <Label>Documentos de Soporte</Label>
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
              Haga clic para subir archivos
            </span>
            <span className="text-xs text-muted-foreground">
              PDF, DOC, DOCX, XLS, XLSX (máx. 10MB)
            </span>
          </label>
        </div>

        {formData.documentos.length > 0 && (
          <div className="space-y-2">
            {formData.documentos.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-muted rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {(file.size / 1024).toFixed(1)} KB
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Vista Previa de la Propuesta</h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(false)}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver a editar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{formData.titulo}</CardTitle>
              <div className="flex items-center gap-2 mt-2">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-foreground mb-2">Presupuesto</h4>
              <p className="text-muted-foreground">{formData.presupuesto}</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-2">Facilitadores</h4>
              <p className="text-muted-foreground whitespace-pre-line">
                {formData.facilitadores}
              </p>
            </div>
          </div>

          {formData.requisitos && (
            <div>
              <h4 className="font-medium text-foreground mb-2">Requisitos</h4>
              <p className="text-muted-foreground whitespace-pre-line">
                {formData.requisitos}
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
      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <Button
          variant="outline"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          Guardar como Borrador
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="flex-1"
        >
          <Send className="h-4 w-4 mr-2" />
          Enviar Propuesta
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Nueva Propuesta</h1>
          <p className="page-subtitle">
            Complete el formulario para crear una nueva propuesta de programa
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/proposals')}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Volver
        </Button>
      </div>

      {/* Step indicator */}
      {!showPreview && (
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
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
                      'flex items-center gap-2 px-4 py-2 rounded-lg transition-all',
                      isActive && 'bg-primary text-primary-foreground',
                      isCompleted && 'bg-primary/20 text-primary cursor-pointer hover:bg-primary/30',
                      !isActive && !isCompleted && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Icon className="h-4 w-4" />
                    )}
                    <span className="hidden sm:inline text-sm font-medium">
                      {step.title}
                    </span>
                    <span className="sm:hidden text-sm font-medium">
                      {step.id}
                    </span>
                  </button>
                  {index < steps.length - 1 && (
                    <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Form content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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
        <CardContent>
          {showPreview ? (
            renderPreview()
          ) : (
            <>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={currentStep === 1}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Anterior
                </Button>
                <Button onClick={handleNext}>
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
