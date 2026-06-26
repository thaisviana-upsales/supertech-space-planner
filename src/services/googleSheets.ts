/**
 * googleSheets.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Serviço de integração com Google Sheets via Apps Script Webhook.
 *
 * Usa mode:"no-cors" porque o Apps Script não envia cabeçalhos CORS adequados
 * para requisições cross-origin. A resposta não pode ser lida, mas o dado chega.
 *
 * Fallback: se o envio falhar, o payload é armazenado em localStorage na fila
 * "pendingSheetsSync" e reenviado automaticamente na próxima oportunidade.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── URL centralizada ───────────────────────────────────────────────────────────
const WEBHOOK_URL =
  import.meta.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL as string | undefined ??
  'https://script.google.com/macros/s/AKfycbwWyLrO7W8ZjWlJ1UZ0-2fXleLcktlm2mtMrVFPcz5BCC4MukNscQQ_D0WIJH3znlEnrA/exec';

const PENDING_KEY = 'pendingSheetsSync';

// ── Internal types ─────────────────────────────────────────────────────────────
interface SheetPayload {
  type: 'lead' | 'equipments' | 'event' | 'status';
  payload: Record<string, unknown>;
}

// ── Core send (fire-and-forget, never throws) ──────────────────────────────────
async function send(body: SheetPayload): Promise<void> {
  try {
    await fetch(WEBHOOK_URL, {
      method: 'POST',
      mode: 'no-cors',            // Required for Apps Script — response is opaque
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
    });
    // With no-cors we can't confirm delivery, but assume success if no throw.
    // Try to flush any pending items after a successful send.
    flushPendingQueue();
  } catch (err) {
    console.warn('[Sheets] Send failed, queuing for retry:', err);
    enqueue(body);
  }
}

// ── Offline / retry queue ──────────────────────────────────────────────────────
function enqueue(body: SheetPayload): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    const queue: SheetPayload[] = raw ? JSON.parse(raw) : [];
    queue.push(body);
    // Keep queue bounded to 50 items to avoid storage bloat
    if (queue.length > 50) queue.splice(0, queue.length - 50);
    localStorage.setItem(PENDING_KEY, JSON.stringify(queue));
  } catch {
    /* localStorage unavailable — silently ignore */
  }
}

function flushPendingQueue(): void {
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const queue: SheetPayload[] = JSON.parse(raw);
    if (!queue.length) return;
    localStorage.removeItem(PENDING_KEY);
    for (const item of queue) {
      // Fire-and-forget each pending item (don't await)
      fetch(WEBHOOK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(item),
      }).catch(() => enqueue(item)); // Re-queue if still failing
    }
  } catch {
    /* Queue empty or corrupted — ignore */
  }
}

// ── Código de prévia único ─────────────────────────────────────────────────────
const PREVIEW_CODE_KEY = 'ssp_preview_code';

export function getOrCreatePreviewCode(): string {
  const stored = sessionStorage.getItem(PREVIEW_CODE_KEY);
  if (stored) return stored;
  const code = `SSP-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
  sessionStorage.setItem(PREVIEW_CODE_KEY, code);
  return code;
}

// ── Captura de query params da URL ────────────────────────────────────────────
export interface UrlLeadData {
  nome?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  uf?: string;
  origem?: string;
}

export function captureUrlParams(): UrlLeadData {
  try {
    const params = new URLSearchParams(window.location.search);
    const result: UrlLeadData = {};
    if (params.get('nome'))     result.nome     = params.get('nome')!;
    if (params.get('telefone')) result.telefone = params.get('telefone')!;
    if (params.get('email'))    result.email    = params.get('email')!;
    if (params.get('cidade'))   result.cidade   = params.get('cidade')!;
    if (params.get('uf'))       result.uf       = params.get('uf')!;
    if (params.get('origem'))   result.origem   = params.get('origem')!;
    return result;
  } catch {
    return {};
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function nowISO(): string {
  return new Date().toISOString();
}

function ddd(phone?: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 2 ? digits.slice(0, 2) : '';
}

// ── 1. saveLeadToSheets ───────────────────────────────────────────────────────
export interface LeadSheetData {
  codigoPrevia: string;
  nome?: string;
  telefone?: string;
  email?: string;
  cidade?: string;
  uf?: string;
  segmento?: string;
  objetivo?: string;
  investimentoEstimado?: string;
  categoriaProjetoLabel?: string;
  prazo?: string;
  ultimaEtapa?: string;
  status?: string;
  enviouConsultor?: boolean;
  vendedorNome?: string;
  vendedorWhatsapp?: string;
  regiaoAtendimento?: string;
  roteamentoCriterio?: string;
  roteamentoChave?: string;
  origem?: string;
  consentimentoLgpd?: boolean;
}

export function saveLeadToSheets(lead: LeadSheetData): void {
  send({
    type: 'lead',
    payload: {
      data_criacao:         nowISO(),
      data_atualizacao:     nowISO(),
      codigo_previa:        lead.codigoPrevia,
      nome:                 lead.nome           ?? '',
      telefone:             lead.telefone       ?? '',
      email:                lead.email          ?? '',
      cidade:               lead.cidade         ?? '',
      uf:                   lead.uf             ?? '',
      ddd:                  ddd(lead.telefone),
      segmento:             lead.segmento       ?? '',
      objetivo:             lead.objetivo       ?? '',
      investimento_estimado: lead.investimentoEstimado ?? '',
      categoria_projeto:    lead.categoriaProjetoLabel ?? '',
      prazo:                lead.prazo          ?? '',
      ultima_etapa:         lead.ultimaEtapa    ?? '',
      status:               lead.status         ?? 'em_andamento',
      enviou_consultor:     lead.enviouConsultor ?? false,
      vendedor_nome:        lead.vendedorNome        ?? '',
      vendedor_whatsapp:    lead.vendedorWhatsapp    ?? '',
      regiao_atendimento:   lead.regiaoAtendimento   ?? '',
      roteamento_criterio:  lead.roteamentoCriterio  ?? '',
      roteamento_chave:     lead.roteamentoChave     ?? '',
      origem:               lead.origem         ?? 'space_planner',
      consentimento_lgpd:   lead.consentimentoLgpd ?? true,
    },
  });
}

// ── 2. saveEquipmentsToSheets ─────────────────────────────────────────────────
export interface EquipmentItem {
  id: string;
  name: string;
  category: string;
  categoryLabel: string;
  quantity: number;
  price: number;
}

export function saveEquipmentsToSheets(codigoPrevia: string, equipments: EquipmentItem[]): void {
  if (!equipments.length) return;
  send({
    type: 'equipments',
    payload: {
      codigo_previa: codigoPrevia,
      equipamentos: equipments.map(e => ({
        codigo:        e.id,
        nome:          e.name,
        categoria:     e.categoryLabel || e.category,
        quantidade:    e.quantity,
        valor_unitario: e.price,
        subtotal:      e.price * e.quantity,
      })),
    },
  });
}

// ── 3. saveEventToSheets ──────────────────────────────────────────────────────
export function saveEventToSheets(
  codigoPrevia: string,
  etapa: string,
  acao: string,
  detalhe = '',
): void {
  send({
    type: 'event',
    payload: {
      codigo_previa: codigoPrevia,
      etapa,
      acao,
      detalhe,
      timestamp: nowISO(),
    },
  });
}

// ── 4. updateLeadStatusToSheets ───────────────────────────────────────────────
export function updateLeadStatusToSheets(lead: LeadSheetData): void {
  send({
    type: 'status',
    payload: {
      data_atualizacao:     nowISO(),
      codigo_previa:        lead.codigoPrevia,
      nome:                 lead.nome           ?? '',
      telefone:             lead.telefone       ?? '',
      email:                lead.email          ?? '',
      cidade:               lead.cidade         ?? '',
      uf:                   lead.uf             ?? '',
      ddd:                  ddd(lead.telefone),
      segmento:             lead.segmento       ?? '',
      objetivo:             lead.objetivo       ?? '',
      investimento_estimado: lead.investimentoEstimado ?? '',
      categoria_projeto:    lead.categoriaProjetoLabel ?? '',
      prazo:                lead.prazo          ?? '',
      ultima_etapa:         'Enviado',
      status:               'enviado',
      enviou_consultor:     true,
      vendedor_nome:        lead.vendedorNome        ?? '',
      vendedor_whatsapp:    lead.vendedorWhatsapp    ?? '',
      regiao_atendimento:   lead.regiaoAtendimento   ?? '',
      roteamento_criterio:  lead.roteamentoCriterio  ?? '',
      roteamento_chave:     lead.roteamentoChave     ?? '',
      origem:               lead.origem         ?? 'space_planner',
      consentimento_lgpd:   true,
    },
  });
}
