const fs = require('fs').promises;
const path = require('path');

const logDir = path.join(__dirname, '../../logs');

fs.mkdir(logDir, { recursive: true }).catch(() => {});

const logger = {
  info: (message, ...args) => {
    const logMessage = `[INFO] ${new Date().toISOString()} - ${message}`;
    console.log(logMessage, ...args);
    writeToFile('info', logMessage, args);
  },

  error: (message, ...args) => {
    const logMessage = `[ERROR] ${new Date().toISOString()} - ${message}`;
    console.error(logMessage, ...args);
    writeToFile('error', logMessage, args);
  },

  warn: (message, ...args) => {
    const logMessage = `[WARN] ${new Date().toISOString()} - ${message}`;
    console.warn(logMessage, ...args);
    writeToFile('warn', logMessage, args);
  },

  debug: (message, ...args) => {
    if (process.env.NODE_ENV === 'development') {
      const logMessage = `[DEBUG] ${new Date().toISOString()} - ${message}`;
      console.log(logMessage, ...args);
      writeToFile('debug', logMessage, args);
    }
  }
};

async function writeToFile(level, message, args) {
  try {
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `${date}-${level}.log`);
    const content = args.length > 0
      ? `${message} ${JSON.stringify(args)}\n`
      : `${message}\n`;

    await fs.appendFile(logFile, content, 'utf8');
  } catch (error) {
    console.error('Error writing to log file:', error);
  }
}

module.exports = logger;
