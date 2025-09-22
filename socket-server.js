// Import required libraries
import { createClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';
import express from 'express';
import { createServer } from 'http';

// --- IMPORTANT ---
// Make sure you have a .env file in your project's root with these variables,
// or set them up as environment variables on your server.
// VITE_SUPABASE_URL=your_supabase_project_url
// VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

// Initialize the Supabase client
const supabaseUrl = "https://cchvsqeqiavhanurnbeo.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U";

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is not defined. Make sure your environment variables are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create Express app and HTTP server for better deployment compatibility
const app = express();
const server = createServer(app);

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Socket.IO server is running!' });
});

// Get port from environment variable (for deployment platforms) or default to 3002
const PORT = process.env.PORT || 3002;

// Configure CORS for production
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [
      process.env.CLIENT_URL,
      'https://preview--grad-sync.lovable.app', // Replace with your actual domain
      'https://your-frontend-domain.netlify.app' // Replace with your actual domain
    ].filter(Boolean)
  : ['http://localhost:3000', 'http://localhost:8080', 'http://localhost:4173'];

// Initialize the Socket.io server
const io = new Server(server, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

console.log(`🚀 Socket server starting on port ${PORT}...`);
console.log(`📡 CORS origins:`, corsOrigins);

// Track online users and their rooms
const onlineUsers = new Map(); // socket.id -> { userId, rooms: Set }
const typingUsers = new Map(); // roomId -> Set of userIds currently typing

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);
  
  // Handle authentication
  const token = socket.handshake.auth.token;
  const userId = socket.handshake.auth.userId;
  
  if (userId) {
    onlineUsers.set(socket.id, { userId, rooms: new Set() });
    console.log(`👤 Authenticated user: ${userId}`);
  }

  // Event to handle a user joining a specific chat room (frontend sends 'join_room')
  socket.on('join_room', ({ chatRoomId, userId: joinUserId }) => {
    socket.join(chatRoomId);
    
    // Track the room for this user
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      userData.rooms.add(chatRoomId);
    }
    
    console.log(`🚪 User ${joinUserId || socket.id} joined room: ${chatRoomId}`);
    
    // Notify others in the room that user is online
    socket.to(chatRoomId).emit('user_joined', { userId: joinUserId, chatRoomId });
  });

  // Event to handle leaving a chat room
  socket.on('leave_room', ({ chatRoomId, userId: leaveUserId }) => {
    socket.leave(chatRoomId);
    
    // Remove room tracking
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      userData.rooms.delete(chatRoomId);
    }
    
    console.log(`🚪 User ${leaveUserId || socket.id} left room: ${chatRoomId}`);
    
    // Notify others in the room that user left
    socket.to(chatRoomId).emit('user_left', { userId: leaveUserId, chatRoomId });
  });

  // Event to handle receiving and processing a new chat message (frontend sends 'message')
  socket.on('message', async ({ chatRoomId, message, userId: senderId }) => {
    console.log(`📩 Message received in room [${chatRoomId}]:`, { message, senderId });

    try {
      // Save the incoming message to the Supabase 'chat_messages_enhanced' table
      const { data, error } = await supabase
        .from('chat_messages_enhanced')
        .insert([{
          chat_room_id: chatRoomId,
          sender_id: senderId,
          message_text: message,
        }])
        .select('*')
        .single();

      if (error) {
        console.error('❌ Supabase error saving message:', error.message);
        socket.emit('message_error', { message: 'Failed to save message.', error: error.message });
        return;
      }

      // If saved successfully, broadcast the message to everyone in the room
      const messageData = {
        id: data.id,
        sender: senderId,
        text: message,
        chatRoomId: chatRoomId,
        timestamp: data.created_at
      };
      
      io.to(chatRoomId).emit('message', messageData);
      console.log(`📨 Message broadcasted to room [${chatRoomId}]`);

    } catch (error) {
      console.error('🔥 An unexpected server error occurred:', error);
      socket.emit('message_error', { message: 'An unexpected server error occurred.' });
    }
  });

  // Handle typing indicators
  socket.on('typing_started', ({ chatRoomId, userId }) => {
    const roomTyping = typingUsers.get(chatRoomId) || new Set();
    roomTyping.add(userId);
    typingUsers.set(chatRoomId, roomTyping);
    
    // Broadcast to others in the room (not including sender)
    socket.to(chatRoomId).emit('typing_started', { chatRoomId, userId });
    console.log(`⌨️ User ${userId} started typing in ${chatRoomId}`);
  });

  socket.on('typing_stopped', ({ chatRoomId, userId }) => {
    const roomTyping = typingUsers.get(chatRoomId);
    if (roomTyping) {
      roomTyping.delete(userId);
      if (roomTyping.size === 0) {
        typingUsers.delete(chatRoomId);
      }
    }
    
    // Broadcast to others in the room (not including sender)
    socket.to(chatRoomId).emit('typing_stopped', { chatRoomId, userId });
    console.log(`⌨️ User ${userId} stopped typing in ${chatRoomId}`);
  });

  // Event for when a user disconnects
  socket.on('disconnect', () => {
    const userData = onlineUsers.get(socket.id);
    if (userData) {
      console.log(`🔌 User disconnected: ${userData.userId} (${socket.id})`);
      
      // Clean up typing indicators for this user
      userData.rooms.forEach(roomId => {
        const roomTyping = typingUsers.get(roomId);
        if (roomTyping) {
          roomTyping.delete(userData.userId);
          if (roomTyping.size === 0) {
            typingUsers.delete(roomId);
          } else {
            // Notify others that this user stopped typing
            socket.to(roomId).emit('typing_stopped', { chatRoomId: roomId, userId: userData.userId });
          }
        }
      });
      
      onlineUsers.delete(socket.id);
    } else {
      console.log(`🔌 User disconnected: ${socket.id}`);
    }
  });
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Socket server is running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
});