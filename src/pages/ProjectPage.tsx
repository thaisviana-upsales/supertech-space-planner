import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Minus, Plus, Trash2, MessageCircle, Activity, Dumbbell, Zap } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { formatPrice } from '../data/catalog';
import { openConsultorDirect } from '../utils/consultorDirect';
import type { Equipment } from '../types';

// ── Investment tier → project profile label ───────────────────────────────────
const TIER_LABEL: Record<string, string> = {
  ate_50k:     'Projeto Entrada',
  '50k_100k':  'Projeto Essencial',
  '100k_200k': 'Projeto Profissional',
  '200k_500k': 'Projeto Premium',
  acima_500k:  'Projeto Enterprise',
  a_definir:   'Em análise',
};

// ── Category order & icons ────────────────────────────────────────────────────
const CAT_ORDER = ['Cardio', 'Musculação', 'Strong'];
const CAT_ICONS: Record<string, typeof Activity> = {
  Cardio:     Activity,
  Musculação: Dumbbell,
  Strong:     Zap,
};

// ── Encode image path for browser compatibility ────────────────────────────
function encodeImagePath(path: string): string {
  const lastSlash = path.lastIndexOf('/');
  if (lastSlash === -1) return encodeURIComponent(path);
  return path.slice(0, lastSlash + 1) + encodeURIComponent(path.slice(lastSlash + 1));
}

// ── Image with fallback ───────────────────────────────────────────────────────
function ProductImg({ src, category }: { src?: string; category: string }) {
  const [failed, setFailed] = useState(false);
  const Icon = CAT_ICONS[category] ?? Dumbbell;
  if (!src || failed) {
    return (
      <div
        className="w-[100px] sm:w-[120px] shrink-0 self-stretch flex items-center justify-center rounded-l-xl"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <Icon size={30} strokeWidth={1.4} color="rgba(255,255,255,0.15)" />
      </div>
    );
  }
  return (
    <div
      className="w-[100px] sm:w-[120px] shrink-0 self-stretch rounded-l-xl overflow-hidden"
      style={{
        // Premium neutral background — same as catalog cards
        background: 'radial-gradient(ellipse 90% 90% at 50% 50%, rgba(200,215,190,0.13) 0%, rgba(40,52,38,0.82) 55%, rgba(18,24,18,0.96) 100%)',
      }}
    >
      <img
        src={encodeImagePath(src)}
        alt={category}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', background: 'transparent', padding: '10px' }}
      />
    </div>
  );
}

// ── Group equipment by categoryLabel ─────────────────────────────────────────
function groupByCategory(items: Equipment[]): Record<string, Equipment[]> {
  return items.reduce((acc, eq) => {
    const key = eq.categoryLabel ?? eq.category;
    if (!acc[key]) acc[key] = [];
    acc[key].push(eq);
    return acc;
  }, {} as Record<string, Equipment[]>);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ProjectPage() {
  const navigate = useNavigate();
  const { state, setStep, removeEquipment, updateEquipmentQty } = usePlanner();

  useEffect(() => { setStep(5); }, [setStep]);

  const selected = state.data.selectedEquipment ?? [];
  const total    = selected.reduce((s, e) => s + e.price * e.quantity, 0);
  const count    = selected.reduce((s, e) => s + e.quantity, 0);
  const grouped  = groupByCategory(selected);

  const tierLabel     = TIER_LABEL[state.data.investmentRange as string] ?? state.data.profile ?? '—';
  const investLabel   = state.data.investmentLabel ?? '—';
  const deadlineLabel = state.data.deadlineLabel   ?? '—';

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (selected.length === 0) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ background: 'radial-gradient(ellipse 70% 55% at 30% 35%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c' }}
      >
        <p className="text-[11px] font-bold text-[#8BC34A] uppercase tracking-[0.14em] mb-3">Meu Projeto</p>
        <h1 className="text-[1.5rem] font-black text-white mb-2 text-center">Nenhum equipamento selecionado.</h1>
        <p className="text-[14px] text-white/40 mb-8 text-center max-w-sm">
          Volte ao catálogo e escolha os equipamentos para compor seu projeto.
        </p>
        <button
          onClick={() => navigate('/catalog')}
          className="flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-[14px] text-black"
          style={{ background: '#8BC34A' }}
        >
          Ir para o catálogo
          <ArrowRight size={16} strokeWidth={2.5} />
        </button>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'radial-gradient(ellipse 70% 55% at 30% 35%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c' }}
    >
      <main className="max-w-[1360px] mx-auto w-full px-4 sm:px-8 py-5 sm:py-7">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <p className="text-[11px] font-bold text-[#8BC34A] uppercase tracking-[0.14em] mb-3">
          Meu Projeto
        </p>
        <h1 className="text-page-title font-black text-white leading-tight tracking-tight mb-1.5">
          Seu projeto Supertech está ganhando forma.
        </h1>
        <p className="text-[12px] text-white/40 mb-5 max-w-[520px] leading-relaxed">
          Revise os equipamentos selecionados antes de visualizar a composição inicial da sua academia.
        </p>

        {/* ── Two-column layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── LEFT: Equipment list grouped by category ── */}
          <div className="flex-1 min-w-0 order-2 lg:order-1">
            {CAT_ORDER.filter(cat => grouped[cat]?.length).map(cat => {
              const items = grouped[cat];
              const _catTotal = items.reduce((s, e) => s + e.price * e.quantity, 0); void _catTotal;
              return (
                <div key={cat} className="mb-6">
                  {/* Category header */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-bold text-[#8BC34A] uppercase tracking-[0.16em]">
                      {cat}
                    </p>
                    <p className="text-[11px] text-white/30">
                      {items.length} {items.length === 1 ? 'item' : 'itens'}
                    </p>
                  </div>

                  {/* Equipment cards */}
                  <div className="flex flex-col gap-2.5">
                    {items.map(eq => (
                      <div
                        key={eq.id}
                        className="flex rounded-xl overflow-hidden border"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          borderColor: 'rgba(255,255,255,0.08)',
                          borderLeftWidth: '3px',
                          borderLeftColor: '#8BC34A',
                        }}
                      >
                        {/* Image */}
                        <ProductImg src={eq.imageUrl} category={eq.categoryLabel ?? eq.category} />

                        {/* Content */}
                        <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                          {/* Top */}
                          <div className="mb-3">
                            <p className="text-[10px] font-bold text-[#8BC34A] uppercase tracking-[0.12em] mb-0.5">
                              {eq.categoryLabel}
                            </p>
                            <p className="font-bold text-[15px] text-white leading-tight">{eq.name}</p>
                            <p className="text-[11px] text-white/30 font-mono">{eq.code ?? eq.id}</p>
                            {eq.bateriaKg && eq.bateriaKg !== 'X' && (
                              <p className="text-[10px] text-white/28 mt-0.5">Bateria: {eq.bateriaKg} kg</p>
                            )}
                          </div>

                          {/* Bottom: qty + subtotal + remove */}
                          <div className="flex items-center gap-3 flex-wrap">
                            {/* Qty control */}
                            <div
                              className="flex items-center rounded-lg overflow-hidden shrink-0"
                              style={{ border: '1px solid rgba(139,195,74,0.4)' }}
                            >
                              <button
                                onClick={() => {
                                  if (eq.quantity <= 1) removeEquipment(eq.id);
                                  else updateEquipmentQty(eq.id, eq.quantity - 1);
                                }}
                                className="p-3 text-white/60 hover:text-white transition-colors"
                                style={{ minHeight: '40px' }}
                              >
                                <Minus size={14} strokeWidth={2.5} />
                              </button>
                              <span className="px-2.5 text-[13px] font-bold text-white min-w-[24px] text-center">
                                {eq.quantity}
                              </span>
                              <button
                                onClick={() => updateEquipmentQty(eq.id, eq.quantity + 1)}
                                className="p-3 text-white/60 hover:text-white transition-colors"
                                style={{ minHeight: '40px' }}
                              >
                                <Plus size={14} strokeWidth={2.5} />
                              </button>
                            </div>

                            {/* Subtotal */}
                            <div className="flex flex-col items-end ml-auto">
                              <p className="text-[9px] font-bold text-white/25 uppercase tracking-[0.12em]">Subtotal</p>
                              <p className="text-[14px] font-bold" style={{ color: '#8BC34A' }}>
                                {formatPrice(eq.price * eq.quantity)}
                              </p>
                            </div>

                            {/* Remove */}
                            <button
                              onClick={() => removeEquipment(eq.id)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-white/25 hover:text-red-400/70 transition-colors shrink-0"
                            >
                              <Trash2 size={12} strokeWidth={2} />
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* ── Bottom action links ────────────────────────────────── */}
            <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
              <button
                onClick={() => navigate('/catalog')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-[13px] font-semibold border transition-all hover:bg-white/[0.04]"
                style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.60)' }}
              >
                Continuar escolhendo
              </button>
              <button
                onClick={() => navigate('/lead')}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white/35 hover:text-white/60 transition-colors min-h-[40px]"
              >
                <ArrowLeft size={13} strokeWidth={2.5} />
                Ajustar perfil do projeto
              </button>
            </div>
          </div>

          {/* ── RIGHT: Sidebar "Seu Projeto" ── */}
          <div className="w-full lg:w-[290px] shrink-0 lg:sticky lg:top-20 order-1 lg:order-2">
            <div
              className="rounded-2xl border p-5"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.09)' }}
            >
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.14em] mb-4">
                Seu Projeto
              </p>

              {/* Stats */}
              <div className="flex flex-col gap-3 mb-5">
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/45">Itens selecionados</p>
                  <p className="text-[13px] font-bold text-white">{count}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/45">Valor estimado</p>
                  <p className="text-[13px] font-bold" style={{ color: '#8BC34A' }}>{formatPrice(total)}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/45">Investimento informado</p>
                  <p className="text-[12px] font-semibold text-white text-right max-w-[130px] leading-snug">{investLabel}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/45">Prazo</p>
                  <p className="text-[12px] font-semibold text-white">{deadlineLabel}</p>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[12px] text-white/45">Perfil</p>
                  <p className="text-[12px] font-bold" style={{ color: '#8BC34A' }}>{tierLabel}</p>
                </div>
              </div>

              <div className="border-t mb-4" style={{ borderColor: 'rgba(255,255,255,0.07)' }} />

              {/* Buttons */}
              <button
                onClick={() => navigate('/visualize')}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold text-[14px] mb-2.5 transition-all hover:scale-[1.01] active:scale-[0.99]"
                style={{ background: '#8BC34A', color: '#0c110c', boxShadow: '0 0 20px rgba(139,195,74,0.22)' }}
              >
                Avançar para visualização
                <ArrowRight size={15} strokeWidth={2.5} />
              </button>

              <button
                onClick={() => {
                  const { data } = state;
                  openConsultorDirect({
                    name:            data.name,
                    phone:           data.phone,
                    city:            data.city,
                    uf:              data.uf,
                    codigoPrevia:    data.codigoPrevia,
                    objectiveLabel:  data.objectiveLabel,
                    investmentLabel: data.investmentLabel,
                    investmentRange: data.investmentRange,
                    deadlineLabel:   data.deadlineLabel,
                    profileLabel:    data.profileLabel,
                  });
                }}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-semibold text-[13px] border transition-all hover:bg-white/[0.04]"
                style={{ background: 'transparent', borderColor: '#8BC34A', color: 'rgba(255,255,255,0.75)' }}
              >
                <MessageCircle size={14} strokeWidth={2} />
                Enviar prévia para consultor
              </button>

              {/* Support text */}
              <p className="text-[11px] text-white/22 leading-relaxed mt-4 text-center">
                Esta é uma prévia de referência. Um consultor Supertech poderá ajustar os equipamentos, condições e próximos passos.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
