import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { spring } from './motion';

const MotionLink = motion.create(Link);

export default function AnimatedLink({ children, className = '', ...props }) {
  return (
    <MotionLink
      className={className}
      whileHover={{ y: -2, scale: 1.025, filter: 'brightness(1.1)' }}
      whileTap={{ y: 1, scale: 0.97 }}
      transition={spring}
      {...props}
    >
      {children}
    </MotionLink>
  );
}
