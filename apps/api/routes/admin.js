const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Middleware to require admin role
router.use(authenticateToken, requireRole(['ADMIN']));

// FR-06: Get All Orders (Admin Dashboard)
router.get('/orders', adminController.getAllOrders);

// FR-07: Get Order Detail (Admin)
router.get('/orders/:id', adminController.getOrderDetail);

// Admin: Approve Order for Pickup (untuk order dengan pickup_method = PICKUP)
router.patch('/orders/:id/approve', adminController.approveOrder);

// Admin: Confirm Delivery (setelah DICUCI, admin trigger user untuk pilih delivery method)
router.patch('/orders/:id/confirm-delivery', [
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long')
], adminController.confirmDelivery);

// FR-12: Update Order Status
router.patch('/orders/:id/status', [
  body('status').isIn(['DIPESAN', 'PESANAN_DIJEMPUT', 'DIAMBIL', 'DICUCI', 'MENUNGGU_KONFIRMASI_DELIVERY', 'MENUNGGU_PEMBAYARAN_DELIVERY', 'MENUNGGU_AMBIL_SENDIRI', 'DIKIRIM', 'SELESAI']).withMessage('Invalid status'),
  body('notes').optional().trim().isLength({ max: 500 }).withMessage('Notes too long'),
  body('estimated_arrival').optional().isISO8601().withMessage('Invalid estimated_arrival format')
], adminController.updateStatus);

// FR-14: Manage Services
router.get('/services', adminController.getServices);

// Create Service
router.post('/services', [
  body('name').trim().isLength({ min: 2 }).withMessage('Service name required'),
  body('base_price').isDecimal().withMessage('Valid price required'),
  body('unit').trim().notEmpty().withMessage('Unit required'),
  body('description').optional().trim()
], adminController.createService);

// Update Service
router.put('/services/:id', [
  body('name').trim().isLength({ min: 2 }).withMessage('Service name required'),
  body('base_price').isDecimal().withMessage('Valid price required'),
  body('unit').trim().notEmpty().withMessage('Unit required'),
  body('description').optional().trim()
], adminController.updateService);

// Delete Service
router.delete('/services/:id', adminController.deleteService);

module.exports = router;
// FR-15: Dashboard Stats
router.get('/dashboard/stats', adminController.getDashboardStats);

// Analytics & Reports
router.get('/reports/sales', adminController.getSalesReport);
router.get('/reports/customers', adminController.getCustomersReport);
router.get('/reports/revenue', adminController.getRevenueReport);

// Admin: Get Chat Messages for Order
router.get('/orders/:orderId/messages', adminController.getOrderMessages);

// Admin: Send Chat Message
router.post('/orders/:orderId/messages', [
  body('message').trim().isLength({ min: 1, max: 1000 }).withMessage('Message must be 1-1000 characters')
], adminController.sendOrderMessage);

// Admin: Get Notifications
router.get('/notifications', adminController.getNotifications);

// Admin: Get Unread Notifications Count
router.get('/notifications/unread-count', adminController.getUnreadNotificationsCount);

// Admin: Mark Notification as Read
router.patch('/notifications/:id/read', adminController.markNotificationRead);

// Admin: Get All Reviews
router.get('/reviews', reviewController.getAllReviews);

module.exports = router;

// Helper function to get week number
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

module.exports = router;


