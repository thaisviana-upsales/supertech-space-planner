import { useNavigate } from 'react-router-dom';
import { ClipboardList, Edit3, Target, DollarSign, Clock, User, MapPin, Package } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import StepHeader from '../components/StepHeader';
import StepNavigation from '../components/StepNavigation';

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  step: number;
  onEdit: () => void;
  children: React.ReactNode;
}

function ReviewSection({ icon, title, step, onEdit, children }: SectionProps) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-supertech-500/10 flex items-center justify-center text-supertech-400">
            {icon}
          </div>
          <div>
            <div className="text-[10px] font-semibold text-supertech-500 uppercase tracking-wider">Etapa {step}</div>
            <div className="font-semibold text-white text-sm">{title}</div>
          </div>
        </div>
        <button onClick={onEdit} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-supertech-400 transition-colors">
          <Edit3 size={12} />
          Editar
        </button>
      </div>
      {children}
    </div>
  );
}

export default function RevisaoPage() {
  const navigate = useNavigate();
  const { state, setStep } = usePlanner();
  const data = state.data;

  const goTo = (path: string, step: number) => { setStep(step); navigate(path); };

  function handleNext() {
    setStep(7);
    navigate('/previa');
  }

  function handleBack() {
    setStep(5);
    navigate('/equipamentos');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <StepHeader
        stepNumber={6}
        title="Revisão do Projeto"
        subtitle="Confira as informações antes de gerar a prévia. Você pode editar qualquer etapa."
        icon={<ClipboardList size={22} />}
      />

      <div className="flex flex-col gap-4">
        {/* Objetivo */}
        <ReviewSection icon={<Target size={16} />} title="Objetivo do Projeto" step={1} onEdit={() => goTo('/objetivo', 1)}>
          <div className="text-slate-200 font-medium">{data.objectiveLabel ?? <span className="text-slate-500 italic">Não informado</span>}</div>
        </ReviewSection>

        {/* Investimento */}
        <ReviewSection icon={<DollarSign size={16} />} title="Investimento" step={2} onEdit={() => goTo('/investimento', 2)}>
          <div className="text-slate-200 font-medium">{data.investmentLabel ?? <span className="text-slate-500 italic">Não informado</span>}</div>
        </ReviewSection>

        {/* Prazo */}
        <ReviewSection icon={<Clock size={16} />} title="Prazo" step={3} onEdit={() => goTo('/prazo', 3)}>
          <div className="text-slate-200 font-medium">{data.timelineLabel ?? <span className="text-slate-500 italic">Não informado</span>}</div>
        </ReviewSection>

        {/* Perfil */}
        <ReviewSection icon={<User size={16} />} title="Perfil & Contato" step={4} onEdit={() => goTo('/perfil', 4)}>
          <div className="space-y-1.5">
            {data.profileLabel && <div className="badge-green inline-flex">{data.profileLabel}</div>}
            <div className="grid grid-cols-2 gap-2 mt-2 text-sm">
              {data.name && (
                <div><span className="text-slate-500 text-xs">Nome</span><div className="text-slate-200">{data.name}</div></div>
              )}
              {data.phone && (
                <div><span className="text-slate-500 text-xs">WhatsApp</span><div className="text-slate-200">{data.phone}</div></div>
              )}
              {data.email && (
                <div><span className="text-slate-500 text-xs">E-mail</span><div className="text-slate-200">{data.email}</div></div>
              )}
              {(data.uf || data.city) && (
                <div className="flex items-center gap-1">
                  <MapPin size={12} className="text-supertech-500" />
                  <span className="text-slate-200">{data.city}, {data.uf}</span>
                </div>
              )}
            </div>
          </div>
        </ReviewSection>

        {/* Equipamentos */}
        <ReviewSection icon={<Package size={16} />} title="Equipamentos" step={5} onEdit={() => goTo('/equipamentos', 5)}>
          {data.selectedEquipment && data.selectedEquipment.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs text-slate-500 mb-2">
                {data.selectedEquipment.length} tipo{data.selectedEquipment.length > 1 ? 's' : ''} ·&nbsp;
                {data.selectedEquipment.reduce((s, e) => s + e.quantity, 0)} unidades
              </div>
              {data.selectedEquipment.map(eq => (
                <div key={eq.id} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                  <span className="text-slate-200 text-sm">{eq.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="badge-dark text-[10px]">{eq.category}</span>
                    <span className="text-supertech-400 font-bold text-sm">×{eq.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <span className="text-slate-500 italic text-sm">Nenhum equipamento selecionado</span>
          )}
        </ReviewSection>
      </div>

      <StepNavigation
        onBack={handleBack}
        onNext={handleNext}
        nextLabel="Gerar Prévia do Projeto"
      />
    </div>
  );
}
