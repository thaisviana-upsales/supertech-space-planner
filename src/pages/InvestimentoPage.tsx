import { useNavigate } from 'react-router-dom';
import { DollarSign, TrendingUp } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { INVESTMENT_LABELS } from '../constants';
import type { InvestmentRange } from '../types';
import StepHeader from '../components/StepHeader';
import StepNavigation from '../components/StepNavigation';
import OptionCard from '../components/OptionCard';

const OPTIONS: { value: InvestmentRange; label: string; desc: string; badge?: string }[] = [
  { value: 'ate_50k',      label: 'Até R$ 50.000',              desc: 'Ideal para studios pequenos ou reposição de equipamentos',   badge: 'Starter' },
  { value: '50k_100k',     label: 'R$ 50.000 – R$ 100.000',     desc: 'Academias compactas e espaços funcionais completos' },
  { value: '100k_200k',    label: 'R$ 100.000 – R$ 200.000',    desc: 'Academia de médio porte com linha completa de musculação',   badge: 'Popular' },
  { value: '200k_500k',    label: 'R$ 200.000 – R$ 500.000',    desc: 'Academia profissional com equipamentos premium e cardio',    badge: 'Premium' },
  { value: 'acima_500k',   label: 'Acima de R$ 500.000',        desc: 'Grandes academias, redes e projetos de alto padrão',         badge: 'Elite' },
  { value: 'a_definir',    label: 'A Definir / Em Análise',     desc: 'Ainda estou avaliando o investimento com minha equipe' },
];

export default function InvestimentoPage() {
  const navigate = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  const selected = state.data.investmentRange;

  function handleSelect(value: InvestmentRange) {
    updateData({
      investmentRange: value,
      investmentLabel: INVESTMENT_LABELS[value],
    });
  }

  function handleNext() {
    if (!selected) return;
    setStep(3);
    navigate('/prazo');
  }

  function handleBack() {
    setStep(1);
    navigate('/objetivo');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <StepHeader
        stepNumber={2}
        title="Qual é a faixa de investimento?"
        subtitle="Selecione o orçamento previsto para seu projeto. Isso nos ajuda a recomendar os melhores equipamentos."
        icon={<DollarSign size={22} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            selected={selected === opt.value}
            onClick={() => handleSelect(opt.value)}
            icon={<TrendingUp size={18} />}
            label={opt.label}
            description={opt.desc}
            badge={opt.badge}
          />
        ))}
      </div>

      <StepNavigation
        onBack={handleBack}
        onNext={handleNext}
        canGoNext={!!selected}
      />
    </div>
  );
}
