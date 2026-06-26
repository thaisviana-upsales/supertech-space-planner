import { useLocation, useNavigate } from 'react-router-dom';
import { Headphones, Shield } from 'lucide-react';
import { VISIBLE_STEPS } from '../constants';
import Stepper from './Stepper';

// Hidden admin: 5× rapid click on logo
let clickCount = 0;
let clickTimer: ReturnType<typeof setTimeout>;

// ── Logo component ─────────────────────────────────────────────────────────────
// Uses the official white Supertech logo from public/brand/.
// Falls back to text if the image fails to load.
function SupertechLogo({ onClick, className = '' }: { onClick?: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2.5 flex-shrink-0 select-none focus:outline-none ${className}`}
      aria-label="Supertech Space Planner — página inicial"
    >
      {/* Official white logo */}
      <img
        src="/brand/logo-supertech-branca.png"
        alt="Supertech 360°"
        height={28}
        style={{
          height: '28px',
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
        }}
        onError={(e) => {
          // Graceful fallback: hide the broken image, show text sibling
          (e.target as HTMLImageElement).style.display = 'none';
          const sib = (e.target as HTMLImageElement).nextElementSibling as HTMLElement | null;
          if (sib) sib.style.display = 'block';
        }}
      />
      {/* Fallback text (hidden unless image fails) */}
      <span
        className="text-[13px] font-black text-white tracking-tight hidden"
        aria-hidden="true"
      >
        Supertech <span className="text-[#8BC34A]">360°</span>
      </span>

      {/* Separator */}
      <div className="w-px h-4 bg-white/10 mx-0.5 flex-shrink-0" />

      {/* Tool name */}
      <span
        className="text-[11px] font-semibold text-white/38 tracking-widest uppercase flex-shrink-0"
        style={{ letterSpacing: '0.12em' }}
      >
        Space Planner™
      </span>
    </button>
  );
}

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();

  const isFlowPage = VISIBLE_STEPS.some(s => s.path === location.pathname);
  const isAdmin    = location.pathname === '/admin';

  function handleLogoClick() {
    clickCount++;
    clearTimeout(clickTimer);
    if (clickCount >= 5) { clickCount = 0; navigate('/admin'); }
    else { clickTimer = setTimeout(() => { clickCount = 0; }, 800); }
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-white/[0.06]"
      style={{ background: 'rgba(10,15,10,0.92)', backdropFilter: 'blur(16px)' }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 h-12 flex items-center gap-4">

        {/* ── Logo (left) ─────────────────────────────────────────────── */}
        <SupertechLogo onClick={handleLogoClick} />

        {/* ── Stepper (center, only on flow pages) ────────────────────── */}
        {isFlowPage && !isAdmin && (
          <div className="flex-1 flex justify-center">
            <Stepper />
          </div>
        )}

        {/* ── Right spacer when not on flow ───────────────────────────── */}
        {!isFlowPage && <div className="flex-1" />}

        {/* ── Right controls ──────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {isAdmin && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20">
              <Shield size={11} className="text-amber-400" />
              <span className="text-[10px] font-semibold text-amber-400">Admin</span>
            </div>
          )}
          <button className="flex items-center gap-1.5 text-[12px] font-medium text-white/50 hover:text-white/80 transition-colors duration-150">
            <Headphones size={13} className="text-white/40" />
            Consultor
          </button>
        </div>
      </div>
    </header>
  );
}
