/**
 * AdminInstallCard.tsx
 * ──────────────────────────────────────────────────────────────────────────────
 * Card discreto de instalação PWA — aparece SOMENTE no painel administrativo.
 *
 * Exibe:
 *  • Botão "Instalar painel" quando beforeinstallprompt está disponível
 *  • Instrução iOS discreta quando em Safari/iPhone
 *  • Nada se o app já estiver instalado ou não houver suporte
 * ──────────────────────────────────────────────────────────────────────────────
 */

import { Download, Smartphone } from 'lucide-react';
import { useAdminInstall } from '../hooks/useAdminInstall';

export default function AdminInstallCard() {
  const { canInstall, isIOS, isInstalled, install } = useAdminInstall();

  // Show nothing if already installed
  if (isInstalled) return null;

  // Show nothing if no install support and not iOS
  if (!canInstall && !isIOS) return null;

  return (
    <div
      className="flex items-start gap-3 rounded-xl border px-4 py-3 mb-4"
      style={{
        background: 'rgba(139,195,74,0.05)',
        borderColor: 'rgba(139,195,74,0.18)',
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-lg shrink-0 mt-0.5"
        style={{ width: 32, height: 32, background: 'rgba(139,195,74,0.12)' }}
      >
        <Smartphone size={15} style={{ color: '#8BC34A' }} />
      </div>

      {/* Text + action */}
      <div className="flex-1 min-w-0">
        <p className="text-[11px] font-bold text-white/60 uppercase tracking-[0.1em] mb-0.5">
          App do gestor
        </p>
        <p className="text-[12px] text-white/38 leading-snug mb-2.5">
          Instale o painel no celular ou desktop para acompanhar os leads com mais agilidade.
        </p>

        {/* Standard PWA install button */}
        {canInstall && (
          <button
            id="admin-install-btn"
            onClick={install}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[12px] text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: '#8BC34A', boxShadow: '0 0 14px rgba(139,195,74,0.25)' }}
          >
            <Download size={12} strokeWidth={2.5} />
            Instalar painel
          </button>
        )}

        {/* iOS Safari instruction — no beforeinstallprompt support */}
        {isIOS && !canInstall && (
          <p className="text-[11px] text-white/35 leading-relaxed">
            Para instalar no iPhone:{' '}
            <span className="text-white/55 font-semibold">
              toque em Compartilhar
            </span>{' '}
            e depois em{' '}
            <span className="text-white/55 font-semibold">
              Adicionar à Tela de Início.
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
