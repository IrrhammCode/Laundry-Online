const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const db = require('../config/database');

// Email transporter setup
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

exports.register = async (req, res) => {
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

    // Check if email already exists
    const { data: existingUsers, error: checkError } = await db
      .from('users')
      .select('id')
      .eq('email', email);

    if (checkError) {
      throw checkError;
    }

    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        ok: false,
        error: 'Email sudah terdaftar. Silakan gunakan email lain atau login dengan email ini.',
        message: 'Email sudah terdaftar. Silakan gunakan email lain atau login dengan email ini.'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const { data: newUser, error: insertError } = await db
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        phone: phone || null,
        address: address || null,
        role: 'CUSTOMER'
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id, role: 'CUSTOMER' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      ok: true,
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          phone: newUser.phone,
          address: newUser.address,
          role: newUser.role
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
};

exports.login = async (req, res) => {
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

    // Get user data based on email
    const { data: users, error: userError } = await db
      .from('users')
      .select('id, name, email, password_hash, role, phone, address')
      .eq('email', email)
      .single();

    if (userError || !users) {
      return res.status(401).json({
        ok: false,
        error: 'Invalid credentials'
      });
    }

    const user = users;

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
      httpOnly: false,
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
};

exports.adminLogin = async (req, res) => {
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
    const ADMIN_ID = 1; 
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
      httpOnly: false,
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
};

exports.forgotPassword = async (req, res) => {
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

    // Check if email exists
    const { data: users, error: userError } = await db
      .from('users')
      .select('id, name')
      .eq('email', email)
      .single();

    if (userError || !users) {
      return res.status(404).json({
        ok: false,
        error: 'Email not found'
      });
    }

    // Email found, user can reset password
    res.json({
      ok: true,
      message: 'Email verified. You can now reset your password.',
      data: {
        email: email
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to verify email'
    });
  }
};

exports.resetPassword = async (req, res) => {
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

    // Check if email exists
    const { data: user, error: userError } = await db
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        ok: false,
        error: 'Email not found'
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    // Update password
    const { error: updateError } = await db
      .from('users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id);

    if (updateError) {
      throw updateError;
    }

    res.json({
      ok: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      ok: false,
      error: 'Password reset failed'
    });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({
    ok: true,
    message: 'Logged out successfully'
  });
};

exports.getMe = async (req, res) => {
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
    
    // Regular user lookup from database
    const { data: users, error: userError } = await db
      .from('users')
      .select('id, name, email, role, phone, address')
      .eq('id', decoded.userId)
      .single();

    if (userError || !users) {
      return res.status(401).json({
        ok: false,
        error: 'User not found'
      });
    }

    res.json({
      ok: true,
      data: { user: users }
    });

  } catch (error) {
    res.status(401).json({
      ok: false,
      error: 'Invalid token'
    });
  }
};
