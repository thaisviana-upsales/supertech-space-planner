import { useState, useEffect } from 'react';
import { X, MessageCircle, Copy, Check, AlertCircle, ChevronDown } from 'lucide-react';
import type { LeadRecord } from '../utils/leadStorage';
import { getLastStepLabel } from '../utils/leadStorage';
import {
  MESSAGE_TEMPLATES,
  replaceTemplateVariables,
  normalizeWhatsappNumber,
  openLeadWhatsapp,
} from '../data/messageTemplates';

interface Props {
  lead: LeadRecord;
  onClose: () => void;
}

function ni(v: string | undefined | null) {
  return v && v.trim() ? v.trim() : 'Não informado';
}

export default function WhatsAppModal({ lead, onClose }: Props) {
  const [selectedId,     setSelectedId]     = useState<string>('');
  const [editedMessage,  setEditedMessage]  = useState<string>('');
  const [copied,         setCopied]         = useState(false);

  const selected = MESSAGE_TEMPLATES.find(t => t.id === selectedId);
  const hasPhone = !!normalizeWhatsappNumber(lead.phone ?? '');
  const lastStep = getLastStepLabel(lead.lastStepNum, lead.sentToConsultor);
  const canAct   = editedMessage.trim().length > 0;

  // When template changes → fill textarea with replaced content
  useEffect(() => {
    if (!selected) return;
    setEditedMessage(replaceTemplateVariables(selected.body, lead));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  function handleCopy() {
    if (!canAct) return;
    navigator.clipboard.writeText(editedMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSend() {
    if (!hasPhone || !canAct) return;
    openLeadWhatsapp(lead.phone, editedMessage);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full sm:max-w-2xl max-h-[94vh] flex flex-col bg-surface-card border border-surface-border rounded-t-2xl sm:rounded-2xl shadow-2xl">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-surface-border flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <MessageCircle size={16} className="text-supertech-400" />
              <h2 className="text-white font-bold text-base">Enviar mensagem para o lead</h2>
            </div>
            <p className="text-slate-500 text-xs">Escolha uma mensagem pronta e envie pelo WhatsApp.</p>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex flex-col gap-5 p-5 overflow-y-auto flex-1">

          {/* Lead info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[
              { label: 'Nome',         value: ni(lead.name)                     },
              { label: 'Telefone',     value: ni(lead.phone)                    },
              { label: 'Cidade/UF',    value: lead.city && lead.uf ? `${lead.city}/${lead.uf}` : 'Não informado' },
              { label: 'Segmento',     value: ni(lead.segment)                  },
              { label: 'Investimento', value: ni(lead.investmentLabel)           },
              { label: 'Última etapa', value: lastStep                           },
            ].map(row => (
              <div key={row.label} className="bg-dark-900 rounded-lg p-2.5">
                <div className="text-[10px] text-slate-600 uppercase tracking-wider mb-0.5">{row.label}</div>
                <div className="text-xs text-slate-200 font-medium truncate">{row.value}</div>
              </div>
            ))}
          </div>

          {/* Template selector */}
          <div>
            <label className="label-upper mb-1.5 block">Modelo de mensagem</label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={e => setSelectedId(e.target.value)}
                className="w-full bg-dark-900 border border-surface-border text-slate-200 text-sm rounded-xl px-3 py-2.5 pr-8 appearance-none focus:outline-none focus:border-supertech-500"
              >
                <option value="">— Selecione um template —</option>
                {MESSAGE_TEMPLATES.map(t => (
                  <option key={t.id} value={t.id}>{t.category} · {t.name}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            </div>
            {selected && (
              <div className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
                <span className="px-2 py-0.5 rounded bg-surface-border text-slate-400">{selected.category}</span>
                <span>{selected.description}</span>
              </div>
            )}
          </div>

          {/* Editable message textarea */}
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <label className="label-upper">Mensagem para envio</label>
              <span className="text-[10px] text-slate-600">Você pode ajustar o texto antes de enviar.</span>
            </div>
            <textarea
              value={editedMessage}
              onChange={e => setEditedMessage(e.target.value)}
              rows={10}
              placeholder={selected ? '' : 'Selecione um template acima ou escreva uma mensagem personalizada...'}
              className="w-full bg-dark-900 border border-surface-border rounded-xl px-4 py-3 text-sm text-slate-200 leading-relaxed resize-none focus:outline-none focus:border-supertech-500 placeholder-slate-700 transition-colors font-mono"
              style={{ minHeight: '200px' }}
            />
            {!canAct && editedMessage !== '' && (
              <p className="text-xs text-slate-600 mt-1">Escreva ou selecione uma mensagem antes de enviar.</p>
            )}
          </div>

          {/* No phone warning */}
          {!hasPhone && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-xl px-3 py-2.5">
              <AlertCircle size={14} className="flex-shrink-0" />
              Telefone não informado para este lead. Não é possível abrir o WhatsApp.
            </div>
          )}
        </div>

        {/* Actions — fixed at bottom */}
        <div className="flex items-center gap-3 p-5 border-t border-surface-border flex-shrink-0">
          <button onClick={onClose} className="text-slate-500 text-sm hover:text-white transition-colors px-3 py-2">
            Cancelar
          </button>
          <div className="flex-1 flex gap-2 justify-end flex-wrap">
            <button
              onClick={handleCopy}
              disabled={!canAct}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-surface-border text-slate-300 text-sm hover:border-slate-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {copied ? <Check size={14} className="text-supertech-400" /> : <Copy size={14} />}
              {copied ? 'Copiado!' : 'Copiar mensagem'}
            </button>
            <button
              onClick={handleSend}
              disabled={!hasPhone || !canAct}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-supertech-500 text-dark-950 text-sm font-bold hover:bg-supertech-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageCircle size={14} />
              Enviar no WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
