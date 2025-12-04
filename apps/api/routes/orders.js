const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');

const router = express.Router();

// FR-14/15: Get Services (for price calculation)
router.get('/services', async (req, res) => {
  try {
    const [services] = await db.execute(
      'SELECT id, name, base_price, unit, description FROM services ORDER BY name'
    );

    res.json({
      ok: true,
      data: { services }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch services'
    });
  }
});

// FR-03: Create Order
router.post('/', [
  body('pickup_method').isIn(['PICKUP', 'SELF']).withMessage('Invalid pickup method'),
  body('items').isArray({ min: 1 }).withMessage('At least one item required'),
  body('items.*.service_id').isInt().withMessage('Valid service ID required'),
  body('items.*.qty').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
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

    const { pickup_method, items, notes } = req.body;
    const userId = req.user.id;

    // Start transaction
    const connection = await db.getConnection();
    await connection.beginTransaction();

    try {
      // Calculate total price
      let totalPrice = 0;
      const orderItems = [];

      for (const item of items) {
        // Get service details
        const [services] = await connection.execute(
          'SELECT id, name, base_price FROM services WHERE id = ?',
          [item.service_id]
        );

        if (services.length === 0) {
          throw new Error(`Service with ID ${item.service_id} not found`);
        }

        const service = services[0];
        const subtotal = service.base_price * item.qty;
        totalPrice += subtotal;

        orderItems.push({
          service_id: item.service_id,
          qty: item.qty,
          unit_price: service.base_price,
          subtotal
        });
      }

      // Create order
      const [orderResult] = await connection.execute(
        'INSERT INTO orders (user_id, pickup_method, status, price_total, notes) VALUES (?, ?, ?, ?, ?)',
        [userId, pickup_method, 'DIPESAN', totalPrice, notes || null]
      );

      const orderId = orderResult.insertId;

      // Create order items
      for (const item of orderItems) {
        await connection.execute(
          'INSERT INTO order_items (order_id, service_id, qty, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
          [orderId, item.service_id, item.qty, item.unit_price, item.subtotal]
        );
      }

      // Query #8 DPPL: Insert Pembayaran
      // DPPL: INSERT INTO pembayaran (pesanan_id, metode, bukti_transfer, status) VALUES (?, ?, ?, 'Menunggu Verifikasi');
      // Implementasi: Menggunakan tabel payments dengan struktur yang disesuaikan
      await connection.execute(
        'INSERT INTO payments (order_id, method, amount, status) VALUES (?, ?, ?, ?)',
        [orderId, 'QRIS', totalPrice, 'PENDING'] // Status PENDING setara dengan 'Menunggu Verifikasi'
      );

      await connection.commit();

      // Get complete order details
      const [orders] = await db.execute(`
        SELECT 
          o.id, o.pickup_method, o.status, o.price_total, o.notes, o.created_at,
          u.name as customer_name, u.phone, u.address
        FROM orders o
        JOIN users u ON o.user_id = u.id
        WHERE o.id = ?
      `, [orderId]);

      const [orderItemsData] = await db.execute(`
        SELECT 
          oi.id, oi.qty, oi.unit_price, oi.subtotal,
          s.name as service_name, s.unit
        FROM order_items oi
        JOIN services s ON oi.service_id = s.id
        WHERE oi.order_id = ?
      `, [orderId]);

      res.status(201).json({
        ok: true,
        data: {
          order: {
            ...orders[0],
            items: orderItemsData
          }
        }
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      ok: false,
      error: error.message || 'Failed to create order'
    });
  }
});

// FR-04: Get User Orders
// Query #2 & #10 DPPL: SELECT * FROM pesanan WHERE user_id = ? ORDER BY tanggal_pesan DESC;
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    // Query #2 & #10 DPPL - Sesuai dengan DPPL, ditambahkan pagination dan JOIN untuk item_count
    let query = `
      SELECT 
        o.id, o.pickup_method, o.status, o.price_total, o.created_at,
        COUNT(oi.id) as item_count
      FROM orders o
      LEFT JOIN order_items oi ON o.id = oi.order_id
      WHERE o.user_id = ?
    `;
    
    const params = [userId];

    if (status) {
      query += ' AND o.status = ?';
      params.push(status);
    }

    // ORDER BY created_at DESC sesuai DPPL (tanggal_pesan DESC)
    query += ' GROUP BY o.id ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [orders] = await db.execute(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM orders WHERE user_id = ?';
    const countParams = [userId];
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
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
    console.error('Get user orders error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch orders'
    });
  }
});

// FR-04: Get Order Detail
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.user.id;

    // Get order details
    const [orders] = await db.execute(`
      SELECT 
        o.id, o.pickup_method, o.status, o.price_total, o.notes, o.created_at, o.updated_at,
        u.name as customer_name, u.phone, u.address
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.id = ? AND o.user_id = ?
    `, [orderId, userId]);

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

    res.json({
      ok: true,
      data: {
        order: {
          ...orders[0],
          items: orderItems,
          payments
        }
      }
    });

  } catch (error) {
    console.error('Get order detail error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch order details'
    });
  }
});

// FR-09/16: Confirm Payment
router.post('/:orderId/payment/confirm', [
  body('method').isIn(['QRIS', 'TRANSFER']).withMessage('Invalid payment method'),
  body('amount').isDecimal().withMessage('Valid amount required')
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
    const { method, amount } = req.body;
    const userId = req.user.id;

    // Verify order belongs to user
    const [orders] = await db.execute(
      'SELECT id, price_total FROM orders WHERE id = ? AND user_id = ?',
      [orderId, userId]
    );

    if (orders.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Order not found'
      });
    }

    const order = orders[0];

    // Verify amount matches order total
    if (parseFloat(amount) !== parseFloat(order.price_total)) {
      return res.status(400).json({
        ok: false,
        error: 'Payment amount does not match order total'
      });
    }

    // Query #8 DPPL: Update Pembayaran setelah konfirmasi
    // Mengubah status dari 'PENDING' (Menunggu Verifikasi) menjadi 'PAID' (Terbayar)
    await db.execute(
      'UPDATE payments SET method = ?, amount = ?, status = "PAID", paid_at = NOW() WHERE order_id = ?',
      [method, amount, orderId]
    );

    res.json({
      ok: true,
      message: 'Payment confirmed successfully'
    });

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to confirm payment'
    });
  }
});

module.exports = router;
