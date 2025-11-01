const express = require('express');
const { body, validationResult } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const db = require('../config/database');
const nodemailer = require('nodemailer');

const router = express.Router();

// Middleware to require admin role
router.use(authenticateToken, requireRole(['ADMIN']));

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// FR-06: Get All Orders (Admin Dashboard)
router.get('/orders', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        o.id, o.pickup_method, o.status, o.price_total, o.created_at, o.updated_at,
        u.name as customer_name, u.phone, u.email
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('o.status = ?');
      params.push(status);
    }

    if (search) {
      conditions.push('(u.name LIKE ? OR u.email LIKE ? OR o.id LIKE ?)');
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await db.execute(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM orders o
      JOIN users u ON o.user_id = u.id
    `;
    const countParams = [];
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
      countParams.push(...params.slice(0, -2)); // Remove limit and offset
    }

    const [countResult] = await db.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      ok: true,
      data: {
        orders,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get admin orders error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch orders'
    });
  }
});

// FR-07: Get Order Detail (Admin)
router.get('/orders/:id', async (req, res) => {
  try {
    const orderId = req.params.id;

    // Get order details
    const [orders] = await db.execute(`
      SELECT 
        o.id, o.pickup_method, o.status, o.price_total, o.notes, o.created_at, o.updated_at,
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

    // Get payment info
    const [payments] = await db.execute(
      'SELECT id, method, amount, status, paid_at, created_at FROM payments WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );

    // Get courier updates
    const [courierUpdates] = await db.execute(`
      SELECT 
        cu.id, cu.delivery_status, cu.notes, cu.created_at,
        u.name as courier_name
      FROM courier_updates cu
      JOIN users u ON cu.courier_id = u.id
      WHERE cu.order_id = ?
      ORDER BY cu.created_at DESC
    `, [orderId]);

    // Get chat messages
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
      data: {
        order: {
          ...orders[0],
          items: orderItems,
          payments,
          courier_updates: courierUpdates,
          messages
        }
      }
    });

  } catch (error) {
    console.error('Get admin order detail error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch order details'
    });
  }
});

// FR-12: Update Order Status
router.patch('/orders/:id/status', [
  body('status').isIn(['DIPESAN', 'DIJEMPUT', 'DICUCI', 'DIKIRIM', 'SELESAI']).withMessage('Invalid status'),
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
    const { status, notes } = req.body;

    // Get current order
    const [orders] = await db.execute(
      'SELECT id, status, user_id FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    const order = orders[0];

    // Validate status transition
    const validTransitions = {
      'DIPESAN': ['DIJEMPUT'],
      'DIJEMPUT': ['DICUCI'],
      'DICUCI': ['DIKIRIM'],
      'DIKIRIM': ['SELESAI'],
      'SELESAI': []
    };

    if (!validTransitions[order.status].includes(status)) {
      return res.status(400).json({
        ok: false,
        error: `Cannot transition from ${order.status} to ${status}`
      });
    }

    // Update order status
    await db.execute(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, orderId]
    );

    // Create notification
    await db.execute(
      'INSERT INTO notifications (order_id, user_id, type, payload_json, channel) VALUES (?, ?, ?, ?, ?)',
      [orderId, order.user_id, 'status_update', JSON.stringify({ status, notes }), 'EMAIL']
    );

    // Send email notification
    try {
      const [users] = await db.execute(
        'SELECT name, email FROM users WHERE id = ?',
        [order.user_id]
      );

      if (users.length > 0) {
        const user = users[0];
        const transporter = createTransporter();
        
        const statusMessages = {
          'DIJEMPUT': 'Your laundry order has been picked up and is on its way to our facility.',
          'DICUCI': 'Your laundry is now being processed and cleaned.',
          'DIKIRIM': 'Your laundry has been cleaned and is out for delivery.',
          'SELESAI': 'Your laundry order has been completed and delivered.'
        };

        await transporter.sendMail({
          from: process.env.SMTP_FROM,
          to: user.email,
          subject: `Order Status Update - Order #${orderId}`,
          html: `
            <h2>Order Status Update</h2>
            <p>Hello ${user.name},</p>
            <p>Your order #${orderId} status has been updated to: <strong>${status}</strong></p>
            <p>${statusMessages[status] || 'Your order status has been updated.'}</p>
            ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
            <p>Thank you for using our laundry service!</p>
          `
        });
      }
    } catch (emailError) {
      console.error('Failed to send email notification:', emailError);
    }

    // Emit socket event
    if (global.io) {
      global.io.to(`order:${orderId}`).emit('order.status.updated', {
        orderId,
        status,
        notes,
        timestamp: new Date()
      });
    }

    res.json({
      ok: true,
      message: 'Order status updated successfully'
    });

  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update order status'
    });
  }
});

// FR-14: Manage Services
router.get('/services', async (req, res) => {
  try {
    const [services] = await db.execute(
      'SELECT id, name, base_price, unit, description, created_at FROM services ORDER BY name'
    );

    res.json({
      ok: true,
      data: { services }
    });
  } catch (error) {
    console.error('Get admin services error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch services'
    });
  }
});

// Create Service
router.post('/services', [
  body('name').trim().isLength({ min: 2 }).withMessage('Service name required'),
  body('base_price').isDecimal().withMessage('Valid price required'),
  body('unit').trim().notEmpty().withMessage('Unit required'),
  body('description').optional().trim()
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

    const { name, base_price, unit, description } = req.body;

    const [result] = await db.execute(
      'INSERT INTO services (name, base_price, unit, description) VALUES (?, ?, ?, ?)',
      [name, base_price, unit, description || null]
    );

    res.status(201).json({
      ok: true,
      data: {
        service: {
          id: result.insertId,
          name,
          base_price,
          unit,
          description
        }
      }
    });

  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to create service'
    });
  }
});

// Update Service
router.put('/services/:id', [
  body('name').trim().isLength({ min: 2 }).withMessage('Service name required'),
  body('base_price').isDecimal().withMessage('Valid price required'),
  body('unit').trim().notEmpty().withMessage('Unit required'),
  body('description').optional().trim()
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

    const serviceId = req.params.id;
    const { name, base_price, unit, description } = req.body;

    const [result] = await db.execute(
      'UPDATE services SET name = ?, base_price = ?, unit = ?, description = ? WHERE id = ?',
      [name, base_price, unit, description || null, serviceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Service not found'
      });
    }

    res.json({
      ok: true,
      message: 'Service updated successfully'
    });

  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to update service'
    });
  }
});

// Delete Service
router.delete('/services/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Check if service is used in any orders
    const [orderItems] = await db.execute(
      'SELECT COUNT(*) as count FROM order_items WHERE service_id = ?',
      [serviceId]
    );

    if (orderItems[0].count > 0) {
      return res.status(400).json({
        ok: false,
        error: 'Cannot delete service that is used in orders'
      });
    }

    const [result] = await db.execute(
      'DELETE FROM services WHERE id = ?',
      [serviceId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Service not found'
      });
    }

    res.json({
      ok: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to delete service'
    });
  }
});

// Get Dashboard Stats
router.get('/dashboard/stats', async (req, res) => {
  try {
    // Get order counts by status
    const [orderStats] = await db.execute(`
      SELECT 
        status,
        COUNT(*) as count
      FROM orders 
      WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
      GROUP BY status
    `);

    // Get total revenue
    const [revenueResult] = await db.execute(`
      SELECT 
        SUM(price_total) as total_revenue,
        COUNT(*) as total_orders
      FROM orders 
      WHERE status = 'SELESAI' 
      AND DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    `);

    // Get recent orders
    const [recentOrders] = await db.execute(`
      SELECT 
        o.id, o.status, o.price_total, o.created_at,
        u.name as customer_name
      FROM orders o
      JOIN users u ON o.user_id = u.id
      ORDER BY o.created_at DESC
      LIMIT 5
    `);

    res.json({
      ok: true,
      data: {
        orderStats,
        revenue: revenueResult[0],
        recentOrders
      }
    });

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch dashboard stats'
    });
  }
});

module.exports = router;


