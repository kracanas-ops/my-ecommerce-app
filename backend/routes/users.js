const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getJwtSecret, requireAuth } = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  const role = user.role || (user.isAdmin ? 'admin' : 'buyer');
  return {
    id: user._id.toString(),
    name: user.name,
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
  if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ error: 'Enter a name between 2 and 80 characters.' });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    return res.status(400).json({ error: 'Password must be between 8 and 128 characters.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  if (await User.exists({ email: normalizedEmail })) {
    return res.status(409).json({ error: 'An account with this account already exists.' });
  }

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: await bcrypt.hash(password, 12),
    });
    res.status(201).json({ token: createToken(user, jwtSecret), user: publicUser(user) });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }
    throw error;
  }
});

router.post('/login', async (req, res) => {
  const jwtSecret = getJwtSecret();
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Enter your email and password.' });
  }

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Email or password is incorrect.' });
  }
  res.json({ token: createToken(user, jwtSecret), user: publicUser(user) });
});

router.get('/me', requireAuth, async (req, res) => {
  res.json(publicUser(req.user));
});

module.exports = router;