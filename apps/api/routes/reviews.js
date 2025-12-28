const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

const router = express.Router();

// Submit Review
router.post('/', [
  authenticateToken,
  body('order_id').isInt().withMessage('Valid order ID required'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment too long'),
  body('service_id').optional().isInt().withMessage('Invalid service ID')
], reviewController.submitReview);

// Get Reviews for Order
router.get('/order/:orderId', reviewController.getOrderReviews);

// Get Reviews for Service
router.get('/service/:serviceId', reviewController.getServiceReviews);

// Get User Reviews
router.get('/me', authenticateToken, reviewController.getUserReviews);

// Get All Reviews (Admin)
router.get('/admin/all', [
  authenticateToken,
  requireRole(['ADMIN'])
], reviewController.getAllReviews);

module.exports = router;

