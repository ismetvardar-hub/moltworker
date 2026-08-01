/**
 * AŞAMA 19 — Basit bellek içi rate limit + güvenlik başlıkları.
 */

const buckets = new Map(); // key → { count, resetAt }

const WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const MAX_HITS = Number(process.env.RATE_LIMIT_MAX || 120);
const AUTH_MAX = Number(process.env.RATE_LIMIT_AUTH_MAX || 20);

function clientKey(req) {
  const xf = req.headers['x-forwarded-for'];
  const ip = (typeof xf === 'string' ? xf.split(',')[0] : null) || req.socket?.remoteAddress || 'local';
  return ip.trim();
}

function hit(key, max) {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now > b.resetAt) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  b.count += 1;
  return {
    allowed: b.count <= max,
    remaining: Math.max(0, max - b.count),
    resetAt: b.resetAt,
  };
}

export function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  // API JSON — CSP gevşek tutulur (Vite dev inline)
  if (!res.getHeader('Content-Security-Policy')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self' http://localhost:11434 ws: wss:;",
    );
  }
}

/**
 * Connect middleware — /api/* için limit uygular.
 */
export function createRateLimitMiddleware() {
  return (req, res, next) => {
    applySecurityHeaders(res);
    const path = (req.url ?? '').split('?')[0];
    if (!path.startsWith('/api/')) {
      next();
      return;
    }
    // health muaf
    if (path === '/api/health') {
      next();
      return;
    }
    const ip = clientKey(req);
    const isAuth = path.startsWith('/api/auth/login');
    const max = isAuth ? AUTH_MAX : MAX_HITS;
    const key = `${isAuth ? 'auth' : 'api'}:${ip}`;
    const result = hit(key, max);
    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(result.remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(result.resetAt / 1000)));
    if (!result.allowed) {
      res.statusCode = 429;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Retry-After', String(Math.ceil((result.resetAt - Date.now()) / 1000)));
      res.end(JSON.stringify({ error: 'Çok fazla istek — biraz bekleyin', retryAfterSec: Math.ceil((result.resetAt - Date.now()) / 1000) }));
      return;
    }
    next();
  };
}
