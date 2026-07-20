/**
 * api/leads.js — Vercel Serverless Function
 * ══════════════════════════════════════════════════════════════════════════════
 * Proxy que lê os leads do Google Sheets via Apps Script webhook.
 * Roda no servidor (Vercel), então não tem problema de CORS.
 *
 * GET /api/leads  → retorna todos os leads consolidados
 *
 * A leitura funciona assim:
 *   1. Faz GET no Apps Script com ?action=getLeads
 *   2. Se o Apps Script tiver doGet() implementado, retorna JSON
 *   3. Se não tiver, retorna [] (painel usa localStorage como fallback)
 *
 * Variáveis de ambiente necessárias (Vercel Dashboard > Settings > Env Vars):
 *   VITE_GOOGLE_SHEETS_WEBHOOK_URL  → mesma URL do Apps Script
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const config = { runtime: 'edge' };

export default async function handler(req) {
  // CORS — permite chamada do frontend Vercel
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Método não permitido' }), {
      status: 405, headers: corsHeaders,
    });
  }

  const webhookUrl = process.env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
  if (!webhookUrl) {
    return new Response(JSON.stringify({ leads: [], error: 'WEBHOOK_URL não configurada' }), {
      status: 200, headers: corsHeaders,
    });
  }

  try {
    // Requisição GET ao Apps Script (sem restrição de CORS do lado do servidor)
    const sheetsResp = await fetch(`${webhookUrl}?action=getLeads`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      redirect: 'follow',
    });

    if (!sheetsResp.ok) {
      return new Response(JSON.stringify({ leads: [], source: 'fallback', status: sheetsResp.status }), {
        status: 200, headers: corsHeaders,
      });
    }

    const text = await sheetsResp.text();

    // Verificar se é JSON válido (Apps Script pode retornar HTML de erro)
    if (!text.startsWith('{') && !text.startsWith('[')) {
      console.warn('[api/leads] Apps Script não retornou JSON válido. doGet() pode não estar implementado.');
      return new Response(JSON.stringify({ leads: [], source: 'fallback', raw: text.slice(0, 200) }), {
        status: 200, headers: corsHeaders,
      });
    }

    const json = JSON.parse(text);
    const leads = json.leads ?? json.data ?? (Array.isArray(json) ? json : []);

    return new Response(JSON.stringify({ leads, total: leads.length, source: 'sheets' }), {
      status: 200, headers: corsHeaders,
    });

  } catch (err) {
    console.error('[api/leads] Erro ao buscar leads do Sheets:', err);
    return new Response(JSON.stringify({ leads: [], source: 'error', error: String(err) }), {
      status: 200, headers: corsHeaders,
    });
  }
}
