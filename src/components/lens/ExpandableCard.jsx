import { memo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

function ChevronIcon({ open }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExpandableCardComponent({
  children,
  contentClassName = '',
  id,
  isOpen,
  summary,
  title,
  onToggle,
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      layout
      className="glass-panel interactive-glow overflow-hidden rounded-[1.6rem] px-4 py-3 sm:px-5"
      whileHover={reduceMotion ? undefined : { y: -2 }}
      transition={{ type: 'spring', stiffness: 260, damping: 26 }}
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[0.68rem] uppercase tracking-[0.28em] text-cyan-100/72">
            {title}
          </p>
          <p className="mt-2 text-sm text-slate-300">{summary}</p>
        </div>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={id}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/12 bg-white/10 text-slate-100 transition duration-200 hover:bg-white/16 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/60"
        >
          <ChevronIcon open={isOpen} />
          <span className="sr-only">{isOpen ? `Collapse ${title}` : `Expand ${title}`}</span>
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen ? (
          <motion.div
            id={id}
            key="content"
            initial={reduceMotion ? false : { height: 0, opacity: 0, y: 14 }}
            animate={reduceMotion ? {} : { height: 'auto', opacity: 1, y: 0 }}
            exit={reduceMotion ? {} : { height: 0, opacity: 0, y: 10 }}
            transition={{
              type: 'spring',
              stiffness: 240,
              damping: 28,
              opacity: { duration: 0.2 },
            }}
            className="overflow-hidden"
          >
            <div className={`pt-4 ${contentClassName}`}>{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.section>
  );
}

const ExpandableCard = memo(ExpandableCardComponent);

export default ExpandableCard;
