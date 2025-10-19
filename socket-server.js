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
// Use service role key from environment variable for production, fallback to anon key for local development
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U";

console.log('🔑 Supabase key type:', supabaseKey.includes('service_role') ? 'SERVICE_ROLE' : 'ANON');

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is not defined. Make sure your environment variables are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Create Express app and HTTP server for better deployment compatibility
const app = express();
const server = createServer(app);

// Parse JSON bodies
app.use(express.json());

// Global Surepass mode selection (unconditional): prefer FORCE then SUREPASS_ENV then default to production
const SUREPASS_MODE = (process.env.SUREPASS_FORCE_ENV || process.env.SUREPASS_ENV || 'production').toLowerCase();
console.log('🔒 Surepass mode:', SUREPASS_MODE);

// Health check endpoint for deployment platforms
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Server-side proxy for Aadhaar validation to avoid exposing the Surepass token
app.post('/api/validate-aadhaar', async (req, res) => {
  try {
    const id_number = req.body?.id_number;
    if (!id_number) return res.status(400).json({ error: 'Missing id_number in body' });

    // Optional simple protection: if API_SECRET is set, require x-api-secret header
    const apiSecret = process.env.API_SECRET;
    if (apiSecret) {
      const incoming = req.headers['x-api-secret'];
      if (!incoming || incoming !== apiSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Use env var first; fall back to a hardcoded token if not provided.
    // NOTE: Hardcoding secrets in source is insecure for production. Prefer env vars or a secret manager.
    const surepassToken = process.env.SUREPASS_TOKEN;
    if (!surepassToken) {
      console.error('Missing SUREPASS_TOKEN environment variable');
      return res.status(500).json({ error: 'Missing server SUREPASS_TOKEN environment variable' });
    }

    const SP_URL_BASE = SUREPASS_MODE === 'sandbox' ? 'https://sandbox.surepass.io' : 'https://kyc-api.surepass.io';
    const SP_URL = `${SP_URL_BASE}/api/v1/aadhaar-validation/aadhaar-validation`;

    // Use global fetch available in modern Node.js — if not available, user should install node-fetch
    const spRes = await fetch(SP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${surepassToken}`,
      },
      body: JSON.stringify({ id_number }),
    });

    const json = await spRes.json().catch(() => null);
    // Mirror status and body
    return res.status(spRes.status).json(json ?? { error: 'No response from Surepass' });
  } catch (err) {
    console.error('Error in /api/validate-aadhaar:', err);
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});

// Server-side flow: validate then produce a redirect URL to Surepass hosted UI
app.post('/api/validate-aadhaar-redirect', async (req, res) => {
  try {
    const id_number = req.body?.id_number;
    if (!id_number) return res.status(400).json({ error: 'Missing id_number in body' });

    const apiSecret = process.env.API_SECRET;
    if (apiSecret) {
      const incoming = req.headers['x-api-secret'];
      if (!incoming || incoming !== apiSecret) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    const surepassToken = process.env.SUREPASS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2MDY5Njc2NSwianRpIjoiNTU2YTg1YTYtY2M5NC00NTYyLTkxMjQtMGJkMjZkOGY2M2Y2IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmF0b21uZXR3b3JraW5nQHN1cmVwYXNzLmlvIiwibmJmIjoxNzYwNjk2NzY1LCJleHAiOjE3NjMyODg3NjUsImVtYWlsIjoiYXRvbW5ldHdvcmtpbmdAc3VyZXBhc3MuaW8iLCJ0ZW5hbnRfaWQiOiJtYWluIiwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.Wot2R5Yshf_YyCpwVhJcZZMDnBQ9LiUBxYE2ODkxzdA';

    const SP_BASE = SUREPASS_MODE === 'sandbox' ? 'https://sandbox.surepass.io' : 'https://kyc-api.surepass.io';
    const SP_API = `${SP_BASE}/api/v1/aadhaar-validation/aadhaar-validation`;

    const spRes = await fetch(SP_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${surepassToken}`,
      },
      body: JSON.stringify({ id_number }),
    });

    const json = await spRes.json().catch(() => null);

    if (!spRes.ok) {
      return res.status(spRes.status).json(json ?? { error: 'Surepass error' });
    }

    // Expect data.client_id in response (per Surepass sample)
    const clientId = json?.data?.client_id;
    if (!clientId) {
      // No client id — return data so client can inspect
      return res.status(200).json({ success: true, data: json?.data ?? null, redirect_url: null });
    }

    // Build hosted UI redirect URL using client_id
    const hostedBase = SUREPASS_MODE === 'sandbox' ? 'https://sandbox.surepass.io/verify' : 'https://kyc.surepass.io/verify';
    const redirectUrl = `${hostedBase}?client_id=${encodeURIComponent(clientId)}`;

    // Instruct browser to follow the redirect (302) — this prevents exposing tokens to client and lets browser land on Surepass UI
    return res.redirect(302, redirectUrl);
  } catch (err) {
    console.error('Error in /api/validate-aadhaar-redirect:', err);
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});

// Diagnostic endpoint: safely check the embedded/env Surepass token against sandbox and production
app.get('/api/surepass-token-check', async (req, res) => {
  try {
    const token = process.env.SUREPASS_TOKEN || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTc2MDY5Njc2NSwianRpIjoiNTU2YTg1YTYtY2M5NC00NTYyLTkxMjQtMGJkMjZkOGY2M2Y2IiwidHlwZSI6ImFjY2VzcyIsImlkZW50aXR5IjoiZGV2LmF0b21uZXR3b3JraW5nQHN1cmVwYXNzLmlvIiwibmJmIjoxNzYwNjk2NzY1LCJleHAiOjE3NjMyODg3NjUsImVtYWlsIjoiYXRvbW5ldHdvcmtpbmdAc3VyZXBhc3MuaW8iLCJ0ZW5hbnRfaWQiOiJtYWluIiwidXNlcl9jbGFpbXMiOnsic2NvcGVzIjpbInVzZXIiXX19.Wot2R5Yshf_YyCpwVhJcZZMDnBQ9LiUBxYE2ODkxzdA';

    // Only check the currently selected SUREPASS_MODE environment
    const endpoints = [
      { env: SUREPASS_MODE, url: SUREPASS_MODE === 'sandbox' ? 'https://sandbox.surepass.io/api/v1/aadhaar-validation/aadhaar-validation' : 'https://kyc-api.surepass.io/api/v1/aadhaar-validation/aadhaar-validation' }
    ];

    const results = [];
    for (const ep of endpoints) {
      try {
        const r = await fetch(ep.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ id_number: '000000000000' })
        });
        const json = await r.json().catch(() => null);
        // Return only minimal fields and avoid echoing token
        results.push({ env: ep.env, status: r.status, success: json?.success ?? null, message_code: json?.message_code ?? null, message: json?.message ?? null });
      } catch (err) {
        results.push({ env: ep.env, status: null, error: err?.message ?? String(err) });
      }
    }

    return res.status(200).json({ checked: results });
  } catch (err) {
    console.error('Error in /api/surepass-token-check:', err);
    return res.status(500).json({ error: 'internal_error' });
  }
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
      'https://preview--grad-sync.lovable.app', // Your actual frontend domain
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
    console.log(`🔍 Attempting to save to database...`);

    try {
      // Validate required fields
      if (!chatRoomId || !senderId || !message) {
        console.error('❌ Missing required fields:', { chatRoomId, senderId, message: !!message });
        socket.emit('message_error', { message: 'Missing required fields for message.' });
        return;
      }

      // Save the incoming message to the Supabase 'chat_messages_enhanced' table
      console.log(`💾 Inserting into chat_messages_enhanced:`, {
        chat_room_id: chatRoomId,
        sender_id: senderId,
        message_text: message,
      });

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
        console.error('❌ Supabase error saving message:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        socket.emit('message_error', { message: 'Failed to save message.', error: error.message });
        return;
      }

      console.log(`✅ Message saved successfully:`, data);

      // If saved successfully, broadcast the message to everyone in the room
      const messageData = {
        id: data.id,
        sender: senderId,
        text: message,
        chatRoomId: chatRoomId,
        timestamp: data.created_at
      };
      
      io.to(chatRoomId).emit('message', messageData);
      console.log(`📨 Message broadcasted to room [${chatRoomId}]:`, messageData);

    } catch (error) {
      console.error('🔥 An unexpected server error occurred:', error);
      console.error('🔥 Error stack:', error.stack);
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