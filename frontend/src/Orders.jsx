import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Package, Truck } from 'lucide-react';
import AnimatedLink from './AnimatedLink';
import { apiRequest } from './api';
import { floatIn, spring } from './motion';
import { useAuth } from './useAuth';
import Spinner from './Spinner';

function DeliveryStatusBadge({ status }) {
  const colors = {
    Processing: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200',
    Dispatched: 'border-sky-400/20 bg-sky-400/[0.06] text-sky-200',
    Delivered: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium ${colors[status] || 'text-zinc-400'}`}>
      <Package size={11} /> {status}
    </span>
  );
}

export default function Orders() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/api/orders', { token })
      .then((result) => { if (active) setOrders(result); })
      .catch((requestError) => { if (active) setError(requestError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Your account</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Order history</h1>
      {loading && <Spinner label="Loading your orders…" />}
      {error && <p className="mt-7 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200" role="alert">{error}</p>}
      {!loading && !error && orders.length === 0 && (
        <motion.div className="glass-panel mt-7 rounded-2xl p-8 text-center" initial="hidden" animate="show" variants={floatIn}>
          <p className="text-zinc-400">Your order history is empty for now.</p>
          <AnimatedLink className="mt-4 inline-block text-sm text-violet-200 hover:text-white" to="/">Explore the collection</AnimatedLink>
        </motion.div>
      )}
      <div className="mt-7 space-y-4">
        {orders.map((order) => (
          <motion.article key={order.id} className="glass-card rounded-2xl p-5 sm:p-6" initial="hidden" animate="show" variants={floatIn} whileHover={{ y: -3, borderColor: 'rgba(221, 214, 254, 0.3)' }} transition={spring}>
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-sm font-medium text-white">Order {order.id.slice(-8).toUpperCase()}</p>
                <p className="mt-1 text-xs text-zinc-500">{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
              <div className="flex items-center gap-2">
                <DeliveryStatusBadge status={order.deliveryStatus || 'Processing'} />
                <span className={`rounded-full px-3 py-1 text-xs capitalize ${order.paymentStatus === 'paid' ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-200'}`}>{order.paymentStatus}</span>
              </div>
            </div>
            <ul className="mt-4 space-y-3">
              {order.items.map((item, index) => (
                <li key={`${order.id}-${index}`} className="flex justify-between gap-4 text-sm">
                  <span className="text-zinc-400">{item.name} × {item.quantity}</span>
                  <span className="text-zinc-300">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            {order.shippingAddress?.city && (
              <div className="mt-3 flex items-center gap-2 text-xs text-zinc-500 border-t border-white/[0.06] pt-3">
                <MapPin size={12} />
                Ship to: {order.shippingAddress.street}, {order.shippingAddress.city} {order.shippingAddress.postalCode}
              </div>
            )}
            <p className="mt-3 flex justify-between border-t border-white/[0.08] pt-3 text-sm font-semibold text-white"><span>Total</span><span>${order.total.toFixed(2)}</span></p>
          </motion.article>
        ))}
      </div>
    </main>
  );
}