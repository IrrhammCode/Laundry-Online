const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

// Try to load .env from root directory
const rootEnvPath = path.resolve(__dirname, '../../.env');
if (fs.existsSync(rootEnvPath)) {
  require('dotenv').config({ path: rootEnvPath });
} else {
  // Fallback to current directory
  require('dotenv').config();
}

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const complaintRoutes = require('./routes/complaints');
const reviewRoutes = require('./routes/reviews');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);

// Trust proxy for Railway/Vercel deployments
app.set('trust proxy', 1);

// Get frontend URL from environment or use default
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
// Support multiple frontend URLs (comma-separated)
const frontendUrls = frontendUrl.split(',').map(url => url.trim()).filter(Boolean);
const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...frontendUrls,
  // Allow all Vercel deployments (production and preview)
  /^https:\/\/.*\.vercel\.app$/
].filter(Boolean);

// Log allowed origins for debugging
console.log('Allowed CORS origins:', allowedOrigins);
console.log('FRONTEND_URL from env:', process.env.FRONTEND_URL);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
  }
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = allowedOrigins.some(allowed => {
      if (typeof allowed === 'string') {
        // Remove trailing slash for comparison
        const normalizedOrigin = origin.replace(/\/$/, '');
        const normalizedAllowed = allowed.replace(/\/$/, '');
        return normalizedAllowed === normalizedOrigin;
      } else if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return false;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      // Log for debugging but allow in production (more permissive)
      console.warn('CORS: Origin not in allowed list:', origin);
      console.warn('CORS: Allowed origins:', allowedOrigins);
      // Allow anyway for Vercel deployments (more permissive)
      if (origin.includes('.vercel.app')) {
        console.log('CORS: Allowing Vercel deployment:', origin);
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000 // limit each IP to 1000 requests per windowMs (more permissive for development)
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 auth requests per windowMs (increased for development)
  message: {
    ok: false,
    error: 'Too many authentication attempts, please try again later'
  }
});

app.use(generalLimiter);

// Routes
app.use('/api/auth', authLimiter, authRoutes);
// Public route for services (before auth middleware)
app.get('/api/orders/services', async (req, res) => {
  try {
    const { data: services, error } = await db
      .from('services')
      .select('id, name, base_price, unit, description')
      .order('name');

    if (error) throw error;

    res.json({
      ok: true,
      data: { services: services || [] }
    });
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch services'
    });
  }
});
// Protected routes
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/reviews', reviewRoutes);

// Public routes (no authentication required)
app.get('/api/services', async (req, res) => {
  try {
    console.log('GET /api/services - Request received from:', req.headers.origin);
    const { data: services, error } = await db
      .from('services')
      .select('id, name, base_price, unit, description')
      .order('name');

    if (error) throw error;

    console.log('GET /api/services - Services found:', services?.length || 0);
    res.json({
      ok: true,
      data: { services: services || [] }
    });
  } catch (error) {
    console.error('Get services error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      ok: false,
      error: 'Failed to fetch services',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'Laundry API is running' });
});

// Reset rate limit for development (DANGER: Only for development!)
app.post('/api/reset-rate-limit', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ ok: false, error: 'Not allowed in production' });
  }
  
  // Reset rate limit counters
  authLimiter.resetKey(req.ip);
  generalLimiter.resetKey(req.ip);
  
  res.json({ 
    ok: true, 
    message: 'Rate limit reset successfully',
    ip: req.ip 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join order room
  socket.on('join-order', (orderId) => {
    socket.join(`order:${orderId}`);
    console.log(`User ${socket.id} joined order room: ${orderId}`);
  });

  // Leave order room
  socket.on('leave-order', (orderId) => {
    socket.leave(`order:${orderId}`);
    console.log(`User ${socket.id} left order room: ${orderId}`);
  });

  // Handle chat messages
  socket.on('chat-message', async (data) => {
    try {
      const { orderId, message, senderId } = data;
      
      // Save message to database
      const { data: newMessage, error: insertError } = await db
        .from('messages')
        .insert({
          order_id: orderId,
          sender_id: senderId,
          body: message
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Broadcast to all users in the order room
      io.to(`order:${orderId}`).emit('message:new', {
        id: newMessage.id,
        orderId,
        senderId,
        message,
        timestamp: new Date(newMessage.created_at)
      });
    } catch (error) {
      console.error('Error handling chat message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    ok: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    ok: false,
    error: 'Route not found'
  });
});

// Railway dan Vercel auto-assign PORT
const PORT = process.env.PORT || 3001;

// Make io available globally for other modules
global.io = io;

// Export untuk Vercel serverless
// Vercel akan menggunakan ini sebagai handler
if (process.env.VERCEL) {
  module.exports = app;
} else {
  // Normal server mode (Railway, local, dll)
  if (require.main === module) {
    server.listen(PORT, () => {
      console.log(`🚀 Laundry API server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  }
  // Export untuk development/testing
  module.exports = { app, server, io };
}


