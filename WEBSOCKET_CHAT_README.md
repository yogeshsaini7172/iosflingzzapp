# Socket.IO Chat Features

This implementation adds real-time chat capabilities to your existing chat system using Socket.IO while maintaining compatibility with your current Supabase-based chat functionality.

## Features Added

### 🚀 Real-time Messaging
- Instant message delivery via Socket.IO
- Fallback to Supabase real-time subscriptions
- Automatic reconnection with exponential backoff
- Better browser compatibility and reliability

### 👥 Online Status
- Real-time online/offline indicators
- User presence in chat rooms
- Visual indicators in chat list and conversation

### ⌨️ Typing Indicators
- Real-time typing notifications
- Automatic timeout after 3 seconds of inactivity
- Visual typing animation

### 🔄 Connection Management
- Connection status indicators
- Graceful degradation when Socket.IO is unavailable
- Automatic message queuing and retry
- Multiple transport fallbacks (WebSocket, polling)

### 🎛️ Dual Mode Support
- Enhanced mode: Full Socket.IO features
- Standard mode: Original Supabase-only functionality
- Easy switching between modes

## Setup Instructions

### 1. Environment Configuration

Create a `.env` file in your project root (copy from `.env.example`):
```env
# Socket.IO server URL (optional - leave empty to use standard chat mode)
VITE_SOCKET_URL=http://localhost:3001
# For production, use https://your-domain.com
```

**Note:** If `VITE_SOCKET_URL` is not set, the app will work in standard mode using only Supabase real-time subscriptions.

### 2. Socket.IO Server Setup

#### Option A: Use the Included Server (Development)

1. Install dependencies (already included):
```bash
npm install socket.io
```

2. Run the Socket.IO server:
```bash
npm run socket-server
```

3. Test the connection:
```bash
npm run check-socket
```

#### Option B: Deploy Production Server

For production, consider using:
- **Railway/Heroku** for simple deployment
- **AWS ECS/EC2** for scalable deployment
- **DigitalOcean App Platform** for managed hosting
- **Your own Node.js server** with clustering and Redis

### 3. Integration

The Socket.IO features are automatically integrated when you wrap your app with `SocketChatProvider`:

```tsx
import { SocketChatProvider } from '@/contexts/SocketChatContext';

function App() {
  return (
    <SocketChatProvider>
      {/* Your app components */}
    </SocketChatProvider>
  );
}
```

## Usage

### Basic Usage

The enhanced chat system automatically uses Socket.IO features when available:

```tsx
import RebuiltChatSystem from '@/components/chat/RebuiltChatSystem';

function ChatPage() {
  return <RebuiltChatSystem onNavigate={handleNavigate} />;
}
```

### Using Socket.IO Context

Access Socket.IO functionality in any component:

```tsx
import { useSocketChat } from '@/contexts/SocketChatContext';

function MyComponent() {
  const {
    isConnected,
    connectionStatus,
    onlineUsers,
    typingUsers,
    sendMessage,
    joinChatRoom,
    sendTypingIndicator
  } = useSocketChat();

  // Your component logic
}
```

### Using Enhanced Chat Hook

The enhanced hook provides both Supabase and Socket.IO functionality:

```tsx
import { useChatWithWebSocket } from '@/hooks/useChatWithWebSocket';

function ChatComponent() {
  const {
    // Standard chat features
    chatRooms,
    messages,
    sendMessage,
    
    // Socket.IO enhancements
    wsConnected,
    connectionStatus,
    handleTyping,
    getTypingUsers,
    isUserOnline,
    onlineUsers
  } = useChatWithWebSocket(userId);
}
```

## Architecture

### Data Flow

1. **Message Sending**:
   - Primary: Supabase database insert
   - Secondary: Socket.IO broadcast for instant delivery
   - Fallback: Supabase real-time subscriptions

2. **Message Receiving**:
   - Socket.IO messages for instant updates
   - Supabase subscriptions for reliability
   - Deduplication to prevent duplicates

3. **Presence & Typing**:
   - Socket.IO-only features
   - Graceful degradation when unavailable

### Components Structure

```
SocketChatProvider (Context)
├── RebuiltChatSystem (Main Component)
├── ChatRoomList (Room List with Online Status)
├── ChatConversation (Chat with Typing Indicators)
└── useChatWithWebSocket (Enhanced Hook)
```

## Configuration Options

### WebSocket Context Options

The WebSocket context automatically handles:
- Authentication via Firebase tokens
- Room management (join/leave)
- Connection lifecycle
- Error handling and reconnection

### Chat Hook Options

The enhanced chat hook provides:
- All original useChat functionality
- WebSocket integration
- Typing indicator management
- Online status tracking

## Error Handling

### Connection Failures
- Automatic reconnection with exponential backoff
- Maximum retry attempts (configurable)
- Graceful fallback to standard mode

### Message Delivery
- Primary delivery via Supabase (reliable)
- WebSocket delivery for speed (best effort)
- No message loss due to dual delivery

### Network Issues
- Connection status indicators
- Offline message queuing
- Automatic sync when reconnected

## Security Considerations

### Authentication
- Firebase tokens used for WebSocket authentication
- Server-side token verification (implement in production)
- User ID validation

### Message Validation
- Input sanitization
- Rate limiting (implement server-side)
- Room access control

## Performance

### Optimizations
- Connection pooling
- Message deduplication
- Efficient room management
- Automatic cleanup on disconnect

### Monitoring
- Connection status tracking
- Error logging
- Performance metrics (implement as needed)

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check server is running
   - Verify VITE_WEBSOCKET_URL
   - Check firewall/proxy settings

2. **Messages Not Appearing**
   - Check Supabase connection
   - Verify user authentication
   - Check browser console for errors

3. **Typing Indicators Not Working**
   - WebSocket-only feature
   - Check connection status
   - Verify room membership

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('debug', 'websocket:*');
```

## Production Deployment

### Server Requirements
- WebSocket support
- SSL/TLS for wss:// connections
- Load balancing with sticky sessions
- Health checks and monitoring

### Scaling Considerations
- Redis for multi-server presence
- Message queuing for reliability
- Database connection pooling
- CDN for static assets

## Future Enhancements

Potential improvements:
- File sharing via WebSocket
- Voice/video call signaling
- Message reactions and replies
- Advanced presence (away, busy, etc.)
- Message encryption
- Push notifications integration

## Support

For issues or questions:
1. Check the browser console for errors
2. Verify WebSocket server is running
3. Test with standard chat mode
4. Check network connectivity
5. Review server logs

The system is designed to work seamlessly with or without WebSocket connectivity, ensuring your chat functionality remains reliable in all scenarios.