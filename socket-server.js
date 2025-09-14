import { createServer } from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const httpServer = createServer();

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:5173", "http://localhost:3000", "http://localhost:8080"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

io.on('connection', (socket) => {
  const { userId } = socket.handshake.auth;

  if (!userId) {
    return socket.disconnect(true);
  }

  // --- ADDED FOR DEBUGGING ---
  console.log(`[SERVER LOG] User ${userId} connected. Socket ID: ${socket.id}`);

  // This is the handler for the real-time "like" feature
  socket.on('like_thread', (data) => {
    const { threadId, likes_count } = data;
    if (threadId && likes_count !== undefined) {
      // --- ADDED FOR DEBUGGING ---
      console.log(`[SERVER LOG] Received 'like_thread' for thread ${threadId}. Broadcasting 'thread_liked' to other clients.`);

      // Broadcast to all clients except the sender
      socket.broadcast.emit('thread_liked', {
        threadId,
        likes_count,
      });
    }
  });

  socket.on('disconnect', () => {
    // --- ADDED FOR DEBUGGING ---
    console.log(`[SERVER LOG] User ${userId} disconnected. Socket ID: ${socket.id}`);
  });

  // --- Original Chat Logic (Unchanged) ---
  const clients = new Map();
  const rooms = new Map();
  const userRooms = new Map();
  clients.set(userId, socket);
  if (!userRooms.has(userId)) {
    userRooms.set(userId, new Set());
  }
  socket.on('join_room', (data) => {
    const { chatRoomId } = data;
    if (!chatRoomId) return;
    if (!rooms.has(chatRoomId)) rooms.set(chatRoomId, new Set());
    rooms.get(chatRoomId).add(userId);
    userRooms.get(userId).add(chatRoomId);
    socket.join(chatRoomId);
    socket.to(chatRoomId).emit('user_joined', { userId, chatRoomId, timestamp: new Date().toISOString() });
  });
  socket.on('leave_room', (data) => {
    const { chatRoomId } = data;
    if (!chatRoomId) return;
    if (rooms.has(chatRoomId)) {
      rooms.get(chatRoomId).delete(userId);
      if (rooms.get(chatRoomId).size === 0) rooms.delete(chatRoomId);
    }
    userRooms.get(userId).delete(chatRoomId);
    socket.leave(chatRoomId);
    socket.to(chatRoomId).emit('user_left', { userId, chatRoomId, timestamp: new Date().toISOString() });
  });
  socket.on('message', (data) => {
    const { chatRoomId, message } = data;
    if (!chatRoomId || !message) return;
    socket.to(chatRoomId).emit('message', { chatRoomId, message, userId, timestamp: new Date().toISOString() });
  });
  socket.on('typing', (data) => {
    const { chatRoomId, isTyping } = data;
    if (!chatRoomId) return;
    socket.to(chatRoomId).emit('typing', { chatRoomId, userId, isTyping, timestamp: new Date().toISOString() });
  });
  socket.on('error', (error) => {
    console.error(`Socket error for user ${userId}:`, error);
  });
});

const PORT = process.env.SOCKET_PORT || 3002;
httpServer.listen(PORT, () => {
  console.log(`🚀 Socket.IO chat server running on port ${PORT}`);
});