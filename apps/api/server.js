const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');
const authRoutes = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const chatRoutes = require('./routes/chat');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  credentials: true
}));
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
app.use('/api/orders', authenticateToken, orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);

// Public routes (no authentication required)
app.get('/api/services', async (req, res) => {
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
      const [result] = await db.execute(
        'INSERT INTO messages (order_id, sender_id, body) VALUES (?, ?, ?)',
        [orderId, senderId, message]
      );

      // Broadcast to all users in the order room
      io.to(`order:${orderId}`).emit('message:new', {
        id: result.insertId,
        orderId,
        senderId,
        message,
        timestamp: new Date()
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

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`🚀 Laundry API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});

// Make io available globally for other modules
global.io = io;

module.exports = { app, server, io };


