import { useLocation } from 'react-router-dom';
import { VISIBLE_STEPS } from '../constants';
import { clsx } from 'clsx';

export default function Stepper() {
  const location = useLocation();

  // Resolve current step from URL — /project is also step 5 (equipment review)
  const pathname = location.pathname;
  const resolved = pathname === '/project' ? '/catalog' : pathname;
  const activeIdx  = VISIBLE_STEPS.findIndex(s => s.path === resolved);
  const currentStep = activeIdx >= 0 ? activeIdx + 1 : 1;

  return (
    <>
      {/* ── Desktop: inline stepper (shown inside header bar) ── */}
      <nav className="hidden sm:flex items-center gap-1" aria-label="Etapas do projeto">
        {VISIBLE_STEPS.map((step, idx) => {
          const num      = idx + 1;
          const isActive = num === currentStep;
          const isDone   = num < currentStep;
          const isLast   = idx === VISIBLE_STEPS.length - 1;

          return (
            <div key={step.id} className="flex items-center gap-1">
              {/* Node */}
              <div className="flex items-center gap-1.5">
                <div
                  className={clsx(
                    'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-all duration-200',
                    isActive && 'bg-[#8BC34A] text-black',
                    isDone   && 'bg-[#8BC34A]/30 text-[#8BC34A]',
                    !isActive && !isDone && 'bg-white/[0.07] text-white/30 border border-white/[0.08]',
                  )}
                >
                  {num}
                </div>
                <span
                  className={clsx(
                    'text-[11px] font-medium whitespace-nowrap transition-colors duration-200',
                    isActive && 'text-white',
                    isDone   && 'text-white/50',
                    !isActive && !isDone && 'text-white/25',
                  )}
                >
                  {step.shortLabel}
                </span>
              </div>

              {/* Connector arrow */}
              {!isLast && (
                <span className="text-white/15 text-[11px] mx-0.5 select-none">→</span>
              )}
            </div>
          );
        })}
      </nav>

      {/* ── Mobile: compact label only ── */}
      <div className="sm:hidden flex items-center gap-2">
        <div className="w-5 h-5 rounded-full bg-[#8BC34A] flex items-center justify-center text-[10px] font-bold text-black">
          {currentStep}
        </div>
        <span className="text-[11px] font-medium text-white/70">
          {VISIBLE_STEPS[currentStep - 1]?.shortLabel}
        </span>
        <span className="text-[10px] text-white/30">
          {currentStep}/{VISIBLE_STEPS.length}
        </span>
      </div>
    </>
  );
}
