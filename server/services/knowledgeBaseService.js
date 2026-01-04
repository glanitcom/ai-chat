const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

let knowledgeBase = null;

async function loadKnowledgeBase() {
  try {
    if (knowledgeBase) {
      return knowledgeBase;
    }

    const dataDir = path.join(__dirname, '../../data');

    const [companyInfo, products, faq, stopWords] = await Promise.all([
      fs.readFile(path.join(dataDir, 'company_info.json'), 'utf8'),
      fs.readFile(path.join(dataDir, 'products.json'), 'utf8'),
      fs.readFile(path.join(dataDir, 'faq.json'), 'utf8'),
      fs.readFile(path.join(dataDir, 'stop_words.json'), 'utf8')
    ]);

    const productsData = JSON.parse(products);
    const faqData = JSON.parse(faq);

    knowledgeBase = {
      companyInfo: JSON.parse(companyInfo),
      products: productsData.products || productsData,
      faq: faqData.faq || faqData,
      stopWords: JSON.parse(stopWords)
    };

    logger.info('Knowledge base loaded successfully');
    return knowledgeBase;
  } catch (error) {
    logger.error('Error loading knowledge base:', error);
    throw error;
  }
}

async function searchRelevantInfo(message) {
  const kb = await loadKnowledgeBase();
  const lowerMessage = message.toLowerCase();

  const relevantInfo = {
    faq: [],
    products: [],
    companyInfo: null
  };

  kb.faq.forEach(item => {
    const questionLower = item.question.toLowerCase();
    const keywords = item.keywords || [];

    if (questionLower.includes(lowerMessage) ||
        lowerMessage.includes(questionLower) ||
        keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
      relevantInfo.faq.push(item);
    }
  });

  kb.products.forEach(product => {
    const productNameLower = product.name.toLowerCase();
    const descriptionLower = (product.description || '').toLowerCase();

    if (lowerMessage.includes(productNameLower) ||
        descriptionLower.includes(lowerMessage) ||
        lowerMessage.includes(product.category?.toLowerCase() || '')) {
      relevantInfo.products.push(product);
    }
  });

  relevantInfo.companyInfo = kb.companyInfo;

  return relevantInfo;
}

async function getSystemPrompt(context) {
  const kb = await loadKnowledgeBase();

  let prompt = `You are an assistant for ${kb.companyInfo.name}.\n\n`;
  prompt += `Company description: ${kb.companyInfo.description}\n\n`;

  if (kb.companyInfo.contact) {
    prompt += `Contact information:\n`;
    if (kb.companyInfo.contact.phone) {
      prompt += `Phone: ${kb.companyInfo.contact.phone}\n`;
    }
    if (kb.companyInfo.contact.email) {
      prompt += `Email: ${kb.companyInfo.contact.email}\n`;
    }
    if (kb.companyInfo.contact.addresses && kb.companyInfo.contact.addresses.length > 0) {
      prompt += `Addresses: ${kb.companyInfo.contact.addresses.join(', ')}\n`;
    }
    prompt += `Working hours: ${kb.companyInfo.workingHours}\n\n`;
  }

  prompt += `Strict rules:\n`;
  prompt += `- Never mention competitors: ${kb.stopWords.competitors.join(', ')}\n`;
  prompt += `- If a product is out of stock, do not suggest alternatives from other companies\n`;
  prompt += `- If the client asks for a human, immediately escalate to an operator\n`;
  prompt += `- Do not discuss politics, religion, or personal topics\n`;
  prompt += `- Use only information from the provided context\n\n`;

  if (context.faq.length > 0) {
    prompt += `Relevant FAQ:\n`;
    context.faq.forEach(item => {
      prompt += `Question: ${item.question}\nAnswer: ${item.answer}\n\n`;
    });
  }

  if (context.products.length > 0) {
    prompt += `Relevant products:\n`;
    context.products.forEach(product => {
      prompt += `Name: ${product.name}\n`;
      prompt += `Description: ${product.description}\n`;
      prompt += `Price: ${product.price} ${product.currency || 'USD'}\n`;
      prompt += `Availability: ${product.availability ? 'In stock' : 'Out of stock'}\n`;
      if (product.features) {
        prompt += `Features: ${product.features.join(', ')}\n`;
      }
      prompt += `\n`;
    });
  }

  prompt += `\nRespond briefly, politely and professionally. If you don't know the answer, suggest contacting an operator.\n\n`;
  prompt += `CRITICAL INSTRUCTION: If the user requests to speak with a human operator, wants to talk to a person, asks for a human, or if you determine that the situation requires human intervention, you MUST start your response with exactly: "ESCALATE_TO_OPERATOR:" followed by a space and then your message. For example: "ESCALATE_TO_OPERATOR: Please hold while I connect you to an operator." This is the ONLY way to trigger operator escalation.`;

  return prompt;
}

module.exports = {
  loadKnowledgeBase,
  searchRelevantInfo,
  getSystemPrompt
};
