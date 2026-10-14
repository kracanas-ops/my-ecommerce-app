import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Pause, Play } from 'lucide-react';
import { apiRequest } from './api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function SponsorSpotlight({ placement = 'feed_interstitial' }) {
  const [ads, setAds] = useState([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    apiRequest(`/api/ads?placement=${encodeURIComponent(placement)}`)
      .then((data) => setAds(data))
      .catch(() => {});
  }, [placement]);

  const advance = useCallback(() => {
    setActive((prev) => (prev + 1) % (ads.length || 1));
  }, [ads.length]);

  useEffect(() => {
    if (paused || ads.length < 2) return;
    intervalRef.current = setInterval(advance, placement === 'hero_banner' ? 6000 : 4500);
    return () => clearInterval(intervalRef.current);
  }, [paused, ads.length, advance, placement]);

  if (ads.length === 0) return null;

  const ad = ads[active];

  const handleClick = () => {
    fetch(`${API_BASE_URL}/api/ads/${ad.id}/click`, { method: 'POST' }).catch(() => {});
    if (ad.targetUrl) window.open(ad.targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <section
      className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl px-5 sm:px-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <motion.article
        className="glass-panel group relative flex cursor-pointer items-end overflow-hidden rounded-3xl"
        style={{ minHeight: placement === 'hero_banner' ? 'clamp(180px, 26vw, 320px)' : 'clamp(120px, 18vw, 220px)' }}
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        onClick={handleClick}
        whileHover={{ scale: 1.008, y: -2 }}
        whileTap={{ scale: 0.99 }}
      >
        {/* Background gradient */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900/30 via-cyan-900/20 to-fuchsia-900/30" />
          <motion.div
            className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet-500/20 blur-[80px]"
            animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        {/* Media — image or video */}
        {ad.mediaUrl && (
          <img
            src={ad.mediaUrl}
            alt={ad.title}
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-40 transition duration-700 group-hover:scale-105 group-hover:opacity-60"
          />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Content */}
        <div className="relative z-10 flex w-full items-end justify-between gap-4 p-6 sm:p-8">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-violet-200">Sponsored</p>
            <h3 className="mt-1 text-lg font-semibold text-white sm:text-xl">{ad.title}</h3>
            <p className="mt-0.5 text-sm text-zinc-300">{ad.sponsorName}</p>
          </div>
          <div className="flex items-center gap-3">
            {ad.targetUrl && (
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs text-white">
                Learn more <ExternalLink size={12} />
              </span>
            )}
            {ads.length > 1 && (
              <button
                className="glass-pill flex h-8 w-8 items-center justify-center rounded-full p-0 text-zinc-300 hover:text-white"
                onClick={(e) => { e.stopPropagation(); setPaused((p) => !p); }}
                aria-label={paused ? 'Resume auto-play' : 'Pause auto-play'}
              >
                {paused ? <Play size={12} /> : <Pause size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Dot indicators */}
        {ads.length > 1 && (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {ads.map((_, idx) => (
              <span
                key={idx}
                className={`block h-1.5 rounded-full transition-all ${idx === active ? 'w-6 bg-violet-300' : 'w-1.5 bg-white/30'}`}
              />
            ))}
          </div>
        )}
      </motion.article>
    </section>
  );
}