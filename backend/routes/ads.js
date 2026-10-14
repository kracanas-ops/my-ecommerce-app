const express = require('express');
const mongoose = require('mongoose');
const SponsorAd = require('../models/SponsorAd');
const { requireAuth, authorize } = require('../middleware/auth');

const router = express.Router();

// -- List active ads, optionally filtered by placement -- //
router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.placement) {
    filter.placement = req.query.placement;
  }
  const ads = await SponsorAd.find(filter).sort({ createdAt: -1 });
  res.json(ads.map((ad) => ({
    id: ad._id.toString(),
    title: ad.title,
    mediaUrl: ad.mediaUrl,
    targetUrl: ad.targetUrl,
    sponsorName: ad.sponsorName,
    placement: ad.placement,
    clicks: ad.clicks,
  })));
});

// -- Track a click (public, no auth needed) -- //
router.post('/:id/click', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Ad not found.' });
  }
  const ad = await SponsorAd.findByIdAndUpdate(
    req.params.id,
    { $inc: { clicks: 1 } },
    { new: true }
  );
  if (!ad) {
    return res.status(404).json({ error: 'Ad not found.' });
  }
  res.json({ clicks: ad.clicks });
});

// -- Create ad (admin only) -- //
router.post('/', requireAuth, authorize('admin'), async (req, res) => {
  const { title, mediaUrl, targetUrl = '', sponsorName, placement = 'hero_banner' } = req.body || {};
  if (typeof title !== 'string' || !title.trim() ||
      typeof mediaUrl !== 'string' || !mediaUrl.trim() ||
      typeof sponsorName !== 'string' || !sponsorName.trim()) {
    return res.status(400).json({ error: 'Provide title, media URL, and sponsor name.' });
  }
  if (!['hero_banner', 'feed_interstitial', 'side_card'].includes(placement)) {
    return res.status(400).json({ error: 'Placement must be hero_banner, feed_interstitial, or side_card.' });
  }

  const ad = await SponsorAd.create({
    title: title.trim(),
    mediaUrl: mediaUrl.trim(),
    targetUrl: targetUrl.trim(),
    sponsorName: sponsorName.trim(),
    placement,
  });

  res.status(201).json({
    id: ad._id.toString(),
    title: ad.title,
    mediaUrl: ad.mediaUrl,
    targetUrl: ad.targetUrl,
    sponsorName: ad.sponsorName,
    placement: ad.placement,
    clicks: ad.clicks,
  });
});

// -- Delete ad (admin only) -- //
router.delete('/:id', requireAuth, authorize('admin'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Ad not found.' });
  }
  const ad = await SponsorAd.findByIdAndDelete(req.params.id);
  if (!ad) {
    return res.status(404).json({ error: 'Ad not found.' });
  }
  res.status(204).end();
});

module.exports = router;