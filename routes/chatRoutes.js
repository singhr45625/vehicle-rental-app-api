const express = require('express');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');
const {
    getOrCreateChat,
    getMyChats,
    getMessages,
    sendMessage
} = require('../controllers/chatController');

router.use(authenticateUser);

router.post('/', getOrCreateChat);
router.get('/', getMyChats);
router.get('/:chatId/messages', getMessages);
router.post('/:chatId/messages', sendMessage);

module.exports = router;
