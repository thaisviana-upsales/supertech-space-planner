/**
 * ConsultorDirectModal.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Modal que coleta WhatsApp com DDD quando o lead clica em "Falar com consultor"
 * antes de preencher seus dados de contato.
 *
 * Após preenchimento, usa exatamente a mesma lógica de roteamento por DDD
 * (resolveWhatsappDestination) que o envio final do orçamento.
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { useState, useEffect, useRef } from 'react';
import { X, MessageCircle, AlertCircle, MapPin, User, Phone } from 'lucide-react';
import { openConsultorDirect } from '../utils/consultorDirect';
import type { ConsultorDirectLeadData } from '../utils/consultorDirect';

// ── Brazil UF list ────────────────────────────────────────────────────────────
const UF_LIST = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
  'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO',
];

// ── Phone mask ────────────────────────────────────────────────────────────────
function maskPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7)  return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ConsultorDirectModalProps {
  /** Dados já existentes do lead (podem estar parcialmente preenchidos) */
  prefill?: Partial<ConsultorDirectLeadData>;
  onClose: () => void;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ConsultorDirectModal({
  prefill = {},
  onClose,
}: ConsultorDirectModalProps) {
  const [name,  setName]  = useState(prefill.name  ?? '');
  const [phone, setPhone] = useState(prefill.phone ? maskPhone(prefill.phone) : '');
  const [city,  setCity]  = useState(prefill.city  ?? '');
  const [uf,    setUf]    = useState(prefill.uf    ?? '');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const phoneRef = useRef<HTMLInputElement>(null);

  // Focus phone field on open (or name if no name)
  useEffect(() => {
    const timer = setTimeout(() => {
      phoneRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Close on ESC
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  function handleSubmit() {
    setError('');

    // Validar WhatsApp (obrigatório, precisa de DDD com 2 dígitos)
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) {
      setError('Informe um WhatsApp válido com DDD para direcionarmos ao consultor correto.');
      return;
    }
    // Verificar que há DDD válido (primeiro dígito do DDD >= 1, segundo >= 1)
    const potentialDDD = parseInt(digits.slice(0, 2), 10);
    if (potentialDDD < 11) {
      setError('Informe um WhatsApp válido com DDD para direcionarmos ao consultor correto.');
      return;
    }

    setSending(true);

    const leadData: ConsultorDirectLeadData = {
      name:               name.trim() || prefill.name,
      phone:              digits,
      city:               city.trim() || prefill.city,
      uf:                 uf || prefill.uf,
      codigoPrevia:       prefill.codigoPrevia,
      objectiveLabel:     prefill.objectiveLabel,
      investmentLabel:    prefill.investmentLabel,
      investmentRange:    prefill.investmentRange,
      deadlineLabel:      prefill.deadlineLabel,
      profileLabel:       prefill.profileLabel,
      segment:            prefill.segment,
    };

    const ok = openConsultorDirect(leadData);
    setSending(false);

    if (ok) {
      onClose();
    } else {
      setError('Não foi possível identificar um consultor para sua região. Tente novamente.');
    }
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.72)' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ backdropFilter: 'blur(8px)' }}
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md flex flex-col rounded-t-3xl sm:rounded-2xl"
        style={{
          background: 'linear-gradient(160deg, rgba(18,26,18,0.99) 0%, rgba(10,15,10,1) 100%)',
          border: '1px solid rgba(139,195,74,0.22)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(139,195,74,0.08)',
          maxHeight: '95vh',
          overflow: 'auto',
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between p-5 pb-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(139,195,74,0.15)' }}
              >
                <MessageCircle size={14} color="#8BC34A" strokeWidth={2} />
              </div>
              <h2 className="text-[15px] font-black text-white leading-tight">
                Para direcionar você ao consultor correto
              </h2>
            </div>
            <p className="text-[12px] text-white/40 leading-relaxed ml-9">
              Informe seu WhatsApp com DDD para conectarmos você ao representante responsável pela sua região.
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 p-1.5 rounded-lg text-white/35 hover:text-white/70 transition-colors"
            style={{ background: 'rgba(255,255,255,0.06)' }}
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 flex flex-col gap-3">

          {/* Nome */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 uppercase tracking-[0.12em] mb-1.5">
              <User size={10} />
              Nome
            </label>
            <input
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={e => { setName(e.target.value); setError(''); }}
              className="w-full px-4 py-2.5 rounded-lg text-[14px] font-medium text-white placeholder:text-white/22 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#8BC34A';
                e.currentTarget.style.background = 'rgba(139,195,74,0.06)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          {/* WhatsApp com DDD — obrigatório */}
          <div>
            <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 uppercase tracking-[0.12em] mb-1.5">
              <Phone size={10} />
              WhatsApp com DDD <span className="text-[#8BC34A] ml-0.5">*</span>
            </label>
            <input
              ref={phoneRef}
              type="tel"
              inputMode="numeric"
              placeholder="(98) 99999-9999"
              value={phone}
              onChange={e => { setPhone(maskPhone(e.target.value)); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              className="w-full px-4 py-2.5 rounded-lg text-[14px] font-medium text-white placeholder:text-white/22 focus:outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${error ? 'rgba(248,113,113,0.5)' : 'rgba(255,255,255,0.12)'}`,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#8BC34A';
                e.currentTarget.style.background = 'rgba(139,195,74,0.06)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = error
                  ? 'rgba(248,113,113,0.5)'
                  : 'rgba(255,255,255,0.12)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}
            />
          </div>

          {/* Cidade + UF — opcionais */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 uppercase tracking-[0.12em] mb-1.5">
                <MapPin size={10} />
                Cidade
              </label>
              <input
                type="text"
                placeholder="Cidade (opcional)"
                value={city}
                onChange={e => { setCity(e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 rounded-lg text-[13px] font-medium text-white placeholder:text-white/22 focus:outline-none transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = '#8BC34A';
                  e.currentTarget.style.background = 'rgba(139,195,74,0.06)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                }}
              />
            </div>
            <div className="w-[90px]">
              <label className="flex items-center gap-1.5 text-[10px] font-bold text-white/35 uppercase tracking-[0.12em] mb-1.5">
                UF
              </label>
              <select
                value={uf}
                onChange={e => { setUf(e.target.value); setError(''); }}
                className="w-full px-3 py-2.5 rounded-lg text-[13px] font-medium focus:outline-none appearance-none cursor-pointer transition-all"
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: uf ? '#ffffff' : 'rgba(255,255,255,0.25)',
                }}
              >
                <option value="" disabled style={{ background: '#151a15' }}>UF</option>
                {UF_LIST.map(u => (
                  <option key={u} value={u} style={{ background: '#151a15', color: '#fff' }}>{u}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              <AlertCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[12px] text-red-400 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            style={{
              background: '#8BC34A',
              boxShadow: '0 0 24px rgba(139,195,74,0.30)',
            }}
          >
            <MessageCircle size={16} strokeWidth={2.5} />
            {sending ? 'Conectando...' : 'Falar com consultor agora'}
          </button>

          {/* Privacy note */}
          <p className="text-[10px] text-white/22 text-center leading-relaxed">
            Seus dados são usados apenas para direcionar ao consultor correto da sua região.
          </p>
        </div>
      </div>
    </div>
  );
}
