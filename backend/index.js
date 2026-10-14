require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { createRateLimiter } = require('./middleware/rateLimit');
const { securityHeaders } = require('./middleware/securityHeaders');
const { validateEnv, assertValidEnv } = require('./config/validateEnv');
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

// ============================================================================
// SECURITY: Validate environment configuration before starting
// ============================================================================
assertValidEnv(process.env, console);

// ============================================================================
// SECURITY: Trust proxy for correct IP detection (important for rate limiting)
// ============================================================================
app.set('trust proxy', true);

// ============================================================================
// SECURITY: Request size limits to prevent DoS
// ============================================================================
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ============================================================================
// SECURITY: Cookie parser for CSRF protection
// ============================================================================
app.use(cookieParser());

// ============================================================================
// SECURITY: Helmet for various security headers
// ============================================================================
app.use(helmet());

// ============================================================================
// SECURITY: Custom security headers
// ============================================================================
app.use(securityHeaders);

// ============================================================================
// SECURITY: HTTP to HTTPS redirect in production
// ============================================================================
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers['x-forwarded-proto'];
    if (proto && proto !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
  }
  next();
});

// ============================================================================
// CORS Configuration
// ============================================================================
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean); // Remove empty strings

app.use(cors({
  origin(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) {
      callback(null, true);
      return;
    }
    // Allow all allowed origins
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    // Check if origin matches any allowed origin with wildcard
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed.endsWith('*')) {
        const base = allowed.slice(0, -1);
        return origin.startsWith(base);
      }
      return origin === allowed;
    });
    
    if (isAllowed) {
      callback(null, true);
      return;
    }
    
    const error = new Error('This origin is not allowed by the CORS policy.');
    error.status = 403;
    callback(error);
  },
  credentials: true // Allow credentials (cookies, auth headers)
}));

// ============================================================================
// SECURITY: Rate limiting - Applied to ALL routes
// ============================================================================
// Default rate limiter for most routes
const defaultRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: 'Too many requests, please try again later.'
});

// Stricter rate limiter for auth routes
const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 login attempts per 15 minutes per IP
  message: 'Too many login attempts. Please try again later.'
});

// Strictest rate limiter for sensitive routes (AI, webhooks)
const strictRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: 'Too many requests to this endpoint.'
});

// Apply default rate limiting to all routes
app.use(defaultRateLimiter);

// ============================================================================
// Stripe Webhook - with IP whitelisting and rate limiting
// ============================================================================
// Stripe webhook IPs (from https://stripe.com/docs/ips)
const STRIPE_WEBHOOK_IPS = new Set([
  '3.18.12.63', '3.130.192.231', '13.235.14.237', '13.235.122.149',
  '18.211.135.69', '35.154.171.200', '52.15.183.38', '54.88.130.119',
  '54.88.130.237', '54.187.174.169', '54.187.205.235', '54.241.33.10',
  '54.241.33.61', '204.236.229.240'
]);

// Webhook rate limiter
const webhookRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Allow burst for Stripe retries
  message: 'Too many webhook requests.'
});

app.post('/api/stripe/webhook', 
  webhookRateLimiter,
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    // SECURITY: Verify request is from Stripe IP
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    if (!STRIPE_WEBHOOK_IPS.has(clientIp)) {
      console.warn(`Stripe webhook request from unauthorized IP: ${clientIp}`);
      return res.status(403).json({ error: 'Request not from Stripe.' });
    }

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
      console.error('Invalid Stripe webhook signature:', error.message);
      return res.status(400).json({ error: 'Invalid Stripe webhook signature.' });
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
  }
);

// ============================================================================
// Apply stricter rate limiting to auth routes
// ============================================================================
app.use('/api/users/register', authRateLimiter);
app.use('/api/users/login', authRateLimiter);

// ============================================================================
// Apply strict rate limiting to AI endpoint
// ============================================================================
app.use('/api/ai', strictRateLimiter);

// ============================================================================
// API Routes
// ============================================================================
app.use(express.json());
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api', paymentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ads', adRoutes);

// Health check
app.get('/', (req, res) => res.send('Ecommerce API is running successfully!'));

// ============================================================================
// Error handling middleware
// ============================================================================
app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  
  // Log the full error for debugging
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    name: error.name,
    status: error.status,
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // SECURITY: Never expose internal error details in production
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 600
    ? error.status
    : 500;

  // Map known error types to safe messages
  const errorMessages = {
    'MongoServerError': 'A database error occurred.',
    'ValidationError': 'The data provided is invalid.',
    'JsonWebTokenError': 'Your session is invalid. Please sign in again.',
    'TokenExpiredError': 'Your session has expired. Please sign in again.',
    'CastError': 'The requested resource was not found.',
    'MongooseError': 'A database error occurred.',
    'ConfigurationError': 'The server is misconfigured.'
  };

  // In production, use generic message for internal errors
  const isProduction = process.env.NODE_ENV === 'production';
  const message = isProduction && status >= 500 
    ? 'An unexpected server error occurred.'
    : errorMessages[error.name] || error.message || 'An unexpected error occurred.';

  res.status(status).json({
    error: message
  });
});

// ============================================================================
// Start server
// ============================================================================
async function startServer() {
  // Validate environment again before connecting
  const { errors, warnings } = validateEnv(process.env);
  
  if (errors.length > 0) {
    console.error('Cannot start server - configuration errors:');
    errors.forEach(e => console.error('  -', e));
    process.exit(1);
  }
  
  warnings.forEach(w => console.warn('[config]', w));

  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const Product = require('./models/Product');
  if (await Product.countDocuments() === 0) {
    await Product.insertMany([
      { name: 'Wireless Headphones', imageUrl: '/products/wireless-headphones.jpg', price: 99.99, stock: 15, description: 'Immersive sound for work and play.' },
      { name: 'Mechanical Keyboard', imageUrl: '/products/mechanical-keyboard.jpg', price: 120, stock: 8, description: 'A satisfying, precise typing experience.' },
      { name: 'USB-C Monitor', imageUrl: '/products/usb-c-monitor.jpg', price: 300, stock: 4, description: 'A crisp, expansive display for your setup.' }
    ]);
    console.log('Inserted sample products');
  }

  const port = process.env.PORT || 5000;
  app.listen(port, '0.0.0.0', () => console.log(`Server running on port ${port} in ${process.env.NODE_ENV || 'development'} mode`));
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Could not start the server:', error);
    process.exit(1);
  });
}

module.exports = app;
