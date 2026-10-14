const mongoose = require('mongoose');
const Product = require('../models/Product');

/**
 * Marks an order as paid and decrements product stock.
 * Uses MongoDB transactions to ensure atomicity and prevent race conditions.
 *
 * @param {Object} order - The order to mark as paid
 * @param {Object} options - Optional parameters
 * @param {mongoose.ClientSession} options.session - Existing session to use
 * @returns {Promise<Object>} The updated order
 * @throws {Error} If stock is insufficient or transaction fails
 */
async function markOrderPaid(order, options = {}) {
  const { session: existingSession } = options;
  
  // If already paid, return as-is
  if (!order || order.paymentStatus === 'paid') {
    return order;
  }
  
  // Only process pending orders
  if (order.paymentStatus !== 'pending') {
    return order;
  }

  // Create a new session if one wasn't provided
  const session = existingSession || await mongoose.startSession();
  let sessionCreated = !existingSession;

  try {
    await session.withTransaction(async () => {
      // Process each item in the order
      for (const item of order.items) {
        // Find and update product with stock check in a single atomic operation
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            _id: item.product, 
            stock: { $gte: item.quantity } // Atomic check: stock >= requested quantity
          },
          { $inc: { stock: -item.quantity } }, // Atomic decrement
          { session, new: true }
        );

        // If product not found or stock insufficient, fail the transaction
        if (!updatedProduct) {
          order.paymentStatus = 'failed';
          await order.save({ session });
          const error = new Error(`Insufficient stock for ${item.name}.`);
          error.status = 409;
          throw error;
        }
      }

      // All stock updates successful - mark order as paid
      order.paymentStatus = 'paid';
      await order.save({ session });
    });

    return order;
  } catch (error) {
    // Transaction will be aborted automatically
    throw error;
  } finally {
    // End the session if we created it
    if (sessionCreated && session) {
      await session.endSession();
    }
  }
}

module.exports = { markOrderPaid };
