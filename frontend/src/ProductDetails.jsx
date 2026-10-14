import { useRef, useState } from 'react';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { apiRequest } from './api';
import AnimatedLink from './AnimatedLink';
import MotionButton from './MotionButton';
import ProductImage from './ProductImage.jsx';
import { floatIn, spring } from './motion';
import { useCart } from './useCart';
import Spinner from './Spinner';

export default function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const [request, setRequest] = useState({ productId: null, product: null, loading: true, error: '' });
  const videoRef = useRef(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoMuted, setVideoMuted] = useState(true);

  useEffect(() => {
    let active = true;
    apiRequest(`/api/products/${id}`)
      .then((result) => {
        if (active) setRequest({ productId: id, product: result, loading: false, error: '' });
      })
      .catch((requestError) => {
        if (active) setRequest({ productId: id, product: null, loading: false, error: requestError.message });
      });
    return () => { active = false; };
  }, [id]);

  const loading = request.productId !== id || request.loading;
  const product = request.productId === id ? request.product : null;
  const error = request.productId === id ? request.error : '';

  if (loading) {
    return <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-20"><Spinner fullPage label="Loading product…" /></main>;
  }
  if (error || !product) {
    return (
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-20 text-center">
        <p className="text-red-200" role="alert">{error || 'Product not found.'}</p>
        <AnimatedLink className="mt-5 inline-block text-violet-200 hover:text-white" to="/">Back to the collection</AnimatedLink>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <AnimatedLink to="/" className="text-sm text-zinc-400 transition hover:text-white">← Back to the collection</AnimatedLink>
      <motion.div
        className="glass-panel mt-7 grid overflow-hidden rounded-3xl md:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={floatIn}
        whileHover={{ borderColor: 'rgba(221, 214, 254, 0.3)', boxShadow: '0 30px 90px rgba(99, 75, 185, 0.18)' }}
        transition={spring}
      >
        <div className="relative min-h-72 md:min-h-[30rem]">
          {/* Main product image */}
          <div className="group/image absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-br from-zinc-800/60 via-zinc-900/45 to-violet-950/40">
            <ProductImage product={product} priority className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover/image:scale-105" sizes="(min-width: 768px) 50vw, 100vw" />
            <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-white/10" aria-hidden="true" />
            <motion.div className="pointer-events-none absolute h-52 w-52 rounded-full bg-violet-400/20 blur-3xl mix-blend-screen" animate={{ scale: [1, 1.25, 0.95, 1], x: [0, 15, -10, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
          </div>

          {/* Video overlay */}
          {product.videoUrl && (
            <div className="absolute inset-0 z-10">
              <video
                ref={videoRef}
                src={product.videoUrl}
                autoPlay
                loop
                muted={videoMuted}
                playsInline
                className="h-full w-full object-cover"
                onEnded={() => setVideoPlaying(false)}
              />
              <div className="absolute bottom-4 right-4 flex gap-2">
                <button
                  className="glass-pill flex h-8 w-8 items-center justify-center rounded-full p-0 text-white"
                  onClick={() => {
                    if (!videoRef.current) return;
                    if (videoPlaying) { videoRef.current.pause(); setVideoPlaying(false); }
                    else { videoRef.current.play(); setVideoPlaying(true); }
                  }}
                  aria-label={videoPlaying ? 'Pause video' : 'Play video'}
                >
                  {videoPlaying ? <Pause size={12} /> : <Play size={12} />}
                </button>
                <button
                  className="glass-pill flex h-8 w-8 items-center justify-center rounded-full p-0 text-white"
                  onClick={() => setVideoMuted((prev) => !prev)}
                  aria-label={videoMuted ? 'Unmute video' : 'Mute video'}
                >
                  {videoMuted ? <VolumeX size={12} /> : <Volume2 size={12} />}
                </button>
              </div>
              <span className="glass-pill absolute bottom-4 left-4 rounded-full px-3 py-1 text-[10px] text-zinc-300 uppercase tracking-widest">
                Demo video
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center p-7 sm:p-10">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Forma essentials</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{product.name}</h1>
          <p className="mt-4 leading-7 text-zinc-400">{product.description || 'A considered essential for your everyday setup.'}</p>
          <p className="mt-5 text-sm text-zinc-500">{product.stock > 0 ? `${product.stock} available` : 'Currently sold out'}</p>
          <div className="mt-8 flex items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
            <span className="text-2xl font-semibold text-white">${product.price.toFixed(2)}</span>
            <MotionButton
              className="glass-button rounded-xl px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => addToCart(product)}
              disabled={product.stock < 1}
            >
              {product.stock > 0 ? 'Add to cart' : 'Sold out'}
            </MotionButton>
          </div>
        </div>
      </motion.div>
    </main>
  );
}