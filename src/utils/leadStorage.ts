import type { ProjectData } from '../types';

// ── Lead record ────────────────────────────────────────────────────────────────
export interface LeadRecord {
  id: string;
  createdAt: string;
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

export function getLastStepLabel(step: number, sent?: boolean): string {
  if (sent) return 'Enviado';
  const labels: Record<number, string> = {
    1: 'Início', 2: 'Objetivo', 3: 'Investimento',
    4: 'Prazo', 5: 'Perfil', 6: 'Equipamentos', 7: 'Prévia do projeto',
  };
  return labels[step] ?? 'Início';
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR') + ' às ' +
    d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ── Storage ────────────────────────────────────────────────────────────────────
const STORAGE_KEY = 'ssp_leads';
const MOCK_KEY    = 'ssp_leads_seeded';

export function readLeads(): LeadRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as LeadRecord[]) : [];
  } catch { return []; }
}

export function saveLeadFromData(data: ProjectData, step: number): void {
  const mid  = getInvestmentMidpoint(data.investmentRange);
  const cat  = getInvestmentCategory(mid);
  const total = (data.selectedEquipment ?? [])
    .reduce((s, e) => s + (e.price ?? 0) * e.quantity, 0);

  const record: LeadRecord = {
    id:                  crypto.randomUUID(),
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
    // Routing (populated after WhatsApp send)
    vendedorNome:        data.vendedorNome        ?? undefined,
    vendedorWhatsapp:    data.vendedorWhatsapp    ?? undefined,
    regiaoAtendimento:   data.regiaoAtendimento   ?? undefined,
    roteamentoCriterio:  data.roteamentoCriterio  ?? undefined,
  };

  const existing = readLeads();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...existing]));
}

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
  const existing = readLeads();
  const merged = [...existing, ...MOCK_LEADS];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  localStorage.setItem(MOCK_KEY, '1');
}
