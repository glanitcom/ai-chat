# AI Chat Assistant for Company

AI chat assistant system with support for three providers: Grok 4, Gemini 3 PRO and ChatGPT 5.

## Project Structure

```
ai-chat/
├── server/                # Server side (API)
│   ├── controllers/       # Controllers
│   ├── models/            # Data models
│   ├── routes/            # API routes
│   ├── services/          # Services
│   │   └── providers/     # AI providers (Grok, Gemini, ChatGPT)
│   ├── utils/            # Utilities
│   ├── config/           # Configuration
│   └── app.js            # Main server file
├── data/                 # Knowledge base
│   ├── company_info.json # Company information
│   ├── products.json     # Products catalog
│   ├── faq.json         # Frequently asked questions
│   └── stop_words.json  # Stop words and triggers
├── logs/                # Server logs
└── tests/               # Tests
```

## Requirements

- **Node.js**: version 18.0.0 or higher (LTS 24.x recommended)
- **npm**: version 9.0.0 or higher

## Installation

Run the following commands in the project root directory:

```bash
# Initialize project (if not done yet)
npm init -y

# Install main dependencies
npm install express cors dotenv axios

# Install development dependencies
npm install --save-dev nodemon
```

## Configuration

1. **Copy `.env.example` to `.env`:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and configure:**
   ```env
   # Select AI provider (grok, gemini, or chatgpt)
   DEFAULT_AI_PROVIDER=grok

   # API keys
   GROK_API_KEY=your_grok_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   CHATGPT_API_KEY=your_chatgpt_api_key_here

   # Model selection for each provider
   GROK_MODEL=grok-4
   GEMINI_MODEL=gemini-3-pro
   CHATGPT_MODEL=gpt-5
   ```

3. **Configure knowledge base:**
   - Edit files in `data/` folder:
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

### GET `/api/chat/history/:sessionId`
Get chat history.

### POST `/api/chat/escalate`
Request operator escalation.

**Request body:**
```json
{
  "sessionId": "session_id",
  "reason": "Escalation reason"
}
```

## AI Provider Configuration

Configure AI provider and models in `.env` file:

### Select Default Provider
```env
DEFAULT_AI_PROVIDER=grok
```
Options: `grok`, `gemini`, or `chatgpt`

### Configure Models
You can specify which model to use for each provider:

```env
# Grok models
GROK_MODEL=grok-4

# Gemini models
GEMINI_MODEL=gemini-3-pro

# ChatGPT models
CHATGPT_MODEL=gpt-5
```

Available providers:
- `grok` - Grok (default model: grok-4)
- `gemini` - Gemini (default model: gemini-3-pro)
- `chatgpt` - ChatGPT (default model: gpt-5)

## Logging

Logs are saved in `logs/` folder with separation by level and date:
- `YYYY-MM-DD-info.log`
- `YYYY-MM-DD-error.log`
- `YYYY-MM-DD-warn.log`
- `YYYY-MM-DD-debug.log` (development mode only)

## Development

### Service Structure

- `chatService.js` - main message processing service
- `aiService.js` - router for AI provider selection
- `knowledgeBaseService.js` - knowledge base operations
- `filterService.js` - filtering and stop words checking
- `providers/` - implementations for each AI provider

### Adding New AI Provider

1. Create file in `server/services/providers/` with `getResponse()` function implementation
2. Add configuration in `server/config/index.js`
3. Add handling in `server/services/aiService.js`

## License

ISC
