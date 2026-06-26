import { useState, type ReactNode } from 'react';

// ── CheckMark SVG ─────────────────────────────────────────────────────────────
function CheckMark() {
  return (
    <svg width="9" height="7" viewBox="0 0 9 7" fill="none" aria-hidden>
      <path d="M1 3.5L3.3 6L8 1" stroke="#0c110c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── SelectableCard ─────────────────────────────────────────────────────────────
interface Props {
  title: string;
  desc?: string;
  icon?: ReactNode;           // optional icon shown in a pill above title
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export default function SelectableCard({ title, desc, icon, isSelected, onClick, className = '' }: Props) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative text-left w-full rounded-xl p-4 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8BC34A] cursor-pointer ${className}`}
      style={{
        background: isSelected
          ? 'rgba(139,195,74,0.08)'
          : hovered
            ? 'rgba(139,195,74,0.04)'
            : 'rgba(255,255,255,0.03)',
        border: `${isSelected ? '1.5px' : '1px'} solid ${
          isSelected
            ? '#8BC34A'
            : hovered
              ? 'rgba(139,195,74,0.38)'
              : 'rgba(255,255,255,0.08)'
        }`,
        boxShadow: isSelected
          ? '0 0 0 1px rgba(139,195,74,0.18), 0 0 22px rgba(139,195,74,0.12)'
          : hovered
            ? '0 0 0 1px rgba(139,195,74,0.08), 0 0 14px rgba(139,195,74,0.06)'
            : 'none',
        transform: isSelected ? 'scale(1.01)' : hovered ? 'scale(1.005)' : 'scale(1)',
      }}
    >
      {/* Check circle — always rendered, animated */}
      <div
        className="absolute top-3 right-3 flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          width: 20,
          height: 20,
          background: isSelected ? '#8BC34A' : 'rgba(255,255,255,0.07)',
          border: `1.5px solid ${isSelected ? '#8BC34A' : 'rgba(255,255,255,0.14)'}`,
          transform: isSelected ? 'scale(1)' : 'scale(0.75)',
          opacity: isSelected ? 1 : 0.4,
        }}
      >
        <CheckMark />
      </div>

      {/* Optional icon pill */}
      {icon && (
        <span
          className="flex items-center justify-center rounded-lg mb-2.5 transition-colors duration-150"
          style={{
            width: 28, height: 28,
            background: isSelected
              ? 'rgba(139,195,74,0.15)'
              : 'rgba(255,255,255,0.06)',
            color: isSelected ? '#8BC34A' : 'rgba(255,255,255,0.45)',
          }}
        >
          {icon}
        </span>
      )}

      {/* Title */}
      <p
        className="font-bold text-[13px] leading-snug mb-1.5 pr-7 transition-colors duration-150"
        style={{ color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.80)' }}
      >
        {title}
      </p>

      {/* Description */}
      {desc && (
        <p className="text-[12px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.38)' }}>
          {desc}
        </p>
      )}
    </button>
  );
}
