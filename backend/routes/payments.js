const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { getStripe } = require('../services/stripe');

const router = express.Router();

router.post('/create-payment-intent', requireAuth, async (req, res) => {
  const { items, shippingAddress } = req.body || {};
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) {
    return res.status(400).json({ error: 'Your cart must contain between 1 and 20 products.' });
  }

  const quantities = new Map();
  for (const item of items) {
    if (!item || typeof item.productId !== 'string' ||
        !mongoose.isValidObjectId(item.productId) ||
        !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) {
      return res.status(400).json({ error: 'Your cart contains an invalid product or quantity.' });
    }
    const productId = item.productId;
    quantities.set(productId, (quantities.get(productId) || 0) + item.quantity);
    if (quantities.get(productId) > 99) {
      return res.status(400).json({ error: 'A product quantity cannot exceed 99.' });
    }
  }

  const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
  if (products.length !== quantities.size) {
    return res.status(400).json({ error: 'One or more products are no longer available.' });
  }

  const orderItems = products.map((product) => {
    const quantity = quantities.get(product._id.toString());
    if (quantity > product.stock) {
      const error = new Error(`${product.name} does not have enough stock.`);
      error.status = 409;
      throw error;
    }
    const unitPriceCents = Math.round(product.price * 100);
    return {
      product: product._id,
      name: product.name,
      unitPriceCents,
      quantity
    };
  });
  const totalAmountCents = orderItems.reduce(
    (total, item) => total + item.unitPriceCents * item.quantity,
    0
  );
  if (!Number.isSafeInteger(totalAmountCents) || totalAmountCents < 1) {
    return res.status(400).json({ error: 'The cart total is invalid.' });
  }

  const stripe = getStripe();

  // Build optional shipping address
  const shipping = shippingAddress && typeof shippingAddress.street === 'string'
    ? {
        street: shippingAddress.street.trim(),
        city: shippingAddress.city?.trim() || '',
        postalCode: shippingAddress.postalCode?.trim() || '',
        lat: Number.isFinite(shippingAddress.lat) ? shippingAddress.lat : null,
        lng: Number.isFinite(shippingAddress.lng) ? shippingAddress.lng : null,
      }
    : null;

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    totalAmountCents,
    currency: 'usd',
    ...(shipping ? { shippingAddress: shipping } : {}),
  });

  let intent;
  try {
    intent = await stripe.paymentIntents.create({
      amount: totalAmountCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { orderId: order._id.toString(), userId: req.user._id.toString() }
    });
    order.paymentIntentId = intent.id;
    await order.save();
    res.status(201).json({ clientSecret: intent.client_secret, orderId: order._id.toString() });
  } catch (error) {
    if (intent) {
      try { await stripe.paymentIntents.cancel(intent.id); } catch (cancelError) {
        console.error('Could not cancel an unlinked Stripe payment intent:', cancelError);
      }
    }
    try { await Order.findByIdAndDelete(order._id); } catch (cleanupError) {
      console.error('Could not remove an incomplete checkout order:', cleanupError);
    }
    throw error;
  }
});

module.exports = router;