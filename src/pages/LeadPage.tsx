import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bot, MessageCircle, Check } from 'lucide-react';
import { usePlanner } from '../context/PlannerContext';
import { BRAZIL_LOCATIONS, getCitiesByUF } from '../data/brazilLocations';
import { saveLeadToSheets, saveEventToSheets, upsertLeadProgress } from '../services/googleSheets';
import { openConsultorDirect } from '../utils/consultorDirect';
import { upsertLeadFromData } from '../utils/leadStorage';

// ── Sub-step config ───────────────────────────────────────────────────────────
type SubStep = 1 | 2 | 3 | 4;

const FOOTER_TEXT: Record<SubStep, string> = {
  1: 'ETAPA 4 DE 6 · PERFIL DO PROJETO · LEVA CERCA DE 2 MINUTOS.',
  2: 'ETAPA 4 DE 6 · PERFIL DO PROJETO · FALTAM 2 PASSOS NESTA ETAPA.',
  3: 'ETAPA 4 DE 6 · PERFIL DO PROJETO · FALTAM 1 PASSO NESTA ETAPA.',
  4: 'ETAPA 4 DE 6 · PERFIL DO PROJETO · ÚLTIMA PERGUNTA ANTES DE SEGUIRMOS PARA OS EQUIPAMENTOS.',
};

const SEGMENTS = [
  'Academia',
  'Condomínio',
  'Hotel',
  'Clube',
  'Estúdio',
  'Incorporadora / Construtora',
  'Personal / Educação Física',
  'Outro',
];

// ── Segment chip ──────────────────────────────────────────────────────────────
function SegmentChip({ label, isActive, onClick }: {
  label: string; isActive: boolean; onClick: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold border transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BC34A]"
      style={{
        background: isActive
          ? 'rgba(139,195,74,0.10)'
          : hovered
            ? 'rgba(139,195,74,0.04)'
            : 'transparent',
        borderColor: isActive
          ? '#8BC34A'
          : hovered
            ? 'rgba(139,195,74,0.35)'
            : 'rgba(255,255,255,0.14)',
        color: isActive ? '#8BC34A' : 'rgba(255,255,255,0.65)',
        boxShadow: isActive
          ? '0 0 12px rgba(139,195,74,0.12)'
          : hovered
            ? '0 0 8px rgba(139,195,74,0.06)'
            : 'none',
        transform: isActive ? 'scale(1.03)' : hovered ? 'scale(1.015)' : 'scale(1)',
      }}
    >
      {isActive && <Check size={11} strokeWidth={3} style={{ color: '#8BC34A' }} />}
      {label}
    </button>
  );
}

// ── Phone mask ────────────────────────────────────────────────────────────────
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7)  return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ── Shared input style ────────────────────────────────────────────────────────
const inputCls = `
  w-full px-4 py-3 rounded-lg text-white text-[15px] font-medium
  bg-transparent border transition-all duration-150
  placeholder:text-white/25 focus:outline-none
`.trim();

const inputStyle = {
  background: 'rgba(255,255,255,0.04)',
  borderColor: 'rgba(255,255,255,0.12)',
};

const inputFocusStyle = {
  background: 'rgba(139,195,74,0.06)',
  borderColor: '#8BC34A',
  boxShadow: '0 0 0 3px rgba(139,195,74,0.12)',
};

// ── Select style ──────────────────────────────────────────────────────────────
const selectCls = `
  flex-1 px-4 py-3 rounded-lg text-[14px] font-medium
  bg-transparent border transition-all duration-150
  focus:outline-none appearance-none cursor-pointer
`.trim();

// ── Main component ────────────────────────────────────────────────────────────
export default function LeadPage() {
  const navigate  = useNavigate();
  const { state, updateData, setStep } = usePlanner();

  const [subStep, setSubStep] = useState<SubStep>(1);
  const [error,   setError]   = useState('');

  // Form values
  const [name,    setName]    = useState(state.data.name    ?? '');
  const [phone,   setPhone]   = useState(state.data.phone   ?? '');
  const [uf,      setUf]      = useState(state.data.uf      ?? '');
  const [city,    setCity]    = useState(state.data.city    ?? '');
  const [segment, setSegment] = useState(state.data.profile ?? '');

  // Input focus tracking
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const cities = getCitiesByUF(uf);
  const progress = (subStep / 4) * 100;

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleBack() {
    setError('');
    if (subStep === 1) { navigate('/deadline'); return; }
    setSubStep((s) => (s - 1) as SubStep);
  }

  function handleNext() {
    setError('');

    if (subStep === 1) {
      if (!name.trim()) { setError('Por favor, informe seu nome.'); return; }
      updateData({ name: name.trim() });
      setSubStep(2);
      return;
    }

    if (subStep === 2) {
      const digits = phone.replace(/\D/g, '');
      if (digits.length < 10) { setError('Informe um WhatsApp válido (com DDD).'); return; }
      updateData({ phone: phone.trim() });
      setSubStep(3);
      return;
    }

    if (subStep === 3) {
      if (!uf)   { setError('Selecione o estado do projeto.'); return; }
      if (!city) { setError('Selecione a cidade do projeto.'); return; }
      updateData({ uf, city });
      setSubStep(4);
      return;
    }

    if (subStep === 4) {
      if (!segment) { setError('Selecione o segmento do seu espaço.'); return; }
      updateData({ profile: segment as any, profileLabel: segment });
      setStep(5);

      // ── Dados completos do lead até o perfil ──
      const updatedData = {
        ...state.data,
        name:         name.trim(),
        phone:        phone.trim(),
        city,
        uf,
        profile:      segment as any,
        profileLabel: segment,
      };

      // Salvar no localStorage (fonte do painel admin)
      upsertLeadFromData(updatedData, 5);
      // Enviar para Google Sheets (fonte compartilhada)
      upsertLeadProgress({
        codigoPrevia: updatedData.codigoPrevia ?? '',
        ultimaEtapa:  'profile',
        status:       'em_andamento',
        nome:         name.trim(),
        telefone:     phone.trim(),
        cidade:       city,
        uf,
        segmento:     segment,
        objetivo:     updatedData.objectiveLabel,
        investimento_estimado: updatedData.investmentLabel,
        prazo:        updatedData.deadlineLabel,
        origem:       updatedData.origem ?? 'space_planner',
      });
      console.log('UPSERT LEAD PROGRESS (LeadPage/Perfil):', { codigoPrevia: updatedData.codigoPrevia, step: 5, name: updatedData.name });

      // Salvar no Google Sheets (não-bloqueante, independente do painel)
      const d = state.data;
      saveLeadToSheets({
        codigoPrevia:         d.codigoPrevia ?? '',
        nome:                 name.trim(),
        telefone:             phone.trim(),
        cidade:               city,
        uf,
        segmento:             segment,
        objetivo:             d.objectiveLabel ?? '',
        investimentoEstimado: d.investmentLabel ?? '',
        prazo:                d.deadlineLabel  ?? '',
        ultimaEtapa:          'Perfil',
        status:               'em_andamento',
        origem:               d.origem ?? 'space_planner',
        consentimentoLgpd:    true,
      });
      saveEventToSheets(d.codigoPrevia ?? '', 'Perfil', 'concluiu', segment);

      navigate('/catalog?line=cardio');
    }
  }

  function handleConsultor() {
    // Usar dados já informados pelo lead para rotear corretamente
    const phoneRaw = phone || state.data.phone || '';
    const ufRaw   = uf   || state.data.uf   || '';
    const cityRaw = city || state.data.city || '';
    const nameRaw = name || state.data.name || '';

    openConsultorDirect({
      name:            nameRaw,
      phone:           phoneRaw,
      city:            cityRaw,
      uf:              ufRaw,
      codigoPrevia:    state.data.codigoPrevia,
      objectiveLabel:  state.data.objectiveLabel,
      investmentLabel: state.data.investmentLabel,
      investmentRange: state.data.investmentRange,
      deadlineLabel:   state.data.deadlineLabel,
      profileLabel:    segment || state.data.profileLabel,
    });
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        background:
          'radial-gradient(ellipse 70% 55% at 30% 35%, rgba(100,180,60,0.07) 0%, transparent 65%), #0c110c',
      }}
    >
      <main className="flex-1 max-w-[720px] mx-auto w-full px-4 sm:px-8 py-5 sm:py-7 flex flex-col">

        {/* ── Top bar: label + counter ──────────────────────────────────── */}
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-bold text-[#8BC34A] uppercase tracking-[0.14em]">
            Etapa 4 de 6 · Perfil
          </p>
          <p className="text-[12px] font-bold text-white/40">
            {subStep}/4
          </p>
        </div>

        {/* ── Progress bar ─────────────────────────────────────────────── */}
        <div
          className="w-full h-[3px] rounded-full mb-4 overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.08)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%`, background: '#8BC34A' }}
          />
        </div>

        {/* ── Microcopy ────────────────────────────────────────────────── */}
        <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
          Faltam poucos passos para montar sua prévia.
        </p>

        {/* ── Card ─────────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl border p-4 sm:p-6 flex-1 flex flex-col"
          style={{
            background: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.09)',
          }}
        >
          {/* Card header */}
          <div className="flex items-center gap-2.5 mb-6">
            <span
              className="flex items-center justify-center w-6 h-6 rounded-md"
              style={{ background: 'rgba(139,195,74,0.15)' }}
            >
              <Bot size={14} color="#8BC34A" strokeWidth={2} />
            </span>
            <p className="text-[10px] font-bold text-white/35 uppercase tracking-[0.14em]">
              Assistente Supertech · Seu Projeto
            </p>
          </div>

          {/* ── Sub-step 1: Nome ───────────────────────────────────────── */}
          {subStep === 1 && (
            <div className="flex flex-col flex-1">
              <h2 className="text-[1.6rem] sm:text-[1.85rem] font-black text-white leading-tight tracking-tight mb-2">
                Como podemos te chamar?
              </h2>
              <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
                Use o nome pelo qual prefere ser tratado.
              </p>
              <input
                id="lead-name"
                type="text"
                placeholder="Nome"
                value={name}
                onChange={(e) => { setName(e.target.value); setError(''); }}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className={inputCls}
                style={focusedField === 'name' || name ? { ...inputFocusStyle } : { ...inputStyle }}
                autoFocus
              />
              {error && <p className="mt-2 text-[12px] text-red-400/80">{error}</p>}
            </div>
          )}

          {/* ── Sub-step 2: WhatsApp ───────────────────────────────────── */}
          {subStep === 2 && (
            <div className="flex flex-col flex-1">
              <h2 className="text-[1.6rem] sm:text-[1.85rem] font-black text-white leading-tight tracking-tight mb-2">
                Qual o melhor WhatsApp para falar com você?
              </h2>
              <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
                Usamos apenas para enviar sua prévia e falar do projeto.
              </p>
              <input
                id="lead-phone"
                type="tel"
                inputMode="numeric"
                placeholder="WhatsApp"
                value={phone}
                onChange={(e) => { setPhone(maskPhone(e.target.value)); setError(''); }}
                onFocus={() => setFocusedField('phone')}
                onBlur={() => setFocusedField(null)}
                onKeyDown={(e) => e.key === 'Enter' && handleNext()}
                className={inputCls}
                style={focusedField === 'phone' || phone ? { ...inputFocusStyle } : { ...inputStyle }}
                autoFocus
              />
              {error && <p className="mt-2 text-[12px] text-red-400/80">{error}</p>}
            </div>
          )}

          {/* ── Sub-step 3: UF + Cidade ────────────────────────────────── */}
          {subStep === 3 && (
            <div className="flex flex-col flex-1">
              <h2 className="text-[1.6rem] sm:text-[1.85rem] font-black text-white leading-tight tracking-tight mb-2">
                De qual cidade é o seu projeto?
              </h2>
              <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
                Selecione primeiro o estado e depois a cidade onde o espaço será montado.
              </p>

              {/* Selects row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-3">
                {/* UF Select */}
                <div className="relative flex-1">
                  <select
                    id="lead-uf"
                    value={uf}
                    onChange={(e) => { setUf(e.target.value); setCity(''); setError(''); }}
                    className={selectCls}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderColor: uf ? '#8BC34A' : 'rgba(255,255,255,0.12)',
                      color: uf ? '#ffffff' : 'rgba(255,255,255,0.35)',
                    }}
                  >
                    <option value="" disabled style={{ background: '#151a15', color: 'rgba(255,255,255,0.4)' }}>
                      UF / Estado
                    </option>
                    {BRAZIL_LOCATIONS.map(loc => (
                      <option key={loc.uf} value={loc.uf} style={{ background: '#151a15', color: '#ffffff' }}>
                        {loc.uf} – {loc.name}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35">
                    ▾
                  </span>
                </div>

                {/* City Select */}
                <div className="relative flex-1">
                  <select
                    id="lead-city"
                    value={city}
                    disabled={!uf}
                    onChange={(e) => { setCity(e.target.value); setError(''); }}
                    className={selectCls}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      borderColor: city ? '#8BC34A' : 'rgba(255,255,255,0.12)',
                      color: city ? '#ffffff' : 'rgba(255,255,255,0.35)',
                      opacity: !uf ? 0.45 : 1,
                      cursor: !uf ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <option value="" disabled style={{ background: '#151a15', color: 'rgba(255,255,255,0.4)' }}>
                      {uf ? 'Cidade do projeto' : 'Selecione a UF primeiro'}
                    </option>
                    {cities.map(c => (
                      <option key={c} value={c} style={{ background: '#151a15', color: '#ffffff' }}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/35">
                    ▾
                  </span>
                </div>
              </div>

              <p className="text-[12px] text-white/30 leading-relaxed mb-2">
                Usamos essa informação para direcionar sua prévia ao consultor da região.
              </p>
              {error && <p className="mt-1 text-[12px] text-red-400/80">{error}</p>}
            </div>
          )}

          {/* ── Sub-step 4: Segmento ───────────────────────────────────── */}
          {subStep === 4 && (
            <div className="flex flex-col flex-1">
              <h2 className="text-[1.6rem] sm:text-[1.85rem] font-black text-white leading-tight tracking-tight mb-2">
                Qual é o segmento do seu espaço fitness?
              </h2>
              <p className="text-[13px] text-white/40 mb-6 leading-relaxed">
                Isso nos ajuda a indicar a composição certa.
              </p>

              {/* Chips */}
              <div className="flex flex-wrap gap-2 mb-4">
                {SEGMENTS.map(seg => {
                  const isActive = segment === seg;
                  return (
                    <SegmentChip
                      key={seg}
                      label={seg}
                      isActive={isActive}
                      onClick={() => { setSegment(seg); setError(''); }}
                    />
                  );
                })}
              </div>
              {error && <p className="text-[12px] text-red-400/80">{error}</p>}
            </div>
          )}

          {/* ── LGPD consent microcopy (subStep 4 only) ──────────────── */}
          {subStep === 4 && (
            <p className="text-[10px] text-white/30 leading-relaxed text-center mt-5 max-w-[340px] mx-auto">
              Ao continuar, você autoriza a Supertech a usar seus dados para contato comercial sobre seu projeto fitness.
            </p>
          )}

          {/* ── Navigation row ───────────────────────────────────────────── */}
          <div className="flex items-center justify-between mt-4 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
            <button
              onClick={handleBack}
              className="flex items-center gap-1.5 text-[13px] font-semibold text-white/45 hover:text-white/70 transition-colors"
            >
              <ArrowLeft size={14} strokeWidth={2.5} />
              Voltar
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-[14px] text-black transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: '#8BC34A',
                boxShadow: '0 0 18px rgba(139,195,74,0.25)',
              }}
            >
              {subStep === 4 ? 'Avançar' : 'Continuar'}
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* ── Footer microcopy ─────────────────────────────────────────── */}
        <p className="text-[10px] font-semibold text-white/20 uppercase tracking-[0.12em] text-center mt-5 mb-3 leading-relaxed">
          {FOOTER_TEXT[subStep]}
        </p>

        {/* ── Green info pill ──────────────────────────────────────────── */}
        <div
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full mx-auto"
          style={{
            background: 'rgba(139,195,74,0.10)',
            border: '1px solid rgba(139,195,74,0.20)',
          }}
        >
          <Bot size={13} color="#8BC34A" strokeWidth={2} />
          <p className="text-[12px] font-semibold text-[#8BC34A]">
            Na próxima etapa você já escolhe os equipamentos do seu projeto.
          </p>
        </div>
      </main>

      {/* ── Floating WhatsApp button ─────────────────────────────────────── */}
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
