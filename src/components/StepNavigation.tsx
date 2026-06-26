import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';

interface StepNavigationProps {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  backLabel?: string;
  canGoNext?: boolean;
  canGoBack?: boolean;
  isLoading?: boolean;
  nextVariant?: 'primary' | 'secondary';
  hideBack?: boolean;
  className?: string;
}

export default function StepNavigation({
  onBack,
  onNext,
  nextLabel = 'Continuar',
  backLabel = 'Voltar',
  canGoNext = true,
  canGoBack = true,
  isLoading = false,
  nextVariant = 'primary',
  hideBack = false,
  className,
}: StepNavigationProps) {
  return (
    <div className={clsx('flex items-center justify-between gap-4 pt-6', className)}>
      {/* Back button */}
      {!hideBack ? (
        <button
          onClick={onBack}
          disabled={!canGoBack || isLoading}
          className="btn-secondary flex items-center gap-2"
        >
          <ArrowLeft size={16} />
          {backLabel}
        </button>
      ) : (
        <div /> /* spacer */
      )}

      {/* Next button */}
      <button
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className={clsx(
          'flex items-center gap-2 min-w-[160px] justify-center',
          nextVariant === 'primary' ? 'btn-primary' : 'btn-secondary'
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Aguarde...
          </>
        ) : (
          <>
            {nextLabel}
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </div>
  );
}
