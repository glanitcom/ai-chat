const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const chatRoutes = require('./routes/chatRoutes');
const errorHandler = require('./utils/errorHandler');
const logger = require('./utils/logger');
const config = require('./config');
const { rateLimitMiddleware } = require('./utils/rateLimiter');
const { authenticateApiKey, optionalAuth } = require('./utils/auth');

const app = express();
const PORT = process.env.PORT || 3000;

function validateConfiguration() {
  const defaultProvider = config.ai.defaultProvider;
  const providerConfig = config.ai.providers[defaultProvider];

  if (!providerConfig) {
    logger.warn(`Default provider ${defaultProvider} is not configured`);
    return false;
  }

  if (!providerConfig.apiKey ||
      providerConfig.apiKey.includes('your_') ||
      providerConfig.apiKey.includes('_here')) {
    logger.error(`API key for ${defaultProvider} is not set. Please configure ${defaultProvider.toUpperCase()}_API_KEY in .env file`);
    return false;
  }

  if (!providerConfig.apiUrl) {
    logger.error(`API URL for ${defaultProvider} is not set`);
    return false;
  }

  logger.info(`Configuration validated. Using provider: ${defaultProvider}, model: ${providerConfig.model}`);
  return true;
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.set('trust proxy', process.env.TRUST_PROXY === 'true' || false);

app.use('/api/chat', optionalAuth);
app.use('/api/chat', rateLimitMiddleware);
if (process.env.REQUIRE_API_KEY === 'true') {
  app.use('/api/chat', authenticateApiKey);
}
app.use('/api/chat', chatRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

if (process.env.NODE_ENV === 'development') {
  app.use(express.static(path.join(__dirname, '../client')));
}

app.use(errorHandler);

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);

  if (!validateConfiguration()) {
    logger.warn('Server started but configuration may be incomplete. Check your .env file.');
  }
});

module.exports = app;
