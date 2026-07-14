import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Clock, CalendarDays, Calendar, CalendarClock, Search, MessageCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { openConsultorDirect } from '../utils/consultorDirect';
import SelectableCard from '../components/SelectableCard';
import { saveEventToSheets } from '../services/googleSheets';

// ── Option definitions (exact from print) ────────────────────────────────────
type DeadlineKey =
  | 'imediatamente'
  | 'ate_30_dias'
  | 'ate_90_dias'
  | 'ate_6_meses'
  | 'acima_6_meses'
  | 'pesquisando';

interface Option {
  value: DeadlineKey;
  icon: ReactNode;
  title: string;
  desc: string;
}

const OPTIONS: Option[] = [
  {
    value: 'imediatamente',
    icon: <Zap size={20} strokeWidth={2} />,
    title: 'Imediatamente',
    desc: 'Preciso avançar o quanto antes.',
  },
  {
    value: 'ate_30_dias',
    icon: <Clock size={20} strokeWidth={1.75} />,
    title: 'Até 30 dias',
    desc: 'Estou em fase ativa de decisão.',
  },
  {
    value: 'ate_90_dias',
    icon: <CalendarDays size={20} strokeWidth={1.75} />,
    title: 'Até 90 dias',
    desc: 'Estou planejando para os próximos meses.',
  },
  {
    value: 'ate_6_meses',
    icon: <Calendar size={20} strokeWidth={1.75} />,
    title: 'Até 6 meses',
    desc: 'Tenho um projeto em planejamento.',
  },
  {
    value: 'acima_6_meses',
    icon: <CalendarClock size={20} strokeWidth={1.75} />,
    title: 'Acima de 6 meses',
    desc: 'Ainda estou em fase inicial.',
  },
  {
    value: 'pesquisando',
    icon: <Search size={20} strokeWidth={1.75} />,
    title: 'Ainda estou pesquisando',
    desc: 'Quero entender opções e valores antes de decidir.',
  },
];

const DEADLINE_LABELS: Record<DeadlineKey, string> = {
  imediatamente: 'Imediatamente',
  ate_30_dias:   'Até 30 dias',
  ate_90_dias:   'Até 90 dias',
  ate_6_meses:   'Até 6 meses',
  acima_6_meses: 'Acima de 6 meses',
  pesquisando:   'Ainda estou pesquisando',
};

export default function DeadlinePage() {
  const navigate = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  const [selected, setSelected] = useState<DeadlineKey | null>(
    (state.data.timeline as DeadlineKey) ?? null,
  );

  function handleSelect(value: DeadlineKey) {
    setSelected(value);
  }

  function handleContinue() {
    if (!selected) return;
    updateData({
      timeline: selected as import('../types').ProjectTimeline,
      deadlineLabel: DEADLINE_LABELS[selected],
    });
    setStep(4);
    // Fire Google Sheets event (non-blocking)
    saveEventToSheets(
      state.data.codigoPrevia ?? '',
      'Prazo',
      'selecionou',
      DEADLINE_LABELS[selected],
    );
    navigate('/lead');
  }

  function handleBack() {
    navigate('/investment');
  }

  function handleConsultor() {
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
      deadlineLabel:   selected ? DEADLINE_LABELS[selected] : data.deadlineLabel,
    });
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 30% 35%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c',
      }}
    >
      <main className="flex-1 max-w-[1200px] mx-auto w-full px-4 sm:px-8 py-5 sm:py-7">

        {/* ── Label ─────────────────────────────────────────────────────── */}
        <p className="text-[10px] font-bold text-[#8BC34A] uppercase tracking-[0.14em] mb-2">
          Etapa 3 de 6 · Prazo
        </p>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <h1 className="text-page-title font-black text-white leading-tight tracking-tight mb-1.5">
          Qual é o prazo previsto para executar seu projeto?
        </h1>

        {/* ── Subtitle ──────────────────────────────────────────────────── */}
        <p className="text-[12px] text-white/42 mb-4 max-w-[580px] leading-relaxed">
          O prazo ajuda a Supertech a organizar o atendimento e os próximos passos do seu projeto.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
          {OPTIONS.map(opt => (
            <SelectableCard
              key={opt.value}
              title={opt.title}
              desc={opt.desc}
              icon={opt.icon}
              isSelected={selected === opt.value}
              onClick={() => handleSelect(opt.value)}
            />
          ))}
        </div>

        {/* ── Navigation ────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleContinue}
            disabled={!selected}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[14px] text-black transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: '#8BC34A',
              boxShadow: selected ? '0 0 18px rgba(139,195,74,0.25)' : 'none',
            }}
          >
            Continuar
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>

          <button
            onClick={handleBack}
            className="px-5 py-2.5 rounded-lg font-semibold text-[14px] text-white/60 border border-white/[0.09] hover:border-white/20 hover:text-white/80 transition-all duration-150"
          >
            Voltar
          </button>
        </div>
      </main>

      {/* ── Floating WhatsApp button ───────────────────────────────────── */}
      <button
        onClick={handleConsultor}
        className="fixed bottom-6 right-6 flex items-center gap-2.5 px-4 py-2.5 rounded-full font-semibold text-[13px] transition-all duration-200 hover:scale-105 active:scale-[0.98] z-50"
        style={{
          background: '#8BC34A',
          color: '#0c110c',
          boxShadow: '0 4px 20px rgba(139,195,74,0.35), 0 0 0 1px rgba(139,195,74,0.2)',
        }}
      >
        <MessageCircle size={16} strokeWidth={2} />
        Negociar direto com consultor
      </button>
    </div>
  );
}
