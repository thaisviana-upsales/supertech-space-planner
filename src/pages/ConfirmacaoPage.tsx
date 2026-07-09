import { useRef, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Download, MessageCircle,
  Inbox, ClipboardList, FileText, Clock,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { generatePDF } from '../utils/generatePDF';
import { upsertLeadFromData } from '../utils/leadStorage';
import { updateLeadStatusToSheets, saveEventToSheets } from '../services/googleSheets';
import {
  resolveWhatsappDestination,
  openWhatsappWithDestination,
} from '../data/whatsappRouting';

// ── Constants ─────────────────────────────────────────────────────────────────
// (destination name/number are now resolved dynamically via whatsappRouting)

// ── Helpers ───────────────────────────────────────────────────────────────────
function makeCode(): string {
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `SSP-${rand}-${new Date().getFullYear()}`;
}

function brl(v: number) {
  return 'R$ ' + v.toLocaleString('pt-BR');
}

// ── Sub-components ────────────────────────────────────────────────────────────
function PipelineCard({ num, icon, label }: { num: string; icon: React.ReactNode; label: string }) {
  return (
    <div className="flex-1 flex flex-col items-center gap-2 bg-surface-card border border-surface-border rounded-2xl p-5">
      <span className="text-3xl font-black text-supertech-400 leading-none">{num}</span>
      <div className="text-supertech-500/60">{icon}</div>
      <span className="text-xs text-slate-400 text-center leading-snug">{label}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function ConfirmacaoPage() {
  const navigate    = useNavigate();
  const { state, reset } = usePlanner();
  const data        = state.data;

  // Stable code for this session
  const previewCode = useRef(makeCode()).current;

  // Resolve routing destination (stable, cached per lead)
  const destination = resolveWhatsappDestination({
    phone:        data.phone,
    city:         data.city,
    uf:           data.uf,
    codigoPrevia: data.codigoPrevia,
  });

  const totalEstimate = useMemo(() =>
    (data.selectedEquipment ?? []).reduce((s, e) => s + (e.price ?? 0) * e.quantity, 0),
  [data.selectedEquipment]);

  // Save lead to localStorage once on mount
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    upsertLeadFromData(data, 7);

    // Save final status to Google Sheets (non-blocking)
    updateLeadStatusToSheets({
      codigoPrevia:         data.codigoPrevia ?? previewCode,
      nome:                 data.name,
      telefone:             data.phone,
      email:                data.email,
      cidade:               data.city,
      uf:                   data.uf,
      segmento:             data.profileLabel,
      objetivo:             data.objectiveLabel,
      investimentoEstimado: data.investmentLabel,
      prazo:                data.deadlineLabel,
      ultimaEtapa:          'Confirmação',
      status:               data.sentToConsultor ? 'enviado' : 'preencheu_tudo',
      enviouConsultor:      data.sentToConsultor ?? false,
      origem:               data.origem ?? 'space_planner',
      consentimentoLgpd:    true,
      // Routing fields (resolved from DDD/cidade/UF)
      vendedorNome:         data.vendedorNome      ?? destination.vendedorNome,
      vendedorWhatsapp:     data.vendedorWhatsapp  ?? destination.whatsapp,
      regiaoAtendimento:    data.regiaoAtendimento ?? destination.regiaoAtendimento,
      roteamentoCriterio:   data.roteamentoCriterio ?? destination.roteamentoCriterio,
      roteamentoChave:      data.roteamentoChave   ?? destination.roteamentoChave,
    });
    saveEventToSheets(data.codigoPrevia ?? previewCode, 'Confirmação', 'chegou', '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const equipCount = (data.selectedEquipment ?? []).length;

  function handleNewProject() {
    reset();
    navigate('/');
  }

  async function handleDownloadPDF() {
    const doc      = await generatePDF(data, previewCode);
    const safeName = (data.name ?? 'projeto').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const code     = previewCode.toLowerCase();
    doc.save(`supertech-space-planner-previa-${safeName}-${code}.pdf`);
  }

  function handleOpenWhatsApp() {
    const msg = [
      `Olá! Acabei de enviar minha prévia via Supertech Space Planner™. Código: ${
        data.codigoPrevia ?? previewCode
      }`,
      '',
      `📍 *Origem:* ${data.city ?? ''}${data.uf ? `, ${data.uf}` : ''}`,
    ].join('\n');

    openWhatsappWithDestination(destination, msg);

    // Mark as sent in Sheets (non-blocking)
    updateLeadStatusToSheets({
      codigoPrevia:         data.codigoPrevia ?? previewCode,
      nome:                 data.name,
      telefone:             data.phone,
      email:                data.email,
      cidade:               data.city,
      uf:                   data.uf,
      segmento:             data.profileLabel,
      objetivo:             data.objectiveLabel,
      investimentoEstimado: data.investmentLabel,
      prazo:                data.deadlineLabel,
      enviouConsultor:      true,
      origem:               data.origem ?? 'space_planner',
      consentimentoLgpd:    true,
      vendedorNome:         destination.vendedorNome,
      vendedorWhatsapp:     destination.whatsapp,
      regiaoAtendimento:    destination.regiaoAtendimento,
      roteamentoCriterio:   destination.roteamentoCriterio,
      roteamentoChave:      destination.roteamentoChave,
    });
    saveEventToSheets(data.codigoPrevia ?? previewCode, 'WhatsApp', 'enviou', destination.vendedorNome);
  }

  return (
    <div className="min-h-screen bg-app flex flex-col">

      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-4 pt-16 pb-10">

        {/* Logo badge */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-2xl bg-[#8BC34A]/20 blur-2xl scale-150" />
          <img
            src="/brand/logo-supertech-branca.png"
            alt="Supertech 360°"
            style={{ position: 'relative', height: '40px', width: 'auto', objectFit: 'contain' }}
          />
        </div>

        <h1 className="text-page-title font-black text-white mb-2 tracking-tight">
          Projeto enviado.
        </h1>
        <p className="text-slate-400 text-base mb-4">
          Seu consultor Supertech já recebeu a prévia.
        </p>
        <div className="flex items-center gap-1.5 text-supertech-400 text-sm font-semibold mb-10">
          <CheckCircle2 size={15} strokeWidth={2.5} />
          Prévia entregue com sucesso
        </div>

        {/* O QUE ACONTECE AGORA */}
        <div className="w-full max-w-2xl">
          <p className="label-upper mb-1">O que acontece agora</p>
          <p className="text-slate-500 text-sm mb-6">
            Seu projeto segue para análise comercial em 3 etapas.
          </p>

          {/* Pipeline steps — vertical on mobile, horizontal on sm+ */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-0">
            <PipelineCard num="01" icon={<Inbox size={22} />}       label="Consultor recebe sua prévia" />
            <div className="hidden sm:flex items-center text-slate-600 text-lg font-bold self-center select-none px-1">→</div>
            <PipelineCard num="02" icon={<ClipboardList size={22} />} label="Análise técnica do projeto" />
            <div className="hidden sm:flex items-center text-slate-600 text-lg font-bold self-center select-none px-1">→</div>
            <PipelineCard num="03" icon={<FileText size={22} />}    label="Proposta comercial ajustada" />
          </div>
        </div>
      </section>

      {/* ── MIDDLE ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center px-4 pb-10 gap-6 max-w-2xl mx-auto w-full">

        {/* Response time */}
        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Clock size={13} />
          Tempo médio de resposta: até 1 dia útil
        </div>

        {/* WhatsApp notice */}
        <div className="w-full flex items-start gap-3 bg-surface-card border-l-4 border-supertech-400 rounded-xl px-4 py-4">
          <MessageCircle size={18} className="text-supertech-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-slate-200 text-sm font-medium">
              Seu consultor pode entrar em contato ainda hoje.
            </p>
            <p className="text-slate-500 text-xs mt-0.5">Deixe o WhatsApp aberto.</p>
          </div>
        </div>

        {/* Download PDF button */}
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-supertech-500 text-dark-950 font-bold text-sm hover:bg-supertech-400 transition-colors shadow-green-glow"
        >
          <Download size={16} strokeWidth={2.5} />
          Baixar Prévia do Orçamento
        </button>

        {/* Connector dots */}
        <div className="flex flex-col items-center gap-1 -my-2">
          {[0,1,2].map(i => <div key={i} className="w-1 h-1 rounded-full bg-surface-border" />)}
        </div>

        {/* ── PREVIEW CARD ───────────────────────────────────────────────── */}
        <div className="w-full bg-surface-card border border-surface-border rounded-2xl p-6 relative">

          {/* Top labels */}
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="label-upper text-[10px]">Prévia do Projeto</p>
              <p className="text-xs text-slate-500 mt-0.5">Supertech Space Planner™</p>
            </div>
            <span className="flex items-center gap-1 px-3 py-1 rounded-lg bg-supertech-500 text-dark-950 text-xs font-black tracking-wider">
              ENVIADO <CheckCircle2 size={12} strokeWidth={3} />
            </span>
          </div>

          {/* Lead info */}
          <h2 className="text-2xl font-black text-white mt-3 mb-0.5">
            {data.name ?? 'Não informado'}
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            {[data.profileLabel, data.city && data.uf ? `${data.city}, ${data.uf}` : data.city ?? data.uf]
              .filter(Boolean)
              .join(' · ')}
          </p>

          <div className="border-t border-surface-border mb-4" />

          {/* Equipment + estimate */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-slate-300 text-sm">
              {equipCount > 0
                ? `${equipCount} equipamento${equipCount > 1 ? 's' : ''} selecionado${equipCount > 1 ? 's' : ''}`
                : 'Nenhum equipamento'}
            </span>
            {totalEstimate > 0 && (
              <span className="text-supertech-400 font-bold text-sm">
                Estimativa · {brl(totalEstimate)}
              </span>
            )}
          </div>

          <div className="border-t border-surface-border mb-4" />

          {/* Destination */}
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">
            Direcionado para:
          </p>
          <p className="text-slate-200 text-sm font-medium">{destination.vendedorNome}</p>
          <p className="text-slate-500 text-xs">{destination.regiaoAtendimento}</p>

          {/* Code */}
          <p className="text-[10px] text-slate-600 text-right mt-4">
            Código da prévia · {previewCode}
          </p>
        </div>

        {/* ── ACTION BUTTONS ─────────────────────────────────────────────── */}
        <div className="w-full flex flex-col gap-3 pt-2">
          <button
            onClick={handleOpenWhatsApp}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full border border-supertech-500/50 text-supertech-400 text-sm font-semibold hover:bg-supertech-500/10 transition-colors"
          >
            <MessageCircle size={16} />
            Abrir conversa no WhatsApp
          </button>
          <button
            onClick={handleNewProject}
            className="w-full text-center text-slate-500 text-sm hover:text-slate-300 transition-colors py-3"
          >
            Montar novo projeto
          </button>
        </div>
      </section>

      {/* ── SPACER + WATERMARK ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-16 relative overflow-hidden">
        <span className="text-[10rem] font-black text-white/[0.03] select-none leading-none">S</span>
        <p className="text-[10px] font-semibold text-slate-700 tracking-[0.3em] uppercase mt-2">
          Space Planner™ · Fabricação Nacional
        </p>
        <p className="text-xs text-slate-700 mt-1">
          Equipamentos profissionais para academias, hotéis, condomínios e clubes.
        </p>
      </div>

      {/* ── FOOTER ───────────────────────────────────────────────────────── */}
      <footer className="border-t border-surface-border bg-surface-card">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">

            {/* Brand */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                {/* Official logo */}
                <img
                  src="/brand/logo-supertech-branca.png"
                  alt="Supertech 360°"
                  style={{ height: '20px', width: 'auto', objectFit: 'contain', opacity: 0.85 }}
                />
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Fábrica nacional de equipamentos fitness profissionais
                para academias, condomínios, hotéis e clubes.
              </p>
            </div>

            {/* Ferramenta */}
            <div>
              <p className="label-upper mb-4">Ferramenta</p>
              <ul className="flex flex-col gap-2.5">
                {['Space Planner™', 'A Fábrica', 'Falar com consultor'].map(item => (
                  <li key={item} className="text-slate-400 text-sm hover:text-white transition-colors cursor-default">{item}</li>
                ))}
              </ul>
            </div>

            {/* Atendimento */}
            <div>
              <p className="label-upper mb-4">Atendimento</p>
              <ul className="flex flex-col gap-2.5">
                {['Consultoria comercial em todo o Brasil', 'Showroom · Visitas à fábrica'].map(item => (
                  <li key={item} className="text-slate-400 text-sm">{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom line */}
          <div className="border-t border-surface-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">
              © Space Planner™ · Prévia Visual de Projeto
            </span>
            <span className="text-[10px] text-slate-600 uppercase tracking-widest">
              Fabricação Nacional
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
