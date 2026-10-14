const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  label: { type: String, trim: true, maxlength: 60, default: 'Home' },
  street: { type: String, trim: true, maxlength: 200, default: '' },
  city: { type: String, trim: true, maxlength: 100, default: '' },
  postalCode: { type: String, trim: true, maxlength: 20, default: '' },
  lat: { type: Number },
  lng: { type: Number },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  savedAddresses: { type: [addressSchema], default: [] },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);