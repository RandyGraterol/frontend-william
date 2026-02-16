import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { 
  Users, 
  Settings, 
  FileText, 
  BarChart3, 
  Bell, 
  Plus, 
  Pencil, 
  Trash2, 
  Download,
  ArrowRight,
  GripVertical
} from "lucide-react";

// Mock data for users
const mockUsers = [
  { id: "1", name: "Juan García", email: "juan@ejemplo.com", role: "admin", status: "active" },
  { id: "2", name: "María López", email: "maria@ejemplo.com", role: "evaluator", status: "active" },
  { id: "3", name: "Carlos Ruiz", email: "carlos@ejemplo.com", role: "user", status: "inactive" },
  { id: "4", name: "Ana Martínez", email: "ana@ejemplo.com", role: "evaluator", status: "active" },
];

// Mock data for workflow steps
const mockWorkflowSteps = [
  { id: "1", name: "Borrador", order: 1, role: "user", conditions: "Ninguna" },
  { id: "2", name: "Revisión Inicial", order: 2, role: "evaluator", conditions: "Propuesta completa" },
  { id: "3", name: "Evaluación Técnica", order: 3, role: "evaluator", conditions: "Aprobación inicial" },
  { id: "4", name: "Aprobación Final", order: 4, role: "admin", conditions: "Puntuación >= 70%" },
];

// Mock data for rubric criteria
const mockRubricCriteria = [
  { id: "1", name: "Innovación", description: "Grado de novedad de la propuesta", weight: 25, maxScore: 10 },
  { id: "2", name: "Viabilidad", description: "Factibilidad técnica y financiera", weight: 30, maxScore: 10 },
  { id: "3", name: "Impacto", description: "Beneficio esperado para la organización", weight: 25, maxScore: 10 },
  { id: "4", name: "Claridad", description: "Calidad de la documentación", weight: 20, maxScore: 10 },
];

// Mock statistics
const mockStats = {
  totalProposals: 156,
  approved: 89,
  rejected: 42,
  pending: 25,
  avgEvaluationTime: "3.5 días",
  avgScore: 7.2,
};

const AdminPanel = () => {
  const [users, setUsers] = useState(mockUsers);
  const [workflowSteps, setWorkflowSteps] = useState(mockWorkflowSteps);
  const [rubricCriteria, setRubricCriteria] = useState(mockRubricCriteria);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isRubricDialogOpen, setIsRubricDialogOpen] = useState(false);

  // Notification settings state
  const [notifications, setNotifications] = useState({
    newProposal: true,
    statusChange: true,
    evaluationComplete: true,
    deadlineReminder: true,
    emailDigest: false,
  });

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin": return "destructive";
      case "evaluator": return "default";
      default: return "secondary";
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    return status === "active" ? "default" : "outline";
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground">Gestiona usuarios, workflows, rúbricas y configuraciones</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Usuarios</span>
          </TabsTrigger>
          <TabsTrigger value="workflows" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Workflows</span>
          </TabsTrigger>
          <TabsTrigger value="rubrics" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Rúbricas</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Reportes</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificaciones</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gestión de Usuarios</CardTitle>
                <CardDescription>Administra usuarios y sus roles en el sistema</CardDescription>
              </div>
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Usuario
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                    <DialogDescription>Añade un nuevo usuario al sistema</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input id="name" placeholder="Juan García" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input id="email" type="email" placeholder="juan@ejemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="evaluator">Evaluador</SelectItem>
                          <SelectItem value="user">Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsUserDialogOpen(false)}>
                      Crear Usuario
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>
                          {user.role === "admin" ? "Administrador" : 
                           user.role === "evaluator" ? "Evaluador" : "Usuario"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(user.status)}>
                          {user.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Workflows Tab */}
        <TabsContent value="workflows" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Configuración de Workflows</CardTitle>
                <CardDescription>Define los pasos del proceso de evaluación</CardDescription>
              </div>
              <Dialog open={isWorkflowDialogOpen} onOpenChange={setIsWorkflowDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Paso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Paso de Workflow</DialogTitle>
                    <DialogDescription>Define un nuevo paso en el proceso</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="stepName">Nombre del Paso</Label>
                      <Input id="stepName" placeholder="Revisión Técnica" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stepRole">Rol Responsable</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar rol" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Administrador</SelectItem>
                          <SelectItem value="evaluator">Evaluador</SelectItem>
                          <SelectItem value="user">Usuario</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="conditions">Condiciones</Label>
                      <Textarea 
                        id="conditions" 
                        placeholder="Ej: Puntuación >= 70%, Documentación completa"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsWorkflowDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsWorkflowDialogOpen(false)}>
                      Crear Paso
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflowSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-muted-foreground">
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
                            <span>•</span>
                            <span>{step.conditions}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    {index < workflowSteps.length - 1 && (
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rubrics Tab */}
        <TabsContent value="rubrics" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Configuración de Rúbricas</CardTitle>
                <CardDescription>Define los criterios de evaluación y sus ponderaciones</CardDescription>
              </div>
              <Dialog open={isRubricDialogOpen} onOpenChange={setIsRubricDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Criterio
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Criterio de Evaluación</DialogTitle>
                    <DialogDescription>Define un nuevo criterio para la rúbrica</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="criteriaName">Nombre del Criterio</Label>
                      <Input id="criteriaName" placeholder="Innovación" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="criteriaDesc">Descripción</Label>
                      <Textarea 
                        id="criteriaDesc" 
                        placeholder="Describe qué se evalúa con este criterio"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="weight">Ponderación (%)</Label>
                        <Input id="weight" type="number" placeholder="25" min="0" max="100" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxScore">Puntuación Máxima</Label>
                        <Input id="maxScore" type="number" placeholder="10" min="1" />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRubricDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={() => setIsRubricDialogOpen(false)}>
                      Crear Criterio
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Criterio</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Ponderación</TableHead>
                    <TableHead className="text-center">Puntuación Máx.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rubricCriteria.map((criteria) => (
                    <TableRow key={criteria.id}>
                      <TableCell className="font-medium">{criteria.name}</TableCell>
                      <TableCell className="text-muted-foreground">{criteria.description}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{criteria.weight}%</Badge>
                      </TableCell>
                      <TableCell className="text-center">{criteria.maxScore}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ponderación Total:</span>
                  <Badge variant={rubricCriteria.reduce((acc, c) => acc + c.weight, 0) === 100 ? "default" : "destructive"}>
                    {rubricCriteria.reduce((acc, c) => acc + c.weight, 0)}%
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Propuestas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.totalProposals}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tiempo Promedio Evaluación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.avgEvaluationTime}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Puntuación Promedio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockStats.avgScore}/10</div>
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
                <div className="flex items-center justify-between">
                  <span>Aprobadas</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${(mockStats.approved / mockStats.totalProposals) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{mockStats.approved}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Rechazadas</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500" 
                        style={{ width: `${(mockStats.rejected / mockStats.totalProposals) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{mockStats.rejected}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Pendientes</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500" 
                        style={{ width: `${(mockStats.pending / mockStats.totalProposals) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium">{mockStats.pending}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

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
                <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
                  <Download className="h-6 w-6" />
                  <span>Reporte Completo (PDF)</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Notificaciones</CardTitle>
              <CardDescription>Configura qué notificaciones deseas recibir</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Nueva Propuesta</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir notificación cuando se cree una nueva propuesta
                  </p>
                </div>
                <Switch 
                  checked={notifications.newProposal}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, newProposal: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Cambio de Estado</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando una propuesta cambie de estado
                  </p>
                </div>
                <Switch 
                  checked={notifications.statusChange}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, statusChange: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Evaluación Completada</Label>
                  <p className="text-sm text-muted-foreground">
                    Notificar cuando se complete una evaluación
                  </p>
                </div>
                <Switch 
                  checked={notifications.evaluationComplete}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, evaluationComplete: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Recordatorio de Fecha Límite</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir recordatorios antes de las fechas límite
                  </p>
                </div>
                <Switch 
                  checked={notifications.deadlineReminder}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, deadlineReminder: checked }))
                  }
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Resumen por Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir un resumen diario de actividad por email
                  </p>
                </div>
                <Switch 
                  checked={notifications.emailDigest}
                  onCheckedChange={(checked) => 
                    setNotifications(prev => ({ ...prev, emailDigest: checked }))
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Configuración de Email</CardTitle>
              <CardDescription>Configura las opciones de correo electrónico</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="senderName">Nombre del Remitente</Label>
                <Input id="senderName" placeholder="Sistema de Propuestas" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="replyTo">Correo de Respuesta</Label>
                <Input id="replyTo" type="email" placeholder="noreply@ejemplo.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="digestTime">Hora del Resumen Diario</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="08:00">08:00 AM</SelectItem>
                    <SelectItem value="09:00">09:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="18:00">06:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button className="mt-4">Guardar Configuración</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;
