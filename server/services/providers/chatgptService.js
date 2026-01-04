const axios = require('axios');
const logger = require('../../utils/logger');

async function getResponse(message, systemPrompt, history, config) {
  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    const requestBody = {
      model: config.model,
      messages: messages
    };

    if (config.model && config.model.startsWith('gpt-5')) {
      requestBody.max_completion_tokens = config.maxTokens;
    } else {
      requestBody.max_tokens = config.maxTokens;
      requestBody.temperature = config.temperature;
    }

    const response = await axios.post(
      `${config.apiUrl}/chat/completions`,
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error) {
    logger.error('ChatGPT API error:', error.response?.data || error.message);
    throw new Error(`ChatGPT API error: ${error.response?.data?.error?.message || error.message}`);
  }
}

module.exports = {
  getResponse
};
