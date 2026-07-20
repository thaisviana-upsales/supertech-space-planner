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
// CORREÇÃO CRÍTICA: Usar localStorage (não sessionStorage) para que o código
// persista mesmo que o usuário feche e reabra a aba. sessionStorage é destruído
// ao fechar a aba, fazendo o lead perder seu identificador e não ser deduplificado.
const PREVIEW_CODE_KEY = 'ssp_preview_code';

export function getOrCreatePreviewCode(): string {
  // Migrar código legado de sessionStorage para localStorage (compatibilidade)
  const legacy = sessionStorage.getItem(PREVIEW_CODE_KEY);
  if (legacy) {
    localStorage.setItem(PREVIEW_CODE_KEY, legacy);
    sessionStorage.removeItem(PREVIEW_CODE_KEY);
    return legacy;
  }
  const stored = localStorage.getItem(PREVIEW_CODE_KEY);
  if (stored) return stored;
  const code = `SSP-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
  localStorage.setItem(PREVIEW_CODE_KEY, code);
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

// ── 5. upsertLeadProgress — enviar lead parcial para Google Sheets ─────────────
/**
 * Função central para salvar progresso do lead em cada etapa.
 * É chamada em todas as etapas da jornada.
 * Envia para Google Sheets mesmo sem nome/telefone/cidade.
 * O Apps Script aceita type: 'lead_progress' — se não reconhecer, trata como 'lead'.
 */
export interface LeadProgressPayload {
  codigoPrevia: string;
  ultimaEtapa: string;
  status: string;
  // Campos opcionais — preenchidos conforme o usuário avança
  nome?: string;
  telefone?: string;
  cidade?: string;
  uf?: string;
  segmento?: string;
  objetivo?: string;
  investimento_estimado?: string;
  categoria_projeto?: string;
  prazo?: string;
  equipamentos_count?: number;
  valor_estimado?: number;
  enviou_consultor?: boolean;
  vendedor_nome?: string;
  vendedor_whatsapp?: string;
  regiao_atendimento?: string;
  roteamento_criterio?: string;
  roteamento_chave?: string;
  origem?: string;
}

export function upsertLeadProgress(payload: LeadProgressPayload): void {
  send({
    type: 'lead_progress' as unknown as SheetPayload['type'],
    payload: {
      data_criacao:         nowISO(),
      data_atualizacao:     nowISO(),
      codigo_previa:        payload.codigoPrevia,
      ultima_etapa:         payload.ultimaEtapa,
      status:               payload.status,
      nome:                 payload.nome                    ?? '',
      telefone:             payload.telefone                ?? '',
      ddd:                  ddd(payload.telefone),
      cidade:               payload.cidade                  ?? '',
      uf:                   payload.uf                      ?? '',
      segmento:             payload.segmento                ?? '',
      objetivo:             payload.objetivo                ?? '',
      investimento_estimado: payload.investimento_estimado  ?? '',
      categoria_projeto:    payload.categoria_projeto       ?? '',
      prazo:                payload.prazo                   ?? '',
      equipamentos_count:   payload.equipamentos_count      ?? 0,
      valor_estimado:       payload.valor_estimado          ?? 0,
      enviou_consultor:     payload.enviou_consultor        ?? false,
      vendedor_nome:        payload.vendedor_nome           ?? '',
      vendedor_whatsapp:    payload.vendedor_whatsapp       ?? '',
      regiao_atendimento:   payload.regiao_atendimento      ?? '',
      roteamento_criterio:  payload.roteamento_criterio     ?? '',
      roteamento_chave:     payload.roteamento_chave        ?? '',
      origem:               payload.origem                  ?? 'space_planner',
      user_agent:           typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : '',
    },
  } as unknown as SheetPayload);
  console.log('LEAD PROGRESS SENT TO SHARED SOURCE:', { codigoPrevia: payload.codigoPrevia, etapa: payload.ultimaEtapa, status: payload.status });
}

// ── 6. fetchLeadsFromSheets — ler leads do Google Sheets para o painel admin ───
/**
 * Lê leads do Google Sheets via GET com ?action=getLeads para o painel admin.
 * Requer que o Apps Script implemente doGet() retornando JSON dos leads.
 * Retorna array vazio se o endpoint não suportar GET ou se falhar.
 */
export interface SheetLeadRow {
  codigo_previa?: string;
  data_criacao?: string;
  data_atualizacao?: string;
  ultima_etapa?: string;
  status?: string;
  nome?: string;
  telefone?: string;
  ddd?: string;
  cidade?: string;
  uf?: string;
  segmento?: string;
  objetivo?: string;
  investimento_estimado?: string;
  categoria_projeto?: string;
  prazo?: string;
  equipamentos_count?: number | string;
  valor_estimado?: number | string;
  enviou_consultor?: boolean | string;
  vendedor_nome?: string;
  vendedor_whatsapp?: string;
  regiao_atendimento?: string;
  roteamento_criterio?: string;
  roteamento_chave?: string;
  origem?: string;
  [key: string]: unknown;
}

export async function fetchLeadsFromSheets(): Promise<SheetLeadRow[]> {
  // Estratégia 1: proxy Vercel /api/leads (sem CORS, lê do Apps Script server-side)
  // Funciona em produção (Vercel deploy). Em dev local usa fallback.
  const proxyUrl = '/api/leads';

  try {
    const resp = await fetch(proxyUrl, { method: 'GET', cache: 'no-store' });
    if (resp.ok) {
      const json = await resp.json() as unknown;
      if (json && typeof json === 'object') {
        const obj = json as Record<string, unknown>;
        const source = obj['source'] as string | undefined;
        if (Array.isArray(obj['leads'])) {
          console.log('[Sheets] fetchLeadsFromSheets via proxy:', (obj['leads'] as unknown[]).length, 'leads — source:', source ?? 'proxy');
          return obj['leads'] as SheetLeadRow[];
        }
      }
      if (Array.isArray(json)) return json as SheetLeadRow[];
    }
  } catch {
    // Proxy indisponível (dev local sem Vercel) — tentar direto
  }

  // Estratégia 2: chamada direta ao Apps Script (funciona se doGet() estiver implementado)
  // Pode falhar com CORS em alguns browsers, mas tenta mesmo assim.
  try {
    const url = `${WEBHOOK_URL}?action=getLeads`;
    const resp = await fetch(url, { method: 'GET', cache: 'no-store' });
    if (!resp.ok) return [];
    const text = await resp.text();
    if (!text.startsWith('{') && !text.startsWith('[')) {
      console.warn('[Sheets] Apps Script não retornou JSON (doGet não implementado). Use o arquivo apps-script/Code.gs para atualizar.');
      return [];
    }
    const json = JSON.parse(text) as unknown;
    if (Array.isArray(json)) return json as SheetLeadRow[];
    if (json && typeof json === 'object') {
      const obj = json as Record<string, unknown>;
      if (Array.isArray(obj['leads'])) return obj['leads'] as SheetLeadRow[];
      if (Array.isArray(obj['data']))  return obj['data']  as SheetLeadRow[];
    }
    return [];
  } catch (err) {
    console.warn('[Sheets] fetchLeadsFromSheets falhou (CORS ou rede) — painel usando apenas localStorage:', err);
    return [];
  }
}
