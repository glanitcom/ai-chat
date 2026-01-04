const logger = require('./logger');
const config = require('../config');

const validApiKeys = new Set();

function loadApiKeys() {
  const apiKeysEnv = process.env.CLIENT_API_KEYS;
  if (apiKeysEnv) {
    const keys = apiKeysEnv.split(',').map(key => key.trim()).filter(key => key);
    keys.forEach(key => validApiKeys.add(key));
    logger.info(`Loaded ${validApiKeys.size} client API keys`);
  } else {
    logger.warn('No CLIENT_API_KEYS configured. API authentication is disabled.');
  }
}

loadApiKeys();

function authenticateApiKey(req, res, next) {
  if (validApiKeys.size === 0) {
    logger.warn('API authentication is disabled. No CLIENT_API_KEYS configured.');
    return next();
  }

  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '') || req.query.apiKey;

  if (!apiKey) {
    logger.error('API authentication failed: No API key provided');
    return res.status(401).json({
      error: 'Authentication required. Please provide API key in X-API-Key header or Authorization: Bearer <key>'
    });
  }

  if (!validApiKeys.has(apiKey)) {
    logger.error('API authentication failed: Invalid API key');
    return res.status(403).json({
      error: 'Invalid API key'
    });
  }

  req.apiKey = apiKey;
  next();
}

function optionalAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace(/^Bearer\s+/i, '') || req.query.apiKey;

  if (apiKey && validApiKeys.has(apiKey)) {
    req.apiKey = apiKey;
    req.authenticated = true;
  } else {
    req.authenticated = false;
  }

  next();
}

module.exports = {
  authenticateApiKey,
  optionalAuth,
  loadApiKeys
};

