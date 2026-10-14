const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    unitPriceCents: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  }],
  totalAmountCents: { type: Number, required: true, min: 1 },
  currency: { type: String, required: true, default: 'usd' },
  paymentIntentId: { type: String, unique: true, sparse: true },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  deliveryStatus: { type: String, enum: ['Processing', 'Dispatched', 'Delivered'], default: 'Processing' },
  shippingAddress: {
    street: { type: String, trim: true, maxlength: 200 },
    city: { type: String, trim: true, maxlength: 100 },
    postalCode: { type: String, trim: true, maxlength: 20 },
    lat: { type: Number },
    lng: { type: Number },
  },
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);