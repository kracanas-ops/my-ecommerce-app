import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { ArrowDown, ArrowRight, MoveUpRight, Sparkles } from 'lucide-react';
import heroArtwork from './assets/hero.png';
import AnimatedLink from './AnimatedLink';
import { spring } from './motion';

export default function Hero() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start']
  });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [0, 310]), { stiffness: 90, damping: 24 });
  const scale = useSpring(useTransform(scrollYProgress, [0, 1], [1, 0.62]), { stiffness: 90, damping: 24 });
  const rotateX = useTransform(scrollYProgress, [0, 1], [0, -34]);
  const rotateY = useTransform(scrollYProgress, [0, 1], [-8, 16]);
  const rotateZ = useTransform(scrollYProgress, [0, 1], [0, 9]);
  const opacity = useTransform(scrollYProgress, [0, 0.8, 1], [1, 0.86, 0.45]);

  return (
    <section ref={heroRef} className="relative isolate min-h-[780px] overflow-hidden border-b border-white/[0.08] sm:min-h-[900px]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute left-1/2 top-[33%] h-[25rem] w-[25rem] -translate-x-1/2 rounded-full bg-violet-600/20 blur-[120px] sm:h-[38rem] sm:w-[38rem]"
          animate={{ scale: [0.9, 1.12, 0.95], opacity: [0.48, 0.8, 0.55] }}
          transition={{ duration: 13, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute -right-24 top-32 h-72 w-72 rounded-full bg-cyan-400/[0.07] blur-[100px]" />
        <div className="absolute -left-32 bottom-12 h-80 w-80 rounded-full bg-fuchsia-500/[0.08] blur-[110px]" />
        <div className="hero-grain absolute inset-0 opacity-[0.17]" />
      </div>

      <div className="mx-auto grid min-h-[780px] max-w-[1440px] items-center gap-2 px-5 pb-16 pt-20 sm:min-h-[900px] sm:px-8 sm:pb-20 sm:pt-24 lg:grid-cols-[0.9fr_1.1fr] lg:gap-0">
        <motion.div
          className="relative z-10 mx-auto max-w-2xl text-center lg:mx-0 lg:text-left"
          initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ ...spring, delay: 0.18 }}
        >
          <motion.p
            className="glass-pill mb-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-100 sm:text-xs"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...spring, delay: 0.3 }}
          >
            <Sparkles size={13} strokeWidth={1.7} />
            Form, function, feeling
          </motion.p>
          <h1 className="text-[clamp(3.5rem,9vw,7.6rem)] font-medium leading-[0.86] tracking-[-0.085em] text-white">
            <span className="block">Make room</span>
            <span className="block bg-gradient-to-r from-white via-violet-100 to-white/45 bg-clip-text pb-2 text-transparent">for better.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-zinc-300 sm:text-base lg:mx-0">
            Everyday essentials, elevated by thoughtful design. A little more considered. A lot more you.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <AnimatedLink to="#collection" className="glass-button group inline-flex items-center gap-3 rounded-full px-5 py-3 text-sm font-semibold transition">
              Explore the collection
              <ArrowRight className="transition-transform duration-300 group-hover:translate-x-1" size={16} />
            </AnimatedLink>
            <span className="inline-flex items-center gap-2 px-3 py-3 text-xs text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" />
              Objects for everyday
            </span>
          </div>
        </motion.div>

        <div className="relative mx-auto flex h-[360px] w-full max-w-[620px] items-center justify-center [perspective:1200px] sm:h-[490px] lg:h-[640px]">
          <motion.div
            className="pointer-events-none absolute h-[68%] w-[68%] rounded-full bg-violet-500/20 blur-[90px]"
            style={{ opacity }}
            animate={{ scale: [0.86, 1.08, 0.9] }}
            transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="hero-product-scene relative flex h-full w-full items-center justify-center"
            style={{ y, scale, rotateX, rotateY, rotateZ, opacity, transformStyle: 'preserve-3d' }}
          >
            <motion.div
              className="glass-panel absolute h-[73%] w-[76%] rounded-[34px] sm:rounded-[46px]"
              style={{ transform: 'rotateX(62deg) rotateZ(-34deg) translateZ(-75px)' }}
              animate={{ rotateZ: [-34, -31, -34], y: [0, -8, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="glass-pill absolute h-[61%] w-[65%] rounded-[30px] sm:rounded-[40px]"
              style={{ transform: 'rotateX(62deg) rotateZ(-34deg) translateZ(-22px)' }}
              animate={{ rotateZ: [-32, -35, -32], y: [0, 8, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.img
              src={heroArtwork}
              alt="Layered, polished glass tile sculpture representing the Forma collection"
              className="relative z-10 w-[74%] select-none drop-shadow-[0_45px_70px_rgba(124,58,237,0.32)]"
              draggable="false"
              style={{ transform: 'translateZ(100px)' }}
              animate={{ y: [0, -13, 0], rotateZ: [0, 1.5, 0] }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="glass-pill absolute bottom-[12%] right-[5%] z-20 hidden items-center gap-3 rounded-2xl px-4 py-3 sm:flex"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...spring, delay: 0.85 }}
              style={{ transform: 'translateZ(150px)' }}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-violet-100"><MoveUpRight size={17} /></span>
              <span><span className="block text-[10px] uppercase tracking-widest text-zinc-400">The collection</span><span className="mt-0.5 block text-sm font-medium text-white">Designed to feel different</span></span>
            </motion.div>
          </motion.div>
          <motion.div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-zinc-400" animate={{ y: [0, 5, 0], opacity: [0.55, 1, 0.55] }} transition={{ duration: 2.4, repeat: Infinity }}>
            <ArrowDown size={13} /> Scroll to explore
          </motion.div>
        </div>
      </div>
    </section>
  );
}
