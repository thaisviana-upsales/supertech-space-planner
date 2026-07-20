/**
 * api/leads.js — Vercel Serverless Function (Node.js)
 * Lê leads do Google Sheets via CSV export público.
 * Sem runtime manual — a Vercel detecta automaticamente.
 *
 * GET /api/leads → { leads: [...], total: N, source: 'csv' }
 */

const SHEET_ID  = '1bK2456aXKjNE8f738c-7eLqs9eT8UoNzO5Aw4WqUroE';
const SHEET_GID = '2111535274';
const CSV_URL   = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type':                 'application/json',
  'Cache-Control':                'no-store, max-age=0',
};

const STEP_RANK = {
  'intro':1, 'objective':2, 'investment':3, 'deadline':4,
  'profile':5, 'catalog':6, 'review':6,
  'visualize':7, 'visualise':7,
  'confirmation':8, 'confirmacao':8, 'enviado':8,
  'consultor_direto':9, 'falar_com_consultor':9,
};

// ── Parser CSV sem dependências ────────────────────────────────────────────────
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = parseCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.every(v => v === '')) continue;
    const obj = {};
    headers.forEach((h, idx) => { obj[h.trim()] = (values[idx] || '').trim(); });
    rows.push(obj);
  }
  return rows;
}

function normalizeLead(row) {
  ['enviou_consultor', 'consentimento_lgpd'].forEach(k => {
    if (k in row) {
      const v = String(row[k]).toUpperCase();
      row[k] = v === 'TRUE' || v === '1' || v === 'SIM';
    }
  });
  return row;
}

// ── Handler Vercel (CommonJS padrão) ──────────────────────────────────────────
module.exports = async function handler(req, res) {
  // Definir headers CORS em todas as respostas
  Object.entries(CORS_HEADERS).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const csvResp = await fetch(CSV_URL, {
      method: 'GET',
      headers: { 'Accept': 'text/csv,text/plain,*/*' },
      redirect: 'follow',
    });

    if (!csvResp.ok) {
      console.error('[api/leads] CSV falhou:', csvResp.status);
      return res.status(200).json({ leads: [], total: 0, source: 'error', status: csvResp.status });
    }

    const csvText = await csvResp.text();

    if (csvText.trim().startsWith('<!DOCTYPE') || csvText.trim().startsWith('<html')) {
      console.warn('[api/leads] Planilha retornou HTML — não está pública');
      return res.status(200).json({ leads: [], total: 0, source: 'private' });
    }

    const rawLeads = parseCSV(csvText).map(normalizeLead);

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
    ].sort((a, b) => new Date(b.data_criacao || 0) - new Date(a.data_criacao || 0));

    console.log(`[api/leads] ${rawLeads.length} linhas → ${leads.length} consolidados`);
    return res.status(200).json({ leads, total: leads.length, source: 'csv' });

  } catch (err) {
    console.error('[api/leads] Erro:', err);
    return res.status(200).json({ leads: [], total: 0, source: 'error', error: String(err) });
  }
};
