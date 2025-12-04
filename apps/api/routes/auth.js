const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const db = require('../config/database');

const router = express.Router();

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

// FR-01: User Registration
router.post('/register', [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional({ nullable: true, checkFalsy: true }).trim()
    .matches(/^08\d{8,11}$/).withMessage('Nomor telepon harus dimulai dengan 08 dan terdiri dari 10-13 digit angka'),
  body('address').optional({ nullable: true, checkFalsy: true }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        ok: false,
        error: 'Validation failed',
        details: errors.array(),
        message: errors.array().map(e => e.msg).join(', ')
      });
    }

    const { name, email, password, phone, address } = req.body;

    // Query #6 DPPL: Cek apakah email sudah terdaftar
    // DPPL: SELECT COUNT(*) FROM user WHERE email = ?;
    // Implementasi: Menggunakan SELECT id untuk cek keberadaan (lebih efisien)
    const [existingUsers] = await db.execute(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        ok: false,
        error: 'Email sudah terdaftar. Silakan gunakan email lain atau login dengan email ini.',
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login dengan email ini.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password_hash, phone, address, role) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, passwordHash, phone || null, address || null, 'CUSTOMER']
    );

    // Generate JWT token
    const token = jwt.sign(
      { userId: result.insertId, role: 'CUSTOMER' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      ok: true,
      data: {
        user: {
          id: result.insertId,
          name,
          email,
          phone,
          address,
          role: 'CUSTOMER'
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      ok: false,
      error: 'Registration failed'
    });
  }
});

// FR-02: User Login
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
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

    const { email, password } = req.body;

    // Check hardcoded admin first
    const ADMIN_EMAIL = 'admin@laundry.com';
    const ADMIN_PASSWORD = 'admin123';
    const ADMIN_ID = 1;
    const ADMIN_NAME = 'Admin User';

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Generate JWT token for hardcoded admin
      const token = jwt.sign(
        { userId: ADMIN_ID, role: 'ADMIN' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Set cookie
      res.cookie('token', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });

      return res.json({
        ok: true,
        data: {
          user: {
            id: ADMIN_ID,
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            role: 'ADMIN',
            phone: '081234567890',
            address: null
          },
          token
        }
      });
    }

    // Query #4 DPPL: Cari data user berdasarkan email
    // DPPL: SELECT * FROM user WHERE email = ?;
    // Implementasi: Menggunakan users (bukan user) dan hanya mengambil kolom yang diperlukan
    const [users] = await db.execute(
      'SELECT id, name, email, password_hash, role, phone, address FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid credentials'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      ok: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone: user.phone,
          address: user.address
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      ok: false,
      error: 'Login failed'
    });
  }
});

// FR-05: Admin Login (Hardcoded)
router.post('/admin/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required')
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

    const { email, password } = req.body;

    // Hardcoded admin credentials
    const ADMIN_EMAIL = 'admin@laundry.com';
    const ADMIN_PASSWORD = 'admin123';
    const ADMIN_ID = 1; // Hardcoded admin ID
    const ADMIN_NAME = 'Admin User';

    // Check hardcoded credentials
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid admin credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: ADMIN_ID, role: 'ADMIN' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: false, // Allow JavaScript access for debugging
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.json({
      ok: true,
      data: {
        user: {
          id: ADMIN_ID,
          name: ADMIN_NAME,
          email: ADMIN_EMAIL,
          role: 'ADMIN'
        },
        token
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      ok: false,
      error: 'Admin login failed'
    });
  }
});

// FR-08: Forgot Password
router.post('/forgot', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required')
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

    const { email } = req.body;

    // Query #20 DPPL: Cek apakah email terdaftar untuk reset password
    // DPPL: SELECT * FROM user WHERE email = ?;
    const [users] = await db.execute(
      'SELECT id, name FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Email not found'
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = jwt.sign(
      { userId: user.id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Send email
    const transporter = createTransporter();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: 'Reset Password - Laundry System',
      html: `
        <h2>Reset Password</h2>
        <p>Hello ${user.name},</p>
        <p>Click the link below to reset your password:</p>
        <a href="${resetUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    res.json({
      ok: true,
      message: 'Password reset link sent to your email'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to send reset email'
    });
  }
});

// FR-08: Reset Password
router.post('/reset', [
  body('token').notEmpty().withMessage('Reset token required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

    const { token, password } = req.body;

    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      return res.status(400).json({
        ok: false,
        error: 'Invalid reset token'
      });
    }

    // Query #20 DPPL: Update password setelah reset
    // DPPL: UPDATE user SET password = ? WHERE email = ?;
    // Implementasi: Menggunakan id (lebih aman) dan password_hash (sudah dienkripsi)
    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    await db.execute(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [passwordHash, decoded.userId]
    );

    res.json({
      ok: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(400).json({
        ok: false,
        error: 'Invalid or expired reset token'
      });
    }

    console.error('Reset password error:', error);
    res.status(500).json({
      ok: false,
      error: 'Password reset failed'
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({
    ok: true,
    message: 'Logged out successfully'
  });
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Not authenticated'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle hardcoded admin
    if (decoded.role === 'ADMIN' && decoded.userId === 1) {
      return res.json({
        ok: true,
        data: {
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@laundry.com',
            role: 'ADMIN',
            phone: '081234567890',
            address: null
          }
        }
      });
    }
    
    // Handle hardcoded admin
    if (decoded.role === 'ADMIN' && decoded.userId === 1) {
      return res.json({
        ok: true,
        data: {
          user: {
            id: 1,
            name: 'Admin User',
            email: 'admin@laundry.com',
            role: 'ADMIN',
            phone: '081234567890',
            address: null
          }
        }
      });
    }
    
    // Regular user lookup from database
    const [users] = await db.execute(
      'SELECT id, name, email, role, phone, address FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        ok: false,
        error: 'User not found'
      });
    }

    res.json({
      ok: true,
      data: { user: users[0] }
    });

  } catch (error) {
    res.status(401).json({
      ok: false,
      error: 'Invalid token'
    });
  }
});

module.exports = router;


