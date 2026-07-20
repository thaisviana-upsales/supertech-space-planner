/**
 * Supertech Space Planner™ — Google Apps Script Webhook
 * ══════════════════════════════════════════════════════════════════════════════
 * INSTRUÇÕES DE DEPLOY:
 *
 *  1. Acesse script.google.com
 *  2. Abra o projeto ligado à planilha do Space Planner
 *  3. Cole este código substituindo todo o conteúdo existente
 *  4. Clique em Implantar > Nova implantação
 *     - Tipo: Aplicativo da web
 *     - Executar como: Eu (sua conta Google)
 *     - Quem pode acessar: Qualquer pessoa
 *  5. Copie a URL gerada e cole em .env.local como VITE_GOOGLE_SHEETS_WEBHOOK_URL
 *
 * ABAS DA PLANILHA (criadas automaticamente se não existirem):
 *   - Leads        → registros principais (type: lead, status, lead_progress)
 *   - Equipamentos → itens selecionados por lead (type: equipments)
 *   - Eventos      → histórico de ações (type: event)
 * ══════════════════════════════════════════════════════════════════════════════
 */

// ── Configuração de abas ───────────────────────────────────────────────────────
var SHEET_LEADS      = 'Leads';
var SHEET_EQUIPMENTS = 'Equipamentos';
var SHEET_EVENTS     = 'Eventos';

// ── Cabeçalhos das abas ────────────────────────────────────────────────────────
var LEADS_HEADERS = [
  'data_criacao', 'data_atualizacao', 'codigo_previa',
  'nome', 'telefone', 'ddd', 'email',
  'cidade', 'uf', 'segmento',
  'objetivo', 'investimento_estimado', 'categoria_projeto', 'prazo',
  'ultima_etapa', 'status',
  'equipamentos_count', 'valor_estimado',
  'enviou_consultor',
  'vendedor_nome', 'vendedor_whatsapp',
  'regiao_atendimento', 'roteamento_criterio', 'roteamento_chave',
  'origem', 'consentimento_lgpd', 'user_agent'
];

var EQUIPMENTS_HEADERS = [
  'data', 'codigo_previa', 'codigo', 'nome',
  'categoria', 'quantidade', 'valor_unitario', 'subtotal'
];

var EVENTS_HEADERS = [
  'timestamp', 'codigo_previa', 'etapa', 'acao', 'detalhe'
];

// ── Resposta com CORS ──────────────────────────────────────────────────────────
function corsResponse(data) {
  var output = ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return output;
}

// ── GET — leitura de leads para o Painel Admin ────────────────────────────────
/**
 * Retorna todos os leads da aba "Leads" como array JSON.
 * Chamado pelo AdminLeadsPage via fetch GET ?action=getLeads
 *
 * Exemplo de retorno:
 * { "leads": [ { "codigo_previa": "SSP-1234-2026", "nome": "João", ... }, ... ] }
 */
function doGet(e) {
  try {
    var action = e && e.parameter && e.parameter.action ? e.parameter.action : 'getLeads';

    if (action === 'getLeads') {
      var ss    = SpreadsheetApp.getActiveSpreadsheet();
      var sheet = getOrCreateSheet(ss, SHEET_LEADS, LEADS_HEADERS);
      var data  = sheet.getDataRange().getValues();

      if (data.length <= 1) {
        // Apenas cabeçalho ou vazio
        return corsResponse({ leads: [] });
      }

      var headers = data[0];
      var leads   = [];

      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = row[j] !== undefined ? row[j] : '';
        }
        leads.push(obj);
      }

      // Consolidar por codigo_previa — retornar somente o registro mais avançado
      var byCode = {};
      var noCode = [];

      var STEP_RANK = {
        'intro': 1, 'objective': 2, 'investment': 3, 'deadline': 4,
        'profile': 5, 'catalog': 6, 'review': 6,
        'visualize': 7, 'visualise': 7,
        'confirmation': 8, 'confirmacao': 8, 'enviado': 8,
        'consultor_direto': 9, 'falar_com_consultor': 9,
        'Início': 1, 'Objetivo': 2, 'Investimento': 3, 'Prazo': 4,
        'Perfil': 5, 'Equipamentos': 6, 'Prévia do projeto': 7,
        'Confirmação': 8, 'Enviado': 8, 'Consultor Direto': 9
      };

      for (var k = 0; k < leads.length; k++) {
        var lead = leads[k];
        var code = String(lead.codigo_previa || '').trim();
        var rank = STEP_RANK[lead.ultima_etapa] || 0;
        if (lead.enviou_consultor === true || lead.enviou_consultor === 'TRUE' || lead.enviou_consultor === '1') {
          rank = 10;
        }

        if (code) {
          if (!byCode[code] || rank > (STEP_RANK[byCode[code].ultima_etapa] || 0)) {
            lead._rank = rank;
            byCode[code] = lead;
          }
        } else {
          noCode.push(lead);
        }
      }

      var consolidated = [];
      for (var key in byCode) {
        if (byCode.hasOwnProperty(key)) {
          consolidated.push(byCode[key]);
        }
      }
      consolidated = consolidated.concat(noCode);

      // Ordenar por data_criacao desc
      consolidated.sort(function(a, b) {
        var da = new Date(a.data_criacao || 0).getTime();
        var db = new Date(b.data_criacao || 0).getTime();
        return db - da;
      });

      return corsResponse({ leads: consolidated, total: consolidated.length });
    }

    return corsResponse({ error: 'Ação desconhecida: ' + action });

  } catch (err) {
    return corsResponse({ error: String(err), stack: err.stack || '' });
  }
}

// ── POST — recebimento de dados da jornada ────────────────────────────────────
/**
 * Recebe payloads do frontend e grava na planilha correta.
 * Tipos aceitos: 'lead', 'lead_progress', 'equipments', 'event', 'status'
 */
function doPost(e) {
  try {
    var raw  = e.postData ? e.postData.contents : '{}';
    var body = JSON.parse(raw);
    var type = body.type || 'lead';
    var data = body.payload || {};

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // lead, lead_progress e status → todos vão para a aba Leads
    if (type === 'lead' || type === 'lead_progress' || type === 'status') {
      saveLead(ss, data, type);
    } else if (type === 'equipments') {
      saveEquipments(ss, data);
    } else if (type === 'event') {
      saveEvent(ss, data);
    }

    return corsResponse({ ok: true, type: type });

  } catch (err) {
    // Nunca retornar erro 500 — Apps Script com no-cors ignora o body mesmo assim
    return corsResponse({ ok: false, error: String(err) });
  }
}

// ── Salvar lead (tipo: lead, lead_progress, status) ───────────────────────────
function saveLead(ss, data, type) {
  var sheet = getOrCreateSheet(ss, SHEET_LEADS, LEADS_HEADERS);

  // Normalizar data_atualizacao
  var now = new Date().toISOString();
  var codigo = String(data.codigo_previa || '').trim();

  // Para type: status e lead_progress — tentar atualizar linha existente
  if ((type === 'status' || type === 'lead_progress') && codigo) {
    var rows = sheet.getDataRange().getValues();
    var headers = rows[0];
    var codeIdx = headers.indexOf('codigo_previa');

    if (codeIdx >= 0) {
      for (var i = 1; i < rows.length; i++) {
        if (String(rows[i][codeIdx]).trim() === codigo) {
          // Verificar se a nova etapa é mais avançada
          var etapaIdx    = headers.indexOf('ultima_etapa');
          var updIdx      = headers.indexOf('data_atualizacao');
          var RANK = {
            'intro': 1, 'objective': 2, 'investment': 3, 'deadline': 4,
            'profile': 5, 'catalog': 6, 'review': 6,
            'visualize': 7, 'enviado': 8, 'confirmation': 8, 'confirmacao': 8,
            'consultor_direto': 9, 'falar_com_consultor': 9
          };
          var existingRank = RANK[String(rows[i][etapaIdx]).toLowerCase()] || 0;
          var newRank      = RANK[String(data.ultima_etapa || '').toLowerCase()] || 0;

          if (newRank >= existingRank) {
            // Atualizar campo a campo (preservar dados já preenchidos)
            for (var j = 0; j < headers.length; j++) {
              var col = headers[j];
              var val = data[col];
              if (col === 'data_atualizacao') {
                sheet.getRange(i + 1, j + 1).setValue(now);
              } else if (val !== undefined && val !== null && val !== '') {
                sheet.getRange(i + 1, j + 1).setValue(val);
              }
            }
            return; // Atualizado com sucesso
          } else {
            // Etapa mais baixa — só atualizar data_atualizacao
            if (updIdx >= 0) sheet.getRange(i + 1, updIdx + 1).setValue(now);
            return;
          }
        }
      }
    }
  }

  // Inserir nova linha (lead não existe ainda ou tipo 'lead')
  var row = LEADS_HEADERS.map(function(col) {
    if (col === 'data_criacao' || col === 'data_atualizacao') {
      return data[col] || now;
    }
    var val = data[col];
    return val !== undefined && val !== null ? val : '';
  });

  sheet.appendRow(row);
}

// ── Salvar equipamentos ───────────────────────────────────────────────────────
function saveEquipments(ss, data) {
  var sheet   = getOrCreateSheet(ss, SHEET_EQUIPMENTS, EQUIPMENTS_HEADERS);
  var now     = new Date().toISOString();
  var codigo  = data.codigo_previa || '';
  var equipamentos = data.equipamentos || [];

  for (var i = 0; i < equipamentos.length; i++) {
    var eq = equipamentos[i];
    sheet.appendRow([
      now,
      codigo,
      eq.codigo       || '',
      eq.nome         || '',
      eq.categoria    || '',
      eq.quantidade   || 0,
      eq.valor_unitario || 0,
      eq.subtotal     || 0,
    ]);
  }
}

// ── Salvar evento ─────────────────────────────────────────────────────────────
function saveEvent(ss, data) {
  var sheet = getOrCreateSheet(ss, SHEET_EVENTS, EVENTS_HEADERS);
  sheet.appendRow([
    data.timestamp   || new Date().toISOString(),
    data.codigo_previa || '',
    data.etapa       || '',
    data.acao        || '',
    data.detalhe     || '',
  ]);
}

// ── Criar aba se não existir ──────────────────────────────────────────────────
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    // Formatar cabeçalho
    var headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#1e2b1e');
    headerRange.setFontColor('#a3d643');
    sheet.setFrozenRows(1);
  }
  // Garantir cabeçalho mesmo se a aba já existia mas estava vazia
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

// ── Teste manual (rodar no editor do Apps Script) ─────────────────────────────
function testeManual() {
  // Simular POST de lead parcial
  var mockPost = {
    postData: {
      contents: JSON.stringify({
        type: 'lead_progress',
        payload: {
          data_criacao:         new Date().toISOString(),
          data_atualizacao:     new Date().toISOString(),
          codigo_previa:        'SSP-TESTE-2026',
          ultima_etapa:         'objective',
          status:               'em_andamento',
          nome:                 'TESTE PAINEL PARCIAL',
          telefone:             '11999990000',
          ddd:                  '11',
          cidade:               '',
          uf:                   '',
          objetivo:             'Montar uma academia do zero',
          origem:               'space_planner',
        }
      })
    }
  };

  var result = doPost(mockPost);
  Logger.log('POST result: ' + result.getContent());

  // Simular GET
  var mockGet = { parameter: { action: 'getLeads' } };
  var getResult = doGet(mockGet);
  var json = JSON.parse(getResult.getContent());
  Logger.log('GET result - total leads: ' + json.total);
  Logger.log('Primeiro lead: ' + JSON.stringify(json.leads[0]));
}
