const axios = require('axios');
const logger = require('../../utils/logger');

async function getResponse(message, systemPrompt, history, config) {
  let fullUrl = null;

  try {
    if (!config.apiUrl || !config.apiKey) {
      logger.error('Grok API configuration missing:', {
        hasApiUrl: !!config.apiUrl,
        hasApiKey: !!config.apiKey
      });
      throw new Error('Grok API URL or API key is missing');
    }

    const apiUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
    fullUrl = `${apiUrl}/chat/completions`;

    try {
      const urlObj = new URL(fullUrl);
    } catch (urlError) {
      logger.error(`Invalid URL format: ${fullUrl}`, urlError);
      throw new Error(`Invalid Grok API URL format: ${fullUrl}`);
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    if (!fullUrl.startsWith('https://') && !fullUrl.startsWith('http://')) {
      logger.error(`Invalid URL protocol. URL must start with http:// or https://. Got: ${fullUrl}`);
      throw new Error(`Invalid URL protocol: ${fullUrl}`);
    }

    const requestData = {
      model: config.model,
      messages: messages,
      max_tokens: config.maxTokens,
      temperature: config.temperature
    };

    const axiosConfig = {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'ai-chat-assistant/1.0.0'
      },
      timeout: 30000,
      maxRedirects: 0,
      validateStatus: function (status) {
        return status >= 200 && status < 400;
      }
    };

    const response = await axios.post(fullUrl, requestData, axiosConfig);

    if (!response.data || !response.data.choices || !response.data.choices[0]) {
      logger.error('Invalid Grok API response format:', {
        hasData: !!response.data,
        hasChoices: !!(response.data && response.data.choices),
        responseKeys: response.data ? Object.keys(response.data) : []
      });
      throw new Error('Invalid response format from Grok API');
    }

    return response.data.choices[0].message.content;
  } catch (error) {
    if (error.response) {
      logger.error('Grok API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      throw new Error(`Grok API error: ${error.response.data?.error?.message || error.response.statusText || 'Unknown error'}`);
    } else if (error.request) {
      logger.error('Grok API request error:', {
        message: error.message,
        code: error.code,
        requestUrl: fullUrl
      });
      throw new Error(`Grok API request failed: ${error.message}. Check API URL and network connection.`);
    } else {
      logger.error('Grok API error:', error.message);
      throw new Error(`Grok API error: ${error.message}`);
    }
  }
}

module.exports = {
  getResponse
};
