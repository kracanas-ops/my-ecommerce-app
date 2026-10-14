import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion, useMotionValue, useSpring } from 'framer-motion';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { CircleUserRound, Plus, Search, ShoppingBag, Sparkles } from 'lucide-react';
import { CartProvider } from './CartProvider';
import { useCart } from './useCart';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './useAuth';
import { apiRequest } from './api';
import MotionButton from './MotionButton';
import ProductImage from './ProductImage.jsx';
import { floatIn, pageTransition, spring, staggerContainer } from './motion';
import Auth from './Auth';
import Admin from './Admin';
import Cart from './Cart';
import Checkout from './Checkout';
import Hero from './Hero';
import OrderConfirmation from './OrderConfirmation';
import Orders from './Orders';
import ProductDetails from './ProductDetails';
import ProtectedRoute from './ProtectedRoute';
import Spinner from './Spinner';
import AIChatBubble from './AIChatBubble';
import SponsorSpotlight from './SponsorSpotlight';

const MotionLink = motion.create(Link);

function MagneticLink({ to, children, className = '' }) {
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const x = useSpring(rawX, { stiffness: 250, damping: 18, mass: 0.35 });
  const y = useSpring(rawY, { stiffness: 250, damping: 18, mass: 0.35 });

  function handlePointerMove(event) {
    const bounds = event.currentTarget.getBoundingClientRect();
    rawX.set((event.clientX - bounds.left - bounds.width / 2) * 0.16);
    rawY.set((event.clientY - bounds.top - bounds.height / 2) * 0.18);
  }

  function handlePointerLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <MotionLink
      to={to}
      className={className}
      style={{ x, y }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      whileTap={{ scale: 0.94 }}
      transition={spring}
    >
      {children}
    </MotionLink>
  );
}

function Navbar() {
  const { totalItems } = useCart();
  const { token, user, logout } = useAuth();

  return (
    <motion.header
      className="sticky top-0 z-30 px-3 pt-3 sm:px-6 sm:pt-5"
      initial={{ opacity: 0, y: -36, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...spring, delay: 0.1 }}
    >
      <nav className="glass-pill mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-4 gap-y-3 rounded-[2rem] px-4 py-3 sm:flex sm:justify-between sm:gap-6 sm:rounded-full sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight text-white">
          <motion.span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg shadow-glass-inset" whileHover={{ rotate: 45, scale: 1.08 }} transition={spring}><Sparkles size={16} /></motion.span>
          Forma<span className="text-violet-300">.store</span>
        </Link>
        <div className="hidden items-center justify-center gap-7 text-xs text-zinc-300 sm:flex sm:text-sm">
          <MagneticLink className="transition-colors hover:text-white" to="/">Discover</MagneticLink>
          {token && <MagneticLink className="transition-colors hover:text-white" to="/orders">Orders</MagneticLink>}
          {(user?.role === 'admin' || user?.isAdmin) && <MagneticLink className="transition-colors hover:text-white" to="/admin">Admin</MagneticLink>}
        </div>
        <div className="flex items-center justify-end gap-3">
          {token ? (
            <>
              <span className="hidden items-center gap-2 text-sm text-zinc-300 md:inline-flex"><CircleUserRound size={15} />{user.name}</span>
              <MotionButton onClick={logout} className="rounded-full px-2 py-2 text-xs text-zinc-300 hover:text-white sm:text-sm">
                Sign out
              </MotionButton>
            </>
          ) : (
            <MotionLink to="/login" className="text-sm text-zinc-300 transition hover:text-white" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={spring}>Sign in</MotionLink>
          )}
          <MotionLink
            to="/cart"
            className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white"
            whileHover={{ scale: 1.045, y: -1 }}
            whileTap={{ scale: 0.96 }}
            transition={spring}
          >
            <ShoppingBag size={15} strokeWidth={1.8} /> <span>Bag</span><motion.span key={totalItems} initial={{ scale: 0.6, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={spring} className="flex h-5 min-w-5 items-center justify-center rounded-full bg-violet-300 px-1 text-xs text-zinc-950">{totalItems}</motion.span>
          </MotionLink>
        </div>
      </nav>
    </motion.header>
  );
}

function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const { addToCart } = useCart();

  useEffect(() => {
    let active = true;
    apiRequest('/api/products')
      .then((result) => {
        if (active) setProducts(result);
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.description}`.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Hero />
      <SponsorSpotlight />

      <main id="collection" className="mx-auto w-full max-w-7xl flex-1 scroll-mt-28 px-5 py-16 sm:px-8 sm:py-24">
        <motion.div className="mb-8 flex flex-col justify-between gap-5 sm:mb-12 sm:flex-row sm:items-end" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={spring}>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-violet-200 sm:text-xs">Objects with intention</p>
            <h2 className="mt-3 text-3xl font-medium tracking-[-0.06em] text-white sm:text-5xl">The everyday, <span className="text-zinc-500">reimagined.</span></h2>
          </div>
          <label className="glass-pill inline-flex w-fit items-center gap-3 rounded-full px-4 py-2.5">
            <Search size={15} className="text-zinc-400" />
            <input className="glass-search w-40 text-xs text-white placeholder:text-zinc-400 sm:w-48" type="search" placeholder="Find your next favorite" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search products" />
            {!loading && <span className="border-l border-white/15 pl-3 text-[10px] text-zinc-400">{visibleProducts.length}</span>}
          </label>
        </motion.div>

        {loading ? <Spinner label="Finding the good stuff..." /> : null}
        {error && (
          <div className="rounded-2xl border border-red-400/20 bg-red-400/[0.06] p-5 text-sm text-red-200" role="alert">
            {error}
          </div>
        )}
        {!loading && !error && visibleProducts.length === 0 && (
          <p className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-8 text-center text-zinc-400">
            {products.length ? 'No products match your search.' : 'The collection is being refreshed. Please check back soon.'}
          </p>
        )}
        <motion.div className="grid auto-rows-[minmax(280px,auto)] gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5" variants={staggerContainer} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.12 }}>
          {visibleProducts.map((product, index) => (
            <motion.article
              key={product.id}
              variants={floatIn}
              whileHover={{ y: -7, scale: 1.018, rotateX: 2, rotateY: index % 2 ? -2 : 2, borderColor: 'rgba(221, 214, 254, 0.42)', boxShadow: '0 28px 75px rgba(98, 74, 185, 0.22)', filter: 'brightness(1.07)' }}
              whileTap={{ scale: 0.99 }}
              transition={spring}
              className={`glass-card group overflow-hidden rounded-2xl ${index === 0 ? 'lg:row-span-2' : ''}`}
              style={{ transformStyle: 'preserve-3d' }}
            >
              <Link to={`/product/${product.id}`} className={`relative flex h-56 items-center justify-center overflow-hidden bg-gradient-to-br from-white/[0.12] via-zinc-900/55 to-violet-950/45 ${index === 0 ? 'lg:h-[calc(100%-5.5rem)]' : ''}`}>
                <ProductImage
                  product={product}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  sizes={index === 0 ? '(min-width: 1024px) 60vw, 100vw' : '(min-width: 1024px) 33vw, 100vw'}
                  priority={index === 0}
                />
                <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10" aria-hidden="true" />
                <motion.div
                  className={`pointer-events-none absolute h-36 w-36 rounded-full blur-3xl ${index % 2 ? 'bg-fuchsia-300/20' : 'bg-violet-300/25'}`}
                  animate={{ scale: [1, 1.18, 0.96, 1], x: [0, 12, -8, 0], y: [0, -8, 10, 0] }}
                  transition={{ duration: 9 + index, repeat: Infinity, ease: 'easeInOut' }}
                />
                <span className="glass-pill absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs text-zinc-100">
                  {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
                </span>
              </Link>
              <div className="flex items-center justify-between gap-4 p-5">
                <Link to={`/product/${product.id}`} className="group/title min-w-0">
                  <h3 className="truncate font-medium text-white transition group-hover:text-violet-200">{product.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{product.description || 'A considered essential for your everyday setup.'}</p>
                </Link>
                <MotionButton
                  className="glass-button shrink-0 rounded-xl px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
                  onClick={() => addToCart(product)}
                  disabled={product.stock < 1}
                  aria-label={`Add ${product.name} to cart`}
                >
                  <span className="inline-flex items-center gap-1.5">${product.price.toFixed(2)} <Plus size={14} /></span>
                </MotionButton>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </main>
    </>
  );
}

function Storefront() {
  const location = useLocation();

  return (
    <div className="relative flex min-h-screen flex-col">
      <Navbar />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname}
          className="flex flex-1 flex-col"
          initial={pageTransition.initial}
          animate={pageTransition.animate}
          exit={pageTransition.exit}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Auth mode="login" />} />
              <Route path="/register" element={<Auth mode="register" />} />
              <Route path="/signin" element={<Navigate to="/login" replace />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
              <Route path="/order-confirmation" element={<ProtectedRoute><OrderConfirmation /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
              <Route path="*" element={<main className="mx-auto w-full max-w-7xl flex-1 px-5 py-24 text-center"><h1 className="text-3xl font-semibold text-white">Page not found</h1><Link className="mt-5 inline-block text-violet-300 hover:text-white" to="/">Back to the store</Link></main>} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <motion.footer className="mt-16 border-t border-white/[0.08] px-5 py-7 text-center text-xs text-zinc-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
        Forma.store <span className="mx-2">·</span> Made for the everyday
      </motion.footer>
      <AIChatBubble />
    </div>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <CartProvider>
          <BrowserRouter>
            <Storefront />
          </BrowserRouter>
        </CartProvider>
      </AuthProvider>
    </MotionConfig>
  );
}

export default App;
