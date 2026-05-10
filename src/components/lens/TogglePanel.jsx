import { memo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import GlassButton from './GlassButton';

function MenuIcon({ open }) {
  return (
    <span className="relative block h-4 w-4">
      <span
        className={`absolute left-0 top-0 block h-[2px] w-4 rounded-full bg-current transition-transform duration-300 ${
          open ? 'translate-y-[7px] rotate-45' : ''
        }`}
      />
      <span
        className={`absolute left-0 top-[7px] block h-[2px] w-4 rounded-full bg-current transition-opacity duration-300 ${
          open ? 'opacity-0' : 'opacity-100'
        }`}
      />
      <span
        className={`absolute left-0 top-[14px] block h-[2px] w-4 rounded-full bg-current transition-transform duration-300 ${
          open ? '-translate-y-[7px] -rotate-45' : ''
        }`}
      />
    </span>
  );
}

const containerVariants = {
  hidden: {
    opacity: 0,
    y: -12,
    scale: 0.98,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 280,
      damping: 24,
      staggerChildren: 0.08,
      delayChildren: 0.03,
    },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.98,
    transition: {
      duration: 0.18,
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: (direction) => ({
    opacity: 0,
    x: direction === 'left' ? -22 : 22,
    y: 8,
  }),
  visible: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 340,
      damping: 24,
    },
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction === 'left' ? -18 : 18,
    y: 4,
    transition: {
      duration: 0.16,
    },
  }),
};

function TogglePanelComponent({ actions, isOpen, onToggle }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 sm:right-5 sm:top-5 lg:right-8 lg:top-7">
      <div className="flex flex-col items-end gap-3">
        <GlassButton
          active={isOpen}
          onClick={onToggle}
          ariaExpanded={isOpen}
          ariaControls="top-action-panel"
          ariaLabel={isOpen ? 'Hide quick actions' : 'Show quick actions'}
          className="pointer-events-auto h-12 min-w-12 rounded-full px-3 shadow-[0_16px_44px_rgba(8,47,73,0.45)]"
          variant="accent"
          icon={<MenuIcon open={isOpen} />}
        >
          <span className="sr-only">{isOpen ? 'Close actions' : 'Open actions'}</span>
        </GlassButton>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              id="top-action-panel"
              initial={reduceMotion ? false : 'hidden'}
              animate={reduceMotion ? false : 'visible'}
              exit={reduceMotion ? undefined : 'exit'}
              variants={reduceMotion ? undefined : containerVariants}
              className="pointer-events-auto"
            >
              <div className="glass-panel w-[min(84vw,22rem)] p-3 sm:w-auto">
                <motion.div
                  className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:justify-end"
                  variants={reduceMotion ? undefined : containerVariants}
                >
                  {actions.map((action) => (
                    <motion.div
                      key={action.key}
                      custom={action.direction}
                      variants={reduceMotion ? undefined : itemVariants}
                      className="w-full lg:w-auto"
                    >
                      <GlassButton
                        onClick={action.onClick}
                        active={action.active}
                        disabled={action.disabled}
                        ariaLabel={action.ariaLabel}
                        variant={action.variant}
                        className="w-full justify-start whitespace-nowrap px-4 lg:min-w-[10rem] lg:justify-center"
                        icon={action.icon}
                      >
                        {action.label}
                      </GlassButton>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

const TogglePanel = memo(TogglePanelComponent);

export default TogglePanel;
