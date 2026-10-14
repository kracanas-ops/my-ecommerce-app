const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return process.env.JWT_SECRET;
}

async function requireAuth(req, res, next) {
  const authorization = req.headers.authorization || '';
  const [scheme, token] = authorization.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }

  let payload;
  try {
    payload = jwt.verify(token, getJwtSecret());
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Your session is invalid or has expired. Please sign in again.' });
    }
    return next(error);
  }

  const user = await User.findById(payload.id);
  if (!user) {
    return res.status(401).json({ error: 'Your account could not be found. Please sign in again.' });
  }
  req.user = user;
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }
  // Accept both the new role field and the legacy isAdmin flag
  if (req.user.role === 'admin' || req.user.isAdmin === true) {
    return next();
  }
  return res.status(403).json({ error: 'Administrator access is required.' });
}

/**
 * Returns middleware that checks the authenticated user's role against
 * one or more allowed roles.  Usage: router.get('/path', authorize('seller', 'admin'), handler)
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Sign in to continue.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'You do not have permission to perform this action.' });
    }
    next();
  };
}

module.exports = { getJwtSecret, requireAuth, requireAdmin, authorize };