const mongoose = require('mongoose');

const sponsorAdSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  mediaUrl: { type: String, required: true, trim: true, maxlength: 2048 },
  targetUrl: { type: String, trim: true, maxlength: 2048, default: '' },
  sponsorName: { type: String, required: true, trim: true, maxlength: 80 },
  placement: { type: String, enum: ['hero_banner', 'feed_interstitial', 'side_card'], default: 'hero_banner' },
  clicks: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('SponsorAd', sponsorAdSchema);