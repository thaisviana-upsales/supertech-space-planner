import { useNavigate } from 'react-router-dom';
import { Target, Dumbbell, Users, Building2, Heart, Hotel, HelpCircle } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { OBJECTIVE_LABELS } from '../constants';
import type { ProjectObjective } from '../types';
import StepHeader from '../components/StepHeader';
import StepNavigation from '../components/StepNavigation';
import OptionCard from '../components/OptionCard';

const OPTIONS: { value: ProjectObjective; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'academia_completa',    label: 'Academia Completa',        desc: 'Espaço completo com musculação, cardio e área funcional',       icon: <Dumbbell size={20} /> },
  { value: 'sala_funcional',       label: 'Sala Funcional',           desc: 'Ambiente dedicado ao treinamento funcional e HIIT',              icon: <Target size={20} /> },
  { value: 'studio_personal',      label: 'Studio Personal',          desc: 'Espaço compacto e premium para personal trainers',               icon: <Users size={20} /> },
  { value: 'espaco_corporativo',   label: 'Espaço Corporativo',       desc: 'Academia para colaboradores em empresas e escritórios',          icon: <Building2 size={20} /> },
  { value: 'clinica_reabilitacao', label: 'Clínica / Reabilitação',   desc: 'Equipamentos para fisioterapia e reabilitação física',           icon: <Heart size={20} /> },
  { value: 'hotel_condominio',     label: 'Hotel / Condomínio',       desc: 'Academia para hóspedes, moradores e usuários ocasionais',        icon: <Hotel size={20} /> },
  { value: 'outro',                label: 'Outro Projeto',            desc: 'Descreva seu projeto e nosso consultor vai ajudar',              icon: <HelpCircle size={20} /> },
];

export default function ObjetivoPage() {
  const navigate = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  const selected = state.data.objective;

  function handleSelect(value: ProjectObjective) {
    updateData({
      objective: value,
      objectiveLabel: OBJECTIVE_LABELS[value],
    });
  }

  function handleNext() {
    if (!selected) return;
    setStep(2);
    navigate('/investimento');
  }

  function handleBack() {
    navigate('/');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <StepHeader
        stepNumber={1}
        title="Qual é o objetivo do projeto?"
        subtitle="Selecione o tipo de espaço que você deseja criar ou reformar."
        icon={<Target size={22} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {OPTIONS.map(opt => (
          <OptionCard
            key={opt.value}
            selected={selected === opt.value}
            onClick={() => handleSelect(opt.value)}
            icon={opt.icon}
            label={opt.label}
            description={opt.desc}
          />
        ))}
      </div>

      <StepNavigation
        onBack={handleBack}
        onNext={handleNext}
        canGoNext={!!selected}
        canGoBack={true}
        backLabel="Início"
      />
    </div>
  );
}
