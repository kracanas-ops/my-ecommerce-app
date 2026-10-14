import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import AnimatedLink from './AnimatedLink';
import MotionButton from './MotionButton';
import ProductImage from './ProductImage.jsx';
import { floatIn, spring } from './motion';
import { useCart } from './useCart';

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, cartTotal } = useCart();

  if (cartItems.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-20 text-center">
        <motion.div initial="hidden" animate="show" variants={floatIn}>
          <motion.span className="glass-pill mx-auto flex h-16 w-16 items-center justify-center rounded-2xl text-2xl text-violet-200" animate={{ rotate: [0, 4, -4, 0], y: [0, -5, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>✦</motion.span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-white">Your cart is taking a little break.</h1>
          <p className="mt-3 text-zinc-400">Find something you love in our collection.</p>
          <AnimatedLink to="/" className="glass-button mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold">Explore the collection <ArrowRight size={15} /></AnimatedLink>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Your picks</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Shopping cart</h1>
      <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_22rem]">
        <section className="space-y-3" aria-label="Cart items">
          {cartItems.map((item) => (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ x: 4, borderColor: 'rgba(221, 214, 254, 0.36)' }}
              transition={spring}
              className="glass-card flex items-center gap-4 rounded-2xl p-4 sm:p-5"
            >
              <ProductImage product={item} className="h-16 w-16 shrink-0 rounded-xl object-cover" sizes="64px" />
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-medium text-white">{item.name}</h2>
                <p className="mt-1 text-sm text-zinc-500">Qty {item.quantity} <span className="mx-1">·</span> ${item.price.toFixed(2)} each</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                <div className="mt-2 flex items-center justify-end gap-2 rounded-full border border-white/10 bg-white/[0.02] px-2 py-1">
                  <button type="button" className="h-6 w-6 rounded-full text-sm text-zinc-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => updateQuantity(item.id, -1)} disabled={item.quantity <= 1} aria-label={`Decrease quantity for ${item.name}`}>
                    −
                  </button>
                  <span className="min-w-5 text-center text-sm text-zinc-200">{item.quantity}</span>
                  <button type="button" className="h-6 w-6 rounded-full text-sm text-zinc-200 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40" onClick={() => updateQuantity(item.id, 1)} disabled={item.quantity >= 99} aria-label={`Increase quantity for ${item.name}`}>
                    +
                  </button>
                </div>
                <MotionButton className="mt-2 rounded px-1 py-1 text-xs text-zinc-400 hover:text-red-200" onClick={() => removeFromCart(item.id)} aria-label={`Remove ${item.name} from cart`}>
                  Remove
                </MotionButton>
              </div>
            </motion.article>
          ))}
          <AnimatedLink to="/" className="inline-block pt-2 text-sm text-zinc-400 transition hover:text-white">← Continue shopping</AnimatedLink>
        </section>

        <motion.aside className="glass-panel h-fit rounded-2xl p-6" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ ...spring, delay: 0.12 }}>
          <h2 className="text-lg font-semibold text-white">Order summary</h2>
          <div className="mt-5 flex justify-between text-sm text-zinc-400">
            <span>Subtotal</span><span>${cartTotal.toFixed(2)}</span>
          </div>
          <div className="mt-3 flex justify-between text-sm text-zinc-400">
            <span>Shipping</span><span className="text-emerald-300">Calculated at checkout</span>
          </div>
          <div className="mt-5 border-t border-white/[0.08] pt-5">
            <div className="flex justify-between font-semibold text-white"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
            <p className="mt-2 text-xs text-zinc-500">Final amount is securely recalculated at checkout.</p>
          </div>
          <AnimatedLink to="/checkout" className="glass-button mt-6 flex w-full justify-center rounded-xl px-4 py-3 text-sm font-semibold transition">
            Continue to secure checkout
          </AnimatedLink>
        </motion.aside>
      </div>
    </main>
  );
}
