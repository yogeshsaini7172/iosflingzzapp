// Socket.IO Chat Server
import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Store connected clients and their rooms
const clients = new Map(); // userId -> socket
const rooms = new Map(); // roomId -> Set of userIds
const userRooms = new Map(); // userId -> Set of roomIds

// Helper function to broadcast to room
function broadcastToRoom(roomId, event, data, excludeUserId = null) {
  const roomUsers = rooms.get(roomId);
  if (!roomUsers) return;

  roomUsers.forEach(userId => {
    if (userId !== excludeUserId) {
      const client = clients.get(userId);
      if (client && client.connected) {
        client.emit(event, data);
      }
    }
  });
}

// Helper function to broadcast user status
function broadcastUserStatus(userId, isOnline) {
  const userRoomSet = userRooms.get(userId);
  if (!userRoomSet) return;

  userRoomSet.forEach(roomId => {
    broadcastToRoom(roomId, 'user_status', {
      userId,
      isOnline
    }, userId);
  });
}

// Socket.IO connection handling
io.on('connection', (socket) => {
  const { token, userId } = socket.handshake.auth;

  console.log(`User ${userId} connected via Socket.IO`);

  // In production, verify the Firebase token here
  // For demo purposes, we'll just use the userId
  if (!userId) {
    socket.disconnect(true);
    return;
  }

  // Store client connection
  clients.set(userId, socket);
  
  // Initialize user rooms if not exists
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }

  // Broadcast that user is online
  broadcastUserStatus(userId, true);

  // Send connection confirmation
  socket.emit('connected', {
    userId,
    timestamp: new Date().toISOString()
  });

  // Handle joining a chat room
  socket.on('join_room', (data) => {
    const { chatRoomId } = data;
    if (!chatRoomId) return;

    // Add user to room
    if (!rooms.has(chatRoomId)) {
      rooms.set(chatRoomId, new Set());
    }
    rooms.get(chatRoomId).add(userId);
    userRooms.get(userId).add(chatRoomId);

    // Join Socket.IO room for easier broadcasting
    socket.join(chatRoomId);

    console.log(`User ${userId} joined room ${chatRoomId}`);
    
    // Notify others in room
    socket.to(chatRoomId).emit('user_joined', {
      userId,
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle leaving a chat room
  socket.on('leave_room', (data) => {
    const { chatRoomId } = data;
    if (!chatRoomId) return;

    // Remove user from room
    if (rooms.has(chatRoomId)) {
      rooms.get(chatRoomId).delete(userId);
      if (rooms.get(chatRoomId).size === 0) {
        rooms.delete(chatRoomId);
      }
    }
    userRooms.get(userId).delete(chatRoomId);

    // Leave Socket.IO room
    socket.leave(chatRoomId);

    console.log(`User ${userId} left room ${chatRoomId}`);
    
    // Notify others in room
    socket.to(chatRoomId).emit('user_left', {
      userId,
      chatRoomId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle chat messages
  socket.on('message', (data) => {
    const { chatRoomId, message } = data;
    if (!chatRoomId || !message) return;

    console.log(`📨 Message from ${userId} in room ${chatRoomId}: ${message}`);

    // Broadcast message to other users in room (excluding sender)
    socket.to(chatRoomId).emit('message', {
      chatRoomId,
      message,
      userId,
      timestamp: new Date().toISOString()
    });
  });

  // Handle typing indicators
  socket.on('typing', (data) => {
    const { chatRoomId, isTyping } = data;
    if (!chatRoomId) return;

    // Broadcast typing indicator to room (excluding sender)
    socket.to(chatRoomId).emit('typing', {
      chatRoomId,
      userId,
      isTyping,
      timestamp: new Date().toISOString()
    });
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User ${userId} disconnected:`, reason);
    
    // Remove from all rooms
    const userRoomSet = userRooms.get(userId);
    if (userRoomSet) {
      userRoomSet.forEach(roomId => {
        if (rooms.has(roomId)) {
          rooms.get(roomId).delete(userId);
          if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
          }
        }
        // Leave Socket.IO room
        socket.leave(roomId);
      });
    }

    // Broadcast that user is offline
    broadcastUserStatus(userId, false);

    // Clean up
    clients.delete(userId);
    userRooms.delete(userId);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

// Start server
const PORT = process.env.SOCKET_PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO chat server running on port ${PORT}`);
  console.log(`📡 Socket.IO URL: http://localhost:${PORT}`);
  console.log(`🌐 Main app should be running on a different port (like 5173)`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down Socket.IO server...');
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('Shutting down Socket.IO server...');
  io.close(() => {
    httpServer.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  });
});