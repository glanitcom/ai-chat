const aiService = require('./aiService');
const knowledgeBaseService = require('./knowledgeBaseService');
const filterService = require('./filterService');
const logger = require('../utils/logger');
const config = require('../config');

const chatHistory = new Map();

async function processMessage(message, sessionId, provider = null) {
  try {
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    if (message.length > config.chat.maxMessageLength) {
      return {
        error: 'Message is too long',
        maxLength: config.chat.maxMessageLength
      };
    }

    const escalationCheck = await filterService.checkEscalationTriggers(message);
    if (escalationCheck.shouldEscalate) {
      await logEscalation(sessionId, escalationCheck.reason);
      return {
        escalate: true,
        message: 'Connecting you to an operator...',
        reason: escalationCheck.reason
      };
    }

    const knowledgeContext = await knowledgeBaseService.searchRelevantInfo(message);
    const history = getHistory(sessionId);
    const systemPrompt = await knowledgeBaseService.getSystemPrompt(knowledgeContext);
    const selectedProvider = provider || config.ai.defaultProvider;

    const aiResponse = await aiService.getResponse(
      message,
      systemPrompt,
      history,
      selectedProvider
    );

    const escalationInResponse = checkEscalationInResponse(aiResponse);
    if (escalationInResponse.shouldEscalate) {
      await logEscalation(sessionId, escalationInResponse.reason);
      return {
        sessionId,
        response: escalationInResponse.cleanResponse,
        provider: selectedProvider,
        escalate: true,
        message: escalationInResponse.cleanResponse
      };
    }

    const filteredResponse = await filterService.filterResponse(aiResponse);
    addToHistory(sessionId, message, filteredResponse);

    return {
      sessionId,
      response: filteredResponse,
      provider: selectedProvider,
      escalate: false
    };
  } catch (error) {
    logger.error('Error processing message:', error.message);
    throw error;
  }
}

function getHistory(sessionId) {
  const history = chatHistory.get(sessionId) || [];
  return history.slice(-config.chat.maxHistoryMessages);
}

function addToHistory(sessionId, userMessage, aiResponse) {
  if (!chatHistory.has(sessionId)) {
    chatHistory.set(sessionId, []);
  }

  const history = chatHistory.get(sessionId);
  history.push({
    role: 'user',
    content: userMessage,
    timestamp: new Date().toISOString()
  });
  history.push({
    role: 'assistant',
    content: aiResponse,
    timestamp: new Date().toISOString()
  });

  chatHistory.set(sessionId, history);
}

function checkEscalationInResponse(response) {
  if (!response) {
    return {
      shouldEscalate: false,
      reason: null,
      cleanResponse: null
    };
  }

  if (response.trim().startsWith('ESCALATE_TO_OPERATOR:')) {
    const cleanResponse = response.replace(/^ESCALATE_TO_OPERATOR:\s*/i, '').trim() || 'Please hold while I connect you to an operator.';
    return {
      shouldEscalate: true,
      reason: 'AI determined that operator escalation is needed',
      cleanResponse: cleanResponse
    };
  }

  return {
    shouldEscalate: false,
    reason: null,
    cleanResponse: null
  };
}

async function logEscalation(sessionId, reason) {
  logger.warn(`Escalation for session ${sessionId}: ${reason}`);
}

module.exports = {
  processMessage,
  getHistory,
  logEscalation
};
