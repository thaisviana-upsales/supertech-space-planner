import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface OptionCardProps {
  selected: boolean;
  onClick: () => void;
  icon?: ReactNode;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
  className?: string;
}

export default function OptionCard({
  selected,
  onClick,
  icon,
  label,
  description,
  badge,
  disabled = false,
  className,
}: OptionCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        'relative w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-200 group',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-supertech-500',
        selected
          ? 'bg-surface-elevated border-supertech-500 shadow-green-sm ring-1 ring-supertech-500/30'
          : 'bg-surface-card border-surface-border hover:border-supertech-700/60 hover:bg-surface-elevated',
        disabled && 'opacity-40 cursor-not-allowed',
        className,
      )}
    >
      {/* Selected indicator dot */}
      <div
        className={clsx(
          'absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center',
          selected
            ? 'border-supertech-500 bg-supertech-500'
            : 'border-surface-border bg-transparent group-hover:border-supertech-700',
        )}
      >
        {selected && (
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3L3 5L7 1" stroke="#0d1117" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <div className="flex items-start gap-3 pr-6">
        {icon && (
          <div className={clsx(
            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200',
            selected
              ? 'bg-supertech-500/20 text-supertech-400'
              : 'bg-surface-elevated text-slate-400 group-hover:text-supertech-500/70',
          )}>
            {icon}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={clsx(
              'font-semibold text-sm sm:text-base transition-colors duration-200',
              selected ? 'text-white' : 'text-slate-200 group-hover:text-white',
            )}>
              {label}
            </span>
            {badge && (
              <span className="badge-green text-[10px]">{badge}</span>
            )}
          </div>
          {description && (
            <p className={clsx(
              'text-xs sm:text-sm mt-1 leading-relaxed transition-colors duration-200',
              selected ? 'text-slate-300' : 'text-slate-500 group-hover:text-slate-400',
            )}>
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
