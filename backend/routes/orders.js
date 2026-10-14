const express = require('express');
const mongoose = require('mongoose');
const { requireAuth, authorize } = require('../middleware/auth');
const Order = require('../models/Order');
const { getStripe } = require('../services/stripe');
const { markOrderPaid } = require('../services/orderLifecycle');

const router = express.Router();

function serializeOrder(order) {
  const shipping = order.shippingAddress || null;
  return {
    id: order._id.toString(),
    items: order.items.map((item) => ({
      productId: item.product.toString(),
      name: item.name,
      unitPrice: item.unitPriceCents / 100,
      quantity: item.quantity,
    })),
    total: order.totalAmountCents / 100,
    currency: order.currency,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus || 'Processing',
    shippingAddress: shipping,
    createdAt: order.createdAt,
  };
}

router.get('/', requireAuth, async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders.map(serializeOrder));
});

router.post('/confirm', requireAuth, async (req, res) => {
  const { paymentIntentId } = req.body || {};
  if (typeof paymentIntentId !== 'string' || !paymentIntentId.startsWith('pi_')) {
    return res.status(400).json({ error: 'A valid payment confirmation is required.' });
  }

  const intent = await getStripe().paymentIntents.retrieve(paymentIntentId);
  if (intent.status !== 'succeeded' || intent.metadata.userId !== req.user._id.toString()) {
    return res.status(409).json({ error: 'This payment has not been completed for your account.' });
  }
  const order = await Order.findOne({
    _id: intent.metadata.orderId,
    user: req.user._id,
    paymentIntentId: intent.id
  });
  if (!order || intent.amount_received !== order.totalAmountCents) {
    return res.status(404).json({ error: 'The matching order could not be verified.' });
  }

  try { await markOrderPaid(order); }
  catch (error) { return res.status(error.status || 409).json({ error: error.message || 'This payment could not be completed.' }); }

  res.json(serializeOrder(order));
});

// -- Update delivery status (seller / admin) -- //

router.patch('/:id/delivery-status', requireAuth, authorize('seller', 'admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  const { deliveryStatus } = req.body || {};
  if (!['Processing', 'Dispatched', 'Delivered'].includes(deliveryStatus)) {
    return res.status(400).json({ error: 'Delivery status must be Processing, Dispatched, or Delivered.' });
  }
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { deliveryStatus },
    { new: true }
  );
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  res.json(serializeOrder(order));
});

module.exports = router;