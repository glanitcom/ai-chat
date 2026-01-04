# Installation Instructions

## Installation Commands

Run the following commands in the project root directory:

### 1. Initialize project (if not done yet)
```bash
npm init -y
```

### 2. Install main dependencies
```bash
npm install express cors dotenv axios
```

### 3. Install development dependencies
```bash
npm install --save-dev nodemon
```

## Environment Setup

### 1. Create .env file from example
```bash
cp .env.example .env
```

### 2. Edit .env and add your API keys:
```bash
nano .env
# or
vim .env
```

Fill in the following variables:

**AI Provider Selection:**
- `DEFAULT_AI_PROVIDER` - select provider: `grok`, `gemini`, or `chatgpt`

**API Keys:**
- `GROK_API_KEY` - your xAI (Grok) API key
- `GEMINI_API_KEY` - your Google (Gemini) API key
- `CHATGPT_API_KEY` - your OpenAI (ChatGPT) API key

**Model Selection (optional):**
- `GROK_MODEL` - Grok model (default: `grok-4`)
- `GEMINI_MODEL` - Gemini model (default: `gemini-2.5-flash`)
- `CHATGPT_MODEL` - ChatGPT model (default: `gpt-5`)

**API URLs (optional, defaults provided):**
- `GROK_API_URL` - Grok API URL (default: `https://api.x.ai/v1`)
- `GEMINI_API_URL` - Gemini API URL (default: `https://generativelanguage.googleapis.com/v1`)
- `CHATGPT_API_URL` - ChatGPT API URL (default: `https://api.openai.com/v1`)

**Chat Configuration (optional):**
- `MAX_MESSAGE_LENGTH` - Maximum message length (default: 1000)
- `MAX_HISTORY_MESSAGES` - Maximum history messages (default: 10)
- `MAX_TOKENS` - Maximum tokens in response (default: 1000)
- `TEMPERATURE` - AI temperature (default: 0.3)

**Rate Limiting (optional):**
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds (default: 60000)
- `RATE_LIMIT_MAX_REQUESTS` - Max requests per window (default: 100)
- `RATE_LIMIT_MIN_DELAY_MS` - Minimum delay between requests (default: 2000)
- `RATE_LIMIT_BLOCK_DURATION_MS` - Block duration when limit exceeded (default: 300000)
- `RATE_LIMIT_MAX_PER_MINUTE` - Max requests per minute (default: 20)
- `RATE_LIMIT_MAX_PER_DAY` - Max requests per day per identifier (default: 10000)

**Security (optional):**
- `REQUIRE_API_KEY` - Require API key authentication (default: false). Set to `true` in production
- `CLIENT_API_KEYS` - Comma-separated list of valid client API keys (e.g., `key1,key2,key3`)
- `TRUST_PROXY` - Enable trust proxy for correct IP detection behind reverse proxy (default: false)
- `TRUSTED_PROXIES` - Comma-separated list of trusted proxy IPs (for X-Forwarded-For parsing)

### 3. Configure knowledge base

Edit files in `data/` folder:
- `company_info.json` - your company information
- `products.json` - products/services catalog
- `faq.json` - frequently asked questions
- `stop_words.json` - stop words, competitors, escalation triggers

## Running

### Development mode (with auto-reload):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

Server will start on port 3000 (or port specified in `PORT` environment variable).

## Verification

Open in browser:
- `http://localhost:3000/health` - server health check
- `http://localhost:3000/index.html` - client example (in development mode)

## Requirements

- **Node.js**: version 18.0.0 or higher
- **npm**: version 9.0.0 or higher

## Check Node.js Version

```bash
node --version
```

If version is lower than 18.0.0, update Node.js:
```bash
# Using nvm (recommended)
nvm install 24
nvm use 24

# Or download from official website
# https://nodejs.org/
```

## Features

- **Multiple AI Providers**: Support for Grok, Gemini, and ChatGPT
- **Chat Logging**: All conversations are logged to `logs/chats/` directory
- **Rate Limiting**: Comprehensive rate limiting with daily limits (per IP or API key)
- **API Authentication**: Optional API key authentication to protect endpoints
- **Proxy Support**: Correct IP detection behind reverse proxies (Nginx, Cloudflare)
- **Escalation System**: Automatic escalation to human operators
- **Knowledge Base**: Company info, products, FAQ integration
- **Client Example**: Simple HTML/JS client included

## Security Recommendations

1. **Enable API Authentication in Production**:
   ```env
   REQUIRE_API_KEY=true
   CLIENT_API_KEYS=your_secure_api_key_1,your_secure_api_key_2
   ```

2. **Configure Proxy Settings** (if behind reverse proxy):
   ```env
   TRUST_PROXY=true
   TRUSTED_PROXIES=10.0.0.1,10.0.0.2
   ```

3. **Use HTTPS**: Always use HTTPS in production to protect API keys in transit

4. **Rate Limiting**: Current implementation uses in-memory storage. For multi-server deployments, consider Redis-based rate limiting
