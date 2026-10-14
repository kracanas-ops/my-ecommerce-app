import { motion } from 'framer-motion';
import { spring } from './motion';

export default function MotionInput({ className = '', multiline = false, ...props }) {
  const Input = multiline ? motion.textarea : motion.input;
  return (
    <Input
      className={`glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none ${className}`}
      whileFocus={{ scale: 1.012 }}
      transition={spring}
      {...props}
    />
  );
}
