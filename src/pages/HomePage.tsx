import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Bot, Clock, User, DollarSign, Dumbbell, Grid2X2, Send } from 'lucide-react';
import ConsultorDirectModal from '../components/ConsultorDirectModal';

const MODULES = [
  { num: '01', title: 'Perfil',           desc: 'Segmento, objetivo e contexto',   icon: <User size={15} /> },
  { num: '02', title: 'Investimento',     desc: 'Faixa de orçamento e prazo',        icon: <DollarSign size={15} /> },
  { num: '03', title: 'Equipamentos',    desc: 'Cardio · Musculação · Strong',      icon: <Dumbbell size={15} /> },
  { num: '04', title: 'Prévia visual',   desc: 'Showroom do seu projeto',            icon: <Grid2X2 size={15} /> },
  { num: '05', title: 'Envio ao consultor', desc: 'WhatsApp direto, sem fricção',   icon: <Send size={15} /> },
];

const STEPS = [
  { num: '01', title: 'Informe seu perfil',  desc: 'Projeto e segmento' },
  { num: '02', title: 'Monte a seleção',     desc: 'Cardio · Musculação · Strong' },
  { num: '03', title: 'Envie ao consultor',  desc: 'Orientação comercial' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(ellipse 70% 55% at 30% 40%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c' }}
    >
      <main className="flex-1 flex flex-col">
        <div className="max-w-[1200px] mx-auto w-full px-4 sm:px-8 pt-6 sm:pt-10 pb-0 flex-1 flex flex-col">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 flex-1">

            {/* ── LEFT COLUMN ─────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col justify-center py-2 sm:py-8 max-w-[500px]">

              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#8BC34A]/25 mb-4 w-fit"
                style={{ background: 'rgba(139,195,74,0.07)' }}
              >
                <Bot size={12} className="text-[#8BC34A]" />
                <span className="text-[10px] font-semibold text-[#8BC34A] uppercase tracking-widest">
                  Assistente de Pré-Projeto
                </span>
              </div>

              {/* Title */}
              <h1 className="text-page-hero font-black leading-[1.1] tracking-tight mb-2.5 text-white">
                Planeje sua academia com{' '}
                <span className="text-[#8BC34A]">equipamentos profissionais</span>
                {' '}Supertech.
              </h1>

              {/* Subtitle */}
              <p className="text-[12px] sm:text-[13px] text-white/45 leading-relaxed mb-5 max-w-[400px]">
                Escolha os equipamentos, visualize seu espaço fitness e envie seu projeto para um consultor — em poucos passos.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mb-3">
              <button
                  onClick={() => navigate('/intro')}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold text-[15px] text-black transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: '#8BC34A', boxShadow: '0 0 20px rgba(139,195,74,0.28)', minHeight: '48px' }}
                >
                  Começar meu projeto
                  <ArrowRight size={16} strokeWidth={2.5} />
                </button>

                <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-semibold text-[13px] text-white/55 border border-white/10 hover:border-white/18 hover:text-white/75 transition-all duration-150">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-white/35">
                    <rect x="1" y="7" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="6" y="4" width="4" height="11" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                    <rect x="10" y="1" width="5" height="14" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                  </svg>
                  Conhecer a fábrica
                </button>
              </div>

              {/* Microcopy */}
              <div className="flex items-center gap-1.5">
                <Clock size={11} className="text-[#8BC34A]/60" />
                <span className="text-[11px] text-white/30">Leva cerca de 2 min · prévia visual instantânea</span>
              </div>
            </div>

            {/* ── RIGHT COLUMN: Flow modules ──────────────────────────── */}
            <div className="lg:w-[360px] xl:w-[400px] flex flex-col justify-center py-2 sm:py-8">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[9px] font-semibold text-white/28 uppercase tracking-[0.15em]">Fluxo da Ferramenta</span>
                <span className="text-[10px] font-bold text-[#8BC34A]">5 módulos</span>
              </div>

              <div className="flex flex-col gap-1">
                {MODULES.map((mod) => (
                  <div
                    key={mod.num}
                    className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border border-white/[0.07] hover:border-white/[0.12] transition-colors duration-150 group"
                    style={{ background: 'rgba(255,255,255,0.02)' }}
                  >
                    <div
                      className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[#8BC34A]"
                      style={{ background: 'rgba(139,195,74,0.09)' }}
                    >
                      {mod.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[9px] font-mono text-white/22">{mod.num}</span>
                        <span className="text-[12px] font-semibold text-white/85">{mod.title}</span>
                      </div>
                      <div className="text-[10px] text-white/32 leading-tight">{mod.desc}</div>
                    </div>
                    <ArrowRight size={12} className="text-white/18 flex-shrink-0 group-hover:text-white/38 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── STEPS STRIP ──────────────────────────────────────────── */}
          <div className="border-t border-white/[0.07] mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-3">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className={`px-0 py-3.5 sm:px-5 ${i > 0 ? 'border-t sm:border-t-0 sm:border-l border-white/[0.07]' : ''}`}
                >
                  <div className="flex items-baseline gap-1.5 mb-0.5">
                    <span className="text-[9px] font-mono text-[#8BC34A]/55">{step.num}</span>
                    <span className="text-[12px] font-bold text-white/78">{step.title}</span>
                  </div>
                  <div className="text-[10px] text-white/32">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────────────── */}
        <footer className="border-t border-white/[0.06]" style={{ background: 'rgba(0,0,0,0.3)' }}>
          <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img
                src="/brand/logo-supertech-branca.png"
                alt="Supertech 360°"
                style={{ height: '18px', width: 'auto', objectFit: 'contain', opacity: 0.55 }}
              />
              <span className="text-[10px] text-white/22 hidden sm:inline">
                Fábrica nacional de equipamentos fitness profissionais
              </span>
            </div>
            <button
              id="homepage-consultor-btn"
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1 text-[10px] font-medium text-[#8BC34A]/65 hover:text-[#8BC34A] transition-colors whitespace-nowrap"
            >
              Já tem um projeto? Falar com consultor →
            </button>
          </div>
        </footer>
      </main>

      {/* Modal para captura de DDD */}
      {showModal && (
        <ConsultorDirectModal onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
