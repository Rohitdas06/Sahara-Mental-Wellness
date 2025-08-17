// backend/server.js
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/chat', require('./routes/chat'));
app.use('/api/ai', require('./routes/ai'));

// Basic health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on('send-message', async (data) => {
    try {
      // Here we'll integrate AI response
      const { message, userId, timestamp } = data;
      
      // Echo back for now - we'll add AI logic later
      socket.to(userId).emit('receive-message', {
        id: Date.now(),
        text: `AI: Thank you for sharing. I'm here to listen and support you.`,
        sender: 'ai',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Sorry, something went wrong.' });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(` Sahara server running on port ${PORT}`);
  console.log(` Frontend should connect to: http://localhost:${PORT}`);
});