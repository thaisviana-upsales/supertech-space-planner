import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface StepHeaderProps {
  stepNumber?: number;
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
}

export default function StepHeader({ stepNumber, title, subtitle, icon, className }: StepHeaderProps) {
  return (
    <div className={clsx('mb-8 animate-slide-up', className)}>
      {stepNumber && (
        <div className="flex items-center gap-2 mb-3">
          <div className="label-upper">Etapa {stepNumber}</div>
          <div className="flex-1 h-px bg-gradient-to-r from-supertech-500/30 to-transparent" />
        </div>
      )}

      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-supertech-500/10 border border-supertech-500/20 flex items-center justify-center text-supertech-400">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">{title}</h1>
          {subtitle && (
            <p className="text-slate-400 mt-1.5 text-sm sm:text-base leading-relaxed">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
