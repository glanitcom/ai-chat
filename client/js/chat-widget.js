const ChatWidget = (function() {
    const API_BASE_URL = 'http://localhost:3000/api/chat';

    let sessionId = null;
    let messageContainer = null;
    let input = null;
    let sendBtn = null;
    let typingIndicator = null;
    let provider = null;

    function generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    function init(config = {}) {
        const apiUrl = config.apiUrl || API_BASE_URL;
        sessionId = config.sessionId || generateSessionId();
        provider = config.provider || null;

        messageContainer = document.getElementById('chat-messages');
        input = document.getElementById('chat-input');
        sendBtn = document.getElementById('send-btn');
        typingIndicator = document.getElementById('typing-indicator');

        if (!messageContainer || !input || !sendBtn) {
            console.error('Required elements not found');
            return;
        }

        sendBtn.addEventListener('click', () => sendMessage(apiUrl));
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage(apiUrl);
            }
        });

        const escalateBtn = document.getElementById('escalate-btn');
        if (escalateBtn) {
            escalateBtn.addEventListener('click', () => escalateToOperator(apiUrl));
        }

        addMessage('assistant', 'Hello! I am your AI assistant. How can I help you?');
    }

    async function sendMessage(apiUrl) {
        const message = input.value.trim();

        if (!message) {
            return;
        }

        addMessage('user', message);
        input.value = '';
        setLoading(true);

        try {
            const response = await fetch(`${apiUrl}/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    sessionId: sessionId,
                    provider: provider
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Error sending message');
            }

            if (data.escalate) {
                addMessage('assistant', data.message || data.response || 'Connecting you to an operator...');
                handleEscalation(data.reason);
            } else {
                addMessage('assistant', data.response);
            }

            if (data.sessionId) {
                sessionId = data.sessionId;
            }

        } catch (error) {
            console.error('Error sending message:', error);
            addMessage('assistant', 'Sorry, an error occurred. Please try again or contact an operator.');
        } finally {
            setLoading(false);
        }
    }

    function addMessage(role, content) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${role}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.textContent = content;

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });

        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        messageContainer.appendChild(messageDiv);

        messageContainer.scrollTop = messageContainer.scrollHeight;
    }

    function setLoading(loading) {
        if (typingIndicator) {
            typingIndicator.style.display = loading ? 'block' : 'none';
        }
        if (sendBtn) {
            sendBtn.disabled = loading;
        }
        if (input) {
            input.disabled = loading;
        }
    }

    async function escalateToOperator(apiUrl) {
        try {
            const response = await fetch(`${apiUrl}/escalate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: sessionId,
                    reason: 'User requested operator'
                })
            });

            const data = await response.json();
            addMessage('assistant', data.message || 'Connecting you to an operator...');
            handleEscalation(data.reason || 'User requested operator');
        } catch (error) {
            console.error('Error escalating:', error);
            addMessage('assistant', 'Please contact us by phone or email.');
        }
    }

    function handleEscalation(reason) {
        console.log('Escalating to operator for session:', sessionId);
        if (reason) {
            console.log('Escalation reason:', reason);
        }
        alert('Switching to operator');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
        });
    } else {
        init();
    }

    return {
        init: init
    };
})();

