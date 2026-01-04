const axios = require('axios');
const logger = require('../../utils/logger');

async function getResponse(message, systemPrompt, history, config) {
  try {
    const contents = [];

    if (systemPrompt) {
      contents.push({
        role: 'user',
        parts: [{ text: systemPrompt }]
      });
      contents.push({
        role: 'model',
        parts: [{ text: 'Understood. I will follow these instructions.' }]
      });
    }

    history.forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    });

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const requestBody = {
      contents: contents,
      generationConfig: {
        maxOutputTokens: config.maxTokens,
        temperature: config.temperature
      }
    };

    const apiUrl = config.apiUrl.endsWith('/') ? config.apiUrl.slice(0, -1) : config.apiUrl;
    const modelName = config.model;
    const fullUrl = `${apiUrl}/models/${modelName}:generateContent`;

    const response = await axios.post(
      fullUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': config.apiKey
        },
        timeout: 30000
      }
    );

    if (!response.data || !response.data.candidates || !response.data.candidates[0] || !response.data.candidates[0].content) {
      logger.error('Invalid Gemini API response format:', {
        hasData: !!response.data,
        hasCandidates: !!(response.data && response.data.candidates),
        responseData: response.data
      });
      throw new Error('Invalid response format from Gemini API');
    }

    const candidate = response.data.candidates[0];
    if (!candidate.content || !candidate.content.parts || !candidate.content.parts[0]) {
      logger.error('Invalid Gemini API response structure:', {
        candidate: candidate
      });
      throw new Error('Invalid response structure from Gemini API');
    }

    return candidate.content.parts[0].text;
  } catch (error) {
    if (error.response) {
      logger.error('Gemini API error response:', {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data
      });
      const errorMessage = error.response.data?.error?.message || error.response.statusText || 'Unknown error';
      throw new Error(`Gemini API error: ${errorMessage}`);
    } else if (error.request) {
      logger.error('Gemini API request error:', {
        message: error.message,
        code: error.code
      });
      throw new Error(`Gemini API request failed: ${error.message}`);
    } else {
      logger.error('Gemini API error:', error.message);
      throw new Error(`Gemini API error: ${error.message}`);
    }
  }
}

module.exports = {
  getResponse
};
