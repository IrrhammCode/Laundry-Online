const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// FR-11: Get Chat Messages for Order
router.get('/orders/:orderId/messages', async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.user.id;

    // Verify user has access to this order
    const [orders] = await db.execute(
      'SELECT id FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found or access denied'
      });
    }

    // Get messages
    const [messages] = await db.execute(`
      SELECT 
        m.id, m.body, m.created_at,
        u.name as sender_name, u.role as sender_role
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.order_id = ?
      ORDER BY m.created_at ASC
    `, [orderId]);

    res.json({
      ok: true,
      data: { messages }
    });

  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch messages'
    });
  }
});

// FR-11: Send Chat Message
router.post('/orders/:orderId/messages', [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const orderId = req.params.orderId;
    const userId = req.user.id;
    const { message } = req.body;

    // Verify user has access to this order
    const [orders] = await db.execute(
      'SELECT id FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found or access denied'
      });
    }

    // Save message
    const [result] = await db.execute(
      'INSERT INTO messages (order_id, sender_id, body) VALUES (?, ?, ?)',
      [orderId, userId, message]
    );

    // Get sender info
    const [users] = await db.execute(
      'SELECT name, role FROM users WHERE id = ?',
      [userId]
    );

    const messageData = {
      id: result.insertId,
      orderId,
      senderId: userId,
      senderName: users[0].name,
      senderRole: users[0].role,
      message,
      timestamp: new Date()
    };

    // Emit to all users in the order room
    if (global.io) {
      global.io.to(`order:${orderId}`).emit('message:new', messageData);
    }

    res.status(201).json({
      ok: true,
      data: { message: messageData }
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to send message'
    });
  }
});

// Get Notifications for User
router.get('/notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [notifications] = await db.execute(`
      SELECT 
        n.id, n.type, n.payload_json, n.sent_at, n.channel, n.created_at,
        o.id as order_id
      FROM notifications n
      JOIN orders o ON n.order_id = o.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, parseInt(limit), parseInt(offset)]);

    // Get total count
    const [countResult] = await db.execute(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [userId]
    );

    res.json({
      ok: true,
      data: {
        notifications,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult[0].total,
          pages: Math.ceil(countResult[0].total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch notifications'
    });
  }
});

// Mark Notification as Read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user.id;

    // Verify notification belongs to user
    const [notifications] = await db.execute(
      'SELECT id FROM notifications WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );

    if (notifications.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Notification not found'
      });
    }

    // Update notification
    await db.execute(
      'UPDATE notifications SET sent_at = NOW() WHERE id = ?',
      [notificationId]
    );

    res.json({
      ok: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// Get Unread Notification Count
router.get('/notifications/unread-count', async (req, res) => {
  try {
    const userId = req.user.id;

    const [result] = await db.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND sent_at IS NULL',
      [userId]
    );

    res.json({
      ok: true,
      data: { unreadCount: result[0].count }
    });

  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to get unread count'
    });
  }
});

module.exports = router;



