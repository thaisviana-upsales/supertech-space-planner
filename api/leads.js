/**
 * api/leads.js — Vercel Edge Function
 * ══════════════════════════════════════════════════════════════════════════════
 * Lê leads do Google Sheets via CSV export público (sem doGet() no Apps Script).
 * Roda server-side na Vercel → sem problema de CORS.
 *
 * Planilha: 1bK2456aXKjNE8f738c-7eLqs9eT8UoNzO5Aw4WqUroE
 * Aba Leads: gid=2111535274
 *
 * GET /api/leads → { leads: [...], total: N, source: 'csv' }
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const config = { runtime: 'edge' };

// ── Configuração fixa da planilha ─────────────────────────────────────────────
const SHEET_ID  = '1bK2456aXKjNE8f738c-7eLqs9eT8UoNzO5Aw4WqUroE';
const SHEET_GID = '2111535274'; // aba Leads
const CSV_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

// ── CORS ──────────────────────────────────────────────────────────────────────
const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'no-store, max-age=0',
};

// ── Parser CSV simples (sem dependências) ─────────────────────────────────────
function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return []; // só cabeçalho ou vazio

  // Parsear cabeçalho
  const headers = parseCSVLine(lines[0]);

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every(v => v === '')) continue; // linha vazia
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] ?? '').trim();
    });
    rows.push(obj);
  }
  return rows;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ── Normalizar booleanos do CSV (Google Sheets exporta como TRUE/FALSE) ────────
function normalizeLead(row) {
  const booleans = ['enviou_consultor', 'consentimento_lgpd'];
  booleans.forEach(k => {
    if (k in row) {
      const v = String(row[k]).toUpperCase();
      row[k] = v === 'TRUE' || v === '1' || v === 'SIM';
    }
  });
  return row;
}

// ── Handler principal ─────────────────────────────────────────────────────────
export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: CORS,
    });
  }

  try {
    // ── Leitura direta do CSV público da planilha ──────────────────────────────
    const csvResp = await fetch(CSV_URL, {
      method: 'GET',
      headers: { 'Accept': 'text/csv,text/plain,*/*' },
      redirect: 'follow',
    });

    if (!csvResp.ok) {
      console.error('[api/leads] CSV export falhou:', csvResp.status);
      return new Response(JSON.stringify({ leads: [], total: 0, source: 'error', status: csvResp.status }), {
        status: 200, headers: CORS,
      });
    }

    const csvText = await csvResp.text();

    // Verificar se é HTML de erro (planilha privada ou inválida)
    if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
      console.warn('[api/leads] Planilha retornou HTML — verifique se está pública (Compartilhar > Qualquer pessoa com o link)');
      return new Response(JSON.stringify({ leads: [], total: 0, source: 'private', error: 'Planilha não pública' }), {
        status: 200, headers: CORS,
      });
    }

    const rawLeads  = parseCSV(csvText).map(normalizeLead);
    const STEP_RANK = {
      'intro': 1, 'objective': 2, 'investment': 3, 'deadline': 4,
      'profile': 5, 'catalog': 6, 'review': 6,
      'visualize': 7, 'visualise': 7,
      'confirmation': 8, 'confirmacao': 8, 'enviado': 8,
      'consultor_direto': 9, 'falar_com_consultor': 9,
      // Labels em PT (caso venham da coluna ultima_etapa)
      'Início': 1, 'Objetivo': 2, 'Investimento': 3, 'Prazo': 4,
      'Perfil': 5, 'Equipamentos': 6, 'Prévia do projeto': 7,
      'Confirmação': 8, 'Enviado': 8, 'Consultor Direto': 9,
    };

    // Consolidar por codigo_previa — manter o registro mais avançado
    const byCode  = {};
    const byPhone = {};
    const noKey   = [];

    for (const lead of rawLeads) {
      const code  = String(lead.codigo_previa || '').trim();
      const phone = String(lead.telefone || '').replace(/\D/g, '');
      const rank  = lead.enviou_consultor ? 10 : (STEP_RANK[lead.ultima_etapa] || 0);

      if (code) {
        const prev     = byCode[code];
        const prevRank = prev ? (prev.enviou_consultor ? 10 : (STEP_RANK[prev.ultima_etapa] || 0)) : -1;
        if (!prev || rank >= prevRank) byCode[code] = lead;
      } else if (phone.length >= 8) {
        const prev     = byPhone[phone];
        const prevRank = prev ? (prev.enviou_consultor ? 10 : (STEP_RANK[prev.ultima_etapa] || 0)) : -1;
        if (!prev || rank >= prevRank) byPhone[phone] = lead;
      } else {
        noKey.push(lead);
      }
    }

    const leads = [
      ...Object.values(byCode),
      ...Object.values(byPhone),
      ...noKey,
    ].sort((a, b) => {
      const da = new Date(a.data_criacao || 0).getTime();
      const db = new Date(b.data_criacao || 0).getTime();
      return db - da;
    });

    console.log(`[api/leads] CSV lido: ${rawLeads.length} linhas brutas → ${leads.length} leads consolidados`);

    return new Response(JSON.stringify({ leads, total: leads.length, source: 'csv' }), {
      status: 200, headers: CORS,
    });

  } catch (err) {
    console.error('[api/leads] Erro inesperado:', err);
    return new Response(JSON.stringify({ leads: [], total: 0, source: 'error', error: String(err) }), {
      status: 200, headers: CORS,
    });
  }
}
