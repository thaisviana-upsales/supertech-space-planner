import { useNavigate } from 'react-router-dom';
import { Clock, Zap, Calendar, CalendarDays } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { TIMELINE_LABELS } from '../constants';
import type { ProjectTimeline } from '../types';
import StepHeader from '../components/StepHeader';
import StepNavigation from '../components/StepNavigation';
import OptionCard from '../components/OptionCard';

const OPTIONS: { value: ProjectTimeline; label: string; desc: string; icon: React.ReactNode; badge?: string }[] = [
  { value: 'imediato',       label: 'Imediato (até 30 dias)',  desc: 'Projeto urgente — preciso montar meu espaço o quanto antes',        icon: <Zap size={18} />,         badge: 'Urgente' },
  { value: '1_3_meses',      label: '1 a 3 meses',            desc: 'Prazo curto — já tenho o espaço e estou próximo de contratar',       icon: <Clock size={18} />,       badge: 'Em breve' },
  { value: '3_6_meses',      label: '3 a 6 meses',            desc: 'Prazo médio — estou na fase de planejamento e negociação',           icon: <Calendar size={18} /> },
  { value: '6_12_meses',     label: '6 a 12 meses',           desc: 'Prazo longo — ainda estou avaliando o projeto e o local',           icon: <CalendarDays size={18} /> },
  { value: 'acima_12_meses', label: 'Acima de 12 meses',      desc: 'Projeto de longo prazo — pesquisa inicial ou expansão futura',      icon: <CalendarDays size={18} /> },
];

export default function PrazoPage() {
  const navigate = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  const selected = state.data.timeline;

  function handleSelect(value: ProjectTimeline) {
    updateData({
      timeline: value,
      timelineLabel: TIMELINE_LABELS[value],
    });
  }

  function handleNext() {
    if (!selected) return;
    setStep(4);
    navigate('/perfil');
  }

  function handleBack() {
    setStep(2);
    navigate('/investimento');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <StepHeader
        stepNumber={3}
        title="Qual é o prazo do projeto?"
        subtitle="Quando você pretende iniciar ou concluir a montagem do seu espaço?"
        icon={<Clock size={22} />}
      />

      <div className="flex flex-col gap-3">
        {OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            selected={selected === opt.value}
            onClick={() => handleSelect(opt.value)}
            icon={opt.icon}
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
