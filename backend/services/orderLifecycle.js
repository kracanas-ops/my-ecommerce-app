const Product = require('../models/Product');

async function markOrderPaid(order, options = {}) {
  const { session } = options;

  if (!order || order.paymentStatus === 'paid') {
    return order;
  }

  if (order.paymentStatus !== 'pending') {
    return order;
  }

  for (const item of order.items) {
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { session, new: true }
    );

    if (!updatedProduct) {
      order.paymentStatus = 'failed';
      await order.save({ session });
      const error = new Error('One or more items are no longer in stock.');
      error.status = 409;
      throw error;
    }
  }

  order.paymentStatus = 'paid';
  await order.save({ session });
  return order;
}

module.exports = { markOrderPaid };
