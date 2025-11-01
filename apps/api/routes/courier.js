const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');

const router = express.Router();

// Middleware to require courier role
router.use(authenticateToken, requireRole(['COURIER']));

// Get Courier Dashboard - Orders assigned to courier
router.get('/orders', async (req, res) => {
  try {
    const courierId = req.user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        o.id, o.pickup_method, o.status, o.price_total, o.created_at,
        u.name as customer_name, u.phone, u.address
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.status IN ('DIJEMPUT', 'DIKIRIM')
    `;
    
    const params = [];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    query += ' ORDER BY o.created_at DESC';

    const [orders] = await db.execute(query, params);

    // Get courier updates for each order
    for (let order of orders) {
      const [updates] = await db.execute(
        'SELECT delivery_status, notes, created_at FROM courier_updates WHERE order_id = ? AND courier_id = ? ORDER BY created_at DESC LIMIT 1',
        [order.id, courierId]
      );
      
      order.latest_update = updates[0] || null;
    }

    res.json({
      ok: true,
      data: { orders }
    });

  } catch (error) {
    console.error('Get courier orders error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch courier orders'
    });
  }
});

// Get Order Detail for Courier
router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get order details
    const [orders] = await db.execute(`
      SELECT 
        o.id, o.pickup_method, o.status, o.price_total, o.notes, o.created_at,
        u.name as customer_name, u.phone, u.email, u.address
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ?
    `, [orderId]);

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    // Get order items
    const [orderItems] = await db.execute(`
      SELECT 
        oi.id, oi.qty, oi.unit_price, oi.subtotal,
        s.name as service_name, s.unit
      FROM order_items oi
      JOIN services s ON oi.service_id = s.id
      WHERE oi.order_id = ?
    `, [orderId]);

    // Get courier updates for this order
    const [courierUpdates] = await db.execute(`
      SELECT 
        cu.id, cu.delivery_status, cu.notes, cu.created_at,
        u.name as courier_name
      FROM courier_updates cu
      JOIN users u ON cu.courier_id = u.id
      WHERE cu.order_id = ?
      ORDER BY cu.created_at DESC
    `, [orderId]);

    res.json({
      ok: true,
      data: {
        order: {
          ...orders[0],
          items: orderItems,
          courier_updates: courierUpdates
        }
      }
    });

  } catch (error) {
    console.error('Get courier order detail error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch order details'
    });
  }
});

// Pick Up Order
router.post('/orders/:id/pickup', [
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
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

    const orderId = req.params.id;
    const courierId = req.user.id;
    const { notes } = req.body;

    // Check if order exists and is in correct status
    const [orders] = await db.execute(
      'SELECT id, status FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    const order = orders[0];

    if (order.status !== 'DIJEMPUT') {
      return res.status(400).json({
        ok: false,
        error: 'Order is not ready for pickup'
      });
    }

    // Create courier update
    await db.execute(
      'INSERT INTO courier_updates (order_id, courier_id, delivery_status, notes) VALUES (?, ?, ?, ?)',
      [orderId, courierId, 'PICKED_UP', notes || null]
    );

    // Update order status to DICUCI
    await db.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      ['DICUCI', orderId]
    );

    // Emit socket event
    if (global.io) {
      global.io.to(`order:${orderId}`).emit('order.status.updated', {
        orderId,
        status: 'DICUCI',
        notes: 'Order picked up by courier',
        timestamp: new Date()
      });
    }

    res.json({
      ok: true,
      message: 'Order picked up successfully'
    });

  } catch (error) {
    console.error('Pickup order error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to pickup order'
    });
  }
});

// Deliver Order
router.post('/orders/:id/deliver', [
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
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

    const orderId = req.params.id;
    const courierId = req.user.id;
    const { notes } = req.body;

    // Check if order exists and is in correct status
    const [orders] = await db.execute(
      'SELECT id, status FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    const order = orders[0];

    if (order.status !== 'DIKIRIM') {
      return res.status(400).json({
        ok: false,
        error: 'Order is not ready for delivery'
      });
    }

    // Create courier update
    await db.execute(
      'INSERT INTO courier_updates (order_id, courier_id, delivery_status, notes) VALUES (?, ?, ?, ?)',
      [orderId, courierId, 'DELIVERED', notes || null]
    );

    // Update order status to SELESAI
    await db.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      ['SELESAI', orderId]
    );

    // Emit socket event
    if (global.io) {
      global.io.to(`order:${orderId}`).emit('order.status.updated', {
        orderId,
        status: 'SELESAI',
        notes: 'Order delivered successfully',
        timestamp: new Date()
      });
    }

    res.json({
      ok: true,
      message: 'Order delivered successfully'
    });

  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to deliver order'
    });
  }
});

// Update Delivery Status
router.post('/orders/:id/delivery-status', [
  body('delivery_status').isIn(['PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED']).withMessage('Invalid delivery status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
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

    const orderId = req.params.id;
    const courierId = req.user.id;
    const { delivery_status, notes } = req.body;

    // Check if order exists
    const [orders] = await db.execute(
      'SELECT id, status FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    // Create courier update
    await db.execute(
      'INSERT INTO courier_updates (order_id, courier_id, delivery_status, notes) VALUES (?, ?, ?, ?)',
      [orderId, courierId, delivery_status, notes || null]
    );

    // Update order status based on delivery status
    let newOrderStatus = null;
    if (delivery_status === 'OUT_FOR_DELIVERY') {
      newOrderStatus = 'DIKIRIM';
    } else if (delivery_status === 'DELIVERED') {
      newOrderStatus = 'SELESAI';
    }

    if (newOrderStatus) {
      await db.execute(
        'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
        [newOrderStatus, orderId]
      );
    }

    // Emit socket event
    if (global.io) {
      global.io.to(`order:${orderId}`).emit('order.status.updated', {
        orderId,
        status: newOrderStatus || orders[0].status,
        delivery_status,
        notes,
        timestamp: new Date()
      });
    }

    res.json({
      ok: true,
      message: 'Delivery status updated successfully'
    });

  } catch (error) {
    console.error('Update delivery status error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update delivery status'
    });
  }
});

// Get Courier Profile
router.get('/profile', async (req, res) => {
  try {
    const courierId = req.user.id;

    const [users] = await db.execute(
      'SELECT id, name, email, phone, address FROM users WHERE id = ?',
      [courierId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Courier not found'
      });
    }

    // Get courier stats
    const [stats] = await db.execute(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN delivery_status = 'DELIVERED' THEN 1 END) as completed_deliveries
      FROM courier_updates 
      WHERE courier_id = ?
    `, [courierId]);

    res.json({
      ok: true,
      data: {
        courier: users[0],
        stats: stats[0]
      }
    });

  } catch (error) {
    console.error('Get courier profile error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch courier profile'
    });
  }
});

// Update Courier Profile
router.put('/profile', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phone').optional().isMobilePhone('id-ID').withMessage('Valid phone number required'),
  body('address').optional().trim().isLength({ min: 10 }).withMessage('Address must be at least 10 characters')
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

    const courierId = req.user.id;
    const { name, phone, address } = req.body;

    await db.execute(
      'UPDATE users SET name = ?, phone = ?, address = ? WHERE id = ?',
      [name, phone || null, address || null, courierId]
    );

    res.json({
      ok: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update courier profile error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;



