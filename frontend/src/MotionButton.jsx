import { motion } from 'framer-motion';
import { spring } from './motion';

export default function MotionButton({ children, className = '', disabled = false, ...props }) {
  return (
    <motion.button
      className={`transform-gpu transition-colors ${className}`}
      whileHover={disabled ? undefined : { scale: 1.035, y: -1, filter: 'brightness(1.12)' }}
      whileTap={disabled ? undefined : { scale: 0.96, y: 1 }}
      transition={spring}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}
