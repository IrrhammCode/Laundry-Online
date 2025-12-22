const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        ok: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Handle hardcoded admin
    if (decoded.role === 'ADMIN' && decoded.userId === 1) {
      req.user = {
        id: 1,
        name: 'Admin User',
        email: 'admin@laundry.com',
        role: 'ADMIN',
        phone: '081234567890',
        address: null
      };
      return next();
    }
    
    // Get user from database for regular users
    const { data: userData, error: userError } = await db
      .from('users')
      .select('id, role, name, email, phone, address')
      .eq('id', decoded.userId)
      .single();

    if (userError || !userData) {
      return res.status(401).json({
        ok: false,
        error: 'User not found'
      });
    }

    req.user = userData;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        ok: false,
        error: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        ok: false,
        error: 'Token expired'
      });
    }

    console.error('Auth middleware error:', error);
    return res.status(500).json({
      ok: false,
      error: 'Authentication error'
    });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        ok: false,
        error: 'Authentication required'
      });
    }

    // Handle hardcoded admin
    if (req.user.role === 'ADMIN' && req.user.id === 1) {
      if (roles.includes('ADMIN')) {
        return next();
      }
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        ok: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireRole
};



