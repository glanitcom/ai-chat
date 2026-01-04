const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');

router.post('/message', chatController.handleMessage);
router.get('/history/:sessionId', chatController.getHistory);
router.post('/escalate', chatController.escalateToOperator);

module.exports = router;
