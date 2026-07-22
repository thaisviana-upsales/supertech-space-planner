import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity, Dumbbell, Zap, MessageCircle,
  Settings2, MapPin, Target, DollarSign, Clock, User,
  Package, CheckCircle2,
} from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import type { Equipment } from '../types';
import {
  resolveWhatsappDestination,
  openWhatsappWithDestination,
  buildDestinationSuffix,
} from '../data/whatsappRouting';
import { upsertLeadFromData } from '../utils/leadStorage';
import { upsertLeadProgress } from '../services/googleSheets';

// ── Helpers ───────────────────────────────────────────────────────────────────
function brl(n: number) { return n > 0 ? 'R$ ' + n.toLocaleString('pt-BR') : '—'; }
function ni(v?: string | null) { return v && v.trim() ? v.trim() : 'Não informado'; }

function normCat(cat?: string) {
  return (cat ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'cardio',     label: 'Cardio',     Icon: Activity, color: '#8BC34A' },
  { key: 'musculacao', label: 'Musculação',  Icon: Dumbbell, color: '#F97316' },
  { key: 'strong',     label: 'Strong',      Icon: Zap,      color: '#A855F7' },
] as const;

function resolveCategory(eq: Equipment): string {
  const c = normCat(eq.category);
  if (c.includes('cardio'))                       return 'cardio';
  if (c.includes('muscula') || c.includes('muscu')) return 'musculacao';
  if (c.includes('strong') || c.includes('funcional')) return 'strong';
  return c || 'outros';
}

// ── WhatsApp message (self-contained) ─────────────────────────────────────────
function buildWAMsg(
  data: ReturnType<typeof usePlanner>['state']['data'],
  destinationSuffix = '',
): string {
  const eqs = data.selectedEquipment ?? [];
  return [
    '🏋️ *Supertech Space Planner™ — Nova Prévia de Projeto*',
    '',
    `👤 *Contato:* ${ni(data.name)}`,
    `📱 *WhatsApp:* ${ni(data.phone)}`,
    `📍 *Localização:* ${ni(data.city)}${data.uf ? `, ${data.uf}` : ''}`,
    '',
    `🎯 *Objetivo:* ${ni(data.objectiveLabel)}`,
    `💰 *Investimento:* ${ni(data.investmentLabel)}`,
    `⏱️ *Prazo:* ${ni(data.timelineLabel)}`,
    `👔 *Segmento:* ${ni(data.profileLabel)}`,
    '',
    `🏋️ *Equipamentos (${eqs.length} ${eqs.length === 1 ? 'tipo' : 'tipos'}):*`,
    ...eqs.map(e => `  • ${e.name} × ${e.quantity}`),
    '',
    '_Prévia gerada via Space Planner™ — Supertech Fitness_',
    destinationSuffix,
  ].join('\n');
}

// ── Equipment card ────────────────────────────────────────────────────────────
function EquipCard({ eq }: { eq: Equipment }) {
  const cat   = CATEGORIES.find(c => c.key === resolveCategory(eq));
  const Icon  = cat?.Icon ?? Package;
  const color = cat?.color ?? '#8BC34A';
  const sub   = (eq.price ?? 0) * eq.quantity;

  return (
    <div
      className="rounded-xl p-3 flex flex-col gap-2.5"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
    >
      {/* Icon area */}
      <div
        className="flex items-center justify-center rounded-lg h-[72px]"
        style={{ background: 'rgba(255,255,255,0.03)' }}
      >
        <Icon size={32} style={{ color, opacity: 0.7 }} strokeWidth={1.5} />
      </div>

      {/* Name + code */}
      <div>
        <p className="text-white text-[11px] font-semibold leading-snug">{eq.name}</p>
        {eq.id && <p className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.25)' }}>{eq.id}</p>}
      </div>

      {/* Qty + subtotal */}
      <div
        className="flex items-center justify-between pt-2 border-t"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <span className="text-[10px] font-bold" style={{ color: 'rgba(255,255,255,0.35)' }}>×{eq.quantity}</span>
        {sub > 0 && <span className="text-[11px] font-black" style={{ color: '#8BC34A' }}>{brl(sub)}</span>}
      </div>
    </div>
  );
}

// ── Category section ──────────────────────────────────────────────────────────
function CatSection({
  catKey, label, Icon, color, items,
}: {
  catKey: string; label: string;
  Icon: React.ElementType; color: string;
  items: Equipment[];
}) {
  const empty = items.length === 0;
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={14} style={{ color }} strokeWidth={2.5} />
          <span
            className="text-[10px] font-black uppercase tracking-[0.14em]"
            style={{ color }}
          >
            {label}
          </span>
        </div>
        {empty
          ? <span
              className="text-[9px] font-bold px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.25)' }}
            >VAZIO</span>
          : <span className="text-[9px] font-semibold" style={{ color: 'rgba(255,255,255,0.3)' }}>
              {items.length} {items.length === 1 ? 'ITEM' : 'ITENS'}
            </span>
        }
      </div>

      {empty ? (
        <p className="text-center py-5 text-[10px]" style={{ color: 'rgba(255,255,255,0.14)' }}>
          AGUARDANDO COMPOSIÇÃO
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {items.map(eq => <EquipCard key={`${eq.id}-${catKey}`} eq={eq} />)}
        </div>
      )}
    </div>
  );
}

// ── Summary row ───────────────────────────────────────────────────────────────
function SRow({
  Icon, value,
}: {
  Icon: React.ElementType; value: string;
}) {
  return (
    <div
      className="flex items-start gap-2.5 py-2 border-b"
      style={{ borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <Icon size={12} style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0, marginTop: 2 }} />
      <span className="text-[12px] text-white/80 leading-snug">{value}</span>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function VisualizePage() {
  const navigate = useNavigate();
  const { state, markSent, updateData } = usePlanner();
  const data = state.data;

  const equipment    = data.selectedEquipment ?? [];
  const totalEstimate = equipment.reduce((s, e) => s + (e.price ?? 0) * e.quantity, 0);
  const hasEquipment  = equipment.length > 0;
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  // ── Salvar lead ao chegar na prévia visual (step 7) ──
  useEffect(() => {
    upsertLeadFromData(data, 7);
    // Enviar para Google Sheets (fonte compartilhada)
    upsertLeadProgress({
      codigoPrevia:        data.codigoPrevia ?? '',
      ultimaEtapa:         'visualize',
      status:              'em_andamento',
      nome:                data.name,
      telefone:            data.phone,
      cidade:              data.city,
      uf:                  data.uf,
      segmento:            data.profileLabel,
      objetivo:            data.objectiveLabel,
      investimento_estimado: data.investmentLabel,
      prazo:               data.timelineLabel,
      equipamentos_count:  (data.selectedEquipment ?? []).length,
      valor_estimado:      (data.selectedEquipment ?? []).reduce((s, e) => s + (e.price ?? 0) * e.quantity, 0),
      origem:              data.origem ?? 'space_planner',
    });
    console.log('UPSERT LEAD PROGRESS (VisualizePage):', { codigoPrevia: data.codigoPrevia, step: 7 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.codigoPrevia]);

  // Group by category
  const grouped: Record<string, Equipment[]> = {};
  equipment.forEach(eq => {
    const k = resolveCategory(eq);
    grouped[k] = grouped[k] ?? [];
    grouped[k].push(eq);
  });

  function handleSend() {
    if (sending || sent) return;
    setSending(true);

    // Resolve routing destination (DDD > cidade/UF > UF > fallback)
    const destination = resolveWhatsappDestination({
      phone:        data.phone,
      city:         data.city,
      uf:           data.uf,
      codigoPrevia: data.codigoPrevia,
    });

    // Save routing data to context (will flow to Sheets via ConfirmacaoPage)
    updateData({
      vendedorNome:       destination.vendedorNome,
      vendedorWhatsapp:   destination.whatsapp,
      regiaoAtendimento:  destination.regiaoAtendimento,
      roteamentoCriterio: destination.roteamentoCriterio,
      roteamentoChave:    destination.roteamentoChave,
    });

    const suffix = buildDestinationSuffix(destination);
    const msg    = buildWAMsg(data, suffix);
    openWhatsappWithDestination(destination, msg, {
      phone:        data.phone,
      city:         data.city,
      uf:           data.uf,
      codigoPrevia: data.codigoPrevia,
    });

    markSent();
    setSent(true);
    setSending(false);
    setTimeout(() => navigate('/confirmation'), 900);
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 30% 35%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c',
      }}
    >
      <main className="max-w-[1200px] mx-auto px-4 sm:px-8 py-5 sm:py-7">

        {/* Label + Title */}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: '#8BC34A' }}>
          Prévia Visual do Projeto
        </p>
        <h1 className="text-[1.4rem] sm:text-[1.8rem] font-black text-white leading-tight tracking-tight mb-1.5">
          Seu espaço fitness está ganhando forma.
        </h1>
        <p className="text-[12px] mb-5 max-w-[540px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
          Com base nos equipamentos que você selecionou, montamos uma prévia do seu showroom. Um consultor Supertech pode ajustar a composição, layout e condições comerciais.
        </p>

        {/* Empty state */}
        {!hasEquipment ? (
          <div className="text-center py-24">
            <p className="text-white/30 text-sm mb-6">Nenhum equipamento selecionado ainda.</p>
            <button
              onClick={() => navigate('/catalog')}
              className="px-6 py-2.5 rounded-lg font-bold text-sm text-black"
              style={{ background: '#8BC34A' }}
            >
              Voltar para escolher equipamentos
            </button>
          </div>
        ) : (
          <div className="flex flex-col lg:flex-row gap-5">

            {/* ── SHOWROOM (left) ──────────────────────────────────── */}
            <div className="flex-1 min-w-0">
              <div
                className="rounded-2xl overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {/* Showroom header bar */}
                <div
                  className="flex items-center justify-between px-5 py-3"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: '#8BC34A', flexShrink: 0 }}
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                      Showroom · Composição Inicial
                    </span>
                  </div>
                  <span className="text-[9px] font-semibold tracking-[0.2em]" style={{ color: 'rgba(255,255,255,0.18)' }}>
                    SPACE PLANNER™
                  </span>
                </div>

                {/* Category sections */}
                <div className="p-4 flex flex-col gap-3">
                  {CATEGORIES.map(cat => (
                    <CatSection
                      key={cat.key}
                      catKey={cat.key}
                      label={cat.label}
                      Icon={cat.Icon}
                      color={cat.color}
                      items={grouped[cat.key] ?? []}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* ── SIDEBAR (right) ───────────────────────────────────── */}
            <div className="w-full lg:w-[272px] flex-shrink-0">
              <div
                className="rounded-2xl p-5 lg:sticky lg:top-6"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                {/* Heading */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#8BC34A' }} />
                  <span className="text-[10px] font-black uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    Resumo Executivo
                  </span>
                </div>

                {/* Project data */}
                <div className="mb-4">
                  {data.profileLabel     && <SRow Icon={User}        value={ni(data.profileLabel)} />}
                  {(data.city || data.uf) && <SRow Icon={MapPin}     value={`${ni(data.city)}${data.uf ? `, ${data.uf}` : ''}`} />}
                  {data.objectiveLabel   && <SRow Icon={Target}      value={ni(data.objectiveLabel)} />}
                  {data.investmentLabel  && <SRow Icon={DollarSign}  value={ni(data.investmentLabel)} />}
                  {data.timelineLabel    && <SRow Icon={Clock}       value={ni(data.timelineLabel)} />}
                </div>

                {/* Equipment list */}
                <div className="mb-4">
                  <p className="text-[9px] font-bold uppercase tracking-wider mb-2" style={{ color: 'rgba(255,255,255,0.28)' }}>
                    Equipamentos selecionados
                    <span className="ml-1.5" style={{ color: 'rgba(255,255,255,0.45)' }}>{equipment.length} itens</span>
                  </p>
                  <div className="space-y-1.5">
                    {equipment.slice(0, 7).map(eq => (
                      <div key={eq.id} className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#8BC34A' }} />
                          <span className="text-[11px] text-white/75 truncate">{eq.name}</span>
                        </div>
                        <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          ×{eq.quantity}
                        </span>
                      </div>
                    ))}
                    {equipment.length > 7 && (
                      <p className="text-[10px] pt-1" style={{ color: 'rgba(255,255,255,0.25)' }}>
                        +{equipment.length - 7} equipamento{equipment.length - 7 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                {/* Estimated total */}
                {totalEstimate > 0 && (
                  <div
                    className="mb-5 py-3 px-4 rounded-xl"
                    style={{
                      background: 'rgba(139,195,74,0.06)',
                      border: '1px solid rgba(139,195,74,0.15)',
                    }}
                  >
                    <p className="text-[9px] font-bold uppercase tracking-wider mb-1" style={{ color: 'rgba(139,195,74,0.65)' }}>
                      Valor estimado da seleção
                    </p>
                    <p className="text-xl font-black" style={{ color: '#8BC34A' }}>{brl(totalEstimate)}</p>
                  </div>
                )}

                {/* CTA buttons */}
                <button
                  onClick={handleSend}
                  disabled={sending || sent}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-[13px] text-black mb-2 transition-all hover:opacity-90 disabled:opacity-60"
                  style={{ background: '#8BC34A', boxShadow: '0 0 18px rgba(139,195,74,0.22)' }}
                >
                  {sent
                    ? <><CheckCircle2 size={15} /> Enviado!</>
                    : <><MessageCircle size={15} /> Enviar prévia para consultor</>
                  }
                </button>

                <button
                  onClick={() => navigate('/catalog')}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[12px] mb-4 transition-all hover:border-white/20"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}
                >
                  <Settings2 size={13} />
                  Ajustar equipamentos
                </button>

                <p className="text-[10px] text-center leading-relaxed mb-3" style={{ color: 'rgba(255,255,255,0.18)' }}>
                  Esta é uma prévia de referência. Um consultor Supertech poderá ajustar os equipamentos, condições e próximos passos.
                </p>

                <button
                  onClick={() => navigate('/project')}
                  className="w-full text-center text-[10px] transition-colors hover:text-white/40"
                  style={{ color: 'rgba(255,255,255,0.18)' }}
                >
                  ← Voltar para revisão
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
