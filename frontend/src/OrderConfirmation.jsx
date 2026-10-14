import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { apiRequest } from './api';
import AnimatedLink from './AnimatedLink';
import { useAuth } from './useAuth';
import { useCart } from './useCart';
import { floatIn, spring } from './motion';
import Spinner from './Spinner';

export default function OrderConfirmation() {
  const [searchParams] = useSearchParams();
  const paymentIntentId = searchParams.get('payment_intent');
  const { token } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(paymentIntentId));
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    if (!paymentIntentId) return;

    apiRequest('/api/orders/confirm', {
      method: 'POST',
      token,
      body: JSON.stringify({ paymentIntentId })
    })
      .then((confirmedOrder) => {
        setOrder(confirmedOrder);
        clearCart();
      })
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  }, [clearCart, paymentIntentId, token]);
  const displayedError = error || (!paymentIntentId ? 'We could not find a completed payment for this page.' : '');

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-16">
      <motion.section className="glass-panel w-full max-w-xl rounded-3xl p-7 text-center sm:p-10" initial="hidden" animate="show" variants={floatIn} whileHover={{ y: -2 }} transition={spring}>
        {loading && <Spinner label="Verifying your payment..." />}
        {!loading && displayedError && (
          <>
            <h1 className="text-2xl font-semibold text-white">We could not confirm this order.</h1>
            <p className="mt-3 text-sm text-red-200" role="alert">{displayedError}</p>
            <AnimatedLink className="mt-6 inline-block text-violet-200 hover:text-white" to="/orders">View your orders</AnimatedLink>
          </>
        )}
        {!loading && order && (
          <>
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-400/10 text-2xl text-emerald-300">✓</span>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white">You’re all set.</h1>
            <p className="mt-2 text-zinc-400">Your payment is confirmed. Thanks for choosing Forma.</p>
            <p className="mt-5 text-sm text-zinc-500">Order <span className="font-mono text-zinc-300">{order.id.slice(-8).toUpperCase()}</span></p>
            <ul className="mt-6 space-y-3 border-y border-white/[0.08] py-5 text-left">
              {order.items.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between gap-4 text-sm"><span className="text-zinc-400">{item.name} × {item.quantity}</span><span className="text-white">${(item.unitPrice * item.quantity).toFixed(2)}</span></li>)}
            </ul>
            <p className="mt-5 flex justify-between font-semibold text-white"><span>Total paid</span><span>${order.total.toFixed(2)}</span></p>
            <AnimatedLink className="glass-button mt-7 inline-flex rounded-xl px-5 py-3 text-sm font-semibold" to="/orders">View order history</AnimatedLink>
          </>
        )}
      </motion.section>
    </main>
  );
}
