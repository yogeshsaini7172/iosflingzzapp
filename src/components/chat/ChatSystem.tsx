import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Send, 
  MoreVertical, 
  Heart,
  Phone,
  Video,
  Image,
  Smile,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface ChatSystemProps {
  onNavigate: (view: string) => void;
  matchId?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: Date;
  type: 'text' | 'image';
}

interface Match {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
  isOnline: boolean;
}

const ChatSystem = ({ onNavigate, matchId }: ChatSystemProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [matches] = useState<Match[]>([
    {
      id: '1',
      name: 'Emma Watson',
      image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
      lastMessage: 'Hey! How was your psychology class?',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      unread: 2,
      isOnline: true
    },
    {
      id: '2',
      name: 'Alex Chen',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      lastMessage: 'That coffee shop you mentioned was amazing! ☕',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      unread: 0,
      isOnline: false
    },
    {
      id: '3',
      name: 'Sophia Lee',
      image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      lastMessage: 'Looking forward to our study session tomorrow!',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      unread: 1,
      isOnline: true
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (matchId) {
      const match = matches.find(m => m.id === matchId);
      if (match) {
        setSelectedMatch(match);
        loadMessages(matchId);
      }
    }
  }, [matchId, matches]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = (matchId: string) => {
    // Mock messages for demonstration
    const mockMessages: Message[] = [
      {
        id: '1',
        content: 'Hey! I saw we matched. Love your profile! 😊',
        senderId: matchId === '1' ? '1' : '2',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        type: 'text'
      },
      {
        id: '2',
        content: 'Thank you! I really enjoyed reading about your hiking adventures. Do you have any favorite trails?',
        senderId: 'me',
        timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        type: 'text'
      },
      {
        id: '3',
        content: 'Actually yes! There\'s this amazing trail near campus that leads to a beautiful viewpoint. Perfect for watching sunsets 🌅',
        senderId: matchId === '1' ? '1' : '2',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
        type: 'text'
      },
      {
        id: '4',
        content: 'That sounds incredible! Would you like to check it out together sometime? I\'d love to see it!',
        senderId: 'me',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        type: 'text'
      }
    ];
    setMessages(mockMessages);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedMatch) return;

    const message: Message = {
      id: Date.now().toString(),
      content: newMessage,
      senderId: 'me',
      timestamp: new Date(),
      type: 'text'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    inputRef.current?.focus();
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const renderMatchList = () => (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('home')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Messages</h1>
              <p className="text-sm text-muted-foreground">{matches.length} conversations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-md">
        <div className="space-y-2">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="cursor-pointer hover:shadow-medium transition-all border-0 shadow-card"
              onClick={() => setSelectedMatch(match)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={match.image}
                        alt={match.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {match.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold truncate">{match.name}</h3>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(match.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {match.lastMessage}
                    </p>
                  </div>
                  {match.unread > 0 && (
                    <Badge className="bg-primary text-white border-0 min-w-[20px] h-5 text-xs rounded-full">
                      {match.unread}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderChat = () => (
    <div className="flex flex-col h-screen bg-gradient-soft">
      {/* Chat Header */}
      <div className="bg-card/80 backdrop-blur-lg border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedMatch(null)}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img
                  src={selectedMatch?.image}
                  alt={selectedMatch?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {selectedMatch?.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-background"></div>
              )}
            </div>
            <div>
              <h2 className="font-semibold">{selectedMatch?.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedMatch?.isOnline ? 'Active now' : 'Last seen recently'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm">
              <Phone className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Video className="w-4 h-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Heart className="w-4 h-4 mr-2" />
                  View Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Flag className="w-4 h-4 mr-2" />
                  Report User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                message.senderId === 'me'
                  ? 'bg-gradient-primary text-white'
                  : 'bg-card shadow-card'
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 ${
                message.senderId === 'me' ? 'text-white/70' : 'text-muted-foreground'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-border bg-card/50 p-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">
            <Image className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-10 border-primary/20 focus:border-primary"
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            />
            <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2">
              <Smile className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="bg-gradient-primary"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );

  return selectedMatch ? renderChat() : renderMatchList();
};

export default ChatSystem;