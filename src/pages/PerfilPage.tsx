import { useNavigate } from 'react-router-dom';
import { User, Briefcase, Dumbbell, Building, PenTool, TrendingUp, Stethoscope, HelpCircle } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { PROFILE_LABELS, UF_LIST } from '../constants';
import type { LeadProfile } from '../types';
import StepHeader from '../components/StepHeader';
import StepNavigation from '../components/StepNavigation';
import OptionCard from '../components/OptionCard';

const PROFILES: { value: LeadProfile; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'empresario',           label: 'Empresário / Investidor',    desc: 'Abro ou expando um negócio fitness',                   icon: <Briefcase size={18} /> },
  { value: 'personal_trainer',     label: 'Personal Trainer',           desc: 'Quero montar meu próprio studio',                      icon: <Dumbbell size={18} /> },
  { value: 'gestor_academia',      label: 'Gestor de Academia',         desc: 'Gerencio uma academia existente',                      icon: <Building size={18} /> },
  { value: 'arquiteto_projetista', label: 'Arquiteto / Projetista',     desc: 'Projeto espaços fitness para clientes',                icon: <PenTool size={18} /> },
  { value: 'investidor',           label: 'Fundo de Investimento',      desc: 'Invisto em academias e negócios fitness',              icon: <TrendingUp size={18} /> },
  { value: 'medico_fisioterapeuta',label: 'Médico / Fisioterapeuta',    desc: 'Clínica ou espaço de reabilitação',                    icon: <Stethoscope size={18} /> },
  { value: 'outro',                label: 'Outro Perfil',               desc: 'Não me identifico com as opções acima',                icon: <HelpCircle size={18} /> },
];

export default function PerfilPage() {
  const navigate = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  const data = state.data;
  const canGoNext = !!data.profile && !!data.name && !!data.phone && !!data.uf && !!data.city;

  function handleSelect(value: LeadProfile) {
    updateData({ profile: value, profileLabel: PROFILE_LABELS[value] });
  }

  function handleNext() {
    if (!canGoNext) return;
    setStep(5);
    navigate('/equipamentos');
  }

  function handleBack() {
    setStep(3);
    navigate('/prazo');
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <StepHeader
        stepNumber={4}
        title="Qual é o seu perfil?"
        subtitle="Nos conte um pouco sobre você e onde o projeto será realizado."
        icon={<User size={22} />}
      />

      {/* Profile grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {PROFILES.map(p => (
          <OptionCard
            key={p.value}
            selected={data.profile === p.value}
            onClick={() => handleSelect(p.value)}
            icon={p.icon}
            label={p.label}
            description={p.desc}
          />
        ))}
      </div>

      {/* Contact form */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-white text-sm mb-4 flex items-center gap-2">
          <User size={15} className="text-supertech-400" />
          Dados de Contato
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome completo *</label>
            <input
              type="text"
              className="input-dark"
              placeholder="Seu nome"
              value={data.name ?? ''}
              onChange={e => updateData({ name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">WhatsApp *</label>
            <input
              type="tel"
              className="input-dark"
              placeholder="(11) 99999-9999"
              value={data.phone ?? ''}
              onChange={e => updateData({ phone: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
            <input
              type="email"
              className="input-dark"
              placeholder="seu@email.com"
              value={data.email ?? ''}
              onChange={e => updateData({ email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Estado (UF) *</label>
            <select
              className="input-dark"
              value={data.uf ?? ''}
              onChange={e => updateData({ uf: e.target.value })}
            >
              <option value="">Selecione</option>
              {UF_LIST.map(uf => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Cidade *</label>
            <input
              type="text"
              className="input-dark"
              placeholder="Sua cidade"
              value={data.city ?? ''}
              onChange={e => updateData({ city: e.target.value })}
            />
          </div>
        </div>
      </div>

      <StepNavigation
        onBack={handleBack}
        onNext={handleNext}
        canGoNext={canGoNext}
      />
    </div>
  );
}
