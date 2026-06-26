import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { saveEventToSheets } from '../services/googleSheets';

// ── Scale helpers ─────────────────────────────────────────────────────────────
const V_MIN = 50_000;
const V_MAX = 10_000_000;
const LOG_MIN = Math.log(V_MIN);
const LOG_MAX = Math.log(V_MAX);
const SLIDER_MAX = 1000; // internal slider resolution

function sliderToValue(pos: number): number {
  return Math.round(Math.exp(LOG_MIN + (pos / SLIDER_MAX) * (LOG_MAX - LOG_MIN)));
}
function valueToSlider(val: number): number {
  return Math.round(((Math.log(Math.max(V_MIN, Math.min(V_MAX, val))) - LOG_MIN) / (LOG_MAX - LOG_MIN)) * SLIDER_MAX);
}
function fillPct(pos: number): number {
  return (pos / SLIDER_MAX) * 100;
}
function brl(v: number) {
  return 'R$\u00a0' + v.toLocaleString('pt-BR');
}

// ── Tier definitions ──────────────────────────────────────────────────────────
const TIERS = [
  {
    key:     'profissional',
    label:   'Profissional',
    min:     50_000,
    max:     400_000,
    badge:   'Projeto Profissional',
    desc:    'Seu projeto já possui perfil para uma composição profissional de equipamentos Supertech, com estrutura adequada ao seu espaço e ao seu momento de investimento.',
    benefit: null as null | string,
  },
  {
    key:     'premium',
    label:   'Premium',
    min:     400_001,
    max:     1_000_000,
    badge:   'Projeto Premium',
    desc:    'Seu projeto tem potencial para uma composição mais completa, com equipamentos profissionais e atendimento consultivo para ajustar a melhor configuração.',
    benefit: 'Benefício exclusivo Premium disponível',
  },
  {
    key:     'estrategico',
    label:   'Estratégico',
    min:     1_000_001,
    max:     3_000_000,
    badge:   'Projeto Estratégico',
    desc:    'Projetos desse porte exigem análise técnica mais detalhada e uma composição estratégica de equipamentos para performance, fluxo e aproveitamento do espaço.',
    benefit: 'Benefício exclusivo Estratégico disponível',
  },
  {
    key:     'enterprise',
    label:   'Enterprise',
    min:     3_000_001,
    max:     10_000_000,
    badge:   'Projeto Enterprise',
    desc:    'Projetos Enterprise exigem atendimento executivo, planejamento comercial dedicado e uma análise mais aprofundada da operação.',
    benefit: 'Benefício exclusivo Enterprise disponível',
  },
] as const;

type TierKey = (typeof TIERS)[number]['key'];

function getTier(val: number) {
  return TIERS.find(t => val >= t.min && val <= t.max) ?? TIERS[TIERS.length - 1];
}

// Tier dividers (boundary between tiers) as % of bar
const DIVIDERS = [400_000, 1_000_000, 3_000_000].map(v => ({
  value: v,
  pct: fillPct(valueToSlider(v)),
}));

// Tier label center positions
const TIER_LABELS = TIERS.map((t, i) => {
  const startPct = i === 0 ? 0 : fillPct(valueToSlider(TIERS[i - 1].max));
  const endPct   = i === TIERS.length - 1 ? 100 : fillPct(valueToSlider(t.max));
  return { key: t.key, label: t.label, centerPct: (startPct + endPct) / 2 };
});

// Default value per tier (used when coming back from a saved tier key)
const TIER_DEFAULTS: Record<TierKey, number> = {
  profissional: 200_000,
  premium:      640_000,
  estrategico:  1_500_000,
  enterprise:   5_000_000,
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function InvestmentPage() {
  const navigate = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  // Resolve initial value from saved state
  const savedRange = state.data.investmentRange as TierKey | undefined;
  const initValue  = savedRange && TIER_DEFAULTS[savedRange]
    ? TIER_DEFAULTS[savedRange]
    : 200_000;

  const [sliderPos, setSliderPos] = useState(valueToSlider(initValue));

  const currentValue = sliderToValue(sliderPos);
  const currentTier  = getTier(currentValue);
  const fill         = fillPct(sliderPos);

  function handleContinue() {
    const label = `${brl(currentValue)} · ${currentTier.label}`;
    updateData({
      investmentRange: currentTier.key as import('../types').InvestmentRange,
      investmentLabel: label,
    });
    setStep(3);
    // Fire Google Sheets event (non-blocking)
    saveEventToSheets(
      state.data.codigoPrevia ?? '',
      'Investimento',
      'selecionou',
      label,
    );
    navigate('/deadline');
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 30% 35%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c',
      }}
    >
      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 sm:px-8 py-5 sm:py-7">

        {/* Etapa label */}
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-2" style={{ color: '#8BC34A' }}>
          Etapa 2 de 6 · Investimento
        </p>

        {/* Title */}
        <h1 className="text-page-title font-black text-white leading-tight tracking-tight mb-1.5">
          Qual é a estimativa de investimento para esse projeto?
        </h1>
        <p className="text-[12px] mb-5 max-w-[520px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.42)' }}>
          Essa informação ajuda a Supertech a entender o porte do seu projeto e orientar melhor os próximos passos.
        </p>

        {/* ── Investment card ────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 mb-7"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
        >
          {/* Value + badge */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Valor estimado
              </p>
              <p className="text-[1.6rem] font-black leading-none" style={{ color: '#8BC34A' }}>
                {brl(currentValue)}
              </p>
            </div>
            <span
              className="text-[11px] font-bold px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(139,195,74,0.14)', color: '#8BC34A', border: '1px solid rgba(139,195,74,0.25)', whiteSpace: 'nowrap' }}
            >
              {currentTier.badge}
            </span>
          </div>

          {/* ── Slider ──────────────────────────────────────────────────── */}
          <div className="mb-1">
            <div className="relative h-[24px] flex items-center select-none">

              {/* Track background */}
              <div
                className="absolute left-0 right-0 rounded-full pointer-events-none"
                style={{ height: 6, background: 'rgba(255,255,255,0.10)' }}
              >
                {/* Green fill */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{ width: fill + '%', background: '#8BC34A', transition: 'width 0s' }}
                />
                {/* Tier dividers */}
                {DIVIDERS.map(d => (
                  <div
                    key={d.value}
                    className="absolute top-[-3px] bottom-[-3px] w-px"
                    style={{ left: d.pct + '%', background: 'rgba(0,0,0,0.4)' }}
                  />
                ))}
              </div>

              {/* Custom thumb */}
              <div
                className="absolute pointer-events-none"
                style={{
                  left: `clamp(10px, calc(${fill}% - 0px), calc(100% - 10px))`,
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#8BC34A',
                  border: '3px solid #0c110c',
                  boxShadow: '0 0 0 3px rgba(139,195,74,0.30), 0 0 12px rgba(139,195,74,0.35)',
                  zIndex: 2,
                }}
              />

              {/* Real range input (invisible — handles interaction) */}
              <input
                type="range"
                min={0}
                max={SLIDER_MAX}
                value={sliderPos}
                onChange={e => setSliderPos(Number(e.target.value))}
                className="absolute left-0 w-full opacity-0 cursor-pointer"
                style={{ height: 24, zIndex: 3 }}
              />
            </div>

            {/* Min / Max labels */}
            <div className="flex justify-between mt-1">
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>R$&nbsp;50.000</span>
              <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.28)' }}>R$&nbsp;10.000.000</span>
            </div>

            {/* Tier labels */}
            <div className="relative mt-1 h-5 overflow-hidden">
              {TIER_LABELS.map(tl => (
                <span
                  key={tl.key}
                  className="absolute text-[9px] font-black uppercase tracking-[0.1em] -translate-x-1/2 transition-colors duration-200"
                  style={{
                    left: tl.centerPct + '%',
                    color: tl.key === currentTier.key
                      ? '#8BC34A'
                      : 'rgba(255,255,255,0.22)',
                  }}
                >
                  {tl.label}
                </span>
              ))}
            </div>
          </div>

          {/* ── Tier description ─────────────────────────────────────────── */}
          <div
            className="mt-5 pt-5"
            style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
          >
            <p className="text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
              {currentTier.desc}
            </p>

            {/* Benefit badge */}
            {currentTier.benefit && (
              <div
                className="inline-flex items-center gap-2 mt-4 px-3 py-2 rounded-xl"
                style={{
                  background: 'rgba(139,195,74,0.06)',
                  border: '1px solid rgba(139,195,74,0.20)',
                }}
              >
                <Sparkles size={13} style={{ color: '#8BC34A', opacity: 0.8 }} />
                <span className="text-[11px] font-semibold" style={{ color: 'rgba(139,195,74,0.90)' }}>
                  {currentTier.benefit}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleContinue}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[14px] text-black transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#8BC34A', boxShadow: '0 0 18px rgba(139,195,74,0.25)' }}
          >
            Continuar
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => navigate('/objective')}
            className="px-5 py-2.5 rounded-lg font-semibold text-[14px] transition-all duration-150"
            style={{
              color: 'rgba(255,255,255,0.55)',
              border: '1px solid rgba(255,255,255,0.09)',
            }}
          >
            Voltar
          </button>
        </div>
      </main>
    </div>
  );
}
