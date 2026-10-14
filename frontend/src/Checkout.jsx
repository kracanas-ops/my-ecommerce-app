import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { LockKeyhole, MapPin } from 'lucide-react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from './api';
import AnimatedLink from './AnimatedLink';
import MotionButton from './MotionButton';
import { floatIn, spring } from './motion';
import { useAuth } from './useAuth';
import { useCart } from './useCart';
import Spinner from './Spinner';
import 'leaflet/dist/leaflet.css';

const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = publishableKey ? loadStripe(publishableKey) : null;

function DraggableMarker({ position, setPosition }) {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return position ? <Marker draggable position={position} /> : null;
}

function AddressSection({ shipping, setShipping }) {
  const [mapReady, setMapReady] = useState(false);
  useEffect(() => { setMapReady(true); }, []);

  const defaultPos = shipping.lat && shipping.lng
    ? [shipping.lat, shipping.lng]
    : [40.7128, -74.006]; // default: NYC

  const [position, setPosition] = useState(defaultPos);

  useEffect(() => {
    setShipping((prev) => ({ ...prev, lat: position[0], lng: position[1] }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]);

  return (
    <motion.div className="glass-panel rounded-2xl p-6 sm:p-8" initial="hidden" animate="show" variants={floatIn}>
      <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.18em] text-violet-300">
        <MapPin size={13} /> Delivery address
      </p>
      <h2 className="mt-2 text-lg font-semibold text-white">Where should we ship your order?</h2>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block space-y-1.5 text-sm text-zinc-300 sm:col-span-2">
          Street address
          <input
            className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500"
            type="text"
            placeholder="123 Main St, Apt 4B"
            value={shipping.street}
            onChange={(e) => setShipping((prev) => ({ ...prev, street: e.target.value }))}
          />
        </label>
        <label className="block space-y-1.5 text-sm text-zinc-300">
          City
          <input
            className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500"
            type="text"
            placeholder="New York"
            value={shipping.city}
            onChange={(e) => setShipping((prev) => ({ ...prev, city: e.target.value }))}
          />
        </label>
        <label className="block space-y-1.5 text-sm text-zinc-300">
          Postal code
          <input
            className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-zinc-500"
            type="text"
            placeholder="10001"
            value={shipping.postalCode}
            onChange={(e) => setShipping((prev) => ({ ...prev, postalCode: e.target.value }))}
          />
        </label>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-white/10" style={{ height: '240px' }}>
        {mapReady && (
          <MapContainer
            center={position}
            zoom={12}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker position={position} setPosition={setPosition} />
          </MapContainer>
        )}
      </div>
      <p className="mt-2 text-xs text-zinc-500">Click or drag the pin to set your precise delivery location.</p>
    </motion.div>
  );
}

function PaymentForm({ shipping }) {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    setError('');
    try {
      const result = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: `${window.location.origin}/order-confirmation` },
        redirect: 'if_required',
      });
      if (result.error) {
        setError(result.error.message || 'Your payment could not be confirmed.');
        return;
      }
      if (result.paymentIntent?.status === 'succeeded') {
        navigate(`/order-confirmation?payment_intent=${encodeURIComponent(result.paymentIntent.id)}`);
        return;
      }
      setError('Your payment is still processing. Check your orders in a moment.');
    } catch (requestError) {
      setError(requestError.message || 'Your payment could not be confirmed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.form onSubmit={handleSubmit} initial="hidden" animate="show" variants={floatIn}>
      <PaymentElement />
      {error && <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
      <MotionButton
        className="glass-button mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={!stripe || submitting}
      >
        {submitting ? 'Processing payment…' : 'Pay securely'}
      </MotionButton>
      <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-400"><LockKeyhole size={12} /> Encrypted and processed by Stripe.</p>
    </motion.form>
  );
}

export default function Checkout() {
  const { cartItems, cartTotal } = useCart();
  const { token } = useAuth();
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(Boolean(stripePromise));
  const started = useRef(false);
  const [shipping, setShipping] = useState({ street: '', city: '', postalCode: '', lat: null, lng: null });

  useEffect(() => {
    if (!cartItems.length) return;
    if (!stripePromise) return;
    if (started.current) return;
    started.current = true;

    apiRequest('/api/create-payment-intent', {
      method: 'POST',
      token,
      body: JSON.stringify({
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
        shippingAddress: shipping.street ? shipping : undefined,
      }),
    })
      .then((result) => setClientSecret(result.clientSecret))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setLoading(false));
  // Only run on mount to create the intent once
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, token]);

  if (!cartItems.length) {
    return (
      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-5 py-20 text-center">
        <div><h1 className="text-2xl font-semibold text-white">Your cart is empty.</h1><AnimatedLink className="mt-4 inline-block text-violet-200" to="/">Back to the collection</AnimatedLink></div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <AnimatedLink to="/cart" className="text-sm text-zinc-400 transition hover:text-white">← Back to cart</AnimatedLink>
      <div className="mx-auto mt-7 grid max-w-5xl gap-7 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-7">
          {/* Address + Map */}
          <AddressSection shipping={shipping} setShipping={setShipping} />

          {/* Payment */}
          <motion.section className="glass-panel rounded-2xl p-6 sm:p-8" initial="hidden" animate="show" variants={floatIn}>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Secure checkout</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Payment details</h1>
            {loading && <Spinner label="Preparing secure payment…" />}
            {!stripePromise && <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200" role="alert">Checkout is not configured. Add VITE_STRIPE_PUBLISHABLE_KEY to the frontend environment.</p>}
            {error && <p className="mt-6 rounded-xl border border-red-400/20 bg-red-400/[0.06] px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
            {clientSecret && stripePromise && (
              <div className="mt-7">
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'night', variables: { colorPrimary: '#8b5cf6', colorBackground: '#09090b', colorText: '#f4f4f5', colorDanger: '#f87171', borderRadius: '12px' } } }}>
                  <PaymentForm shipping={shipping} />
                </Elements>
              </div>
            )}
          </motion.section>
        </div>

        <motion.aside className="glass-panel h-fit rounded-2xl p-6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ ...spring, delay: 0.1 }}>
          <h2 className="font-semibold text-white">Order summary</h2>
          <ul className="mt-5 space-y-4">
            {cartItems.map((item) => (
              <li key={item.id} className="flex justify-between gap-3 text-sm">
                <span className="text-zinc-400">{item.name} <span className="text-zinc-600">× {item.quantity}</span></span>
                <span className="shrink-0 text-white">${(item.price * item.quantity).toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-white/[0.08] pt-5 font-semibold text-white"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
          <p className="mt-2 text-xs text-zinc-500">The server verifies current product prices before charging.</p>
        </motion.aside>
      </div>
    </main>
  );
}