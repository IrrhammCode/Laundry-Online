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
    const { data: orderData, error: orderError } = await db
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !orderData) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found or access denied'
      });
    }

    // Get messages
    const { data: messagesData, error: messagesError } = await db
      .from('messages')
      .select('id, body, created_at, sender_id')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;

    // Get sender details for each message
    const messages = await Promise.all(
      (messagesData || []).map(async (msg) => {
        const { data: senderData, error: senderErr } = await db
          .from('users')
          .select('name, role')
          .eq('id', msg.sender_id)
          .single();

        if (senderErr) throw senderErr;

        return {
          id: msg.id,
          body: msg.body,
          created_at: msg.created_at,
          sender_name: senderData.name,
          sender_role: senderData.role
        };
      })
    );

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
    const { data: orderData, error: orderError } = await db
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (orderError || !orderData) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found or access denied'
      });
    }

    // Save message (untuk chat support)
    // Catatan: Query ini untuk chat, bukan notifikasi sesuai Query #18 DPPL
    const { data: newMessage, error: insertError } = await db
      .from('messages')
      .insert({
        order_id: orderId,
        sender_id: userId,
        body: message
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Get sender info
    const { data: userData, error: userError } = await db
      .from('users')
      .select('name, role')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    const messageData = {
      id: newMessage.id,
      orderId,
      senderId: userId,
      senderName: userData.name,
      senderRole: userData.role,
      message,
      timestamp: new Date(newMessage.created_at)
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

    const { data: notifications, error: notifError } = await db
      .from('notifications')
      .select('id, type, payload_json, sent_at, channel, created_at, order_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + parseInt(limit) - 1);

    if (notifError) throw notifError;

    // Get total count
    const { count, error: countError } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) throw countError;

    res.json({
      ok: true,
      data: {
        notifications: notifications || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
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
    const { data: notifData, error: notifError } = await db
      .from('notifications')
      .select('id')
      .eq('id', notificationId)
      .eq('user_id', userId)
      .single();

    if (notifError || !notifData) {
      return res.status(404).json({
        ok: false,
        error: 'Notification not found'
      });
    }

    // Update notification
    const { error: updateError } = await db
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (updateError) throw updateError;

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

    const { count, error: countError } = await db
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('sent_at', null);

    if (countError) throw countError;

    res.json({
      ok: true,
      data: { unreadCount: count || 0 }
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



