const grokService = require('./providers/grokService');
const geminiService = require('./providers/geminiService');
const chatgptService = require('./providers/chatgptService');
const config = require('../config');
const logger = require('../utils/logger');

async function getResponse(message, systemPrompt, history, provider) {
  try {
    const providerConfig = config.ai.providers[provider];

    if (!providerConfig) {
      logger.error(`Provider ${provider} not found in config`);
      throw new Error(`Provider ${provider} is not configured`);
    }

    if (!providerConfig.apiKey || providerConfig.apiKey === 'your_grok_api_key_here' ||
        providerConfig.apiKey === 'your_gemini_api_key_here' ||
        providerConfig.apiKey === 'your_chatgpt_api_key_here') {
      logger.error(`Provider ${provider} API key is missing or not set. Please configure it in .env file`);
      throw new Error(`Provider ${provider} API key is missing or not set. Please configure it in .env file`);
    }

    if (!providerConfig.apiUrl) {
      logger.error(`Provider ${provider} API URL is missing`);
      throw new Error(`Provider ${provider} API URL is not configured`);
    }

    let response;

    switch (provider) {
      case 'grok':
        response = await grokService.getResponse(
          message,
          systemPrompt,
          history,
          providerConfig
        );
        break;
      case 'gemini':
        response = await geminiService.getResponse(
          message,
          systemPrompt,
          history,
          providerConfig
        );
        break;
      case 'chatgpt':
        response = await chatgptService.getResponse(
          message,
          systemPrompt,
          history,
          providerConfig
        );
        break;
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }

    return response;
  } catch (error) {
    logger.error(`Error getting response from ${provider}:`, error.message);
    throw error;
  }
}

module.exports = {
  getResponse
};
