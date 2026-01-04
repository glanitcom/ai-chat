const logger = require('./logger');
const config = require('../config');

const requestHistory = new Map();
const blockedIPs = new Map();
const dailyRequestCount = new Map();

const RATE_LIMIT_CONFIG = {
  maxRequestsPerWindow: 10,
  windowMs: config.rateLimit.windowMs,
  minDelayBetweenRequests: config.rateLimit.minDelayBetweenRequests,
  blockDuration: config.rateLimit.blockDuration,
  maxRequestsPerMinute: config.rateLimit.maxRequestsPerMinute,
  maxRequestsPerDay: config.rateLimit.maxRequestsPerDay
};

function getDayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

function cleanupOldEntries() {
  const now = Date.now();
  const currentDay = getDayKey();

  for (const [ip, history] of requestHistory.entries()) {
    const filtered = history.filter(timestamp => now - timestamp < RATE_LIMIT_CONFIG.windowMs);
    if (filtered.length === 0) {
      requestHistory.delete(ip);
    } else {
      requestHistory.set(ip, filtered);
    }
  }

  for (const [ip, blockUntil] of blockedIPs.entries()) {
    if (now > blockUntil) {
      blockedIPs.delete(ip);
    }
  }

  for (const [key, count] of dailyRequestCount.entries()) {
    if (key !== currentDay) {
      dailyRequestCount.delete(key);
    }
  }
}

setInterval(cleanupOldEntries, 60000);

function rateLimitMiddleware(req, res, next) {
  const ip = getClientIp(req);
  const now = Date.now();
  const currentDay = getDayKey();

  if (blockedIPs.has(ip)) {
    const blockUntil = blockedIPs.get(ip);
    if (now < blockUntil) {
      const remainingTime = Math.ceil((blockUntil - now) / 1000);
      logger.error(`Rate limit: IP ${ip} is blocked for ${remainingTime} more seconds`);
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: remainingTime
      });
    } else {
      blockedIPs.delete(ip);
    }
  }

  const dayKey = `${currentDay}_${ip}`;
  if (!dailyRequestCount.has(dayKey)) {
    dailyRequestCount.set(dayKey, 0);
  }

  const dailyCount = dailyRequestCount.get(dayKey);
  if (dailyCount >= RATE_LIMIT_CONFIG.maxRequestsPerDay) {
    logger.error(`Rate limit: IP ${ip} exceeded daily limit of ${RATE_LIMIT_CONFIG.maxRequestsPerDay} requests`);
    return res.status(429).json({
      error: 'Daily request limit exceeded. Please try again tomorrow.',
      retryAfter: 86400
    });
  }

  if (!requestHistory.has(ip)) {
    requestHistory.set(ip, []);
  }

  const history = requestHistory.get(ip);
  const recentRequests = history.filter(timestamp => now - timestamp < RATE_LIMIT_CONFIG.windowMs);

  if (recentRequests.length >= RATE_LIMIT_CONFIG.maxRequestsPerWindow) {
    const blockUntil = now + RATE_LIMIT_CONFIG.blockDuration;
    blockedIPs.set(ip, blockUntil);
    logger.error(`Rate limit: IP ${ip} exceeded limit and is blocked until ${new Date(blockUntil).toISOString()}`);
    return res.status(429).json({
      error: 'Too many requests. You have been temporarily blocked.',
      retryAfter: Math.ceil(RATE_LIMIT_CONFIG.blockDuration / 1000)
    });
  }

  if (recentRequests.length > 0) {
    const lastRequestTime = recentRequests[recentRequests.length - 1];
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_CONFIG.minDelayBetweenRequests) {
      const delayNeeded = RATE_LIMIT_CONFIG.minDelayBetweenRequests - timeSinceLastRequest;
      logger.error(`Rate limit: IP ${ip} needs to wait ${delayNeeded}ms between requests`);
      return res.status(429).json({
        error: 'Please wait before sending another message.',
        retryAfter: Math.ceil(delayNeeded / 1000)
      });
    }
  }

  const minuteAgo = now - 60000;
  const requestsLastMinute = history.filter(timestamp => timestamp > minuteAgo).length;

  if (requestsLastMinute >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    logger.error(`Rate limit: IP ${ip} exceeded ${RATE_LIMIT_CONFIG.maxRequestsPerMinute} requests per minute`);
    return res.status(429).json({
      error: 'Too many requests per minute. Please slow down.',
      retryAfter: 60
    });
  }

  history.push(now);
  requestHistory.set(ip, history);
  dailyRequestCount.set(dayKey, dailyCount + 1);

  next();
}

module.exports = {
  rateLimitMiddleware,
  getClientIp
};

