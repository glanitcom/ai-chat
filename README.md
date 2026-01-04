# AI Chat Assistant for Company

AI chat assistant system with support for three providers: Grok 4, Gemini 2.5 Flash, and ChatGPT 5.

## Project Structure

```
ai-chat/
├── server/                # Server side (API)
│   ├── controllers/       # Controllers
│   ├── routes/           # API routes
│   ├── services/          # Services
│   │   └── providers/     # AI providers (Grok, Gemini, ChatGPT)
│   ├── utils/            # Utilities
│   │   ├── chatLogger.js # Chat logging utility
│   │   ├── rateLimiter.js # Rate limiting middleware
│   │   └── logger.js     # Logging utility
│   ├── config/           # Configuration
│   └── app.js            # Main server file
├── client/               # Client example
│   ├── index.html        # HTML page
│   ├── css/              # Styles
│   ├── js/               # JavaScript
│   └── README.md         # Client documentation
├── data/                 # Knowledge base
│   ├── company_info.json # Company information
│   ├── products.json     # Products catalog
│   ├── faq.json         # Frequently asked questions
│   └── stop_words.json  # Stop words and triggers
└── logs/                # Server logs
    ├── chats/           # Chat conversation logs (JSON)
    └── *.log            # Server logs by date
```

## Requirements

- **Node.js**: version 18.0.0 or higher
- **npm**: version 9.0.0 or higher

## Installation

See [INSTALL.md](INSTALL.md) for detailed installation instructions.

Quick start:

```bash
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AI Provider Selection
DEFAULT_AI_PROVIDER=grok

# API Keys
GROK_API_KEY=your_grok_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
CHATGPT_API_KEY=your_chatgpt_api_key_here

# Model Configuration
GROK_MODEL=grok-4
GEMINI_MODEL=gemini-2.5-flash
CHATGPT_MODEL=gpt-5

# API URLs
GROK_API_URL=https://api.x.ai/v1
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1
CHATGPT_API_URL=https://api.openai.com/v1

# Chat Configuration
MAX_MESSAGE_LENGTH=1000
MAX_HISTORY_MESSAGES=10
MAX_TOKENS=1000
TEMPERATURE=0.3

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_MIN_DELAY_MS=2000
RATE_LIMIT_BLOCK_DURATION_MS=300000
RATE_LIMIT_MAX_PER_MINUTE=20
RATE_LIMIT_MAX_PER_DAY=10000

# Security Configuration
REQUIRE_API_KEY=false
CLIENT_API_KEYS=your_client_api_key_1,your_client_api_key_2
TRUST_PROXY=false
TRUSTED_PROXIES=
```

### Knowledge Base

Edit files in `data/` folder:
- `company_info.json` - company information
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

## API Endpoints

### POST `/api/chat/message`
Send message to assistant.

**Request body:**
```json
{
  "message": "Message text",
  "sessionId": "session_id (optional)",
  "provider": "grok|gemini|chatgpt (optional)"
}
```

**Response:**
```json
{
  "sessionId": "session_id",
  "response": "Assistant response",
  "provider": "grok",
  "escalate": false
}
```

**Response with escalation:**
```json
{
  "sessionId": "session_id",
  "response": "Please hold while I connect you to an operator.",
  "provider": "grok",
  "escalate": true,
  "message": "Please hold while I connect you to an operator."
}
```

### GET `/api/chat/history/:sessionId`
Get chat history for a session.

**Response:**
```json
{
  "history": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2026-01-04T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help you?",
      "timestamp": "2026-01-04T10:00:01.000Z"
    }
  ]
}
```

### POST `/api/chat/escalate`
Request operator escalation.

**Request body:**
```json
{
  "sessionId": "session_id",
  "reason": "Escalation reason"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Connecting to operator...",
  "escalate": true
}
```

### GET `/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-04T10:00:00.000Z"
}
```

## AI Provider Configuration

### Select Default Provider

Set `DEFAULT_AI_PROVIDER` in `.env`:
- `grok` - Grok (default model: grok-4)
- `gemini` - Gemini (default model: gemini-2.5-flash)
- `chatgpt` - ChatGPT (default model: gpt-5)

### Configure Models

You can specify which model to use for each provider:

```env
GROK_MODEL=grok-4
GEMINI_MODEL=gemini-2.5-flash
CHATGPT_MODEL=gpt-5
```

### Provider-Specific Notes

**Grok:**
- API URL: `https://api.x.ai/v1`
- Uses `max_tokens` parameter

**Gemini:**
- API URL: `https://generativelanguage.googleapis.com/v1`
- Uses `maxOutputTokens` parameter
- Uses `x-goog-api-key` header for authentication
- Supports system instructions via conversation context

**ChatGPT:**
- API URL: `https://api.openai.com/v1`
- For GPT-5: uses `max_completion_tokens` instead of `max_tokens`
- For GPT-5: temperature parameter not supported (uses default value 1)

## Escalation System

The system supports automatic escalation to human operators in two ways:

1. **Trigger-based escalation**: Detects specific keywords in user messages (configured in `data/stop_words.json`)

2. **AI-determined escalation**: The AI model can decide to escalate by starting its response with `ESCALATE_TO_OPERATOR:`. The system automatically detects this marker and triggers escalation.

When escalation occurs:
- Response includes `escalate: true`
- Client receives alert notification
- Escalation is logged in chat logs

## Security

### API Authentication

The system supports optional API key authentication to protect your endpoints and prevent unauthorized usage of your AI API keys.

**Configuration:**

```env
# Enable API key requirement (set to true to require authentication)
REQUIRE_API_KEY=false

# Comma-separated list of valid client API keys
CLIENT_API_KEYS=your_client_api_key_1,your_client_api_key_2
```

**Usage:**

When `REQUIRE_API_KEY=true`, clients must provide an API key in one of these ways:

1. **Header** (recommended):
   ```
   X-API-Key: your_client_api_key_1
   ```

2. **Authorization header**:
   ```
   Authorization: Bearer your_client_api_key_1
   ```

3. **Query parameter** (less secure):
   ```
   ?apiKey=your_client_api_key_1
   ```

**Note:** If `REQUIRE_API_KEY=false` or `CLIENT_API_KEYS` is not set, authentication is optional. Rate limiting still applies.

### Proxy Support

For correct IP detection behind reverse proxies (Nginx, Cloudflare, etc.):

```env
# Enable trust proxy
TRUST_PROXY=true

# List of trusted proxy IPs (optional, for X-Forwarded-For parsing)
TRUSTED_PROXIES=10.0.0.1,10.0.0.2
```

The system automatically detects client IP from:
- `X-Forwarded-For` header (first IP when behind proxy)
- `X-Real-IP` header
- `CF-Connecting-IP` header (Cloudflare)
- Direct connection IP

### Rate Limiting

The system includes comprehensive rate limiting:

- **Minimum delay**: 2 seconds between requests (configurable via `RATE_LIMIT_MIN_DELAY_MS`)
- **Window limit**: 10 requests per 60 seconds (configurable)
- **Per-minute limit**: 20 requests per minute (configurable)
- **Daily limit**: 10,000 requests per day per identifier (configurable via `RATE_LIMIT_MAX_PER_DAY`)
- **Block duration**: 5 minutes when limits exceeded (configurable)

Rate limits are applied per identifier:
- **With API key**: Per API key (allows different limits per client)
- **Without API key**: Per IP address

**Note:** Current implementation uses in-memory storage. For multi-server/cluster deployments, consider implementing Redis-based rate limiting for synchronization.

Exceeded limits return HTTP 429 with `retryAfter` information.

## Logging

### Server Logs

Logs are saved in `logs/` folder with separation by level and date:
- `YYYY-MM-DD-info.log`
- `YYYY-MM-DD-error.log`
- `YYYY-MM-DD-warn.log`
- `YYYY-MM-DD-debug.log` (development mode only)

### Chat Logs

All chat conversations are logged in `logs/chats/` directory:
- One JSON file per session: `{sessionId}.json`
- Contains full conversation history with timestamps
- Includes IP address, user agent, and escalation information

**Chat log format:**
```json
{
  "sessionId": "session_1234567890_abc123",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "startTime": "2026-01-04T10:00:00.000Z",
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2026-01-04T10:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "Hi! How can I help?",
      "timestamp": "2026-01-04T10:00:01.000Z",
      "provider": "grok"
    }
  ],
  "lastUpdate": "2026-01-04T10:00:01.000Z"
}
```

## Client Example

A simple HTML/JS client example is provided in `client/` directory. See [client/README.md](client/README.md) for details.

To use the client:
1. Start the server: `npm run dev`
2. Open `client/index.html` in a browser
3. Configure API URL in `client/js/chat-widget.js` if needed

## Development

### Service Structure

- `chatService.js` - main message processing service, handles escalation detection
- `aiService.js` - router for AI provider selection
- `knowledgeBaseService.js` - knowledge base operations and system prompt generation
- `filterService.js` - filtering, stop words checking, and competitor detection
- `providers/` - implementations for each AI provider:
  - `grokService.js` - Grok API integration
  - `geminiService.js` - Gemini API integration
  - `chatgptService.js` - ChatGPT API integration

### Adding New AI Provider

1. Create file in `server/services/providers/` with `getResponse(message, systemPrompt, history, config)` function
2. Add configuration in `server/config/index.js`
3. Add handling in `server/services/aiService.js`

### Utilities

- `chatLogger.js` - logs all chat conversations to JSON files
- `rateLimiter.js` - rate limiting middleware with IP-based tracking
- `logger.js` - Winston-based logging utility
- `errorHandler.js` - global error handling middleware

## License

GNU General Public License v3.0
