import jsPDF from 'jspdf';

const MARGIN_LEFT = 20;
const MARGIN_TOP = 20;
const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT * 2;
const LINE_HEIGHT = 7;

function addHeader(doc: jsPDF, title: string, subtitle?: string) {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(title, MARGIN_LEFT, MARGIN_TOP);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(subtitle, MARGIN_LEFT, MARGIN_TOP + 7);
  }

  doc.setDrawColor(200);
  doc.line(MARGIN_LEFT, MARGIN_TOP + 12, PAGE_WIDTH - MARGIN_LEFT, MARGIN_TOP + 12);
  doc.setTextColor(0);
}

function addSectionTitle(doc: jsPDF, title: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(40);
  doc.text(title, MARGIN_LEFT, y);
  doc.setFontSize(10);
  doc.setTextColor(0);
  return y + LINE_HEIGHT + 3;
}

function addField(doc: jsPDF, label: string, value: string, y: number): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(label + ':', MARGIN_LEFT, y);
  doc.setFont('helvetica', 'normal');
  const labelWidth = doc.getTextWidth(label + ': ') + 5;
  doc.text(value || 'No especificado', MARGIN_LEFT + labelWidth, y);
  return y + LINE_HEIGHT;
}

function addMultilineText(doc: jsPDF, label: string, text: string, y: number): number {
  if (!text) return y;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(label + ':', MARGIN_LEFT, y);
  y += LINE_HEIGHT;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  lines.forEach((line: string) => {
    if (y > PAGE_HEIGHT - 30) {
      doc.addPage();
      y = MARGIN_TOP;
    }
    doc.text(line, MARGIN_LEFT, y);
    y += 5;
  });
  doc.setFontSize(10);
  return y + 3;
}

function addListItem(doc: jsPDF, text: string, index: number, y: number): number {
  if (y > PAGE_HEIGHT - 30) {
    doc.addPage();
    y = MARGIN_TOP;
  }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`  ${index + 1}. ${text}`, MARGIN_LEFT, y);
  return y + LINE_HEIGHT;
}

function checkPageBreak(doc: jsPDF, y: number, needed: number = 20): number {
  if (y > PAGE_HEIGHT - needed) {
    doc.addPage();
    return MARGIN_TOP;
  }
  return y;
}

function addDivider(doc: jsPDF, y: number): number {
  y += 3;
  doc.setDrawColor(220);
  doc.line(MARGIN_LEFT, y, PAGE_WIDTH - MARGIN_LEFT, y);
  y += 5;
  doc.setDrawColor(0);
  return y;
}

export function generateProposalPDF(proposal: Record<string, any>) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN_TOP + 20;

  const statusLabels: Record<string, string> = {
    borrador: 'Borrador',
    enviada: 'Enviada',
    en_evaluacion: 'En Evaluación',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
  };

  const typeLabels: Record<string, string> = {
    curso: 'Curso',
    taller: 'Taller',
    diplomado: 'Diplomado',
    seminario: 'Seminario',
    congreso: 'Congreso',
    'programa-extension': 'Programa de Extensión',
    'formacion-docente': 'Formación Docente',
    otro: 'Otro',
  };

  addHeader(doc, proposal.title || 'Propuesta Formativa', `Estado: ${statusLabels[proposal.status] || proposal.status}`);

  addSectionTitle(doc, 'Datos Generales', y); y += LINE_HEIGHT + 3;

  y = addField(doc, 'Tipo', typeLabels[proposal.type] || proposal.type, y);
  if (proposal.modality) y = addField(doc, 'Modalidad', proposal.modality, y);
  y = addField(doc, 'Duración', proposal.duration || 'No especificada', y);
  y = addDivider(doc, y);

  y = addField(doc, 'Creado', proposal.createdAt ? new Date(proposal.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '-', y);
  y = addField(doc, 'Actualizado', proposal.updatedAt ? new Date(proposal.updatedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : '-', y);
  if (proposal.submittedAt) {
    y = addField(doc, 'Enviado', new Date(proposal.submittedAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }), y);
  }
  y = addDivider(doc, y);

  if (proposal.proponente || proposal.submitter) {
    const p = proposal.proponente || proposal.submitter;
    y = addField(doc, 'Proponente', p.name || 'No disponible', y);
    if (p.email) y = addField(doc, 'Email', p.email, y);
    if (p.department) y = addField(doc, 'Departamento', p.department, y);
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  if (proposal.description) {
    y = addSectionTitle(doc, 'Descripción', y);
    y += LINE_HEIGHT + 2;
    y = addMultilineText(doc, '', proposal.description, y - LINE_HEIGHT);
    y = addDivider(doc, y);
  }

  if (proposal.presentation || proposal.justification) {
    y = addSectionTitle(doc, 'Presentación y Justificación', y);
    y += LINE_HEIGHT + 2;
    if (proposal.presentation) y = addMultilineText(doc, 'Presentación', proposal.presentation, y);
    if (proposal.justification) y = addMultilineText(doc, 'Justificación', proposal.justification, y);
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  if (proposal.objectives && proposal.objectives.length > 0) {
    y = addSectionTitle(doc, 'Objetivos', y);
    y += LINE_HEIGHT + 2;
    const objectives = Array.isArray(proposal.objectives)
      ? proposal.objectives
      : typeof proposal.objectives === 'string'
        ? JSON.parse(proposal.objectives)
        : [];
    objectives.forEach((obj: string, i: number) => {
      y = addListItem(doc, obj, i, y);
    });
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  if (proposal.competencias) {
    y = addSectionTitle(doc, 'Competencias', y);
    y += LINE_HEIGHT + 2;
    y = addMultilineText(doc, '', proposal.competencias, y - LINE_HEIGHT);
    y = addDivider(doc, y);
  }

  if (proposal.programa) {
    y = addSectionTitle(doc, 'Programa', y);
    y += LINE_HEIGHT + 2;
    y = addMultilineText(doc, '', proposal.programa, y - LINE_HEIGHT);
    y = addDivider(doc, y);
  }

  if (proposal.methodology) {
    y = addSectionTitle(doc, 'Metodología', y);
    y += LINE_HEIGHT + 2;
    y = addMultilineText(doc, '', proposal.methodology, y - LINE_HEIGHT);
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  if (proposal.entryProfile || proposal.graduationProfile) {
    y = addSectionTitle(doc, 'Perfiles', y);
    y += LINE_HEIGHT + 2;
    if (proposal.entryProfile) y = addMultilineText(doc, 'Perfil de Ingreso', proposal.entryProfile, y);
    if (proposal.graduationProfile) y = addMultilineText(doc, 'Perfil de Egreso', proposal.graduationProfile, y);
    y = addDivider(doc, y);
  }

  if (proposal.transversalAxes) {
    y = addSectionTitle(doc, 'Ejes Transversales', y);
    y += LINE_HEIGHT + 2;
    y = addMultilineText(doc, '', proposal.transversalAxes, y - LINE_HEIGHT);
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  if (proposal.requirements || proposal.exitRequirements || proposal.credentialToAward) {
    y = addSectionTitle(doc, 'Requisitos', y);
    y += LINE_HEIGHT + 2;
    if (proposal.requirements) y = addMultilineText(doc, 'Requisitos de Ingreso', proposal.requirements, y);
    if (proposal.exitRequirements) y = addMultilineText(doc, 'Requisitos de Egreso', proposal.exitRequirements, y);
    if (proposal.credentialToAward) y = addField(doc, 'Credencial a Otorgar', proposal.credentialToAward, y);
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  if (proposal.minQuota != null || proposal.maxQuota != null || proposal.budget != null) {
    y = addSectionTitle(doc, 'Cupos y Presupuesto', y);
    y += LINE_HEIGHT + 2;
    if (proposal.minQuota != null) y = addField(doc, 'Cupo Mínimo', String(proposal.minQuota), y);
    if (proposal.maxQuota != null) y = addField(doc, 'Cupo Máximo', String(proposal.maxQuota), y);
    if (proposal.budget != null) {
      const budget = typeof proposal.budget === 'number'
        ? `$${proposal.budget.toLocaleString('es-CL')}`
        : `$${proposal.budget}`;
      y = addField(doc, 'Presupuesto', budget, y);
    }
    y = addDivider(doc, y);
  }

  if (proposal.facilitadores) {
    y = addSectionTitle(doc, 'Facilitadores', y);
    y += LINE_HEIGHT + 2;
    y = addMultilineText(doc, '', proposal.facilitadores, y - LINE_HEIGHT);
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  const evaluators = proposal.evaluators || [];
  if (evaluators.length > 0) {
    y = addSectionTitle(doc, 'Evaluadores Asignados', y);
    y += LINE_HEIGHT + 2;
    evaluators.forEach((ev: Record<string, any>) => {
      if (y > PAGE_HEIGHT - 20) { doc.addPage(); y = MARGIN_TOP; }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`  - ${ev.name || 'Evaluador'}${ev.department ? ` (${ev.department})` : ''}`, MARGIN_LEFT, y);
      y += LINE_HEIGHT;
    });
    y = addDivider(doc, y);
  }

  y = checkPageBreak(doc, y);

  const evaluations = proposal.evaluations || [];
  if (evaluations.length > 0) {
    y = addSectionTitle(doc, 'Evaluaciones', y);
    y += LINE_HEIGHT + 3;

    evaluations.forEach((ev: Record<string, any>, idx: number) => {
      y = checkPageBreak(doc, y, 40);
      const evaluator = ev.evaluator || {};
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`Evaluación ${idx + 1}: ${evaluator.name || 'Evaluador'}`, MARGIN_LEFT, y);
      y += LINE_HEIGHT + 1;

      if (ev.status) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`  Estado: ${ev.status === 'completada' ? 'Completada' : ev.status === 'en_progreso' ? 'En Progreso' : 'Pendiente'}`, MARGIN_LEFT, y);
        y += LINE_HEIGHT;
      }

      if (ev.scores && ev.scores.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('  Criterios de Evaluación:', MARGIN_LEFT, y);
        y += LINE_HEIGHT;

        let total = 0;
        let maxTotal = 0;
        ev.scores.forEach((s: Record<string, any>) => {
          if (y > PAGE_HEIGHT - 25) { doc.addPage(); y = MARGIN_TOP; }
          const score = s.score || 0;
          const maxScore = s.maxScore || 5;
          total += score;
          maxTotal += maxScore;
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          doc.text(`    - ${s.criterion || 'Criterio'}: ${score} / ${maxScore}`, MARGIN_LEFT, y);
          y += LINE_HEIGHT - 1;
          if (s.comments) {
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(8);
            doc.setTextColor(100);
            const commentLines = doc.splitTextToSize(`      "${s.comments}"`, CONTENT_WIDTH - 10);
            commentLines.forEach((line: string) => {
              if (y > PAGE_HEIGHT - 25) { doc.addPage(); y = MARGIN_TOP; }
              doc.text(line, MARGIN_LEFT, y);
              y += 4;
            });
            doc.setTextColor(0);
            doc.setFontSize(9);
          }
        });

        if (maxTotal > 0) {
          const pct = Math.round((total / maxTotal) * 100);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9);
          doc.text(`  Total: ${total} / ${maxTotal} (${pct}%)`, MARGIN_LEFT, y);
          y += LINE_HEIGHT;
        }
      }

      if (ev.comments) {
        y = addMultilineText(doc, '  Comentarios Generales', ev.comments, y);
      }

      if (ev.recommendation) {
        if (y > PAGE_HEIGHT - 20) { doc.addPage(); y = MARGIN_TOP; }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        const recLabels: Record<string, string> = { aprobar: 'Aprobar', rechazar: 'Rechazar', cambios: 'Requiere Cambios' };
        doc.text(`  Recomendación: ${recLabels[ev.recommendation] || ev.recommendation}`, MARGIN_LEFT, y);
        y += LINE_HEIGHT + 2;
      }

      y = addDivider(doc, y);
    });
  }

  y = checkPageBreak(doc, y);

  const workflowHistory = proposal.workflowHistory || [];
  if (workflowHistory.length > 0) {
    y = addSectionTitle(doc, 'Historial del Workflow', y);
    y += LINE_HEIGHT + 2;

    workflowHistory.forEach((step: Record<string, any>) => {
      y = checkPageBreak(doc, y);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const dateStr = step.date
        ? new Date(step.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })
        : '';
      doc.text(`  ${step.name}${dateStr ? ` - ${dateStr}` : ''}`, MARGIN_LEFT, y);
      y += LINE_HEIGHT - 1;
      if (step.user) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`    Responsable: ${step.user.name || step.user}`, MARGIN_LEFT, y);
        y += LINE_HEIGHT - 1;
        doc.setTextColor(0);
      }
      if (step.comments) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(80);
        const commentLines = doc.splitTextToSize(`    "${step.comments}"`, CONTENT_WIDTH - 10);
        commentLines.forEach((line: string) => {
          if (y > PAGE_HEIGHT - 25) { doc.addPage(); y = MARGIN_TOP; }
          doc.text(line, MARGIN_LEFT, y);
          y += 4;
        });
        doc.setTextColor(0);
      }
      y += 2;
    });
  }

  const filename = `propuesta-${(proposal.title || 'propuesta').replace(/[^a-zA-Z0-9]/g, '_').slice(0, 50)}.pdf`;
  doc.save(filename);
}

export function generateAdminReport(stats: Record<string, any>) {
  const doc = new jsPDF('p', 'mm', 'a4');
  let y = MARGIN_TOP + 20;

  addHeader(doc, 'Reporte Completo del Sistema', `Generado el ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`);

  y = addSectionTitle(doc, 'Estadísticas Generales', y);
  y += LINE_HEIGHT + 2;

  y = addField(doc, 'Total Propuestas', String(stats.totalProposals || 0), y);
  y = addField(doc, 'Aprobadas', String(stats.approved || 0), y);
  y = addField(doc, 'Rechazadas', String(stats.rejected || 0), y);
  y = addField(doc, 'Pendientes', String(stats.pending || 0), y);
  if (stats.avgEvaluationTime) y = addField(doc, 'Tiempo Prom. Evaluación', stats.avgEvaluationTime, y);
  if (stats.avgScore) y = addField(doc, 'Puntaje Promedio', String(stats.avgScore), y);

  y = addDivider(doc, y);

  if (stats.totalEvaluators != null) {
    y = addSectionTitle(doc, 'Asignaciones', y);
    y += LINE_HEIGHT + 2;
    y = addField(doc, 'Total Evaluadores', String(stats.totalEvaluators), y);
    if (stats.availableEvaluators != null) y = addField(doc, 'Evaluadores Disponibles', String(stats.availableEvaluators), y);
    if (stats.pendingProposals != null) y = addField(doc, 'Propuestas Pendientes', String(stats.pendingProposals), y);
    if (stats.activeAssignments != null) y = addField(doc, 'Asignaciones Activas', String(stats.activeAssignments), y);
    if (stats.completedAssignments != null) y = addField(doc, 'Asignaciones Completadas', String(stats.completedAssignments), y);
    if (stats.overdueAssignments != null) y = addField(doc, 'Asignaciones Vencidas', String(stats.overdueAssignments), y);
    if (stats.avgCargaPorEvaluador != null) y = addField(doc, 'Carga Prom. por Evaluador', String(stats.avgCargaPorEvaluador), y);
    if (stats.tasaAsignacion != null) y = addField(doc, 'Tasa de Asignación', `${stats.tasaAsignacion}%`, y);
  }

  const filename = `reporte-completo-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(filename);
}
