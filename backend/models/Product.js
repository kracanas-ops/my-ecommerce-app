const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 2000, default: '' },
  imageUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  price: { type: Number, required: true, min: 0.01 },
  stock: { type: Number, required: true, min: 0, validate: Number.isInteger },
  category: { type: String, trim: true, maxlength: 80, default: '' },
  images: { type: [String], default: [] },
  videoUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sourceUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  isSponsored: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);