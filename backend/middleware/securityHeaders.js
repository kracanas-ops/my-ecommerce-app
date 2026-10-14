const CONTENT_SECURITY_POLICY = [
  "default-src 'none'",
  "frame-ancestors 'none'",
  "base-uri 'none'",
  "form-action 'none'"
].join('; ');

/**
 * Sets a conservative set of security headers on every API response.
 *
 * The API only ever returns JSON (plus the plain-text health string), so the
 * policy is deliberately strict: nothing should be framed, scripted, or sniffed.
 * HSTS is only sent when the request arrived over HTTPS in production.
 */
function securityHeaders(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  res.set('Cross-Origin-Resource-Policy', 'same-site');
  res.set('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  res.removeHeader('X-Powered-By');

  if (process.env.NODE_ENV === 'production' && req.secure) {
    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  next();
}

module.exports = { securityHeaders };
