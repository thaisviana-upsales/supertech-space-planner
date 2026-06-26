import { useNavigate } from 'react-router-dom';
import { Eye, Send, MapPin, Package, Target, DollarSign, Clock, User, Zap } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { CONSULTOR_WHATSAPP } from '../constants';
import StepHeader from '../components/StepHeader';

function buildWhatsAppMessage(data: ReturnType<typeof usePlanner>['state']['data']): string {
  const lines = [
    `🏋️ *Supertech Space Planner™ — Nova Prévia de Projeto*`,
    ``,
    `👤 *Contato:* ${data.name ?? '—'}`,
    `📱 *WhatsApp:* ${data.phone ?? '—'}`,
    `📧 *E-mail:* ${data.email ?? '—'}`,
    `📍 *Localização:* ${data.city ?? '—'}, ${data.uf ?? '—'}`,
    ``,
    `🎯 *Objetivo:* ${data.objectiveLabel ?? '—'}`,
    `💰 *Investimento:* ${data.investmentLabel ?? '—'}`,
    `⏱️ *Prazo:* ${data.timelineLabel ?? '—'}`,
    `👔 *Perfil:* ${data.profileLabel ?? '—'}`,
    ``,
    `🏋️ *Equipamentos selecionados:*`,
    ...(data.selectedEquipment ?? []).map(e => `  • ${e.name} × ${e.quantity}`),
    ``,
    `📊 *Total:* ${(data.selectedEquipment ?? []).reduce((s, e) => s + e.quantity, 0)} unidades`,
    ``,
    `_Prévia gerada via Space Planner™ — Supertech Fitness_`,
  ];
  return lines.join('\n');
}

export default function PreviaPage() {
  const navigate = useNavigate();
  const { state, markSent } = usePlanner();
  const data = state.data;

  function handleSendWhatsApp() {
    const msg = buildWhatsAppMessage(data);
    const encoded = encodeURIComponent(msg);
    const url = `https://api.whatsapp.com/send?phone=${CONSULTOR_WHATSAPP}&text=${encoded}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    markSent();
    setTimeout(() => {
      navigate('/confirmation');
    }, 1000);
  }

  function handleBack() {
    navigate('/project');
  }

  const totalUnits = (data.selectedEquipment ?? []).reduce((s, e) => s + e.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 page-enter">
      <StepHeader
        stepNumber={7}
        title="Prévia do Projeto"
        subtitle="Confira a prévia completa do seu projeto. Quando estiver pronto, envie ao consultor via WhatsApp."
        icon={<Eye size={22} />}
      />

      {/* Preview card */}
      <div className="card overflow-hidden mb-6">
        {/* Header banner */}
        <div className="bg-gradient-to-r from-dark-900 via-surface-elevated to-dark-900 px-6 py-5 border-b border-surface-border">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <div className="label-upper mb-1">Prévia do Projeto</div>
              <div className="text-xl font-bold text-white">
                {data.objectiveLabel ?? 'Projeto Supertech'}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <Zap size={14} className="text-supertech-400" />
              <span className="text-xs font-semibold text-supertech-400">Space Planner™</span>
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: <Target size={15} />,    label: 'Objetivo',      value: data.objectiveLabel },
            { icon: <DollarSign size={15} />,label: 'Investimento',  value: data.investmentLabel },
            { icon: <Clock size={15} />,     label: 'Prazo',         value: data.timelineLabel },
            { icon: <User size={15} />,      label: 'Perfil',        value: data.profileLabel },
          ].map(item => (
            <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-surface-border">
              <div className="w-7 h-7 rounded-lg bg-supertech-500/10 flex items-center justify-center text-supertech-400 flex-shrink-0 mt-0.5">
                {item.icon}
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-0.5">{item.label}</div>
                <div className="text-sm font-semibold text-white">{item.value ?? '—'}</div>
              </div>
            </div>
          ))}

          {/* Location */}
          {(data.city || data.uf) && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-surface-card border border-surface-border sm:col-span-2">
              <div className="w-7 h-7 rounded-lg bg-supertech-500/10 flex items-center justify-center text-supertech-400 flex-shrink-0 mt-0.5">
                <MapPin size={15} />
              </div>
              <div>
                <div className="text-xs font-medium text-slate-500 mb-0.5">Localização</div>
                <div className="text-sm font-semibold text-white">{data.city}, {data.uf} · {data.name}</div>
              </div>
            </div>
          )}
        </div>

        {/* Equipment list */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 mb-3">
            <Package size={15} className="text-supertech-400" />
            <span className="font-semibold text-sm text-white">
              Equipamentos — {(data.selectedEquipment ?? []).length} tipos · {totalUnits} unidades
            </span>
          </div>
          <div className="rounded-xl border border-surface-border overflow-hidden">
            {(data.selectedEquipment ?? []).map((eq, i, arr) => (
              <div
                key={eq.id}
                className={`flex items-center justify-between px-4 py-3 ${i < arr.length - 1 ? 'border-b border-surface-border' : ''}`}
              >
                <div>
                  <div className="text-sm font-medium text-slate-200">{eq.name}</div>
                  <div className="text-xs text-slate-500">{eq.category}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-supertech-400 font-bold text-sm">× {eq.quantity}</span>
                </div>
              </div>
            ))}
            {(data.selectedEquipment ?? []).length === 0 && (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">Nenhum equipamento selecionado</div>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button onClick={handleBack} className="btn-secondary flex-1">
          ← Voltar e Editar
        </button>
        <button
          onClick={handleSendWhatsApp}
          className="btn-primary flex-1 gap-2.5 text-base py-4 shadow-green-glow"
        >
          <Send size={18} />
          Enviar ao Consultor via WhatsApp
        </button>
      </div>

      <p className="text-xs text-slate-600 text-center mt-4">
        Ao clicar, você será redirecionado ao WhatsApp com a prévia pré-preenchida para envio ao nosso consultor.
      </p>
    </div>
  );
}
