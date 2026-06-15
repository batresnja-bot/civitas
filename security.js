const crypto = require('crypto');

const RATE_LIMITS = new Map();

function rateLimit(key, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;

  if (!RATE_LIMITS.has(key)) {
    RATE_LIMITS.set(key, []);
  }

  const requests = RATE_LIMITS.get(key).filter(t => t > windowStart);
  RATE_LIMITS.set(key, requests);

  if (requests.length >= maxRequests) {
    return false;
  }

  requests.push(now);
  RATE_LIMITS.set(key, requests);
  return true;
}

function generateCSRFToken(req) {
  if (!req.session) return null;
  const token = crypto.randomBytes(32).toString('hex');
  req.session.csrfToken = token;
  req.session.csrfExpires = Date.now() + 3600000;
  return token;
}

function validateCSRFToken(req) {
  if (!req.session || !req.session.csrfToken) return false;
  if (req.session.csrfExpires < Date.now()) return false;

  const token = req.body._csrf || req.query._csrf || req.headers['x-csrf-token'];
  if (!token) return false;

  return crypto.timingSafeEqual(
    Buffer.from(req.session.csrfToken, 'hex'),
    Buffer.from(token, 'hex')
  );
}

function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 10000);
}

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
}

function ipRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  if (!rateLimit(`ip:${ip}`, 30, 60000)) {
    return res.status(429).render('error', {
      title: 'Rate Limited',
      message: 'Too many requests. Please try again later.',
      currentUser: null,
    });
  }
  next();
}

function authRateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  if (!rateLimit(`auth:${ip}`, 10, 300000)) {
    return res.status(429).render('error', {
      title: 'Rate Limited',
      message: 'Too many login attempts. Please try again in 5 minutes.',
      currentUser: null,
    });
  }
  next();
}

module.exports = {
  rateLimit,
  generateCSRFToken,
  validateCSRFToken,
  sanitizeInput,
  securityHeaders,
  ipRateLimit,
  authRateLimit,
};
