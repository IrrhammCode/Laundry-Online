const express = require('express');
const { body } = require('express-validator');
const chatController = require('../controllers/chatController');

const router = express.Router();

// FR-11: Get Chat Messages for Order
router.get('/orders/:orderId/messages', chatController.getOrderMessages);

// FR-11: Send Chat Message
router.post('/orders/:orderId/messages', [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters')
], chatController.sendMessage);

// Get Notifications for User
router.get('/notifications', chatController.getNotifications);

// Mark Notification as Read
router.patch('/notifications/:id/read', chatController.markNotificationRead);

// Get Unread Notification Count
router.get('/notifications/unread-count', chatController.getUnreadCount);

module.exports = router;



