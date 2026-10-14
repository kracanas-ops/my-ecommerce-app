const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { requireAuth } = require('../middleware/auth');
const { getStripe } = require('../services/stripe');

const router = express.Router();

/**
 * Validates cart items before processing
 */
function validateCartItems(items) {
  if (!Array.isArray(items)) {
    return { valid: false, error: 'Items must be an array.' };
  }
  
  if (items.length < 1) {
    return { valid: false, error: 'Your cart must contain at least one product.' };
  }
  
  if (items.length > 20) {
    return { valid: false, error: 'Your cart must contain 20 products or fewer.' };
  }
  
  const quantities = new Map();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    if (!item || typeof item !== 'object') {
      return { valid: false, error: 'Each cart item must be an object.' };
    }
    
    if (typeof item.productId !== 'string') {
      return { valid: false, error: `Item at position ${i}: productId is required.` };
    }
    
    if (!mongoose.isValidObjectId(item.productId)) {
      return { valid: false, error: `Item at position ${i}: invalid product ID.` };
    }
    
    if (typeof item.quantity !== 'number' || !Number.isInteger(item.quantity)) {
      return { valid: false, error: `Item at position ${i}: quantity must be a whole number.` };
    }
    
    if (item.quantity < 1) {
      return { valid: false, error: `Item at position ${i}: quantity must be at least 1.` };
    }
    
    if (item.quantity > 99) {
      return { valid: false, error: `Item at position ${i}: quantity cannot exceed 99.` };
    }
    
    const productId = item.productId;
    quantities.set(productId, (quantities.get(productId) || 0) + item.quantity);
    
    if (quantities.get(productId) > 99) {
      return { valid: false, error: `Item at position ${i}: total quantity for product cannot exceed 99.` };
    }
  }
  
  return { valid: true, quantities };
}

/**
 * Validates shipping address
 */
function validateShippingAddress(shippingAddress) {
  if (!shippingAddress) {
    return { valid: true, shipping: null };
  }
  
  if (typeof shippingAddress !== 'object') {
    return { valid: false, error: 'Shipping address must be an object.' };
  }
  
  const shipping = {};
  
  if (shippingAddress.street) {
    if (typeof shippingAddress.street !== 'string') {
      return { valid: false, error: 'Street must be a string.' };
    }
    shipping.street = shippingAddress.street.trim();
    if (shipping.street.length > 200) {
      return { valid: false, error: 'Street must be 200 characters or less.' };
    }
  } else {
    return { valid: false, error: 'Street is required.' };
  }
  
  if (shippingAddress.city) {
    if (typeof shippingAddress.city !== 'string') {
      return { valid: false, error: 'City must be a string.' };
    }
    shipping.city = shippingAddress.city.trim();
    if (shipping.city.length > 100) {
      return { valid: false, error: 'City must be 100 characters or less.' };
    }
  }
  
  if (shippingAddress.postalCode) {
    if (typeof shippingAddress.postalCode !== 'string') {
      return { valid: false, error: 'Postal code must be a string.' };
    }
    shipping.postalCode = shippingAddress.postalCode.trim();
    if (shipping.postalCode.length > 20) {
      return { valid: false, error: 'Postal code must be 20 characters or less.' };
    }
  }
  
  // Optional location coordinates
  if (shippingAddress.lat !== undefined) {
    if (typeof shippingAddress.lat !== 'number' || !Number.isFinite(shippingAddress.lat)) {
      return { valid: false, error: 'Latitude must be a valid number.' };
    }
    shipping.lat = shippingAddress.lat;
  }
  
  if (shippingAddress.lng !== undefined) {
    if (typeof shippingAddress.lng !== 'number' || !Number.isFinite(shippingAddress.lng)) {
      return { valid: false, error: 'Longitude must be a valid number.' };
    }
    shipping.lng = shippingAddress.lng;
  }
  
  return { valid: true, shipping };
}

router.post('/create-payment-intent', requireAuth, async (req, res) => {
  const { items, shippingAddress } = req.body || {};
  
  // Validate items
  const itemsValidation = validateCartItems(items);
  if (!itemsValidation.valid) {
    return res.status(400).json({ error: itemsValidation.error });
  }
  
  // Validate shipping address if provided
  const shippingValidation = validateShippingAddress(shippingAddress);
  if (!shippingValidation.valid) {
    return res.status(400).json({ error: shippingValidation.error });
  }

  const quantities = itemsValidation.quantities;

  try {
    // Fetch all products in a single query
    const products = await Product.find({ _id: { $in: [...quantities.keys()] } });
    
    // Verify all requested products exist
    if (products.length !== quantities.size) {
      return res.status(400).json({ error: 'One or more products are no longer available.' });
    }

    // Build order items and calculate total
    const orderItems = [];
    for (const product of products) {
      const productId = product._id.toString();
      const quantity = quantities.get(productId);
      
      // Check stock before creating order
      if (quantity > product.stock) {
        return res.status(409).json({ 
          error: `${product.name} does not have enough stock (available: ${product.stock}, requested: ${quantity}).` 
        });
      }
      
      const unitPriceCents = Math.round(product.price * 100);
      orderItems.push({
        product: product._id,
        name: product.name,
        unitPriceCents,
        quantity
      });
    }
    
    const totalAmountCents = orderItems.reduce(
      (total, item) => total + item.unitPriceCents * item.quantity,
      0
    );
    
    if (!Number.isSafeInteger(totalAmountCents) || totalAmountCents < 1) {
      return res.status(400).json({ error: 'The cart total is invalid.' });
    }

    const stripe = getStripe();
    const shipping = shippingValidation.shipping;

    // Create order in pending state
    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      totalAmountCents,
      currency: 'usd',
      ...(shipping ? { shippingAddress: shipping } : {}),
      paymentStatus: 'pending'
    });

    let intent;
    try {
      intent = await stripe.paymentIntents.create({
        amount: totalAmountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true },
        metadata: { 
          orderId: order._id.toString(), 
          userId: req.user._id.toString() 
        }
      });
      
      order.paymentIntentId = intent.id;
      await order.save();
      
      res.status(201).json({ 
        clientSecret: intent.client_secret, 
        orderId: order._id.toString() 
      });
    } catch (error) {
      // Clean up order if payment intent creation fails
      if (intent) {
        try { 
          await stripe.paymentIntents.cancel(intent.id); 
        } catch (cancelError) {
          console.error('Could not cancel payment intent:', cancelError);
        }
      }
      try { 
        await Order.findByIdAndDelete(order._id); 
      } catch (cleanupError) {
        console.error('Could not remove incomplete order:', cleanupError);
      }
      
      console.error('Payment intent creation error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Create payment intent error:', error);
    
    // Provide specific error messages for known issues
    if (error.message?.includes('One or more products')) {
      res.status(400).json({ error: error.message });
    } else if (error.message?.includes('does not have enough stock')) {
      res.status(409).json({ error: error.message });
    } else if (error.type === 'StripeCardError') {
      res.status(400).json({ error: 'Payment method was declined.' });
    } else {
      res.status(500).json({ error: 'Could not create payment intent.' });
    }
  }
});

module.exports = router;
