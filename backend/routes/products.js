const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const validator = require('validator');
const Product = require('../models/Product');
const { requireAuth, requireAdmin, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
function sanitizeHtml(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates and sanitizes a URL
 */
function validateUrl(url, fieldName) {
  if (!url) return { valid: true };
  
  const trimmed = url.trim();
  if (!trimmed) return { valid: true };
  
  // Must be http or https
  if (!validator.isURL(trimmed, { 
    protocols: ['http', 'https'], 
    require_protocol: true,
    require_valid_protocol: true 
  })) {
    return { 
      valid: false, 
      error: `${fieldName} must be a valid HTTP/HTTPS URL.` 
    };
  }
  
  // Additional security: block potentially dangerous URLs
  const lowerUrl = trimmed.toLowerCase();
  if (lowerUrl.startsWith('javascript:') || 
      lowerUrl.startsWith('data:') ||
      lowerUrl.startsWith('file:')) {
    return { 
      valid: false, 
      error: `${fieldName} contains an invalid URL scheme.` 
    };
  }
  
  return { valid: true };
}

function serializeProduct(product) {
  return {
    id: product._id.toString(),
    name: sanitizeHtml(product.name),
    description: sanitizeHtml(product.description),
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
  try {
    const products = await Product.find().sort({ createdAt: 1 }).populate('seller', 'name email');
    res.json(products.map(serializeProduct));
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Could not retrieve products.' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const product = await Product.findById(req.params.id).populate('seller', 'name email');
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    res.json(serializeProduct(product));
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Could not retrieve product.' });
  }
});

// -- External link import (seller / admin) -- //

router.post('/import-url', requireAuth, authorize('seller', 'admin'), async (req, res) => {
  const { url } = req.body || {};
  
  if (typeof url !== 'string' || !url.trim()) {
    return res.status(400).json({ error: 'Provide a valid product URL.' });
  }
  
  const trimmedUrl = url.trim();
  
  // Validate URL before processing
  const urlValidation = validateUrl(trimmedUrl, 'URL');
  if (!urlValidation.valid) {
    return res.status(400).json({ error: urlValidation.error });
  }
  
  if (!/^https?:\/\/.+/i.test(trimmedUrl)) {
    return res.status(400).json({ error: 'Provide a valid product URL beginning with http:// or https://.' });
  }

  try {
    const response = await axios.get(trimmedUrl, {
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

    // Validate scraped URLs
    const imageValidation = validateUrl(image, 'Image URL');
    if (!imageValidation.valid) {
      console.warn('Invalid image URL scraped, using empty:', image);
    }

    // Attempt to extract a numeric price from the page body
    const bodyText = $('body').text();
    const priceMatch = bodyText.match(/\$\s*(\d+(?:[,.]\d{1,2})?)/);
    const suggestedPrice = priceMatch ? parseFloat(priceMatch[1].replace(',', '')) || 0 : 0;

    res.json({
      scraped: { 
        title: sanitizeHtml(title.trim().slice(0, 120)), 
        description: sanitizeHtml(description.trim().slice(0, 2000)), 
        imageUrl: imageValidation.valid ? image.trim().slice(0, 2048) : '',
        suggestedPrice 
      },
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
  const {
    name, 
    description = '', 
    imageUrl = '', 
    price, 
    stock, 
    category = '', 
    videoUrl = '', 
    sourceUrl = '', 
    images = []
  } = req.body || {};

  // Validate required fields
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Provide a product name.' });
  }
  if (!Number.isFinite(price) || price <= 0) {
    return res.status(400).json({ error: 'Provide a positive price.' });
  }
  if (!Number.isInteger(stock) || stock < 0) {
    return res.status(400).json({ error: 'Provide a non-negative whole-number stock.' });
  }

  // Validate string lengths
  if (name.trim().length > 120) {
    return res.status(400).json({ error: 'Product name must be 120 characters or less.' });
  }
  if (description.trim().length > 2000) {
    return res.status(400).json({ error: 'Product description must be 2000 characters or less.' });
  }
  if (category.trim().length > 80) {
    return res.status(400).json({ error: 'Product category must be 80 characters or less.' });
  }

  // Validate URLs
  const imageUrlValidation = validateUrl(imageUrl, 'Image URL');
  if (!imageUrlValidation.valid) {
    return res.status(400).json({ error: imageUrlValidation.error });
  }
  
  const videoUrlValidation = validateUrl(videoUrl, 'Video URL');
  if (!videoUrlValidation.valid) {
    return res.status(400).json({ error: videoUrlValidation.error });
  }
  
  const sourceUrlValidation = validateUrl(sourceUrl, 'Source URL');
  if (!sourceUrlValidation.valid) {
    return res.status(400).json({ error: sourceUrlValidation.error });
  }

  // Validate and sanitize images array
  let validatedImages = [];
  if (Array.isArray(images)) {
    validatedImages = images.filter(Boolean).map(img => {
      const trimmed = img.trim();
      const validation = validateUrl(trimmed, 'Image');
      return validation.valid && trimmed.length <= 2048 ? trimmed : null;
    }).filter(Boolean);
  }

  try {
    const product = await Product.create({
      name: sanitizeHtml(name.trim()),
      description: sanitizeHtml(description.trim()),
      imageUrl: imageUrlValidation.valid ? imageUrl.trim() : '',
      price,
      stock,
      category: sanitizeHtml(category.trim()),
      videoUrl: videoUrlValidation.valid ? videoUrl.trim() : '',
      sourceUrl: sourceUrlValidation.valid ? sourceUrl.trim() : '',
      images: validatedImages,
      seller: req.user._id,
    });

    res.status(201).json(serializeProduct(product));
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A product with this name already exists.' });
    }
    res.status(500).json({ error: 'Could not create product.' });
  }
});

// -- Delete product (admin only, or the owning seller) -- //

router.delete('/:id', requireAuth, async (req, res) => {
  try {
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
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Could not delete product.' });
  }
});

module.exports = router;
