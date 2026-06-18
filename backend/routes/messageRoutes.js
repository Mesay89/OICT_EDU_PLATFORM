import express from 'express';
import {
  getConversations,
  getMessageHistory,
  sendMessage,
  getUnreadCount,
  markMessagesAsRead,
  getSupportContact,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/unread', protect, getUnreadCount);
router.get('/support', protect, getSupportContact);
router.put('/read/:conversationId', protect, markMessagesAsRead);

router.route('/')
  .post(protect, sendMessage);

router.route('/conversations')
  .get(protect, getConversations);

router.route('/:conversationId')
  .get(protect, getMessageHistory);

export default router;
