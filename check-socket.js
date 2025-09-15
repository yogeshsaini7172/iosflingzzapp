// Simple Socket.IO connection test
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3002';

console.log('🔍 Testing Socket.IO connection...');
console.log(`📡 Connecting to: ${SOCKET_URL}`);

const socket = io(SOCKET_URL, {
  auth: {
    token: 'test-token',
    userId: 'test-user'
  },
  transports: ['websocket', 'polling'],
  timeout: 5000
});

socket.on('connect', () => {
  console.log('✅ Socket.IO connection successful!');
  console.log(`🆔 Socket ID: ${socket.id}`);
  
  // Test joining a room
  socket.emit('join_room', { chatRoomId: 'test-room' });
  
  // Test sending a message
  setTimeout(() => {
    socket.emit('message', {
      chatRoomId: 'test-room',
      message: 'Hello from test client!'
    });
  }, 1000);
  
  // Disconnect after test
  setTimeout(() => {
    console.log('🔌 Disconnecting test client...');
    socket.disconnect();
    process.exit(0);
  }, 3000);
});

socket.on('connect_error', (error) => {
  console.error('❌ Socket.IO connection failed:', error.message);
  console.log('💡 Make sure the Socket.IO server is running: npm run socket-server');
  process.exit(1);
});

socket.on('connected', (data) => {
  console.log('📨 Received connection confirmation:', data);
});

socket.on('message', (data) => {
  console.log('📨 Received message:', data);
});

socket.on('user_joined', (data) => {
  console.log('👋 User joined:', data);
});

socket.on('disconnect', (reason) => {
  console.log('🔌 Disconnected:', reason);
});

// Timeout after 10 seconds
setTimeout(() => {
  console.log('⏰ Connection test timed out');
  process.exit(1);
}, 10000);