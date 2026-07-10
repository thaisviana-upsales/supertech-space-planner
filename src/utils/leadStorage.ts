import type { ProjectData } from '../types';

// ── Lead record ────────────────────────────────────────────────────────────────
export interface LeadRecord {
  id: string;
  createdAt: string;
  codigoPrevia?: string;        // SSP-XXXX-YYYY — stable session ID for upsert
  lastStepNum: number;
  name: string;
  phone: string;
  city: string;
  uf: string;
  segment: string;
  investmentRange: string;
  investmentLabel: string;
  investmentMidpoint: number;
  investmentCategory: string;
  equipmentCount: number;
  totalEstimate: number;
  sentToConsultor: boolean;
  objective: string;
  timeline: string;
  // Routing
  vendedorNome?: string;
  vendedorWhatsapp?: string;
  regiaoAtendimento?: string;
  roteamentoCriterio?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────
const MIDPOINTS: Record<string, number> = {
  // Legacy keys
  ate_50k:      25_000,
  '50k_100k':   75_000,
  '100k_200k':  150_000,
  '200k_500k':  350_000,
  acima_500k:   1_500_000,
  a_definir:    0,
  // New keys (InvestmentPage v2)
  profissional: 200_000,
  premium:      700_000,
  estrategico:  2_000_000,
  enterprise:   5_000_000,
};

export function getInvestmentMidpoint(range?: string): number {
  return MIDPOINTS[range ?? ''] ?? 0;
}

export function getInvestmentCategory(midpoint: number): string {
  if (midpoint <= 0)         return '—';
  if (midpoint <= 400_000)   return 'Profissional';
  if (midpoint <= 1_000_000) return 'Premium';
  if (midpoint <= 3_000_000) return 'Estratégico';
  return 'Enterprise';
}

// step 8 = Confirmação (lead chegou à página final mas pode não ter enviado)
export function getLastStepLabel(step: number, sent?: boolean): string {
  if (sent) return 'Enviado';
  const labels: Record<number, string> = {
    1: 'Início',
    2: 'Objetivo',
    3: 'Investimento',
    4: 'Prazo',
    5: 'Perfil',
    6: 'Equipamentos',
    7: 'Prévia do projeto',
    8: 'Confirmação',
  };
  return labels[step] ?? 'Início';
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── Storage key ────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'ssp_leads';
const MOCK_KEY    = 'ssp_leads_seeded';

// ── Step rank — higher = more advanced in the funnel ──────────────────────────
function stepRank(lead: LeadRecord): number {
  if (lead.sentToConsultor) return 10;
  return lead.lastStepNum ?? 0;
}

/** Normalise a phone to digits-only for dedup comparison */
function normalizePhone(p?: string): string {
  return (p ?? '').replace(/\D/g, '');
}

// ── Deduplication ─────────────────────────────────────────────────────────────
/**
 * Consolidate raw records from localStorage into one record per real lead.
 *
 * Priority order:
 *  1. codigoPrevia  — same session code → same lead
 *  2. phone         — same normalised phone (≥ 8 digits) → same lead (fallback)
 *  3. no dedup key  → kept as-is
 *
 * When two records map to the same lead, the one with the higher step rank
 * (i.e. most advanced in the funnel) wins.
 *
 * Result is sorted by createdAt descending (most recent first).
 */
export function consolidateLeads(raw: LeadRecord[]): LeadRecord[] {
  const byCode  = new Map<string, LeadRecord>();
  const byPhone = new Map<string, LeadRecord>();
  const noKey:  LeadRecord[] = [];

  for (const lead of raw) {
    const code  = lead.codigoPrevia?.trim();
    const phone = normalizePhone(lead.phone);

    if (code) {
      const prev = byCode.get(code);
      if (!prev || stepRank(lead) > stepRank(prev)) byCode.set(code, lead);
    } else if (phone.length >= 8) {
      const prev = byPhone.get(phone);
      if (!prev || stepRank(lead) > stepRank(prev)) byPhone.set(phone, lead);
    } else {
      noKey.push(lead);
    }
  }

  const result: LeadRecord[] = [
    ...Array.from(byCode.values()),
    ...Array.from(byPhone.values()),
    ...noKey,
  ];

  result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return result;
}

// ── Raw read (no dedup) ───────────────────────────────────────────────────────
function readRawLeads(): LeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeadRecord[]) : [];
  } catch { return []; }
}

// ── Public read — always deduplicated ────────────────────────────────────────
export function readLeads(): LeadRecord[] {
  return consolidateLeads(readRawLeads());
}

// ── Upsert ────────────────────────────────────────────────────────────────────
/**
 * Save or update a lead record.
 *
 * - If a record with the same codigoPrevia already exists:
 *     • Update it in-place (preserving original createdAt).
 *     • Only upgrade — never downgrade the step.
 * - Otherwise: prepend a new record.
 *
 * This replaces the old saveLeadFromData (which always added a new record,
 * causing one duplicated entry per step the lead traversed).
 */
export function upsertLeadFromData(data: ProjectData, step: number): void {
  const mid   = getInvestmentMidpoint(data.investmentRange);
  const cat   = getInvestmentCategory(mid);
  const total = (data.selectedEquipment ?? [])
    .reduce((s, e) => s + (e.price ?? 0) * e.quantity, 0);

  const code = data.codigoPrevia?.trim() ?? '';

  const newRecord: LeadRecord = {
    id:                  code ? `lead-${code}` : crypto.randomUUID(),
    codigoPrevia:        code || undefined,
    createdAt:           new Date().toISOString(),
    lastStepNum:         step,
    name:                data.name         ?? '',
    phone:               data.phone        ?? '',
    city:                data.city         ?? '',
    uf:                  data.uf           ?? '',
    segment:             data.profileLabel ?? '',
    investmentRange:     data.investmentRange ?? '',
    investmentLabel:     data.investmentLabel ?? '',
    investmentMidpoint:  mid,
    investmentCategory:  cat,
    equipmentCount:      data.selectedEquipment?.length ?? 0,
    totalEstimate:       total,
    sentToConsultor:     data.sentToConsultor ?? false,
    objective:           data.objectiveLabel  ?? '',
    timeline:            data.timelineLabel   ?? '',
    vendedorNome:        data.vendedorNome        ?? undefined,
    vendedorWhatsapp:    data.vendedorWhatsapp    ?? undefined,
    regiaoAtendimento:   data.regiaoAtendimento   ?? undefined,
    roteamentoCriterio:  data.roteamentoCriterio  ?? undefined,
  };

  const existing = readRawLeads();

  if (code) {
    const idx = existing.findIndex(r => r.codigoPrevia === code);
    if (idx !== -1) {
      // Never downgrade the step; update all other fields
      if (step >= existing[idx].lastStepNum) {
        existing[idx] = {
          ...existing[idx],
          ...newRecord,
          // Preserve original creation time so date filters stay correct
          createdAt: existing[idx].createdAt,
        };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
      return;
    }
  }

  // New record — prepend so newest appears first in raw array
  localStorage.setItem(STORAGE_KEY, JSON.stringify([newRecord, ...existing]));
}

/** Backward-compat alias — any code still calling saveLeadFromData keeps working */
export const saveLeadFromData = upsertLeadFromData;

// ── Mock seed (runs once) ──────────────────────────────────────────────────────
function mk(
  iso: string, step: number, name: string, phone: string,
  city: string, uf: string, seg: string, range: string,
  label: string, mid: number, cat: string,
  eqCount: number, est: number, sent: boolean,
): LeadRecord {
  return {
    id: 'mock-' + iso,
    createdAt: iso,
    lastStepNum: step,
    name, phone, city, uf, segment: seg,
    investmentRange: range, investmentLabel: label,
    investmentMidpoint: mid, investmentCategory: cat,
    equipmentCount: eqCount, totalEstimate: est,
    sentToConsultor: sent, objective: '', timeline: '',
  };
}

export const MOCK_LEADS: LeadRecord[] = [
  mk('2026-06-22T09:16:00Z', 8, 'Juan', '11991744587', 'Osasco', 'SP', 'Academia',
     '200k_500k', 'R$ 200.000 – R$ 500.000', 350_000, 'Profissional', 3, 74890, true),
  mk('2026-06-20T12:35:00Z', 8, 'Gilson Carvalho', '11932353002', 'São Paulo', 'SP',
     'Personal / Educação Física', 'acima_500k', 'Acima de R$ 500.000', 810_000, 'Premium',
     5, 136_690, true),
  mk('2026-06-19T17:25:00Z', 1, '', '', '', '', '', '100k_200k',
     'R$ 100.000 – R$ 200.000', 150_000, 'Profissional', 0, 0, false),
  mk('2026-06-19T16:06:00Z', 5, 'Ivone', '11932373002', 'Osasco', 'SP', 'Academia',
     '50k_100k', 'R$ 50.000 – R$ 100.000', 75_000, 'Profissional', 2, 47590, true),
  mk('2026-06-19T16:05:00Z', 8, '', '', '', '', '', '100k_200k',
     'R$ 100.000 – R$ 200.000', 150_000, 'Profissional', 4, 89_090, true),
  mk('2026-06-11T13:27:00Z', 1, '', '', '', '', '', '100k_200k',
     'R$ 100.000 – R$ 200.000', 150_000, 'Profissional', 0, 0, false),
  mk('2026-06-11T12:48:00Z', 1, '', '', '', '', '', '100k_200k',
     'R$ 100.000 – R$ 200.000', 150_000, 'Profissional', 0, 0, false),
  mk('2026-06-11T12:17:00Z', 1, '', '', '', '', '', '100k_200k',
     'R$ 100.000 – R$ 200.000', 150_000, 'Profissional', 0, 0, false),
];

export function ensureMockSeeded(): void {
  if (localStorage.getItem(MOCK_KEY)) return;
  const existing = readRawLeads();
  const merged = [...existing, ...MOCK_LEADS];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  localStorage.setItem(MOCK_KEY, '1');
}
