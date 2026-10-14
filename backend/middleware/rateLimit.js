const WINDOW_CLEANUP_INTERVAL_MS = 60 * 1000;

/**
 * Creates a small in-memory fixed-window rate limiter.
 *
 * This is intentionally dependency-free and per-process. It is enough to blunt
 * credential-stuffing and runaway AI usage on a single instance; a multi-instance
 * deployment should swap the `store` map for Redis.
 */
function createRateLimiter({ windowMs, max, message }) {
  const hits = new Map();

  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (entry.resetAt <= now) {
        hits.delete(key);
      }
    }
  }, WINDOW_CLEANUP_INTERVAL_MS);
  cleanup.unref?.();

  return function rateLimiter(req, res, next) {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    entry.count += 1;
    if (entry.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
      res.set('Retry-After', String(retryAfterSeconds));
      res.status(429).json({ error: message });
      return;
    }

    next();
  };
}

module.exports = { createRateLimiter };
