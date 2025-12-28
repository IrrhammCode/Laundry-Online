const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');

const router = express.Router();

// FR-01: User Registration
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim()
    .matches(/^08\d{8,11}$/).withMessage('Nomor telepon harus dimulai dengan 08 dan terdiri dari 10-13 digit angka'),
  body('address').optional({ nullable: true, checkFalsy: true }).trim()
], authController.register);

// FR-02: User Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], authController.login);

// FR-05: Admin Login (Hardcoded)
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
], authController.adminLogin);

// FR-08: Forgot Password - Cek email terdaftar
router.post('/forgot', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
], authController.forgotPassword);

// FR-08: Reset Password - Langsung update password dengan email
router.post('/reset-password', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authController.resetPassword);

// Logout
router.post('/logout', authController.logout);

// Get current user
router.get('/me', authController.getMe);

module.exports = router;


