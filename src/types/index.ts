// ── Types shared across the entire Space Planner flow ────────────────────────

export type ProjectObjective =
  | 'academia_completa'
  | 'sala_funcional'
  | 'studio_personal'
  | 'espaco_corporativo'
  | 'clinica_reabilitacao'
  | 'hotel_condominio'
  | 'outro';

export type InvestmentRange =
  | 'ate_50k'
  | '50k_100k'
  | '100k_200k'
  | '200k_500k'
  | 'acima_500k'
  | 'a_definir';

export type ProjectTimeline =
  | 'imediato'
  | '1_3_meses'
  | '3_6_meses'
  | '6_12_meses'
  | 'acima_12_meses';

export type LeadProfile =
  | 'empresario'
  | 'personal_trainer'
  | 'gestor_academia'
  | 'arquiteto_projetista'
  | 'investidor'
  | 'medico_fisioterapeuta'
  | 'outro';

export interface Equipment {
  id: string;
  code?: string;          // e.g. AR0064 — código oficial Supertech
  name: string;
  category: string;
  categoryLabel: string;
  quantity: number;
  price: number;
  bateriaKg?: string | number | null;  // capacidade de bateria em kg, quando aplicável
  imageUrl?: string;
}

export interface ProjectData {
  // Step 1 — Objective
  objective?: ProjectObjective;
  objectiveLabel?: string;
  objectiveCustom?: string;

  // Step 2 — Investment
  investmentRange?: InvestmentRange;
  investmentLabel?: string;

  // Step 3 — Timeline
  timeline?: ProjectTimeline;
  timelineLabel?: string;

  // Step 4 — Profile
  profile?: LeadProfile;
  profileLabel?: string;
  uf?: string;
  city?: string;
  name?: string;
  phone?: string;
  email?: string;

  // Step 5 — Equipment
  selectedEquipment?: Equipment[];

  // Meta
  createdAt?: string;
  projectId?: string;
  sentToConsultor?: boolean;
  sentAt?: string;

  // Sheets / tracking fields
  codigoPrevia?: string;    // SSP-XXXX-YYYY — stable session ID
  origem?: string;          // URL param or 'space_planner'
  consentimentoLgpd?: boolean;
  deadlineLabel?: string;   // human-readable label for timeline/deadline

  // Routing fields (resolved at WhatsApp send time)
  vendedorNome?: string;
  vendedorWhatsapp?: string;
  regiaoAtendimento?: string;
  roteamentoCriterio?: 'ddd' | 'cidade_uf' | 'uf' | 'fallback';
  roteamentoChave?: string;
}

export interface StepConfig {
  id: number;
  path: string;
  label: string;
  shortLabel: string;
  isVisible: boolean; // false = hidden steps (confirmation, admin)
}
