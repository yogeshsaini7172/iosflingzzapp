// Socket Server for Render Deployment
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
const server = createServer(app);

// CORS configuration
const corsOrigins = [
  'https://preview--grad-sync.lovable.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:4173'
];

app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Grad-Sync Socket Server Running',
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO server
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Track connected users
const connectedUsers = new Map();
const roomUsers = new Map();

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Handle authentication
  const { token, userId } = socket.handshake.auth;
  
  if (userId) {
    connectedUsers.set(socket.id, { userId, socketId: socket.id });
    console.log(`👤 Authenticated user: ${userId} (${socket.id})`);
  }

  // Join room event
  socket.on('join_room', ({ chatRoomId, userId: joinUserId }) => {
    socket.join(chatRoomId);
    
    // Track user in room
    if (!roomUsers.has(chatRoomId)) {
      roomUsers.set(chatRoomId, new Set());
    }
    roomUsers.get(chatRoomId).add(joinUserId || socket.id);
    
    console.log(`🚪 User ${joinUserId || socket.id} joined room: ${chatRoomId}`);
    
    // Notify others in room
    socket.to(chatRoomId).emit('user_joined', { 
      userId: joinUserId, 
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });

  // Leave room event
  socket.on('leave_room', ({ chatRoomId, userId: leaveUserId }) => {
    socket.leave(chatRoomId);
    
    if (roomUsers.has(chatRoomId)) {
      roomUsers.get(chatRoomId).delete(leaveUserId || socket.id);
    }
    
    console.log(`🚪 User ${leaveUserId || socket.id} left room: ${chatRoomId}`);
    
    socket.to(chatRoomId).emit('user_left', { 
      userId: leaveUserId, 
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });

  // Message event - CRITICAL: This handles message sending
  socket.on('message', ({ chatRoomId, message, userId: senderId }) => {
    console.log(`📩 Message received in room [${chatRoomId}]:`, { 
      message, 
      senderId,
      timestamp: new Date().toISOString()
    });

    // Create message object
    const messageData = {
      id: Date.now().toString(),
      chatRoomId,
      message,
      senderId,
      senderSocketId: socket.id,
      timestamp: new Date().toISOString(),
      type: 'text'
    };

    // Broadcast to all users in the room (including sender)
    io.to(chatRoomId).emit('message', messageData);
    
    console.log(`📨 Message broadcasted to room [${chatRoomId}]`);
  });

  // Typing indicators
  socket.on('typing_started', ({ chatRoomId, userId: typingUserId }) => {
    socket.to(chatRoomId).emit('user_typing', { 
      userId: typingUserId, 
      chatRoomId,
      isTyping: true 
    });
  });

  socket.on('typing_stopped', ({ chatRoomId, userId: typingUserId }) => {
    socket.to(chatRoomId).emit('user_typing', { 
      userId: typingUserId, 
      chatRoomId,
      isTyping: false 
    });
  });

  // Handle disconnect
  socket.on('disconnect', (reason) => {
    console.log(`🔌 User disconnected: ${socket.id} (${reason})`);
    
    const userData = connectedUsers.get(socket.id);
    if (userData) {
      // Remove from all rooms
      roomUsers.forEach((users, roomId) => {
        if (users.has(userData.userId)) {
          users.delete(userData.userId);
          socket.to(roomId).emit('user_left', { 
            userId: userData.userId, 
            chatRoomId: roomId,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      connectedUsers.delete(socket.id);
    }
  });

  // Error handling
  socket.on('error', (error) => {
    console.error(`❌ Socket error for ${socket.id}:`, error);
  });
});

// Error handling for the server
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

io.on('error', (error) => {
  console.error('❌ Socket.IO error:', error);
});

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Socket server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 CORS origins:`, corsOrigins);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Process terminated');
  });
});