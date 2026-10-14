const jwt = require('jsonwebtoken');
const User = require('../models/User');

function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured.');
  }
  return process.env.JWT_SECRET;
}

/**
 * Middleware to require authentication.
 * Verifies JWT token and loads user from database.
 */
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
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Your session is invalid. Please sign in again.' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Your session has expired. Please sign in again.' });
    }
    return next(error);
  }

  try {
    const user = await User.findById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Your account could not be found. Please sign in again.' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'An authentication error occurred.' });
  }
}

/**
 * Middleware to require administrator privileges.
 * User must be authenticated AND have role 'admin'.
 * The legacy isAdmin flag is NOT accepted for security.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Sign in to continue.' });
  }
  
  // Only accept role === 'admin' (NOT isAdmin flag)
  // This prevents privilege escalation via isAdmin field
  if (req.user.role === 'admin') {
    return next();
  }
  
  return res.status(403).json({ error: 'Administrator access is required.' });
}

/**
 * Returns middleware that checks the authenticated user's role against
 * one or more allowed roles.
 * 
 * Usage: router.get('/path', authorize('seller', 'admin'), handler)
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
