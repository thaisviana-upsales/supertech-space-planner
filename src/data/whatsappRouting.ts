/**
 * whatsappRouting.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Lógica de roteamento do WhatsApp para o Supertech Space Planner™.
 *
 * Prioridade Absoluta:
 *  1. DDD extraído exclusivamente do telefone/WhatsApp preenchido pelo lead.
 *  2. Cidade + UF (apenas se DDD não for identificado)
 *  3. UF (apenas se DDD e Cidade não forem identificados)
 *  4. Fallback final → pool de vendedores internos SP
 *
 * Número "Comercial Geral" (11 99235-4185 / 5511992354185) NUNCA é usado.
 * ──────────────────────────────────────────────────────────────────────────────
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Seller {
  nome: string;
  whatsapp: string;
  empresa?: string;
}

export interface RoutingDestination {
  /** Número do WhatsApp para abrir (ex: 5511934210027) */
  whatsapp: string;
  /** Nome do vendedor / representante */
  vendedorNome: string;
  /** Região de atendimento (ex: "SUPERTECH FITNESS / DDD 19") */
  regiaoAtendimento: string;
  /** Critério usado: 'ddd' | 'ddd_lead' | 'cidade_uf' | 'uf' | 'fallback' */
  roteamentoCriterio: 'ddd' | 'ddd_lead' | 'cidade_uf' | 'uf' | 'fallback';
  /** Chave de roteamento (ex: "19", "54", "Bauru-SP") */
  roteamentoChave: string;

  // Campos explícitos solicitados no requisito:
  leadDdd?: string | null;
  vendedor_nome?: string;
  vendedor_whatsapp?: string;
  regiao_atendimento?: string;
  roteamento_criterio?: string;
  roteamento_chave?: string;
  regra_aplicada?: string;
  isFallback?: boolean;
}

export interface LeadRoutingData {
  phone?: string;
  telefone?: string;
  whatsapp?: string;
  celular?: string;
  city?: string;
  cidade?: string;
  uf?: string;
  codigoPrevia?: string;
  /** DDD explícito do lead, se disponível */
  ddd?: string;
  [key: string]: any;
}

// ── Pool de vendedores internos SP ───────────────────────────────────────────
// NÃO inclui Comercial Geral (11 99235-4185)
// Pool oficial de SP: Alef, Juan, Pedro, Robson, Valter

export const INTERNAL_SELLERS: Seller[] = [
  { nome: 'Alef',   whatsapp: '5511917491234', empresa: 'SUPERTECH FITNESS' },
  { nome: 'Juan',   whatsapp: '5511989483896', empresa: 'SUPERTECH FITNESS' },
  { nome: 'Pedro',  whatsapp: '5511934210027', empresa: 'SUPERTECH FITNESS' },
  { nome: 'Robson', whatsapp: '5511991743237', empresa: 'SUPERTECH FITNESS' },
  { nome: 'Valter', whatsapp: '5511991711964', empresa: 'SUPERTECH FITNESS' },
];

// ── Representantes regionais ──────────────────────────────────────────────────

const REP_GLOBO_SPORTS: Seller = {
  nome: 'Renan / Diego', whatsapp: '5514998775151', empresa: 'GLOBO SPORTS',
};
const REP_FIRETECH: Seller = {
  nome: 'Igor', whatsapp: '5521964247706', empresa: 'FIRETECH',
};
const REP_MATEUS: Seller = {
  nome: 'Mateus', whatsapp: '5528999846872', empresa: 'MATEUS',
};
const REP_BH_FITNESS: Seller = {
  nome: 'Gustavo', whatsapp: '553185784671', empresa: 'BH FITNESS',
};
const REP_DANILO: Seller = {
  nome: 'Danilo', whatsapp: '554195491297', empresa: 'DANILO ALMEIDA',
};
const REP_VJK: Seller = {
  nome: 'Valmir', whatsapp: '554599017558', empresa: 'VJK FITNESS',
};
const REP_ALESSANDRO: Seller = {
  nome: 'Alessandro', whatsapp: '555186868855', empresa: 'ALESSANDRO',
};
const REP_ORANGE: Seller = {
  nome: 'Rodrigo Gomes', whatsapp: '556296205778', empresa: 'ORANGE',
};
const REP_MC: Seller = {
  nome: 'Marcelo', whatsapp: '559288031286', empresa: 'MC SUPERFITNESS',
};
const REP_TRIPLLE: Seller = {
  nome: 'Alan', whatsapp: '557996045914', empresa: 'TRIPLLE FITNESS',
};
const REP_SUPERFITNESS: Seller = {
  nome: 'Wellington', whatsapp: '558196418465', empresa: 'SUPERFITNESS',
};
const REP_JOEL: Seller = {
  nome: 'Felipe', whatsapp: '558387727825', empresa: 'JOEL JOSE DA SILVA/PARAIBA',
};
const REP_BRAZIL_BIKE: Seller = {
  nome: 'Arlindo', whatsapp: '558596811666', empresa: 'BRAZIL BIKE',
};
const REP_MB: Seller = {
  nome: 'Mauricio Borges', whatsapp: '559181320001', empresa: 'MB EQUIPAMENTOS FITNESS',
};

// ── Funções auxiliares de extração e normalização ────────────────────────────

/** Remove tudo que não é dígito */
export function normalizePhoneNumber(phone?: string | null): string {
  if (!phone) return '';
  return phone.toString().replace(/\D/g, '');
}

/**
 * Extrai o DDD (2 dígitos nacionais) do telefone do lead de forma segura.
 *
 * Regras:
 * - Entrada "11999990000" -> DDD "11"
 * - Entrada "(19) 99999-0000" -> DDD "19"
 * - Entrada "+55 54 99999-0000" -> DDD "54"
 * - Entrada "5551999990000" -> DDD "51"
 * - Entrada "54 99999-0000" -> DDD "54"
 * - Entrada vazia -> null
 *
 * Se começar com 55 e tiver 12 ou 13 dígitos (55 + 2 DDD + 8/9 número), remove 55 antes de extrair o DDD.
 */
export function extractLeadDDD(phone?: string | null): string | null {
  if (!phone) return null;
  const digits = phone.toString().replace(/\D/g, '');
  if (!digits) return null;

  // Se o valor fornecido for diretamente o DDD com 2 dígitos
  if (digits.length === 2) {
    const val = parseInt(digits, 10);
    if (val >= 11 && val <= 99) return digits;
    return null;
  }

  let local = digits;

  // Tratar prefixo 55
  if (local.startsWith('55')) {
    if (local.length === 12 || local.length === 13) {
      local = local.slice(2);
    } else if (local.length > 13) {
      local = local.slice(2);
    } else if (local.length === 10 || local.length === 11) {
      const candidateDdd = parseInt(local.slice(2, 4), 10);
      if (candidateDdd >= 11 && candidateDdd <= 99) {
        local = local.slice(2);
      }
    }
  }

  // DDD de 2 dígitos do número local
  if (local.length >= 10) {
    const ddd = local.slice(0, 2);
    const val = parseInt(ddd, 10);
    if (val >= 11 && val <= 99) return ddd;
  }

  // Fallback para entradas parciais que começam com DDD válido
  if (local.length >= 2) {
    const ddd = local.slice(0, 2);
    const val = parseInt(ddd, 10);
    if (val >= 11 && val <= 99) return ddd;
  }

  return null;
}

/** Alias para manter compatibilidade com importações existentes */
export const extractDDDFromPhone = extractLeadDDD;

/** Normaliza nome de cidade: sem acento, lowercase, sem espaços extras */
export function normalizeCityName(city: string): string {
  return city
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ');
}

/** Normaliza UF: uppercase trim */
export function normalizeUF(uf: string): string {
  return uf.trim().toUpperCase();
}

/**
 * Hash simples e estável para selecionar vendedor do pool.
 */
function stableHash(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Seleciona vendedor do pool de forma estável baseado em routingKey.
 */
export function selectSellerFromPool(pool: Seller[], routingKey: string): Seller {
  if (!pool.length) return INTERNAL_SELLERS[0];
  const index = stableHash(routingKey) % pool.length;
  return pool[index];
}

// ── Mapa DDD → Destino ────────────────────────────────────────────────────────

type DDDEntry =
  | { type: 'pool'; pool: Seller[] }
  | { type: 'fixed'; seller: Seller };

const DDD_MAP: Record<string, DDDEntry> = {
  // DDDs 11, 12, 13, 15, 17, 18, 19 → pool interno Supertech Fitness SP
  '11': { type: 'pool', pool: INTERNAL_SELLERS },
  '12': { type: 'pool', pool: INTERNAL_SELLERS },
  '13': { type: 'pool', pool: INTERNAL_SELLERS },
  '15': { type: 'pool', pool: INTERNAL_SELLERS },
  '17': { type: 'pool', pool: INTERNAL_SELLERS },
  '18': { type: 'pool', pool: INTERNAL_SELLERS },
  '19': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 14, 16 → Renan / Diego - Globo Sports (Bauru-SP)
  '14': { type: 'fixed', seller: REP_GLOBO_SPORTS },
  '16': { type: 'fixed', seller: REP_GLOBO_SPORTS },

  // DDDs 21, 22, 24 → Igor - RJ (Firetech)
  '21': { type: 'fixed', seller: REP_FIRETECH },
  '22': { type: 'fixed', seller: REP_FIRETECH },
  '24': { type: 'fixed', seller: REP_FIRETECH },

  // DDDs 27, 28 → Mateus - ES
  '27': { type: 'fixed', seller: REP_MATEUS },
  '28': { type: 'fixed', seller: REP_MATEUS },

  // DDDs 31, 32, 33, 37, 38 → Gustavo - BH Fitness (MG)
  '31': { type: 'fixed', seller: REP_BH_FITNESS },
  '32': { type: 'fixed', seller: REP_BH_FITNESS },
  '33': { type: 'fixed', seller: REP_BH_FITNESS },
  '37': { type: 'fixed', seller: REP_BH_FITNESS },
  '38': { type: 'fixed', seller: REP_BH_FITNESS },

  // DDDs 34, 35 → Alef (vendedor interno Supertech)
  '34': { type: 'fixed', seller: { nome: 'Alef', whatsapp: '5511917491234', empresa: 'SUPERTECH FITNESS' } },
  '35': { type: 'fixed', seller: { nome: 'Alef', whatsapp: '5511917491234', empresa: 'SUPERTECH FITNESS' } },

  // DDDs 41, 42, 43, 44, 46 → Danilo / Curitiba-PR
  '41': { type: 'fixed', seller: REP_DANILO },
  '42': { type: 'fixed', seller: REP_DANILO },
  '43': { type: 'fixed', seller: REP_DANILO },
  '44': { type: 'fixed', seller: REP_DANILO },
  '46': { type: 'fixed', seller: REP_DANILO },

  // DDD 45 → Valmir - Cascavel/PR (VJK Fitness)
  '45': { type: 'fixed', seller: REP_VJK },

  // DDDs 47, 48, 49 → pool interno Supertech Fitness
  '47': { type: 'pool', pool: INTERNAL_SELLERS },
  '48': { type: 'pool', pool: INTERNAL_SELLERS },
  '49': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 51, 53, 54, 55 → Alessandro - RS
  '51': { type: 'fixed', seller: REP_ALESSANDRO },
  '53': { type: 'fixed', seller: REP_ALESSANDRO },
  '54': { type: 'fixed', seller: REP_ALESSANDRO },
  '55': { type: 'fixed', seller: REP_ALESSANDRO },

  // DDD 61 → pool interno Supertech Fitness
  '61': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 62, 64 → Rodrigo Gomes - Orange (GO)
  '62': { type: 'fixed', seller: REP_ORANGE },
  '64': { type: 'fixed', seller: REP_ORANGE },

  // DDD 63 → pool interno Supertech Fitness
  '63': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 65, 66 → pool interno Supertech Fitness
  '65': { type: 'pool', pool: INTERNAL_SELLERS },
  '66': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDD 67 → pool interno Supertech Fitness
  '67': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 68, 69, 92, 95, 97 → Marcelo AM e AC (MC Superfitness)
  '68': { type: 'fixed', seller: REP_MC },
  '69': { type: 'fixed', seller: REP_MC },
  '92': { type: 'fixed', seller: REP_MC },
  '95': { type: 'fixed', seller: REP_MC },
  '97': { type: 'fixed', seller: REP_MC },

  // DDDs 71, 73, 74, 75, 77, 79 → Alan - Triplle Fitness
  '71': { type: 'fixed', seller: REP_TRIPLLE },
  '73': { type: 'fixed', seller: REP_TRIPLLE },
  '74': { type: 'fixed', seller: REP_TRIPLLE },
  '75': { type: 'fixed', seller: REP_TRIPLLE },
  '77': { type: 'fixed', seller: REP_TRIPLLE },
  '79': { type: 'fixed', seller: REP_TRIPLLE },

  // DDDs 81, 87 → Wellington - Superfitness
  '81': { type: 'fixed', seller: REP_SUPERFITNESS },
  '87': { type: 'fixed', seller: REP_SUPERFITNESS },

  // DDD 82 → pool interno Supertech Fitness
  '82': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDD 83 → Felipe - PB (Joel Jose da Silva)
  '83': { type: 'fixed', seller: REP_JOEL },

  // DDD 84 → pool interno Supertech Fitness
  '84': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 85, 88 → Arlindo - Brazil Bike
  '85': { type: 'fixed', seller: REP_BRAZIL_BIKE },
  '88': { type: 'fixed', seller: REP_BRAZIL_BIKE },

  // DDDs 86, 89 → pool interno Supertech Fitness
  '86': { type: 'pool', pool: INTERNAL_SELLERS },
  '89': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 91, 93, 94 → Mauricio Borges - MB Equipamentos
  '91': { type: 'fixed', seller: REP_MB },
  '93': { type: 'fixed', seller: REP_MB },
  '94': { type: 'fixed', seller: REP_MB },

  // DDD 96 → pool interno Supertech Fitness
  '96': { type: 'pool', pool: INTERNAL_SELLERS },

  // DDDs 98, 99 → pool interno Supertech Fitness
  '98': { type: 'pool', pool: INTERNAL_SELLERS },
  '99': { type: 'pool', pool: INTERNAL_SELLERS },
};

// ── Mapa Cidade/UF → Destino (Usado apenas se DDD do lead não for informado) ────

type CityEntry =
  | { type: 'pool' }
  | { type: 'fixed'; seller: Seller };

const CITY_ROUTING_OVERRIDES: Record<string, CityEntry> = {
  'sao paulo|SP':          { type: 'pool' },
  'bauru|SP':              { type: 'fixed', seller: REP_GLOBO_SPORTS },
  'rio de janeiro|RJ':     { type: 'fixed', seller: REP_FIRETECH },
  'vitoria|ES':            { type: 'fixed', seller: REP_MATEUS },
  'vila velha|ES':         { type: 'fixed', seller: REP_MATEUS },
  'belo horizonte|MG':     { type: 'fixed', seller: REP_BH_FITNESS },
  'curitiba|PR':           { type: 'fixed', seller: REP_DANILO },
  'cascavel|PR':           { type: 'fixed', seller: REP_VJK },
  'florianopolis|SC':      { type: 'pool' },
  'porto alegre|RS':       { type: 'fixed', seller: REP_ALESSANDRO },
  'brasilia|DF':           { type: 'pool' },
  'goiania|GO':            { type: 'fixed', seller: REP_ORANGE },
  'palmas|TO':             { type: 'pool' },
  'cuiaba|MT':             { type: 'pool' },
  'campo grande|MS':       { type: 'pool' },
  'rio branco|AC':         { type: 'fixed', seller: REP_MC },
  'porto velho|RO':        { type: 'fixed', seller: REP_MC },
  'manaus|AM':             { type: 'fixed', seller: REP_MC },
  'boa vista|RR':          { type: 'fixed', seller: REP_MC },
  'salvador|BA':           { type: 'fixed', seller: REP_TRIPLLE },
  'aracaju|SE':            { type: 'fixed', seller: REP_TRIPLLE },
  'recife|PE':             { type: 'fixed', seller: REP_SUPERFITNESS },
  'joao pessoa|PB':        { type: 'fixed', seller: REP_JOEL },
  'maceio|AL':             { type: 'pool' },
  'natal|RN':              { type: 'pool' },
  'fortaleza|CE':          { type: 'fixed', seller: REP_BRAZIL_BIKE },
  'teresina|PI':           { type: 'pool' },
  'belem|PA':              { type: 'fixed', seller: REP_MB },
  'macapa|AP':             { type: 'pool' },
  'sao luis|MA':           { type: 'pool' },
};

// ── Mapa UF → Destino (Usado apenas se DDD e Cidade do lead não forem informados)

type UFEntry =
  | { type: 'pool' }
  | { type: 'fixed'; seller: Seller };

const UF_ROUTING: Record<string, UFEntry> = {
  SP: { type: 'pool' },
  RJ: { type: 'fixed', seller: REP_FIRETECH },
  ES: { type: 'fixed', seller: REP_MATEUS },
  MG: { type: 'fixed', seller: REP_BH_FITNESS },
  PR: { type: 'fixed', seller: REP_DANILO },
  SC: { type: 'pool' },
  RS: { type: 'fixed', seller: REP_ALESSANDRO },
  DF: { type: 'pool' },
  GO: { type: 'fixed', seller: REP_ORANGE },
  TO: { type: 'pool' },
  MT: { type: 'pool' },
  MS: { type: 'pool' },
  AC: { type: 'fixed', seller: REP_MC },
  RO: { type: 'fixed', seller: REP_MC },
  AM: { type: 'fixed', seller: REP_MC },
  RR: { type: 'fixed', seller: REP_MC },
  BA: { type: 'fixed', seller: REP_TRIPLLE },
  SE: { type: 'fixed', seller: REP_TRIPLLE },
  PE: { type: 'fixed', seller: REP_SUPERFITNESS },
  PB: { type: 'fixed', seller: REP_JOEL },
  AL: { type: 'pool' },
  RN: { type: 'pool' },
  CE: { type: 'fixed', seller: REP_BRAZIL_BIKE },
  PI: { type: 'pool' },
  PA: { type: 'fixed', seller: REP_MB },
  AP: { type: 'pool' },
  MA: { type: 'pool' },
};

// ── FUNÇÃO CENTRAL OBRIGATÓRIA ────────────────────────────────────────────────

/**
 * resolveWhatsappDestination(leadData)
 *
 * Função única e centralizada para resolver a rota de atendimento WhatsApp.
 * Usa como fonte de verdade o DDD preenchido pelo lead em seu telefone.
 */
export function resolveWhatsappDestination(leadData: LeadRoutingData): RoutingDestination {
  // 1. Extrair telefone/WhatsApp do lead
  const leadPhone =
    leadData?.phone ||
    leadData?.telefone ||
    leadData?.whatsapp ||
    leadData?.celular ||
    '';

  // 2. Extrair DDD do lead (ou usar DDD explícito)
  const leadDdd = leadData?.ddd?.trim() || extractLeadDDD(leadPhone);

  let destination: RoutingDestination | null = null;

  // 3. Roteamento por DDD (Prioridade Absoluta)
  if (leadDdd && DDD_MAP[leadDdd]) {
    const entry = DDD_MAP[leadDdd];
    if (entry.type === 'fixed') {
      destination = {
        leadDdd,
        whatsapp: entry.seller.whatsapp,
        vendedorNome: entry.seller.nome,
        regiaoAtendimento: `${entry.seller.empresa ?? entry.seller.nome} / DDD ${leadDdd}`,
        roteamentoCriterio: 'ddd_lead',
        roteamentoChave: leadDdd,
        vendedor_nome: entry.seller.nome,
        vendedor_whatsapp: entry.seller.whatsapp,
        regiao_atendimento: `${entry.seller.empresa ?? entry.seller.nome} / DDD ${leadDdd}`,
        roteamento_criterio: 'ddd_lead',
        roteamento_chave: leadDdd,
        regra_aplicada: `Regra DDD ${leadDdd} -> ${entry.seller.nome} (${entry.seller.empresa ?? 'Direto'})`,
        isFallback: false,
      };
    } else {
      const key = `${leadPhone || leadData?.codigoPrevia || 'lead'}-ddd-${leadDdd}`;
      const seller = selectSellerFromPool(entry.pool, key);
      destination = {
        leadDdd,
        whatsapp: seller.whatsapp,
        vendedorNome: seller.nome,
        regiaoAtendimento: `Supertech Fitness SP / DDD ${leadDdd}`,
        roteamentoCriterio: 'ddd_lead',
        roteamentoChave: leadDdd,
        vendedor_nome: seller.nome,
        vendedor_whatsapp: seller.whatsapp,
        regiao_atendimento: `Supertech Fitness SP / DDD ${leadDdd}`,
        roteamento_criterio: 'ddd_lead',
        roteamento_chave: leadDdd,
        regra_aplicada: `Regra DDD ${leadDdd} -> Pool Interno SP (${seller.nome})`,
        isFallback: false,
      };
    }
  }

  // 4. Cidade + UF (Apenas se DDD do lead não pôde ser extraído)
  const city = leadData?.city || leadData?.cidade;
  const uf = leadData?.uf;
  if (!destination && city && uf) {
    const cityNorm = normalizeCityName(city);
    const ufNorm   = normalizeUF(uf);
    const cityKey  = `${cityNorm}|${ufNorm}`;
    const entry = CITY_ROUTING_OVERRIDES[cityKey];
    if (entry) {
      if (entry.type === 'fixed') {
        destination = {
          leadDdd: null,
          whatsapp: entry.seller.whatsapp,
          vendedorNome: entry.seller.nome,
          regiaoAtendimento: `${entry.seller.empresa ?? entry.seller.nome} / ${city}/${ufNorm}`,
          roteamentoCriterio: 'cidade_uf',
          roteamentoChave: `${city}-${ufNorm}`,
          vendedor_nome: entry.seller.nome,
          vendedor_whatsapp: entry.seller.whatsapp,
          regiao_atendimento: `${entry.seller.empresa ?? entry.seller.nome} / ${city}/${ufNorm}`,
          roteamento_criterio: 'cidade_uf',
          roteamento_chave: `${city}-${ufNorm}`,
          regra_aplicada: `Regra Cidade/UF ${cityKey} -> ${entry.seller.nome}`,
          isFallback: false,
        };
      } else {
        const seller = selectSellerFromPool(INTERNAL_SELLERS, `city-${cityKey}`);
        destination = {
          leadDdd: null,
          whatsapp: seller.whatsapp,
          vendedorNome: seller.nome,
          regiaoAtendimento: `Supertech Fitness SP / ${city}/${ufNorm}`,
          roteamentoCriterio: 'cidade_uf',
          roteamentoChave: `${city}-${ufNorm}`,
          vendedor_nome: seller.nome,
          vendedor_whatsapp: seller.whatsapp,
          regiao_atendimento: `Supertech Fitness SP / ${city}/${ufNorm}`,
          roteamento_criterio: 'cidade_uf',
          roteamento_chave: `${city}-${ufNorm}`,
          regra_aplicada: `Regra Cidade/UF ${cityKey} -> Pool Interno SP (${seller.nome})`,
          isFallback: false,
        };
      }
    }
  }

  // 5. UF (Apenas se DDD do lead e Cidade+UF não estiverem disponíveis)
  if (!destination && uf) {
    const ufNorm = normalizeUF(uf);
    const entry = UF_ROUTING[ufNorm];
    if (entry) {
      if (entry.type === 'fixed') {
        destination = {
          leadDdd: null,
          whatsapp: entry.seller.whatsapp,
          vendedorNome: entry.seller.nome,
          regiaoAtendimento: `${entry.seller.empresa ?? entry.seller.nome} / ${ufNorm}`,
          roteamentoCriterio: 'uf',
          roteamentoChave: ufNorm,
          vendedor_nome: entry.seller.nome,
          vendedor_whatsapp: entry.seller.whatsapp,
          regiao_atendimento: `${entry.seller.empresa ?? entry.seller.nome} / ${ufNorm}`,
          roteamento_criterio: 'uf',
          roteamento_chave: ufNorm,
          regra_aplicada: `Regra UF ${ufNorm} -> ${entry.seller.nome}`,
          isFallback: false,
        };
      } else {
        const seller = selectSellerFromPool(INTERNAL_SELLERS, `uf-${ufNorm}`);
        destination = {
          leadDdd: null,
          whatsapp: seller.whatsapp,
          vendedorNome: seller.nome,
          regiaoAtendimento: `Supertech Fitness SP / ${ufNorm}`,
          roteamentoCriterio: 'uf',
          roteamentoChave: ufNorm,
          vendedor_nome: seller.nome,
          vendedor_whatsapp: seller.whatsapp,
          regiao_atendimento: `Supertech Fitness SP / ${ufNorm}`,
          roteamento_criterio: 'uf',
          roteamento_chave: ufNorm,
          regra_aplicada: `Regra UF ${ufNorm} -> Pool Interno SP (${seller.nome})`,
          isFallback: false,
        };
      }
    }
  }

  // 6. Fallback final (apenas se telefone/DDD, cidade e UF forem nulos/inválidos)
  if (!destination) {
    const seller = selectSellerFromPool(INTERNAL_SELLERS, 'fallback');
    destination = {
      leadDdd: null,
      whatsapp: seller.whatsapp,
      vendedorNome: seller.nome,
      regiaoAtendimento: 'Brasil / Atendimento Interno',
      roteamentoCriterio: 'fallback',
      roteamentoChave: 'fallback_interno',
      vendedor_nome: seller.nome,
      vendedor_whatsapp: seller.whatsapp,
      regiao_atendimento: 'Brasil / Atendimento Interno',
      roteamento_criterio: 'fallback',
      roteamento_chave: 'fallback_interno',
      regra_aplicada: `Fallback Interno -> ${seller.nome}`,
      isFallback: true,
    };
  }

  return destination;
}

/**
 * Abre o WhatsApp com o número do destino e a mensagem codificada.
 * Emite obrigatoriamente os logs de auditoria antes da abertura.
 */
export function openWhatsappWithDestination(
  destination: RoutingDestination,
  message: string,
  leadData?: LeadRoutingData,
): void {
  const encoded = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${destination.whatsapp}?text=${encoded}`;

  const leadPhone = leadData?.phone || leadData?.telefone || leadData?.whatsapp || '';
  const leadDdd = destination.leadDdd || extractLeadDDD(leadPhone) || 'não identificado';

  console.log("WHATSAPP ROUTING INPUT LEAD:", leadData ?? {});
  console.log("WHATSAPP ROUTING PHONE USED:", leadPhone);
  console.log("WHATSAPP ROUTING DDD EXTRACTED:", leadDdd);
  console.log("WHATSAPP ROUTING DESTINATION:", destination);
  console.log("WHATSAPP ROUTING FINAL URL:", whatsappUrl);

  window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
}

/**
 * Constrói o bloco de destino obrigatório para acrescentar à mensagem de WhatsApp.
 */
export function buildDestinationSuffix(destination: RoutingDestination): string {
  const dddStr = destination.leadDdd ?? destination.roteamentoChave ?? 'não identificado';
  const lines: string[] = [
    '',
    '📍 *Destino do atendimento:*',
    `• DDD identificado: ${dddStr}`,
    `• Região: ${destination.regiaoAtendimento || destination.regiao_atendimento}`,
    `• Responsável: ${destination.vendedorNome || destination.vendedor_nome}`,
    `• Critério de roteamento: DDD do lead`,
  ];
  return lines.join('\n');
}
