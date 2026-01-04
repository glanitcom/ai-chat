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
- `GEMINI_MODEL` - Gemini model (default: `gemini-3-pro`)
- `CHATGPT_MODEL` - ChatGPT model (default: `gpt-5`)

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

## Requirements

- **Node.js**: version 18.0.0 or higher (LTS 24.x recommended)
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
