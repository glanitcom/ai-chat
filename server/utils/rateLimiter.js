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
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    const trustedProxies = process.env.TRUSTED_PROXIES ? process.env.TRUSTED_PROXIES.split(',').map(p => p.trim()) : [];
    const clientIp = ips[0];

    if (trustedProxies.length > 0) {
      const proxyCount = Math.min(trustedProxies.length, ips.length - 1);
      return ips[proxyCount] || clientIp;
    }

    return clientIp;
  }

  return req.headers['x-real-ip'] ||
         req.headers['cf-connecting-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         (req.connection?.socket ? req.connection.socket.remoteAddress : null) ||
         req.ip ||
         'unknown';
}

function cleanupOldEntries() {
  const now = Date.now();
  const currentDay = getDayKey();

  for (const [identifier, history] of requestHistory.entries()) {
    const filtered = history.filter(timestamp => now - timestamp < RATE_LIMIT_CONFIG.windowMs);
    if (filtered.length === 0) {
      requestHistory.delete(identifier);
    } else {
      requestHistory.set(identifier, filtered);
    }
  }

  for (const [identifier, blockUntil] of blockedIPs.entries()) {
    if (now > blockUntil) {
      blockedIPs.delete(identifier);
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
  const identifier = req.apiKey ? `api_${req.apiKey.substring(0, 8)}` : `ip_${ip}`;
  const now = Date.now();
  const currentDay = getDayKey();

  if (blockedIPs.has(identifier)) {
    const blockUntil = blockedIPs.get(identifier);
    if (now < blockUntil) {
      const remainingTime = Math.ceil((blockUntil - now) / 1000);
      logger.error(`Rate limit: ${identifier} is blocked for ${remainingTime} more seconds`);
      return res.status(429).json({
        error: 'Too many requests. Please try again later.',
        retryAfter: remainingTime
      });
    } else {
      blockedIPs.delete(identifier);
    }
  }

  const dayKey = `${currentDay}_${identifier}`;
  if (!dailyRequestCount.has(dayKey)) {
    dailyRequestCount.set(dayKey, 0);
  }

  const dailyCount = dailyRequestCount.get(dayKey);
  if (dailyCount >= RATE_LIMIT_CONFIG.maxRequestsPerDay) {
    logger.error(`Rate limit: ${identifier} exceeded daily limit of ${RATE_LIMIT_CONFIG.maxRequestsPerDay} requests`);
    return res.status(429).json({
      error: 'Daily request limit exceeded. Please try again tomorrow.',
      retryAfter: 86400
    });
  }

  if (!requestHistory.has(identifier)) {
    requestHistory.set(identifier, []);
  }

  const history = requestHistory.get(identifier);
  const recentRequests = history.filter(timestamp => now - timestamp < RATE_LIMIT_CONFIG.windowMs);

  if (recentRequests.length >= RATE_LIMIT_CONFIG.maxRequestsPerWindow) {
    const blockUntil = now + RATE_LIMIT_CONFIG.blockDuration;
    blockedIPs.set(identifier, blockUntil);
    logger.error(`Rate limit: ${identifier} exceeded limit and is blocked until ${new Date(blockUntil).toISOString()}`);
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
      logger.error(`Rate limit: ${identifier} needs to wait ${delayNeeded}ms between requests`);
      return res.status(429).json({
        error: 'Please wait before sending another message.',
        retryAfter: Math.ceil(delayNeeded / 1000)
      });
    }
  }

  const minuteAgo = now - 60000;
  const requestsLastMinute = history.filter(timestamp => timestamp > minuteAgo).length;

  if (requestsLastMinute >= RATE_LIMIT_CONFIG.maxRequestsPerMinute) {
    logger.error(`Rate limit: ${identifier} exceeded ${RATE_LIMIT_CONFIG.maxRequestsPerMinute} requests per minute`);
    return res.status(429).json({
      error: 'Too many requests per minute. Please slow down.',
      retryAfter: 60
    });
  }

  history.push(now);
  requestHistory.set(identifier, history);
  dailyRequestCount.set(dayKey, dailyCount + 1);

  next();
}

module.exports = {
  rateLimitMiddleware,
  getClientIp
};

