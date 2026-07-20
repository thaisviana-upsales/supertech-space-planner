import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Circle } from 'lucide-react';
import ConsultorDirectModal from '../components/ConsultorDirectModal';
import { usePlanner } from '../context/PlannerContext';
import { upsertLeadFromData } from '../utils/leadStorage';
import { upsertLeadProgress } from '../services/googleSheets';

export default function IntroPage() {
  const navigate = useNavigate();
  const { state } = usePlanner();
  const [showModal, setShowModal] = useState(false);

  function handleStart() {
    const codigo = state.data.codigoPrevia ?? '';
    // Salvar lead parcial step 1 — garante registro mesmo que abandone antes do objetivo
    upsertLeadFromData(state.data, 1);
    // Enviar para Google Sheets (fonte compartilhada — visível em qualquer dispositivo)
    upsertLeadProgress({
      codigoPrevia: codigo,
      ultimaEtapa:  'intro',
      status:       'em_andamento',
      origem:       state.data.origem ?? 'space_planner',
    });
    console.log('LEAD SESSION ID:', codigo);
    console.log('UPSERT LEAD PROGRESS (IntroPage):', { codigoPrevia: codigo, step: 1 });
    navigate('/objective');
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 35%, rgba(100,180,60,0.08) 0%, transparent 65%), #0c110c' }}
    >
      {/* ── CENTERED CONTENT ──────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center px-5 py-8">
        <div className="text-center max-w-[440px] w-full">

          {/* Label */}
          <p className="text-step-label text-white/32 mb-4">
            Space Planner™ · Montando sua prévia
          </p>

          {/* Title — matches Lovable proportions: ~24px desktop, fits 1.5 lines */}
          <h1 className="text-page-hero font-black leading-[1.12] tracking-tight text-white mb-2">
            Monte a{' '}
            <span className="text-[#8BC34A]">prévia do seu projeto fitness.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-micro text-white/38 mb-6">
            Leva cerca de 2 minutos.
          </p>

          {/* CTA */}
          <button
            onClick={handleStart}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-[14px] text-black transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] mb-6"
            style={{ background: '#8BC34A', boxShadow: '0 0 18px rgba(139,195,74,0.26)', minHeight: '48px' }}
          >
            Iniciar planejamento
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>

          {/* Mini flow */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Check size={10} className="text-[#8BC34A]" strokeWidth={2.5} />
              <span className="text-[11px] text-white/48 font-medium">Projeto</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-px bg-white/15" />
              <div className="w-1 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center gap-1.5">
              <Circle size={10} className="text-[#8BC34A]/55" strokeWidth={1.5} />
              <span className="text-[11px] text-white/48 font-medium">Equipamentos</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-px bg-white/15" />
              <div className="w-1 h-1 rounded-full bg-white/15" />
            </div>
            <div className="flex items-center gap-1.5">
              <Check size={10} className="text-[#8BC34A]" strokeWidth={2.5} />
              <span className="text-[11px] text-white/48 font-medium">Envio ao consultor</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.3)' }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-8 py-2.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img
              src="/brand/logo-supertech-branca.png"
              alt="Supertech 360°"
              style={{ height: '16px', width: 'auto', objectFit: 'contain', opacity: 0.5 }}
            />
            <span className="text-[9px] text-white/20 uppercase tracking-widest hidden sm:inline">Space Planner™</span>
          </div>
          <button
            id="intro-consultor-btn"
            onClick={() => setShowModal(true)}
            className="text-[10px] font-semibold text-white/30 uppercase tracking-widest hover:text-white/55 transition-colors"
          >
            Falar com consultor →
          </button>
        </div>
      </footer>

      {/* Modal para captura de DDD */}
      {showModal && (
        <ConsultorDirectModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
