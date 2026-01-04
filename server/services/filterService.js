const logger = require('../utils/logger');

let stopWords = null;

async function loadStopWords() {
  if (stopWords) {
    return stopWords;
  }

  try {
    const fs = require('fs').promises;
    const path = require('path');
    const data = await fs.readFile(
      path.join(__dirname, '../../data/stop_words.json'),
      'utf8'
    );
    stopWords = JSON.parse(data);
    return stopWords;
  } catch (error) {
    logger.error('Error loading stop words:', error);
    return {
      competitors: [],
      escalationTriggers: [],
      forbiddenTopics: []
    };
  }
}

async function checkEscalationTriggers(message) {
  const sw = await loadStopWords();
  const lowerMessage = message.toLowerCase();

  for (const trigger of sw.escalationTriggers) {
    if (lowerMessage.includes(trigger.toLowerCase())) {
      return {
        shouldEscalate: true,
        reason: `Escalation trigger detected: ${trigger}`
      };
    }
  }

  return {
    shouldEscalate: false,
    reason: null
  };
}

async function checkCompetitors(text) {
  const sw = await loadStopWords();
  const lowerText = text.toLowerCase();
  const foundCompetitors = [];

  for (const competitor of sw.competitors) {
    if (lowerText.includes(competitor.toLowerCase())) {
      foundCompetitors.push(competitor);
    }
  }

  return foundCompetitors;
}

async function filterResponse(response) {
  let filtered = response;

  const competitors = await checkCompetitors(filtered);
  if (competitors.length > 0) {
    logger.warn(`Competitors mentioned in response: ${competitors.join(', ')}`);
    competitors.forEach(competitor => {
      const regex = new RegExp(competitor, 'gi');
      filtered = filtered.replace(regex, '');
    });
    filtered = 'Our product has the following advantages: ' + filtered.trim();
  }

  const sw = await loadStopWords();
  for (const topic of sw.forbiddenTopics) {
    if (filtered.toLowerCase().includes(topic.toLowerCase())) {
      logger.warn(`Forbidden topic detected: ${topic}`);
      filtered = 'Sorry, I cannot discuss this topic. Can I help you with something else?';
      break;
    }
  }

  return filtered.trim();
}

module.exports = {
  checkEscalationTriggers,
  checkCompetitors,
  filterResponse
};
