require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development'
  },
  ai: {
    providers: {
      grok: {
        apiKey: process.env.GROK_API_KEY,
        apiUrl: process.env.GROK_API_URL || 'https://api.x.ai/v1',
        model: process.env.GROK_MODEL || 'grok-4',
        maxTokens: parseInt(process.env.MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.TEMPERATURE) || 0.3
      },
      gemini: {
        apiKey: process.env.GEMINI_API_KEY,
        apiUrl: process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1',
        model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
        maxTokens: parseInt(process.env.MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.TEMPERATURE) || 0.3
      },
      chatgpt: {
        apiKey: process.env.CHATGPT_API_KEY,
        apiUrl: process.env.CHATGPT_API_URL || 'https://api.openai.com/v1',
        model: process.env.CHATGPT_MODEL || 'gpt-5',
        maxTokens: parseInt(process.env.MAX_TOKENS) || 1000,
        temperature: parseFloat(process.env.TEMPERATURE) || 0.3
      }
    },
    defaultProvider: process.env.DEFAULT_AI_PROVIDER || 'grok'
  },
  chat: {
    maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 1000,
    maxHistoryMessages: parseInt(process.env.MAX_HISTORY_MESSAGES) || 10
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    minDelayBetweenRequests: parseInt(process.env.RATE_LIMIT_MIN_DELAY_MS) || 2000,
    blockDuration: parseInt(process.env.RATE_LIMIT_BLOCK_DURATION_MS) || 300000,
    maxRequestsPerMinute: parseInt(process.env.RATE_LIMIT_MAX_PER_MINUTE) || 20,
    maxRequestsPerDay: parseInt(process.env.RATE_LIMIT_MAX_PER_DAY) || 10000
  },
  security: {
    requireApiKey: process.env.REQUIRE_API_KEY === 'true',
    clientApiKeys: process.env.CLIENT_API_KEYS ? process.env.CLIENT_API_KEYS.split(',').map(k => k.trim()) : [],
    trustProxy: process.env.TRUST_PROXY === 'true',
    trustedProxies: process.env.TRUSTED_PROXIES ? process.env.TRUSTED_PROXIES.split(',').map(p => p.trim()) : []
  }
};
