import { memo } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

const VARIANT_CLASSES = {
  neutral:
    'border-white/12 bg-white/8 text-slate-100 hover:bg-white/14 focus-visible:border-cyan-300/40',
  accent:
    'border-cyan-300/30 bg-cyan-300/18 text-cyan-50 hover:bg-cyan-300/24 focus-visible:border-cyan-200/60',
  success:
    'border-emerald-300/30 bg-emerald-300/18 text-emerald-50 hover:bg-emerald-300/22 focus-visible:border-emerald-200/60',
  warning:
    'border-amber-300/30 bg-amber-300/18 text-amber-50 hover:bg-amber-300/22 focus-visible:border-amber-200/60',
};

function GlassButtonComponent({
  active = false,
  ariaControls,
  ariaExpanded,
  ariaLabel,
  children,
  className = '',
  disabled = false,
  icon,
  onClick,
  type = 'button',
  variant = 'neutral',
}) {
  const reduceMotion = useReducedMotion();
  const resolvedVariant = active
    ? variant === 'neutral'
      ? 'accent'
      : variant
    : 'neutral';

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-controls={ariaControls}
      aria-expanded={ariaExpanded}
      aria-label={ariaLabel}
      whileHover={reduceMotion || disabled ? undefined : { y: -2, scale: 1.01 }}
      whileTap={reduceMotion || disabled ? undefined : { scale: 0.985 }}
      className={[
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-[1.15rem] border px-4 py-2.5 text-sm font-medium',
        'shadow-[0_14px_34px_rgba(2,6,23,0.28)] backdrop-blur-xl transition-colors duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950',
        'disabled:cursor-not-allowed disabled:opacity-45',
        VARIANT_CLASSES[resolvedVariant],
        className,
      ].join(' ')}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span className="truncate">{children}</span>
    </motion.button>
  );
}

const GlassButton = memo(GlassButtonComponent);

export default GlassButton;
