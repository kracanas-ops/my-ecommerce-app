export const spring = { type: 'spring', stiffness: 380, damping: 28, mass: 0.7 };

export const pageTransition = {
  initial: { opacity: 0, y: 14, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -10, filter: 'blur(6px)' }
};

export const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.085,
      delayChildren: 0.08
    }
  }
};

export const floatIn = {
  hidden: { opacity: 0, y: 22, scale: 0.975, filter: 'blur(8px)' },
  show: { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)', transition: spring }
};
