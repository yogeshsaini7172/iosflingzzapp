// Import required libraries
import { createClient } from '@supabase/supabase-js';
import { Server } from 'socket.io';

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

// Initialize the Socket.io server on port 3001 (as per README)
const io = new Server(3001, {
  cors: {
    origin: '*', // Allow connections from any origin
    methods: ['GET', 'POST'],
  },
});

console.log('🚀 Socket server starting...');

io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.id}`);

  // Event to handle a user joining a specific chat room
  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`🚪 User ${socket.id} joined room: ${room}`);
  });

  // Event to handle receiving and processing a new chat message
  socket.on('chatMessage', async (msg, room) => {
    console.log(`📩 Message received in room [${room}]:`, msg);

    try {
      // Save the incoming message to the Supabase 'chat_messages_enhanced' table
      const { data, error } = await supabase
        .from('chat_messages_enhanced')
        .insert([{
          chat_room_id: room,
          sender_id: msg.sender_id || msg.sender, // The sender's Firebase UID
          message_text: msg.message_text || msg.text,     // The message content
        }]);

      if (error) {
        console.error('❌ Supabase error saving message:', error.message);
        // Optionally, emit an error back to the sender
        socket.emit('messageError', { message: 'Failed to save message.', error: error.message });
        return;
      }

      // If saved successfully, broadcast the message to everyone in the room
      io.to(room).emit('chatMessage', msg);
      console.log(`📨 Message broadcasted to room [${room}]`);

    } catch (error) {
      console.error('🔥 An unexpected server error occurred:', error);
      socket.emit('messageError', { message: 'An unexpected server error occurred.' });
    }
  });

  // Event for when a user disconnects
  socket.on('disconnect', () => {
    console.log(`🔌 User disconnected: ${socket.id}`);
  });
});

console.log('✅ Socket server is running on port 3001');