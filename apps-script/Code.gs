// ══════════════════════════════════════════════════════════════════
// Supertech Space Planner™ — Apps Script Webhook
// Cole este código em: Planilha → Extensões → Apps Script
// Depois: Implantar → Nova implantação → Aplicativo da web
//   Executar como: Eu | Acesso: Qualquer pessoa
// ══════════════════════════════════════════════════════════════════

var SHEET_LEADS      = 'Leads';
var SHEET_EQUIPMENTS = 'Equipamentos';
var SHEET_EVENTS     = 'Eventos';

var LEADS_HEADERS = [
  'data_criacao','data_atualizacao','codigo_previa',
  'nome','telefone','ddd','email',
  'cidade','uf','segmento',
  'objetivo','investimento_estimado','categoria_projeto','prazo',
  'ultima_etapa','status',
  'equipamentos_count','valor_estimado',
  'enviou_consultor',
  'vendedor_nome','vendedor_whatsapp',
  'regiao_atendimento','roteamento_criterio','roteamento_chave',
  'origem','consentimento_lgpd'
];

var RANK = {
  'intro':1,'objective':2,'investment':3,'deadline':4,
  'profile':5,'catalog':6,'review':6,
  'visualize':7,'visualise':7,
  'confirmation':8,'confirmacao':8,'enviado':8,
  'consultor_direto':9,'falar_com_consultor':9
};

function json(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// GET ?action=getLeads → retorna leads como JSON
function doGet(e) {
  try {
    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = getOrCreate(ss, SHEET_LEADS, LEADS_HEADERS);
    var data  = sheet.getDataRange().getValues();
    if (data.length <= 1) return json({ leads: [], total: 0 });

    var headers = data[0];
    var leads = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      headers.forEach(function(h, j) { obj[h] = data[i][j] || ''; });
      leads.push(obj);
    }

    // Consolidar por codigo_previa — manter o mais avançado
    var byCode = {};
    leads.forEach(function(l) {
      var code = String(l.codigo_previa || '').trim();
      var r    = l.enviou_consultor === true || l.enviou_consultor === 'TRUE' ? 10 : (RANK[l.ultima_etapa] || 0);
      if (!code) return;
      if (!byCode[code] || r > (RANK[byCode[code].ultima_etapa] || 0)) byCode[code] = l;
    });

    var out = Object.values(byCode).sort(function(a,b){
      return new Date(b.data_criacao||0) - new Date(a.data_criacao||0);
    });
    return json({ leads: out, total: out.length });
  } catch(err) {
    return json({ leads: [], error: String(err) });
  }
}

// POST — salva lead, equipamentos ou evento na planilha
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var type = body.type || 'lead';
    var data = body.payload || {};
    var ss   = SpreadsheetApp.getActiveSpreadsheet();

    if (type === 'lead' || type === 'lead_progress' || type === 'status') {
      saveLead(ss, data, type);
    } else if (type === 'equipments') {
      saveEquipments(ss, data);
    } else if (type === 'event') {
      saveEvent(ss, data);
    }
    return json({ ok: true });
  } catch(err) {
    return json({ ok: false, error: String(err) });
  }
}

function saveLead(ss, data, type) {
  var sheet  = getOrCreate(ss, SHEET_LEADS, LEADS_HEADERS);
  var now    = new Date().toISOString();
  var codigo = String(data.codigo_previa || '').trim();

  // Se for update, procurar linha existente
  if (codigo && (type === 'lead_progress' || type === 'status')) {
    var rows    = sheet.getDataRange().getValues();
    var headers = rows[0];
    var cIdx    = headers.indexOf('codigo_previa');
    var eIdx    = headers.indexOf('ultima_etapa');
    var uIdx    = headers.indexOf('data_atualizacao');

    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][cIdx]).trim() !== codigo) continue;
      var existR = RANK[String(rows[i][eIdx]).toLowerCase()] || 0;
      var newR   = RANK[String(data.ultima_etapa || '').toLowerCase()] || 0;
      if (newR >= existR) {
        // Atualizar campos com dados novos (preserva campos já preenchidos)
        headers.forEach(function(col, j) {
          if (col === 'data_atualizacao') {
            sheet.getRange(i+1, j+1).setValue(now);
          } else if (data[col] !== undefined && data[col] !== null && data[col] !== '') {
            sheet.getRange(i+1, j+1).setValue(data[col]);
          }
        });
      } else {
        if (uIdx >= 0) sheet.getRange(i+1, uIdx+1).setValue(now);
      }
      return;
    }
  }

  // Nova linha
  var row = LEADS_HEADERS.map(function(col) {
    if (col === 'data_criacao' || col === 'data_atualizacao') return data[col] || now;
    return (data[col] !== undefined && data[col] !== null) ? data[col] : '';
  });
  sheet.appendRow(row);
}

function saveEquipments(ss, data) {
  var sheet = getOrCreate(ss, SHEET_EQUIPMENTS,
    ['data','codigo_previa','codigo','nome','categoria','quantidade','valor_unitario','subtotal']);
  var now = new Date().toISOString();
  (data.equipamentos || []).forEach(function(eq) {
    sheet.appendRow([now, data.codigo_previa||'', eq.codigo||'', eq.nome||'',
      eq.categoria||'', eq.quantidade||0, eq.valor_unitario||0, eq.subtotal||0]);
  });
}

function saveEvent(ss, data) {
  var sheet = getOrCreate(ss, SHEET_EVENTS,
    ['timestamp','codigo_previa','etapa','acao','detalhe']);
  sheet.appendRow([data.timestamp||new Date().toISOString(),
    data.codigo_previa||'', data.etapa||'', data.acao||'', data.detalhe||'']);
}

function getOrCreate(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    var r = sheet.getRange(1,1,1,headers.length);
    r.setFontWeight('bold');
    r.setBackground('#1e2b1e');
    r.setFontColor('#a3d643');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

// Teste manual — rode no editor do Apps Script para verificar
function testeManual() {
  var mockE = { postData: { contents: JSON.stringify({
    type: 'lead_progress',
    payload: {
      codigo_previa: 'SSP-TESTE-2026',
      ultima_etapa:  'objective',
      status:        'em_andamento',
      nome:          'TESTE PAINEL PARCIAL',
      telefone:      '11999990000',
      objetivo:      'Montar uma academia do zero',
      origem:        'space_planner'
    }
  })}};
  var result = doPost(mockE);
  Logger.log('POST:', result.getContent());

  var getResult = doGet({});
  var parsed = JSON.parse(getResult.getContent());
  Logger.log('Leads na planilha:', parsed.total);
  if (parsed.leads[0]) Logger.log('Primeiro lead:', JSON.stringify(parsed.leads[0]));
}
