import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SendHorizonal } from 'lucide-react';

const ChatPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { user } = useAuth();
  const { messages, sendMessage, loading, error } = useChat(roomId);
  const [newMessage, setNewMessage] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim()) {
      sendMessage(newMessage);
      setNewMessage('');
    }
  };

  // Display a loading state while fetching history
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Display an error message if something went wrong
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="p-4 border-b bg-white shadow-sm">
        <h1 className="text-lg font-semibold">Chat Room: {roomId}</h1>
      </header>

      {/* Message Area */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index} // Use message ID from DB if available
            className={`flex items-end gap-2 ${msg.sender_id === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md p-3 rounded-lg shadow-sm ${
                msg.sender_id === user?.uid
                  ? 'bg-blue-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.created_at && (
                <span className={`text-xs mt-1 block text-right ${
                  msg.sender_id === user?.uid ? 'text-blue-200' : 'text-gray-400'
                }`}>
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </div>
          </div>
        ))}
      </main>

      {/* Input Form */}
      <footer className="p-4 bg-white border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim()}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
};

export default ChatPage;