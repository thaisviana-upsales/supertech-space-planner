/**
 * whatsappRouting.ts
 * ──────────────────────────────────────────────────────────────────────────────
 * Lógica de roteamento do WhatsApp para o Supertech Space Planner™.
 *
 * Prioridade:
 *  1. DDD extraído do telefone do lead
 *  2. Cidade + UF (cityRoutingOverrides)
 *  3. UF como fallback
 *  4. Fallback final → pool de vendedores internos
 *
 * Numero "Comercial Geral" (11 99235-4185 / 5511992354185) NUNCA é usado.
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
  /** Região de atendimento (ex: "SP / DDD 11") */
  regiaoAtendimento: string;
  /** Critério usado: 'ddd' | 'cidade_uf' | 'uf' | 'fallback' */
  roteamentoCriterio: 'ddd' | 'cidade_uf' | 'uf' | 'fallback';
  /** Chave de roteamento (ex: "11", "Bauru-SP", "PA", "fallback_interno") */
  roteamentoChave: string;
}

export interface LeadRoutingData {
  phone?: string;
  city?: string;
  uf?: string;
  codigoPrevia?: string;
  /** DDD explícito, se vier de query param */
  ddd?: string;
}

// ── Pool de vendedores internos ───────────────────────────────────────────────
// NÃO inclui Comercial Geral (11 99235-4185)

export const INTERNAL_SELLERS: Seller[] = [
  { nome: 'Pedro',  whatsapp: '5511934210027', empresa: 'SUPERTECH FITNESS' },
  { nome: 'Robson', whatsapp: '5511991743237', empresa: 'SUPERTECH FITNESS' },
  { nome: 'Juan',   whatsapp: '5511989483896', empresa: 'SUPERTECH FITNESS' },
  { nome: 'Alef',   whatsapp: '5511917491234', empresa: 'SUPERTECH FITNESS' },
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

// ── Chave de localStorage para manter vendedor do mesmo lead ─────────────────
const ROUTING_CACHE_KEY = 'ssp_routing_cache';

function getRoutingCache(): Record<string, RoutingDestination> {
  try {
    const raw = localStorage.getItem(ROUTING_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function setRoutingCache(cache: Record<string, RoutingDestination>): void {
  try {
    localStorage.setItem(ROUTING_CACHE_KEY, JSON.stringify(cache));
  } catch { /* silently ignore */ }
}

// ── Funções auxiliares ────────────────────────────────────────────────────────

/** Remove tudo que não é dígito */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/\D/g, '');
}

/** Extrai DDD (2 dígitos) do telefone. Retorna null se não conseguir. */
export function extractDDDFromPhone(phone?: string): string | null {
  if (!phone) return null;
  const digits = normalizePhoneNumber(phone);
  if (!digits) return null;

  // 5511999... → remove prefixo 55 → 11...
  let local = digits;
  if (local.startsWith('55') && local.length >= 12) {
    local = local.slice(2);
  }

  // Precisa ter pelo menos 10 dígitos (DDD + número)
  if (local.length < 10) return null;

  const ddd = local.slice(0, 2);
  // DDD válido: 11–99 (exceto 00/01-10 que não existem no Brasil)
  if (parseInt(ddd, 10) < 11) return null;
  return ddd;
}

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
 * Garante que o mesmo routingKey sempre escolhe o mesmo índice.
 */
function stableHash(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    const char = key.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit int
  }
  return Math.abs(hash);
}

/**
 * Seleciona vendedor do pool de forma estável baseado em routingKey.
 * Garante distribuição igualitária e consistência para o mesmo lead.
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
  // 11, 12, 13, 15, 17, 18, 19 → pool interno
  '11': { type: 'pool', pool: INTERNAL_SELLERS },
  '12': { type: 'pool', pool: INTERNAL_SELLERS },
  '13': { type: 'pool', pool: INTERNAL_SELLERS },
  '15': { type: 'pool', pool: INTERNAL_SELLERS },
  '17': { type: 'pool', pool: INTERNAL_SELLERS },
  '18': { type: 'pool', pool: INTERNAL_SELLERS },
  '19': { type: 'pool', pool: INTERNAL_SELLERS },

  // 14, 16 → Renan/Diego - Globo Sports
  '14': { type: 'fixed', seller: REP_GLOBO_SPORTS },
  '16': { type: 'fixed', seller: REP_GLOBO_SPORTS },

  // 21, 22, 24 → Igor - RJ
  '21': { type: 'fixed', seller: REP_FIRETECH },
  '22': { type: 'fixed', seller: REP_FIRETECH },
  '24': { type: 'fixed', seller: REP_FIRETECH },

  // 27, 28 → Mateus - ES
  '27': { type: 'fixed', seller: REP_MATEUS },
  '28': { type: 'fixed', seller: REP_MATEUS },

  // 31, 32, 33, 37, 38 → BH Fitness
  '31': { type: 'fixed', seller: REP_BH_FITNESS },
  '32': { type: 'fixed', seller: REP_BH_FITNESS },
  '33': { type: 'fixed', seller: REP_BH_FITNESS },
  '37': { type: 'fixed', seller: REP_BH_FITNESS },
  '38': { type: 'fixed', seller: REP_BH_FITNESS },

  // 34, 35 → Alef (vendedor interno, mas número fixo Supertech)
  '34': { type: 'fixed', seller: { nome: 'Alef', whatsapp: '5511917491234', empresa: 'SUPERTECH FITNESS' } },
  '35': { type: 'fixed', seller: { nome: 'Alef', whatsapp: '5511917491234', empresa: 'SUPERTECH FITNESS' } },

  // 41, 42, 43, 44, 46 → Danilo / Curitiba-PR
  '41': { type: 'fixed', seller: REP_DANILO },
  '42': { type: 'fixed', seller: REP_DANILO },
  '43': { type: 'fixed', seller: REP_DANILO },
  '44': { type: 'fixed', seller: REP_DANILO },
  '46': { type: 'fixed', seller: REP_DANILO },

  // 45 → Valmir - Cascavel/PR
  '45': { type: 'fixed', seller: REP_VJK },

  // 47, 48, 49 → pool interno
  '47': { type: 'pool', pool: INTERNAL_SELLERS },
  '48': { type: 'pool', pool: INTERNAL_SELLERS },
  '49': { type: 'pool', pool: INTERNAL_SELLERS },

  // 51, 53, 54, 55 → Alessandro - RS
  '51': { type: 'fixed', seller: REP_ALESSANDRO },
  '53': { type: 'fixed', seller: REP_ALESSANDRO },
  '54': { type: 'fixed', seller: REP_ALESSANDRO },
  '55': { type: 'fixed', seller: REP_ALESSANDRO },

  // 61 → pool interno
  '61': { type: 'pool', pool: INTERNAL_SELLERS },

  // 62, 64 → Rodrigo Gomes - Orange
  '62': { type: 'fixed', seller: REP_ORANGE },
  '64': { type: 'fixed', seller: REP_ORANGE },

  // 63 → pool interno
  '63': { type: 'pool', pool: INTERNAL_SELLERS },

  // 65, 66 → pool interno
  '65': { type: 'pool', pool: INTERNAL_SELLERS },
  '66': { type: 'pool', pool: INTERNAL_SELLERS },

  // 67 → pool interno
  '67': { type: 'pool', pool: INTERNAL_SELLERS },

  // 68, 69, 92, 95, 97 → Marcelo AM e AC
  '68': { type: 'fixed', seller: REP_MC },
  '69': { type: 'fixed', seller: REP_MC },
  '92': { type: 'fixed', seller: REP_MC },
  '95': { type: 'fixed', seller: REP_MC },
  '97': { type: 'fixed', seller: REP_MC },

  // 71, 73, 74, 75, 77, 79 → Alan - Triplle Fitness
  '71': { type: 'fixed', seller: REP_TRIPLLE },
  '73': { type: 'fixed', seller: REP_TRIPLLE },
  '74': { type: 'fixed', seller: REP_TRIPLLE },
  '75': { type: 'fixed', seller: REP_TRIPLLE },
  '77': { type: 'fixed', seller: REP_TRIPLLE },
  '79': { type: 'fixed', seller: REP_TRIPLLE },

  // 81, 87 → Wellington - Superfitness
  '81': { type: 'fixed', seller: REP_SUPERFITNESS },
  '87': { type: 'fixed', seller: REP_SUPERFITNESS },

  // 82 → pool interno
  '82': { type: 'pool', pool: INTERNAL_SELLERS },

  // 83 → Felipe - PB
  '83': { type: 'fixed', seller: REP_JOEL },

  // 84 → pool interno
  '84': { type: 'pool', pool: INTERNAL_SELLERS },

  // 85, 88 → Arlindo - Brazil Bike
  '85': { type: 'fixed', seller: REP_BRAZIL_BIKE },
  '88': { type: 'fixed', seller: REP_BRAZIL_BIKE },

  // 86, 89 → pool interno
  '86': { type: 'pool', pool: INTERNAL_SELLERS },
  '89': { type: 'pool', pool: INTERNAL_SELLERS },

  // 91, 93, 94 → Mauricio Borges - MB
  '91': { type: 'fixed', seller: REP_MB },
  '93': { type: 'fixed', seller: REP_MB },
  '94': { type: 'fixed', seller: REP_MB },

  // 96 → pool interno
  '96': { type: 'pool', pool: INTERNAL_SELLERS },

  // 98, 99 → pool interno
  '98': { type: 'pool', pool: INTERNAL_SELLERS },
  '99': { type: 'pool', pool: INTERNAL_SELLERS },
};

// ── Mapa Cidade/UF → Destino ──────────────────────────────────────────────────

type CityEntry =
  | { type: 'pool' }
  | { type: 'fixed'; seller: Seller };

/**
 * cityRoutingOverrides: chave = "cidade normalizada|uf"
 * UF sempre uppercase, cidade lowercase sem acento.
 */
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

// ── Mapa UF → Destino (fallback quando cidade não mapeada) ────────────────────

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

// ── Função principal de resolução ─────────────────────────────────────────────

/**
 * Resolve o destino de WhatsApp com base nos dados do lead.
 * Prioridade: DDD → cidade/UF → UF → fallback interno.
 * Mantém o mesmo vendedor para o mesmo lead via localStorage.
 */
export function resolveWhatsappDestination(leadData: LeadRoutingData): RoutingDestination {
  // Chave de cache: codigoPrevia ou fallback com phone+city+uf
  const cacheKey =
    leadData.codigoPrevia?.trim() ||
    `${leadData.phone || ''}-${leadData.city || ''}-${leadData.uf || ''}`;

  // Verificar cache (mesmo lead → mesmo vendedor)
  if (cacheKey) {
    const cache = getRoutingCache();
    if (cache[cacheKey]) return cache[cacheKey];
  }

  let destination: RoutingDestination | null = null;

  // ── 1. Tentar DDD ──────────────────────────────────────────────────────────
  const ddd =
    leadData.ddd?.trim() ||
    extractDDDFromPhone(leadData.phone);

  if (ddd) {
    const entry = DDD_MAP[ddd];
    if (entry) {
      if (entry.type === 'fixed') {
        destination = {
          whatsapp: entry.seller.whatsapp,
          vendedorNome: entry.seller.nome,
          regiaoAtendimento: `${entry.seller.empresa ?? entry.seller.nome} / DDD ${ddd}`,
          roteamentoCriterio: 'ddd',
          roteamentoChave: ddd,
        };
      } else {
        const seller = selectSellerFromPool(entry.pool, `${cacheKey}-ddd-${ddd}`);
        destination = {
          whatsapp: seller.whatsapp,
          vendedorNome: seller.nome,
          regiaoAtendimento: `SP / DDD ${ddd}`,
          roteamentoCriterio: 'ddd',
          roteamentoChave: ddd,
        };
      }
    }
  }

  // ── 2. Tentar cidade + UF ──────────────────────────────────────────────────
  if (!destination && leadData.city && leadData.uf) {
    const cityNorm = normalizeCityName(leadData.city);
    const ufNorm   = normalizeUF(leadData.uf);
    const cityKey  = `${cityNorm}|${ufNorm}`;

    const entry = CITY_ROUTING_OVERRIDES[cityKey];
    if (entry) {
      if (entry.type === 'fixed') {
        destination = {
          whatsapp: entry.seller.whatsapp,
          vendedorNome: entry.seller.nome,
          regiaoAtendimento: `${leadData.city}/${ufNorm}`,
          roteamentoCriterio: 'cidade_uf',
          roteamentoChave: `${leadData.city}-${ufNorm}`,
        };
      } else {
        const seller = selectSellerFromPool(INTERNAL_SELLERS, `${cacheKey}-cidade-${cityKey}`);
        destination = {
          whatsapp: seller.whatsapp,
          vendedorNome: seller.nome,
          regiaoAtendimento: `${leadData.city}/${ufNorm}`,
          roteamentoCriterio: 'cidade_uf',
          roteamentoChave: `${leadData.city}-${ufNorm}`,
        };
      }
    }
  }

  // ── 3. Tentar UF como fallback ─────────────────────────────────────────────
  if (!destination && leadData.uf) {
    const ufNorm = normalizeUF(leadData.uf);
    const entry  = UF_ROUTING[ufNorm];
    if (entry) {
      if (entry.type === 'fixed') {
        destination = {
          whatsapp: entry.seller.whatsapp,
          vendedorNome: entry.seller.nome,
          regiaoAtendimento: `${entry.seller.empresa ?? entry.seller.nome} / ${ufNorm}`,
          roteamentoCriterio: 'uf',
          roteamentoChave: ufNorm,
        };
      } else {
        const seller = selectSellerFromPool(INTERNAL_SELLERS, `${cacheKey}-uf-${ufNorm}`);
        destination = {
          whatsapp: seller.whatsapp,
          vendedorNome: seller.nome,
          regiaoAtendimento: ufNorm,
          roteamentoCriterio: 'uf',
          roteamentoChave: ufNorm,
        };
      }
    }
  }

  // ── 4. Fallback final: pool interno ────────────────────────────────────────
  if (!destination) {
    const seller = selectSellerFromPool(INTERNAL_SELLERS, `${cacheKey}-fallback`);
    destination = {
      whatsapp: seller.whatsapp,
      vendedorNome: seller.nome,
      regiaoAtendimento: 'Brasil / Atendimento Interno',
      roteamentoCriterio: 'fallback',
      roteamentoChave: 'fallback_interno',
    };
  }

  // Salvar no cache para manter consistência ao reclique
  if (cacheKey) {
    const cache = getRoutingCache();
    cache[cacheKey] = destination;
    setRoutingCache(cache);
  }

  return destination;
}

/**
 * Abre o WhatsApp com o número do destino e a mensagem codificada.
 * Usa wa.me que funciona em mobile e desktop.
 */
export function openWhatsappWithDestination(
  destination: RoutingDestination,
  message: string,
): void {
  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${destination.whatsapp}?text=${encoded}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Constrói o sufixo de destino para acrescentar à mensagem da prévia.
 * Se algum dado estiver ausente, não quebra.
 */
export function buildDestinationSuffix(destination: RoutingDestination): string {
  const lines: string[] = [
    '',
    '📍 *DESTINO DO ATENDIMENTO*',
    `Responsável: ${destination.vendedorNome}`,
    `Região: ${destination.regiaoAtendimento}`,
  ];
  return lines.join('\n');
}
