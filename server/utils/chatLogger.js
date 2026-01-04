const fs = require('fs').promises;
const path = require('path');

const logsDir = path.join(__dirname, '../../logs/chats');

fs.mkdir(logsDir, { recursive: true }).catch(() => {});

function getClientIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

function formatSessionIdForFilename(sessionId) {
  return sessionId.replace(/[^a-zA-Z0-9_]/g, '_');
}

async function logChatMessage(req, messageData) {
  try {
    const ip = getClientIp(req);
    const sessionId = messageData.sessionId;
    const formattedSessionId = formatSessionIdForFilename(sessionId);

    const filename = `${formattedSessionId}.json`;
    const filepath = path.join(logsDir, filename);

    let chatHistory = [];
    try {
      const fileContent = await fs.readFile(filepath, 'utf8');
      chatHistory = JSON.parse(fileContent);
    } catch (error) {
      chatHistory = [];
    }

    if (chatHistory.length === 0 || !chatHistory.sessionId) {
      chatHistory = {
        sessionId: sessionId,
        ip: ip,
        userAgent: req.headers['user-agent'] || 'unknown',
        startTime: new Date().toISOString(),
        messages: []
      };
    }

    chatHistory.messages.push({
      role: 'user',
      content: messageData.userMessage,
      timestamp: new Date().toISOString()
    });

    chatHistory.messages.push({
      role: 'assistant',
      content: messageData.aiResponse,
      timestamp: new Date().toISOString(),
      provider: messageData.provider
    });

    chatHistory.lastUpdate = new Date().toISOString();
    if (messageData.escalate) {
      chatHistory.escalated = true;
      chatHistory.escalationTime = new Date().toISOString();
    }

    await fs.writeFile(filepath, JSON.stringify(chatHistory, null, 2), 'utf8');
  } catch (error) {
    console.error('Error logging chat message:', error);
  }
}

module.exports = {
  logChatMessage,
  getClientIp
};
