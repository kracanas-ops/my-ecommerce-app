const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const Product = require('../models/Product');
const { requireAuth, requireAdmin, authorize } = require('../middleware/auth');

const router = express.Router();

function serializeProduct(product) {
  return {
    id: product._id.toString(),
    name: product.name,
    description: product.description,
    imageUrl: product.imageUrl || '',
    price: product.price,
    stock: product.stock,
    category: product.category || '',
    images: product.images || [],
    videoUrl: product.videoUrl || '',
    seller: product.seller ? product.seller.toString() : null,
    sourceUrl: product.sourceUrl || '',
    isSponsored: product.isSponsored || false,
  };
}

// -- Public product listing -- //

router.get('/', async (req, res) => {
  const products = await Product.find().sort({ createdAt: 1 }).populate('seller', 'name email');
  res.json(products.map(serializeProduct));
});

router.get('/:id', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const product = await Product.findById(req.params.id).populate('seller', 'name email');
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  res.json(serializeProduct(product));
});

// -- External link import (seller / admin) -- //

router.post('/import-url', requireAuth, authorize('seller', 'admin'), async (req, res) => {
  const { url } = req.body || {};
  if (typeof url !== 'string' || !url.trim() || !/^https?:\/\/.+/i.test(url.trim())) {
    return res.status(400).json({ error: 'Provide a valid product URL beginning with http:// or https://.' });
  }

  try {
    const response = await axios.get(url.trim(), {
      timeout: 12000,
      headers: { 'User-Agent': 'Forma.store-Importer/1.0' },
    });
    const $ = cheerio.load(response.data);

    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('title').text() ||
      '';

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    const image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      '';

    // Attempt to extract a numeric price from the page body
    const bodyText = $('body').text();
    const priceMatch = bodyText.match(/\$\s*(\d+(?:[,.]\d{1,2})?)/);
    const suggestedPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) || 0 : 0;

    res.json({
      scraped: { title: title.trim().slice(0, 120), description: description.trim().slice(0, 2000), imageUrl: image.trim().slice(0, 2048), suggestedPrice },
    });
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.response?.status >= 400) {
      return res.status(422).json({ error: 'The URL could not be loaded or returned an error.' });
    }
    console.error('Product import failed:', error);
    return res.status(502).json({ error: 'The product import could not be completed.' });
  }
});

// -- Create product (seller / admin) -- //

router.post('/', requireAuth, authorize('seller', 'admin'), async (req, res) => {
  const { name, description = '', imageUrl = '', price, stock, category = '', videoUrl = '', sourceUrl = '', images = [] } = req.body || {};
  if (typeof name !== 'string' || !name.trim() ||
      !Number.isFinite(price) || price <= 0 ||
      !Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ error: 'Provide a name, positive price, and non-negative whole-number stock.' });
  }

  const product = await Product.create({
    name: name.trim(),
    description: description.trim(),
    imageUrl: imageUrl.trim(),
    price,
    stock,
    category: category.trim(),
    videoUrl: videoUrl.trim(),
    sourceUrl: sourceUrl.trim(),
    images: Array.isArray(images) ? images.filter(Boolean).map((i) => i.trim()).filter((i) => i.length <= 2048) : [],
    seller: req.user._id,
  });

  res.status(201).json(serializeProduct(product));
});

// -- Delete product (admin only, or the owning seller) -- //

router.delete('/:id', requireAuth, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }
  // Allow admin or the owning seller to delete
  if (req.user.role !== 'admin' && req.user.isAdmin !== true && product.seller?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ error: 'You do not have permission to delete this product.' });
  }
  await Product.findByIdAndDelete(req.params.id);
  res.status(204).end();
});

module.exports = router;