# Chat Widget Client Example

Simple HTML/CSS/JS client example for AI Chat Assistant API.

## Files Structure

```
client/
├── index.html          # Main HTML page
├── css/
│   └── styles.css     # Styles
├── js/
│   └── chat-widget.js  # Widget JavaScript
└── README.md          # This file
```

## Configuration

### API Server URL

To change the API server URL, edit `chat-widget.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000/api/chat';
```

Change `http://localhost:3000` to your server URL.

### Custom Configuration

You can also initialize the widget with custom configuration:

```javascript
ChatWidget.init({
    apiUrl: 'https://your-api-server.com/api/chat',
    sessionId: 'custom-session-id',
    provider: 'grok' // or 'gemini', 'chatgpt', or null for default
});
```

## Local Development

### Option 1: Using Development Server

If you run the API server in development mode, the client files are automatically served:

1. Start the API server:
   ```bash
   npm run dev
   ```

2. Open in browser:
   ```
   http://localhost:3000/index.html
   ```

### Option 2: Standalone (File Protocol)

You can open `index.html` directly in browser, but you need to:

1. Edit `chat-widget.js` and set the correct API URL
2. Make sure CORS is enabled on the API server
3. Open `index.html` in browser

Note: Some browsers may block local file requests due to CORS policy.

### Option 3: Using Simple HTTP Server

Use a simple HTTP server to serve the files:

```bash
# Using Python
python3 -m http.server 8080

# Using Node.js http-server
npx http-server -p 8080

# Using PHP
php -S localhost:8080
```

Then open: `http://localhost:8080/index.html`

## Integration on Website

1. Copy files to your website:
   - `css/styles.css`
   - `js/chat-widget.js`

2. Include in your HTML:
   ```html
   <link rel="stylesheet" href="path/to/css/styles.css">
   <script src="path/to/js/chat-widget.js"></script>
   ```

3. Add widget HTML structure:
   ```html
   <div id="chat-widget" class="chat-widget">
       <div class="chat-header">
           <h3>Chat with Assistant</h3>
           <button id="escalate-btn" class="escalate-btn">Contact Operator</button>
       </div>
       <div id="chat-messages" class="chat-messages"></div>
       <div class="chat-input-container">
           <input type="text" id="chat-input" placeholder="Type your message..." />
           <button id="send-btn">Send</button>
       </div>
       <div class="typing-indicator" id="typing-indicator" style="display: none;">
           Assistant is typing...
       </div>
   </div>
   ```

4. Initialize widget (optional):
   ```javascript
   ChatWidget.init({
       apiUrl: 'https://your-api-server.com/api/chat',
       provider: 'grok'
   });
   ```

## API Endpoints Used

- `POST /api/chat/message` - Send message
- `POST /api/chat/escalate` - Escalate to operator

## Browser Compatibility

Works in all modern browsers that support:
- ES6 (const, let, arrow functions)
- Fetch API
- CSS Flexbox

