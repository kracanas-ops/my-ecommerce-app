require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Order = require('./models/Order');
const { getStripe } = require('./services/stripe');
const { markOrderPaid } = require('./services/orderLifecycle');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const paymentRoutes = require('./routes/payments');
const orderRoutes = require('./routes/orders');
const aiRoutes = require('./routes/aiRoutes');
const adRoutes = require('./routes/ads');

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim());

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    const error = new Error('This origin is not allowed by the CORS policy.');
    error.status = 403;
    callback(error);
  }
}));

app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhook is not configured.' });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      webhookSecret
    );
  } catch (error) {
    return res.status(400).json({ error: `Invalid Stripe webhook: ${error.message}` });
  }

  if (event.type === 'payment_intent.succeeded') {
    const intent = event.data.object;
    if (!intent.metadata.orderId || !intent.metadata.userId) {
      return res.json({ received: true });
    }
    const order = await Order.findOne({
      _id: intent.metadata.orderId,
      paymentIntentId: intent.id,
      user: intent.metadata.userId
    });
    if (order && intent.amount_received === order.totalAmountCents) {
      try {
        await markOrderPaid(order);
      } catch (error) {
        console.error('Could not finalize paid order from Stripe webhook:', error);
      }
    }
  }

  res.json({ received: true });
});

app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ads', adRoutes);
app.get('/', (req, res) => res.send('Ecommerce API is running successfully!'));

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  console.error(error);
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;
  res.status(status).json({
    error: status === 500 ? 'An unexpected server error occurred.' : error.message
  });
});

async function startServer() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const Product = require('./models/Product');
  if (await Product.countDocuments() === 0) {
    await Product.insertMany([
      { name: 'Wireless Headphones', imageUrl: '/products/wireless-headphones.jpg', price: 99.99, stock: 15, description: 'Immersive sound for work and play.' },
      { name: 'Mechanical Keyboard', imageUrl: '/products/mechanical-keyboard.jpg', price: 120, stock: 8, description: 'A satisfying, precise typing experience.' },
      { name: 'USB-C Monitor', imageUrl: '/products/usb-c-monitor.jpg', price: 300, stock: 4, description: 'A crisp, expansive display for your setup.' }
    ]);
  }

  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port}`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Could not start the server:', error);
    process.exit(1);
  });
}

module.exports = app;
