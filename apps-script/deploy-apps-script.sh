#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
#  deploy-apps-script.sh
#  Supertech Space Planner™ — Deploy automático do Google Apps Script
# ══════════════════════════════════════════════════════════════════════════════
#
#  COMO USAR:
#    1. Abra o Terminal nesta pasta do projeto
#    2. Execute: bash apps-script/deploy-apps-script.sh
#    3. Siga as instruções — será pedido para autorizar o clasp no browser
#    4. Informe o Script ID quando solicitado (instruções abaixo)
#
#  COMO OBTER O SCRIPT ID:
#    1. Acesse script.google.com
#    2. Clique no projeto ligado à planilha do Space Planner
#    3. Vá em Configurações do projeto (ícone ⚙️ lateral)
#    4. Copie o "ID do script" (parece com: 1BxkFWtS_...)
#
# ══════════════════════════════════════════════════════════════════════════════

set -e

CLASP="./node_modules/.bin/clasp"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  Supertech Space Planner™ — Deploy do Apps Script Webhook"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 1. Verificar clasp instalado ───────────────────────────────────────────────
if [ ! -f "$CLASP" ]; then
  echo "→ Instalando @google/clasp localmente..."
  npm install --save-dev @google/clasp
fi

CLASP_VERSION=$($CLASP --version 2>&1 || echo "erro")
echo "✓ clasp versão: $CLASP_VERSION"
echo ""

# ── 2. Login Google ────────────────────────────────────────────────────────────
echo "→ Verificando autenticação Google..."
if $CLASP login --status 2>&1 | grep -q "You are logged in"; then
  echo "✓ Já autenticado."
else
  echo ""
  echo "Não autenticado. Iniciando login..."
  echo "Uma URL será exibida. Abra no browser e autorize o acesso."
  echo ""
  $CLASP login --no-localhost
fi

echo ""

# ── 3. Script ID ───────────────────────────────────────────────────────────────
CLASP_JSON="$ROOT_DIR/apps-script/.clasp.json"

if [ -f "$CLASP_JSON" ]; then
  SCRIPT_ID=$(python3 -c "import json; d=json.load(open('$CLASP_JSON')); print(d.get('scriptId',''))" 2>/dev/null || echo "")
  if [ -n "$SCRIPT_ID" ]; then
    echo "✓ Script ID encontrado no .clasp.json: $SCRIPT_ID"
  fi
fi

if [ -z "$SCRIPT_ID" ]; then
  echo "═══════════════════════════════════════════════════════════"
  echo "  Para obter o Script ID:"
  echo "  1. Acesse https://script.google.com"
  echo "  2. Abra o projeto do Space Planner"
  echo "  3. Configurações do projeto → copie o ID do script"
  echo "═══════════════════════════════════════════════════════════"
  echo ""
  read -p "Cole o Script ID aqui: " SCRIPT_ID
  
  if [ -z "$SCRIPT_ID" ]; then
    echo "❌ Script ID não informado. Abortando."
    exit 1
  fi
  
  # Salvar para próximas execuções
  echo "{\"scriptId\":\"$SCRIPT_ID\",\"rootDir\":\"./\"}" > "$CLASP_JSON"
  echo "✓ Script ID salvo em apps-script/.clasp.json"
fi

echo ""

# ── 4. appsscript.json ────────────────────────────────────────────────────────
cat > "$SCRIPT_DIR/appsscript.json" << 'APPSSCRIPT'
{
  "timeZone": "America/Sao_Paulo",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}
APPSSCRIPT
echo "✓ appsscript.json criado"

# ── 5. Push do código ────────────────────────────────────────────────────────
echo ""
echo "→ Enviando código para o Google Apps Script..."
cd "$SCRIPT_DIR"
$CLASP push --force 2>&1

echo ""
echo "✓ Código enviado com sucesso!"
echo ""

# ── 6. Deploy como Web App ───────────────────────────────────────────────────
echo "→ Criando nova implantação como Web App..."
DEPLOY_OUTPUT=$($CLASP deploy --description "Space Planner webhook com doGet() - $(date '+%Y-%m-%d %H:%M')" 2>&1)
echo "$DEPLOY_OUTPUT"

# Tentar extrair a nova URL de deploy
DEPLOYMENT_ID=$(echo "$DEPLOY_OUTPUT" | grep -oE 'AKfycb[A-Za-z0-9_-]+' | head -1 || echo "")

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  ✅ DEPLOY CONCLUÍDO!"
echo ""
echo "  Próximos passos:"
echo ""
echo "  1. Copie a URL da nova implantação do output acima"
echo "     (começa com: https://script.google.com/macros/s/AKfycb...)"
echo ""
echo "  2. Se a URL mudou, atualize o .env.local:"
echo "     VITE_GOOGLE_SHEETS_WEBHOOK_URL=<nova URL>"
echo ""
echo "  3. Verifique em script.google.com:"
echo "     Implantar > Gerenciar implantações"
echo "     Confirme que 'Quem pode acessar' = 'Qualquer pessoa'"
echo ""
echo "  4. Teste o doGet:"
echo "     curl -sL '<URL>/exec?action=getLeads' | python3 -m json.tool"
echo "═══════════════════════════════════════════════════════════"
echo ""

# ── 7. Teste automático ──────────────────────────────────────────────────────
WEBHOOK_URL=$(grep VITE_GOOGLE_SHEETS_WEBHOOK_URL "$ROOT_DIR/.env.local" 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "")

if [ -n "$WEBHOOK_URL" ]; then
  echo "→ Testando o endpoint atual..."
  RESPONSE=$(curl -sL "${WEBHOOK_URL}?action=getLeads" --max-time 10 2>/dev/null | head -200 || echo "timeout")
  
  if echo "$RESPONSE" | python3 -c "import sys,json; d=json.load(sys.stdin); print('✅ doGet funcionando! Leads:', len(d.get('leads', [])))" 2>/dev/null; then
    echo ""
  else
    echo "⚠️  Endpoint ainda retorna HTML (doGet não disponível nesta implantação)"
    echo "    Copie a URL da nova implantação acima e atualize o .env.local"
  fi
fi
