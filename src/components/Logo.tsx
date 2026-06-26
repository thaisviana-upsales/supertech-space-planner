import { Zap } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

const sizeMap = {
  sm: { icon: 18, text: 'text-base', badge: 'text-[9px]', gap: 'gap-2' },
  md: { icon: 22, text: 'text-lg',   badge: 'text-[10px]', gap: 'gap-2.5' },
  lg: { icon: 28, text: 'text-2xl',  badge: 'text-xs',     gap: 'gap-3' },
};

export default function Logo({ size = 'md', showTagline = false }: LogoProps) {
  const s = sizeMap[size];

  return (
    <div className={`flex items-center ${s.gap}`}>
      {/* Icon mark */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 rounded-lg bg-supertech-500/20 blur-sm" />
        <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-supertech-500 to-supertech-400 flex items-center justify-center shadow-green-sm">
          <Zap size={s.icon} className="text-dark-950" fill="currentColor" strokeWidth={0} />
        </div>
      </div>

      {/* Wordmark */}
      <div className="flex flex-col leading-none">
        <div className={`flex items-baseline gap-1.5 ${s.gap}`}>
          <span className={`font-black ${s.text} text-white tracking-tight`}>
            SUPER<span className="text-supertech-400">TECH</span>
          </span>
          <span className={`${s.badge} font-bold text-supertech-400 bg-supertech-500/10 border border-supertech-500/20 px-1.5 py-0.5 rounded-md tracking-wide leading-none`}>
            ™
          </span>
        </div>
        {showTagline && (
          <span className="text-[10px] font-medium text-slate-500 tracking-widest uppercase mt-0.5">
            Space Planner
          </span>
        )}
      </div>
    </div>
  );
}
