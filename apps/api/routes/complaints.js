const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, requireRole } = require('../middleware/auth');
const complaintController = require('../controllers/complaintController');

const router = express.Router();

// Submit Complaint (Customer)
router.post('/', [
  authenticateToken,
  body('subject').trim().isLength({ min: 5, max: 255 }).withMessage('Subject must be 5-255 characters'),
  body('message').trim().isLength({ min: 10, max: 2000 }).withMessage('Message must be 10-2000 characters'),
  body('order_id').optional().isInt().withMessage('Invalid order ID')
], complaintController.submitComplaint);

// Get User Complaints
router.get('/me', authenticateToken, complaintController.getUserComplaints);

// Get Complaint Detail
router.get('/:id', authenticateToken, complaintController.getComplaintDetail);

// Admin: Get All Complaints
router.get('/admin/all', [
  authenticateToken,
  requireRole(['ADMIN'])
], complaintController.getAllComplaints);

// Admin: Update Complaint Status
router.patch('/admin/:id/status', [
  authenticateToken,
  requireRole(['ADMIN']),
  body('status').isIn(['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status'),
  body('admin_response').optional().trim().isLength({ max: 2000 }).withMessage('Response too long')
], complaintController.updateComplaintStatus);

module.exports = router;

