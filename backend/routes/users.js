const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/User');
const { getJwtSecret, requireAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Sanitizes user input to prevent XSS
 */
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Validates password strength
 */
function validatePassword(password) {
  const errors = [];
  
  if (typeof password !== 'string') {
    errors.push('Password is required.');
    return { valid: false, errors };
  }
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters.');
  }
  
  if (password.length > 128) {
    errors.push('Password must be 128 characters or less.');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter.');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter.');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number.');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character.');
  }
  
  return { 
    valid: errors.length === 0, 
    errors 
  };
}

/**
 * Validates email format
 */
function validateEmail(email) {
  if (typeof email !== 'string') {
    return { valid: false, error: 'Email is required.' };
  }
  
  const trimmed = email.trim().toLowerCase();
  if (!validator.isEmail(trimmed)) {
    return { valid: false, error: 'Enter a valid email address.' };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email must be 254 characters or less.' };
  }
  
  return { valid: true, email: trimmed };
}

/**
 * Validates name
 */
function validateName(name) {
  if (typeof name !== 'string') {
    return { valid: false, error: 'Name is required.' };
  }
  
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters.' };
  }
  
  if (trimmed.length > 80) {
    return { valid: false, error: 'Name must be 80 characters or less.' };
  }
  
  return { valid: true, name: trimmed };
}

function publicUser(user) {
  const role = user.role || (user.isAdmin ? 'admin' : 'buyer');
  return {
    id: user._id.toString(),
    name: sanitizeInput(user.name),
    email: user.email,
    role,
    isAdmin: role === 'admin',
    savedAddresses: user.savedAddresses || [],
  };
}

function createToken(user, secret) {
  return jwt.sign({ id: user._id.toString() }, secret, { expiresIn: '7d' });
}

router.post('/register', async (req, res) => {
  const jwtSecret = getJwtSecret();
  const { name, email, password } = req.body || {};

  // Validate name
  const nameValidation = validateName(name);
  if (!nameValidation.valid) {
    return res.status(400).json({ error: nameValidation.error });
  }

  // Validate email
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return res.status(400).json({ error: emailValidation.error });
  }

  // Validate password
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({ 
      error: passwordValidation.errors.join(' ') 
    });
  }

  const normalizedEmail = emailValidation.email;
  
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  try {
    // Hash password with increased cost factor
    const hashedPassword = await bcrypt.hash(password, 14);
    
    const user = await User.create({
      name: nameValidation.name,
      email: normalizedEmail,
      password: hashedPassword,
    });
    
    res.status(201).json({ 
      token: createToken(user, jwtSecret), 
      user: publicUser(user) 
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    console.error('Registration error:', error);
    throw error;
  }
});

router.post('/login', async (req, res) => {
  const jwtSecret = getJwtSecret();
  const { email, password } = req.body || {};

  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    
    if (!user) {
      // Use same error message for both cases to prevent email enumeration
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }
    
    res.json({ token: createToken(user, jwtSecret), user: publicUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Could not process login.' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    res.json(publicUser(req.user));
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Could not retrieve user profile.' });
  }
});

module.exports = router;
