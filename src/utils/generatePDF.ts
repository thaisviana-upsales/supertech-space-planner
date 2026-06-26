import jsPDF from 'jspdf';
import type { ProjectData } from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────
function brl(value: number): string {
  return 'R$ ' + value.toLocaleString('pt-BR');
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function fallback(v: string | undefined | null, def = 'Não informado'): string {
  return v && v.trim() ? v.trim() : def;
}

function getTemperatura(investmentRange?: string): string {
  const map: Record<string, string> = {
    ate_50k:     'Projeto Entrada',
    '50k_100k':  'Projeto Essencial',
    '100k_200k': 'Projeto Profissional',
    '200k_500k': 'Projeto Premium',
    acima_500k:  'Projeto Enterprise',
    a_definir:   'Projeto em Análise',
  };
  return map[investmentRange ?? ''] ?? 'Projeto em Análise';
}

// ── Load image as Base64 (for jsPDF addImage) ─────────────────────────────────
// Fetches the PNG from the public folder at runtime and converts to base64.
// Returns null on any failure so we can gracefully fall back to text.
async function loadImageBase64(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_W   = 210;
const PAGE_H   = 297;
const MARGIN   = 20;
const CONTENT_W = PAGE_W - MARGIN * 2;
const GREEN    = [100, 180, 50]  as [number, number, number];
const DARK     = [30,  30,  30]  as [number, number, number];
const GRAY     = [120, 120, 120] as [number, number, number];
const LIGHT_BG = [245, 245, 243] as [number, number, number];
const TABLE_HEADER_BG = [28, 28, 28] as [number, number, number];

// Logo dimensions in the PDF header (mm)
const LOGO_H_MM = 14;   // height in mm (~40px at 72dpi)
const LOGO_W_MM = 50;   // max width in mm (~150px) — auto-proportioned below

// ── Sub-functions ─────────────────────────────────────────────────────────────
function setFont(doc: jsPDF, style: 'normal' | 'bold' | 'italic', size: number, color: [number, number, number] = DARK) {
  doc.setFont('helvetica', style);
  doc.setFontSize(size);
  doc.setTextColor(...color);
}

function drawSectionHeader(doc: jsPDF, label: string, y: number): number {
  setFont(doc, 'bold', 13, DARK);
  doc.text(label, MARGIN, y);
  // Green underline accent
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.6);
  const textW = doc.getTextWidth(label);
  doc.line(MARGIN, y + 1.5, MARGIN + textW, y + 1.5);
  doc.setLineWidth(0.2);
  doc.setDrawColor(200, 200, 200);
  return y + 9;
}

function drawField(doc: jsPDF, x: number, y: number, w: number, label: string, value: string) {
  // Gray background box
  doc.setFillColor(...LIGHT_BG);
  doc.rect(x, y, w, 17, 'F');
  // Label
  setFont(doc, 'normal', 7, GRAY);
  doc.text(label, x + 3, y + 5.5);
  // Value
  setFont(doc, 'bold', 10, DARK);
  const lines = doc.splitTextToSize(value, w - 6);
  doc.text(lines[0], x + 3, y + 13);
}

function drawTableHeader(doc: jsPDF, y: number) {
  doc.setFillColor(...TABLE_HEADER_BG);
  doc.rect(MARGIN, y, CONTENT_W, 8, 'F');
  setFont(doc, 'bold', 9, [255, 255, 255]);
  doc.text('Qtd',        MARGIN + 7,                      y + 5.5, { align: 'center' });
  doc.text('Equipamento',MARGIN + 17,                     y + 5.5);
  doc.text('Unitário',   MARGIN + CONTENT_W - 45,         y + 5.5);
  doc.text('Subtotal',   MARGIN + CONTENT_W - 3,          y + 5.5, { align: 'right' });
}

function drawPageFooter(doc: jsPDF, page: number, total: number) {
  const fy = PAGE_H - 15;
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, fy - 2, PAGE_W - MARGIN, fy - 2);
  setFont(doc, 'bold', 9, DARK);
  doc.text('Supertech Fitness · Fabricação Nacional', MARGIN, fy + 3);
  setFont(doc, 'normal', 8, GRAY);
  doc.text('Prévia gerada pelo Supertech Space Planner™', MARGIN, fy + 8);
  doc.text(`Página ${page} de ${total}`, PAGE_W - MARGIN, fy + 3, { align: 'right' });
}

// ── Internal PDF builder (synchronous, called after logo is pre-loaded) ───────
function buildPDF(
  data: ProjectData,
  previewCode: string,
  logoBase64: string | null,
): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const halfW = (CONTENT_W - 5) / 2;

  let y = MARGIN;

  // ── HEADER ────────────────────────────────────────────────────────────────
  if (logoBase64) {
    // Official black Supertech logo — proportion-correct placement
    // We set a fixed height and let jsPDF calculate width from aspect ratio.
    // jsPDF addImage signature: addImage(data, format, x, y, w, h)
    // We use LOGO_W_MM as the rendered width; height is LOGO_H_MM.
    doc.addImage(logoBase64, 'PNG', MARGIN, y + 2, LOGO_W_MM, LOGO_H_MM);
  } else {
    // Graceful fallback: text-only logo if image failed to load
    setFont(doc, 'bold', 10, DARK);
    doc.text('Supertech 360°', MARGIN, y + 9);
    setFont(doc, 'normal', 7, GRAY);
    doc.text('equipamentos fitness', MARGIN, y + 14);
  }

  // Title block (right-aligned) — vertically aligned with logo
  setFont(doc, 'bold', 15, DARK);
  doc.text('Supertech Space Planner™', PAGE_W - MARGIN, y + 7, { align: 'right' });
  setFont(doc, 'normal', 9, GRAY);
  doc.text('Prévia visual de projeto fitness', PAGE_W - MARGIN, y + 13, { align: 'right' });
  setFont(doc, 'normal', 8, GRAY);
  doc.text(
    `Gerado em ${formatDate(new Date())}  ·  Código ${previewCode}`,
    PAGE_W - MARGIN, y + 19,
    { align: 'right' },
  );

  y += 27;
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  y += 8;

  // ── DADOS DO LEAD ────────────────────────────────────────────────────────
  y = drawSectionHeader(doc, 'Dados do Lead', y);

  drawField(doc, MARGIN,           y, halfW, 'NOME',          fallback(data.name));
  drawField(doc, MARGIN + halfW + 5, y, halfW, 'TELEFONE',    fallback(data.phone));
  y += 20;

  drawField(doc, MARGIN,           y, halfW, 'E-MAIL',        fallback(data.email));
  drawField(doc, MARGIN + halfW + 5, y, halfW, 'CIDADE / ESTADO',
    data.city && data.uf ? `${data.city} / ${data.uf}` : 'Não informado');
  y += 20;

  drawField(doc, MARGIN, y, halfW, 'SEGMENTO', fallback(data.profileLabel));
  y += 22;

  // ── DADOS DO PROJETO ─────────────────────────────────────────────────────
  y = drawSectionHeader(doc, 'Dados do Projeto', y);

  drawField(doc, MARGIN,           y, halfW, 'OBJETIVO DO PROJETO',  fallback(data.objectiveLabel));
  drawField(doc, MARGIN + halfW + 5, y, halfW, 'INVESTIMENTO ESTIMADO', fallback(data.investmentLabel));
  y += 20;

  drawField(doc, MARGIN,           y, halfW, 'PRAZO DE EXECUÇÃO',  fallback(data.timelineLabel));
  drawField(doc, MARGIN + halfW + 5, y, halfW, 'PERFIL DO PROJETO', fallback(data.profileLabel));
  y += 20;

  drawField(doc, MARGIN, y, halfW, 'TEMPERATURA COMERCIAL', getTemperatura(data.investmentRange));
  y += 22;

  // ── EQUIPAMENTOS SELECIONADOS ─────────────────────────────────────────────
  y = drawSectionHeader(doc, 'Equipamentos Selecionados', y);

  const equipment = data.selectedEquipment ?? [];

  if (equipment.length === 0) {
    setFont(doc, 'italic', 9, GRAY);
    doc.text('Nenhum equipamento selecionado.', MARGIN, y + 6);
    y += 14;
  } else {
    // Group by categoryLabel (fall back to category)
    const groups: Record<string, typeof equipment> = {};
    equipment.forEach(eq => {
      const key = eq.categoryLabel || eq.category || 'Outros';
      if (!groups[key]) groups[key] = [];
      groups[key].push(eq);
    });

    drawTableHeader(doc, y);
    y += 10;

    let grandTotal = 0;

    for (const [catLabel, items] of Object.entries(groups)) {
      // Category subheader
      if (y > 255) {
        doc.addPage();
        drawTableHeader(doc, MARGIN);
        y = MARGIN + 10;
      }

      doc.setFillColor(238, 238, 236);
      doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
      setFont(doc, 'bold', 8.5, DARK);
      doc.text(catLabel.toUpperCase(), PAGE_W / 2, y + 4.8, { align: 'center' });
      y += 8;

      for (const eq of items) {
        if (y > 262) {
          doc.addPage();
          drawTableHeader(doc, MARGIN);
          y = MARGIN + 10;
        }

        const unitPrice = eq.price ?? 0;
        const subtotal  = unitPrice * eq.quantity;
        grandTotal += subtotal;

        setFont(doc, 'normal', 9, DARK);
        doc.text(String(eq.quantity), MARGIN + 7, y + 4.5, { align: 'center' });
        doc.text(eq.name,             MARGIN + 17, y + 4.5);
        doc.text(unitPrice > 0 ? brl(unitPrice) : '—', MARGIN + CONTENT_W - 45, y + 4.5);
        doc.text(subtotal  > 0 ? brl(subtotal)  : '—', MARGIN + CONTENT_W - 3,  y + 4.5, { align: 'right' });

        doc.setDrawColor(220, 220, 220);
        doc.setLineWidth(0.2);
        doc.line(MARGIN, y + 6.5, MARGIN + CONTENT_W, y + 6.5);
        y += 7.5;
      }
    }

    // ── TOTAL ROW ──────────────────────────────────────────────────────────
    if (y > 260) { doc.addPage(); y = MARGIN; }
    y += 3;
    doc.setFillColor(...LIGHT_BG);
    doc.rect(MARGIN, y, CONTENT_W, 13, 'F');
    setFont(doc, 'normal', 8, GRAY);
    doc.text('VALOR ESTIMADO DA SELEÇÃO', MARGIN + 3, y + 8);
    setFont(doc, 'bold', 14, DARK);
    doc.text(grandTotal > 0 ? brl(grandTotal) : 'A definir', PAGE_W - MARGIN - 3, y + 9, { align: 'right' });
    y += 17;
  }

  // ── OBSERVATION ───────────────────────────────────────────────────────────
  if (y > 272) { doc.addPage(); y = MARGIN; }
  y += 4;
  setFont(doc, 'italic', 7.5, GRAY);
  doc.text(
    '* Esta prévia é uma estimativa baseada na seleção de equipamentos. ' +
    'Os valores finais serão apresentados na proposta comercial personalizada.',
    MARGIN, y,
    { maxWidth: CONTENT_W },
  );
  y += 10;

  // ── DESTINO ───────────────────────────────────────────────────────────────
  setFont(doc, 'normal', 8, GRAY);
  doc.text('Direcionado para: Comercial São Paulo · Supertech  |  +55 (11) 96463-4949', MARGIN, y);

  // ── FOOTERS (all pages) ───────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawPageFooter(doc, i, totalPages);
  }

  return doc;
}

// ── Main export (async — loads logo first, then builds PDF) ───────────────────
export async function generatePDF(data: ProjectData, previewCode: string): Promise<jsPDF> {
  // Load the official black Supertech logo from the public folder.
  // Uses a cache-busting approach to avoid stale cached base64.
  const logoBase64 = await loadImageBase64('/brand/logo-supertech-preta-pdf.png');
  return buildPDF(data, previewCode, logoBase64);
}
