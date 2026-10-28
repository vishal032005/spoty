const rateLimit = require('express-rate-limit');

/**
 * Search rate limiter to safeguard upstream public APIs and prevent client spamming.
 */
const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 120, // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    error: 'Rate limit exceeded. Please slow down your search requests.',
    retryAfterSeconds: 60
  }
});

module.exports = {
  searchRateLimiter
};
