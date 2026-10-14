import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Box, FileUp, LayoutGrid, MoveUpRight, PackageCheck, Truck } from 'lucide-react';
import { apiRequest } from './api';
import MotionButton from './MotionButton';
import MotionInput from './MotionInput';
import { floatIn, spring } from './motion';
import { useAuth } from './useAuth';
import ProductImage from './ProductImage.jsx';
import Spinner from './Spinner';

const TABS = [
  { id: 'catalogue', label: 'Catalogue', icon: LayoutGrid },
  { id: 'import', label: 'Import from Web', icon: FileUp },
  { id: 'orders', label: 'Orders', icon: PackageCheck },
  { id: 'ads', label: 'Sponsor Ads', icon: MoveUpRight },
];

function OrderStatusBadge({ status }) {
  const colors = {
    Processing: 'border-amber-400/20 bg-amber-400/[0.06] text-amber-200',
    Dispatched: 'border-sky-400/20 bg-sky-400/[0.06] text-sky-200',
    Delivered: 'border-emerald-400/20 bg-emerald-400/[0.06] text-emerald-200',
  };
  return (
    <span className={`rounded-full border px-3 py-1 text-[11px] font-medium ${colors[status] || 'border-zinc-400/20 bg-zinc-400/[0.06] text-zinc-300'}`}>
      {status}
    </span>
  );
}

/* ─── Catalogue Tab ─── */
function CatalogueTab({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    apiRequest('/api/products')
      .then((result) => { if (active) setProducts(result); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const product = await apiRequest('/api/products', {
        method: 'POST', token,
        body: JSON.stringify({ name, description, imageUrl, category, videoUrl, price: Number(price), stock: Number(stock) }),
      });
      setProducts((cur) => [...cur, product]);
      setName(''); setDescription(''); setImageUrl(''); setCategory(''); setVideoUrl(''); setPrice(''); setStock('');
      setNotice('Product added.');
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  async function handleDelete(product) {
    if (!window.confirm(`Remove "${product.name}"?`)) return;
    setError(''); setNotice('');
    try {
      await apiRequest(`/api/products/${product.id}`, { method: 'DELETE', token });
      setProducts((cur) => cur.filter((p) => p.id !== product.id));
      setNotice(`${product.name} removed.`);
    } catch (err) { setError(err.message); }
  }

  const productCount = products.length;

  return (
    <div className="grid gap-7 lg:grid-cols-[22rem_1fr]">
      <motion.section className="glass-panel h-fit rounded-2xl p-6" initial="hidden" animate="show" variants={floatIn}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><Box size={17} /> Add product</h2>
        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm text-zinc-300">
            Name <MotionInput value={name} onChange={(e) => setName(e.target.value)} required maxLength={120} />
          </label>
          <label className="block space-y-2 text-sm text-zinc-300">
            Description <MotionInput multiline className="min-h-24 resize-y" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={2000} />
          </label>
          <label className="block space-y-2 text-sm text-zinc-300">
            Image URL <MotionInput type="url" placeholder="/products/name.jpg or https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} maxLength={2048} />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2 text-sm text-zinc-300">
              Category <MotionInput value={category} onChange={(e) => setCategory(e.target.value)} maxLength={80} />
            </label>
            <label className="block space-y-2 text-sm text-zinc-300">
              Video URL <MotionInput value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} maxLength={2048} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block space-y-2 text-sm text-zinc-300">
              Price (USD) <MotionInput type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </label>
            <label className="block space-y-2 text-sm text-zinc-300">
              Stock <MotionInput type="number" min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} required />
            </label>
          </div>
          <MotionButton className="glass-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60" type="submit" disabled={submitting}>
            {submitting ? 'Adding…' : 'Add product'}
          </MotionButton>
        </form>
      </motion.section>

      <section>
        <h2 className="text-lg font-semibold text-white">Products <span className="ml-2 text-sm font-normal text-zinc-500">{productCount}</span></h2>
        {loading && <Spinner label="Loading products…" />}
        {error && <div className="rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200">{error}</div>}
        {notice && <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-200">{notice}</div>}
        {!loading && !error && productCount === 0 && <p className="mt-5 text-sm text-zinc-500">No products yet.</p>}
        <div className="mt-4 space-y-3">
          {products.map((p) => (
            <motion.article key={p.id} className="glass-card flex items-center justify-between gap-4 rounded-2xl p-4 sm:p-5" initial="hidden" animate="show" variants={floatIn} whileHover={{ x: 3, borderColor: 'rgba(221, 214, 254, 0.34)' }} transition={spring}>
              <div className="flex min-w-0 items-center gap-4">
                <ProductImage product={p} className="h-14 w-14 shrink-0 rounded-xl object-cover" sizes="56px" />
                <div className="min-w-0">
                  <h3 className="truncate font-medium text-white">{p.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">${p.price.toFixed(2)} <span className="mx-1">·</span> {p.stock} in stock{p.category ? <span className="mx-1">·</span> : ''}{p.category}</p>
                </div>
              </div>
              <MotionButton className="shrink-0 rounded-lg border border-red-300/20 bg-red-400/[0.06] px-3 py-2 text-xs font-medium text-red-100" onClick={() => handleDelete(p)}>Delete</MotionButton>
            </motion.article>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Import Tab ─── */
function ImportTab({ token }) {
  const [url, setUrl] = useState('');
  const [scraped, setScraped] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleImport(e) {
    e.preventDefault();
    setError('');
    setScraped(null);
    setLoading(true);
    try {
      const data = await apiRequest('/api/products/import-url', { method: 'POST', token, body: JSON.stringify({ url }) });
      setScraped(data.scraped);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <motion.section className="glass-panel rounded-2xl p-6 sm:p-8" initial="hidden" animate="show" variants={floatIn}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><FileUp size={17} /> Import from web</h2>
        <p className="mt-2 text-sm text-zinc-400">Paste a product URL to auto-fill details from OpenGraph metadata.</p>
        <form className="mt-5 space-y-4" onSubmit={handleImport}>
          <label className="block space-y-2 text-sm text-zinc-300">
            Product URL
            <MotionInput type="url" placeholder="https://example.com/shop/product" value={url} onChange={(e) => setUrl(e.target.value)} required />
          </label>
          <MotionButton className="glass-button rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60" type="submit" disabled={loading || !url.trim()}>
            {loading ? 'Scraping…' : 'Fetch product details'}
          </MotionButton>
        </form>
        {error && <div className="mt-5 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200">{error}</div>}
        {scraped && (
          <motion.div className="mt-6 space-y-3 border-t border-white/10 pt-5" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
            <h3 className="text-sm font-semibold text-violet-200">Scraped data</h3>
            <div className="glass-input rounded-xl p-4 text-sm">
              <p><span className="text-zinc-400">Title:</span> {scraped.title || '—'}</p>
              <p className="mt-2"><span className="text-zinc-400">Description:</span> {scraped.description ? scraped.description.slice(0, 200) : '—'}</p>
              {scraped.imageUrl && <ProductImage product={{ imageUrl: scraped.imageUrl, name: scraped.title }} className="mt-2 h-20 w-20 rounded-lg object-cover" />}
              {scraped.suggestedPrice > 0 && <p className="mt-2"><span className="text-zinc-400">Suggested price:</span> <span className="text-white">${scraped.suggestedPrice.toFixed(2)}</span></p>}
            </div>
            <p className="text-xs text-zinc-500">Use this data to fill in the Catalogue form and create the product.</p>
          </motion.div>
        )}
      </motion.section>
    </div>
  );
}

/* ─── Orders Tab ─── */
function OrdersTab({ token }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    apiRequest('/api/orders', { token })
      .then((data) => { if (active) setOrders(data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token]);

  async function updateStatus(orderId, status) {
    setError(''); setNotice('');
    try {
      await apiRequest(`/api/orders/${orderId}/delivery-status`, { method: 'PATCH', token, body: JSON.stringify({ deliveryStatus: status }) });
      setOrders((cur) => cur.map((o) => o.id === orderId ? { ...o, deliveryStatus: status } : o));
      setNotice(`Order status updated to ${status}.`);
    } catch (err) { setError(err.message); }
  }

  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><PackageCheck size={17} /> Order fulfillment</h2>
      {loading && <Spinner label="Loading orders…" />}
      {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200">{error}</div>}
      {notice && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-200">{notice}</div>}
      {!loading && orders.length === 0 && <p className="mt-5 text-sm text-zinc-500">No orders yet.</p>}
      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <motion.div key={order.id} className="glass-card rounded-2xl p-5" initial="hidden" animate="show" variants={floatIn}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-xs text-zinc-500">Order {order.id.slice(-8).toUpperCase()}</span>
                <p className="mt-1 text-sm text-zinc-300">{order.items.length} item(s) — ${order.total.toFixed(2)}</p>
                {order.shippingAddress?.city && (
                  <p className="mt-1 text-xs text-zinc-400">Ship to: {order.shippingAddress.street}, {order.shippingAddress.city} {order.shippingAddress.postalCode}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <OrderStatusBadge status={order.deliveryStatus || 'Processing'} />
                <div className="flex gap-1.5">
                  {['Processing', 'Dispatched', 'Delivered'].map((s) => (
                    <MotionButton key={s} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-medium ${order.deliveryStatus === s ? 'border-violet-400/30 bg-violet-400/[0.12] text-violet-200' : 'border-white/10 text-zinc-400 hover:bg-white/[0.04]'}`} onClick={() => updateStatus(order.id, s)}>
                      {s}
                    </MotionButton>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ─── Sponsor Ads Tab ─── */
function SponsorAdsTab({ token }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [placement, setPlacement] = useState('hero_banner');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiRequest('/api/ads')
      .then((data) => setAds(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function createAd(e) {
    e.preventDefault();
    setError(''); setNotice(''); setSubmitting(true);
    try {
      const ad = await apiRequest('/api/ads', { method: 'POST', token, body: JSON.stringify({ title, mediaUrl, targetUrl, sponsorName, placement }) });
      setAds((cur) => [...cur, ad]);
      setTitle(''); setMediaUrl(''); setTargetUrl(''); setSponsorName('');
      setNotice('Ad created.');
    } catch (err) { setError(err.message); }
    finally { setSubmitting(false); }
  }

  async function deleteAd(ad) {
    if (!window.confirm(`Remove "${ad.title}"?`)) return;
    try {
      await apiRequest(`/api/ads/${ad.id}`, { method: 'DELETE', token });
      setAds((cur) => cur.filter((a) => a.id !== ad.id));
    } catch (err) { setError(err.message); }
  }

  return (
    <div className="grid gap-7 lg:grid-cols-[22rem_1fr]">
      <motion.section className="glass-panel h-fit rounded-2xl p-6" initial="hidden" animate="show" variants={floatIn}>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white"><MoveUpRight size={17} /> Create ad</h2>
        <form className="mt-5 space-y-4" onSubmit={createAd}>
          <label className="block space-y-2 text-sm text-zinc-300">Title <MotionInput value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={120} /></label>
          <label className="block space-y-2 text-sm text-zinc-300">Media URL <MotionInput type="url" value={mediaUrl} onChange={(e) => setMediaUrl(e.target.value)} required maxLength={2048} /></label>
          <label className="block space-y-2 text-sm text-zinc-300">Target URL <MotionInput type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} maxLength={2048} /></label>
          <label className="block space-y-2 text-sm text-zinc-300">Sponsor name <MotionInput value={sponsorName} onChange={(e) => setSponsorName(e.target.value)} required maxLength={80} /></label>
          <label className="block space-y-2 text-sm text-zinc-300">
            Placement
            <select className="glass-input w-full rounded-xl px-4 py-3 text-sm text-white" value={placement} onChange={(e) => setPlacement(e.target.value)}>
              <option value="hero_banner">Hero Banner</option>
              <option value="feed_interstitial">Feed Interstitial</option>
              <option value="side_card">Side Card</option>
            </select>
          </label>
          <MotionButton className="glass-button w-full rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60" type="submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create ad'}
          </MotionButton>
        </form>
      </motion.section>

      <section>
        <h2 className="text-lg font-semibold text-white">Ads <span className="ml-2 text-sm font-normal text-zinc-500">{ads.length}</span></h2>
        {loading && <Spinner label="Loading ads…" />}
        {error && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/[0.06] p-4 text-sm text-red-200">{error}</div>}
        {notice && <div className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] p-4 text-sm text-emerald-200">{notice}</div>}
        {!loading && ads.length === 0 && <p className="mt-5 text-sm text-zinc-500">No sponsor ads yet.</p>}
        <div className="mt-4 space-y-3">
          {ads.map((ad) => (
            <motion.div key={ad.id} className="glass-card flex items-center justify-between gap-4 rounded-2xl p-4" initial="hidden" animate="show" variants={floatIn}>
              <div className="min-w-0">
                <h3 className="truncate font-medium text-white">{ad.title}</h3>
                <p className="mt-1 text-sm text-zinc-500">{ad.sponsorName} · {ad.placement} · {ad.clicks} click(s)</p>
              </div>
              <MotionButton className="shrink-0 rounded-lg border border-red-300/20 bg-red-400/[0.06] px-3 py-2 text-xs font-medium text-red-100" onClick={() => deleteAd(ad)}>Delete</MotionButton>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Merchant Studio ─── */
export default function Admin() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('catalogue');

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-12 sm:px-8 sm:py-16">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-violet-300">Store management</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">Merchant Studio</h1>

      {/* Tabs */}
      <div className="glass-pill mt-7 inline-flex flex-wrap gap-1 rounded-2xl p-1.5 sm:gap-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-violet-500/20 text-violet-200 shadow-[0_0_16px_rgba(139,92,246,0.12)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon size={15} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <motion.div
        key={activeTab}
        className="mt-8"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        {activeTab === 'catalogue' && <CatalogueTab token={token} />}
        {activeTab === 'import' && <ImportTab token={token} />}
        {activeTab === 'orders' && <OrdersTab token={token} />}
        {activeTab === 'ads' && <SponsorAdsTab token={token} />}
      </motion.div>
    </main>
  );
}