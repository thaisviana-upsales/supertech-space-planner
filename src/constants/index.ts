import type { StepConfig } from '../types';

// ── 6 visible steps matching the print stepper ────────────────────────────────
export const STEPS: StepConfig[] = [
  { id: 1, path: '/objective',    label: 'Projeto',       shortLabel: 'Projeto',       isVisible: true },
  { id: 2, path: '/investment',   label: 'Investimento',  shortLabel: 'Investimento',  isVisible: true },
  { id: 3, path: '/deadline',     label: 'Prazo',         shortLabel: 'Prazo',         isVisible: true },
  { id: 4, path: '/profile',      label: 'Perfil',        shortLabel: 'Perfil',        isVisible: true },
  { id: 5, path: '/catalog',      label: 'Equipamentos',  shortLabel: 'Equipamentos',  isVisible: true },
  { id: 6, path: '/review',       label: 'Resumo',        shortLabel: 'Resumo',        isVisible: true },
  // Hidden (no stepper)
  { id: 7, path: '/preview',      label: 'Prévia & Envio',  shortLabel: 'Prévia',      isVisible: false },
  { id: 8, path: '/confirmation', label: 'Confirmação',     shortLabel: 'Confirmação', isVisible: false },
  { id: 9, path: '/admin',        label: 'Admin',           shortLabel: 'Admin',       isVisible: false },
  // Legacy paths (backwards compat — keep existing pages working)
  { id: 10, path: '/objetivo',     label: 'Objetivo',   shortLabel: 'Objetivo',   isVisible: false },
  { id: 11, path: '/investimento', label: 'Invest.',    shortLabel: 'Invest.',    isVisible: false },
  { id: 12, path: '/prazo',        label: 'Prazo',      shortLabel: 'Prazo',      isVisible: false },
  { id: 13, path: '/perfil',       label: 'Perfil',     shortLabel: 'Perfil',     isVisible: false },
  { id: 14, path: '/equipamentos', label: 'Equip.',     shortLabel: 'Equip.',     isVisible: false },
  { id: 15, path: '/revisao',      label: 'Revisão',    shortLabel: 'Revisão',    isVisible: false },
  { id: 16, path: '/previa',       label: 'Prévia',     shortLabel: 'Prévia',     isVisible: false },
  { id: 17, path: '/confirmacao',  label: 'Confirm.',   shortLabel: 'Confirm.',   isVisible: false },
];

export const VISIBLE_STEPS = STEPS.filter(s => s.isVisible);

// WhatsApp consultor number (to be configured)
export const CONSULTOR_WHATSAPP = '5511999999999';

// Investment labels
export const INVESTMENT_LABELS: Record<string, string> = {
  ate_50k:      'Até R$ 50.000',
  '50k_100k':   'R$ 50.000 – R$ 100.000',
  '100k_200k':  'R$ 100.000 – R$ 200.000',
  '200k_500k':  'R$ 200.000 – R$ 500.000',
  acima_500k:   'Acima de R$ 500.000',
  a_definir:    'A definir / Em análise',
};

// Timeline labels
export const TIMELINE_LABELS: Record<string, string> = {
  imediato:      'Imediato (até 30 dias)',
  '1_3_meses':   '1 a 3 meses',
  '3_6_meses':   '3 a 6 meses',
  '6_12_meses':  '6 a 12 meses',
  acima_12_meses:'Acima de 12 meses',
};

// Objective labels
export const OBJECTIVE_LABELS: Record<string, string> = {
  academia_zero:     'Montar uma academia do zero',
  renovar_ampliar:   'Renovar ou ampliar uma academia existente',
  condominio:        'Montar ou renovar academia de condomínio',
  hotel_clube:       'Estruturar academia de hotel ou clube',
  pesquisar:         'Apenas pesquisar valores',
};

// Profile labels
export const PROFILE_LABELS: Record<string, string> = {
  empresario:          'Empresário / Investidor',
  personal_trainer:    'Personal Trainer',
  gestor_academia:     'Gestor de Academia',
  arquiteto_projetista:'Arquiteto / Projetista',
  investidor:          'Fundo de Investimento',
  medico_fisioterapeuta:'Médico / Fisioterapeuta',
  outro:               'Outro',
};

// UF list
export const UF_LIST = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR',
  'PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
];
