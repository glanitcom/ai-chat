const chatService = require('../services/chatService');
const logger = require('../utils/logger');
const { logChatMessage } = require('../utils/chatLogger');

exports.handleMessage = async (req, res, next) => {
  try {
    const { message, sessionId, provider } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Message is required and must be a string'
      });
    }

    const result = await chatService.processMessage(message, sessionId, provider);

    await logChatMessage(req, {
      sessionId: result.sessionId,
      userMessage: message,
      aiResponse: result.response,
      provider: result.provider,
      escalate: result.escalate || false
    });

    res.json(result);
  } catch (error) {
    logger.error('Error handling message:', error);

    const statusCode = error.message.includes('API key') || error.message.includes('not configured') ? 500 : 500;
    const errorMessage = error.message || 'Internal server error';

    res.status(statusCode).json({
      error: errorMessage,
      escalate: error.message.includes('API key') ? true : false
    });
  }
};

exports.getHistory = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const history = await chatService.getHistory(sessionId);

    res.json({ history });
  } catch (error) {
    logger.error('Error getting history:', error);
    next(error);
  }
};

exports.escalateToOperator = async (req, res, next) => {
  try {
    const { sessionId, reason } = req.body;

    await chatService.logEscalation(sessionId, reason);

    res.json({
      success: true,
      message: 'Connecting to operator...',
      escalate: true
    });
  } catch (error) {
    logger.error('Error escalating to operator:', error);
    next(error);
  }
};
