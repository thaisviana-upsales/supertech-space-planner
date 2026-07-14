import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { usePlanner } from '../context/PlannerContext';
import { OBJECTIVE_LABELS } from '../constants';
import SelectableCard from '../components/SelectableCard';
import { saveEventToSheets } from '../services/googleSheets';
import { upsertLeadFromData } from '../utils/leadStorage';

// ── Option definitions (exact copy from print) ────────────────────────────────
type ObjectiveKey = keyof typeof OBJECTIVE_LABELS;

const OPTIONS: { value: ObjectiveKey; title: string; desc: string }[] = [
  {
    value: 'academia_zero',
    title: 'Montar uma academia do zero',
    desc: 'Para novos projetos que precisam estruturar equipamentos desde o início.',
  },
  {
    value: 'renovar_ampliar',
    title: 'Renovar ou ampliar uma academia existente',
    desc: 'Para quem já possui uma operação e deseja modernizar, ampliar ou melhorar a estrutura atual.',
  },
  {
    value: 'condominio',
    title: 'Montar ou renovar academia de condomínio',
    desc: 'Para síndicos, administradoras, construtoras ou empreendimentos residenciais.',
  },
  {
    value: 'hotel_clube',
    title: 'Estruturar academia de hotel ou clube',
    desc: 'Para projetos de experiência, lazer, esporte e bem-estar.',
  },
  {
    value: 'pesquisar',
    title: 'Apenas pesquisar valores',
    desc: 'Para quem ainda está em fase inicial de pesquisa.',
  },
];

export default function ObjectivePage() {
  const navigate = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  // Seed from existing state if user navigated back
  const [selected, setSelected] = useState<ObjectiveKey | null>(
    (state.data.objective as ObjectiveKey) ?? null,
  );

  function handleSelect(value: ObjectiveKey) {
    setSelected(value);
  }

  function handleContinue() {
    if (!selected) return;
    const updatedData = {
      ...state.data,
      objective: selected as import('../types').ProjectObjective,
      objectiveLabel: OBJECTIVE_LABELS[selected],
    };
    updateData({
      objective: selected as import('../types').ProjectObjective,
      objectiveLabel: OBJECTIVE_LABELS[selected],
    });
    setStep(2);

    // ── Salvar lead parcial no localStorage (aparece no painel mesmo que abandone) ──
    upsertLeadFromData(updatedData, 2);
    console.log('UPSERT LEAD PROGRESS (ObjectivePage):', { codigoPrevia: updatedData.codigoPrevia, step: 2, objective: updatedData.objectiveLabel });

    // Fire Google Sheets event (non-blocking)
    saveEventToSheets(
      state.data.codigoPrevia ?? '',
      'Objetivo',
      'selecionou',
      OBJECTIVE_LABELS[selected],
    );
    navigate('/investment');
  }

  function handleBack() {
    navigate('/intro');
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
          Etapa 1 de 6 · Projeto
        </p>

        {/* ── Title ─────────────────────────────────────────────────────── */}
        <h1 className="text-page-title font-black text-white leading-tight tracking-tight mb-1.5">
          Qual é o principal objetivo do seu projeto?
        </h1>

        {/* ── Subtitle ──────────────────────────────────────────────────── */}
        <p className="text-[12px] text-white/42 mb-4 max-w-[560px] leading-relaxed">
          Escolha a opção que melhor representa o momento atual do seu espaço fitness.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-5">
          {OPTIONS.map(opt => (
            <SelectableCard
              key={opt.value}
              title={opt.title}
              desc={opt.desc}
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
              background: selected ? '#8BC34A' : '#8BC34A',
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
    </div>
  );
}
