import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, MoreVertical, Heart, Phone, Video, Gift } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface Match {
  id: string;
  name: string;
  age: number;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  isOnline: boolean;
  university: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  type: 'text' | 'icebreaker';
}

interface ModernChatScreenProps {
  onNavigate: (view: 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches') => void;
}

const mockMatches: Match[] = [
  {
    id: '1',
    name: 'Emma',
    age: 21,
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616c57c8458?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'Hey! Love your photography 📸',
    timestamp: '2m ago',
    isOnline: true,
    university: 'NYU'
  },
  {
    id: '2', 
    name: 'Alex',
    age: 22,
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    lastMessage: 'That hiking spot looks amazing!',
    timestamp: '1h ago',
    isOnline: false,
    university: 'Stanford'
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    content: 'What\'s your dream vacation destination? 🌍',
    senderId: 'system',
    timestamp: '10:30 AM',
    type: 'icebreaker'
  },
  {
    id: '2',
    content: 'Hey! I saw we both love photography 📸',
    senderId: '1',
    timestamp: '10:35 AM',
    type: 'text'
  },
  {
    id: '3',
    content: 'Yes! Your gallery shots are incredible. Do you have a favorite spot on campus?',
    senderId: 'me',
    timestamp: '10:37 AM',
    type: 'text'
  }
];

const ModernChatScreen = ({ onNavigate }: ModernChatScreenProps) => {
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [messages] = useState(mockMessages);
  const [newMessage, setNewMessage] = useState("");

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // Handle sending message
      setNewMessage("");
    }
  };

  if (!selectedMatch) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Button variant="ghost" onClick={() => onNavigate('home')} className="rounded-full">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold">Messages</h1>
            <div className="w-10" /> {/* Spacer */}
          </div>
        </div>

        {/* Matches List */}
        <div className="p-4 space-y-3">
          {mockMatches.map((match) => (
            <Card
              key={match.id}
              className="p-4 cursor-pointer hover:shadow-medium transition-all duration-200 border-0 shadow-soft"
              onClick={() => setSelectedMatch(match)}
            >
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={match.avatar} alt={match.name} />
                    <AvatarFallback>{match.name[0]}</AvatarFallback>
                  </Avatar>
                  {match.isOnline && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-success rounded-full border-2 border-card" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-card-foreground">
                      {match.name}, {match.age}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {match.timestamp}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {match.lastMessage}
                  </p>
                  <Badge variant="outline" className="mt-1 text-xs">
                    {match.university}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft flex flex-col">
      {/* Chat Header */}
      <div className="sticky top-0 z-40 bg-card/90 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              onClick={() => setSelectedMatch(null)}
              className="rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="relative">
              <Avatar className="w-10 h-10">
                <AvatarImage src={selectedMatch.avatar} alt={selectedMatch.name} />
                <AvatarFallback>{selectedMatch.name[0]}</AvatarFallback>
              </Avatar>
              {selectedMatch.isOnline && (
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-success rounded-full border-2 border-card" />
              )}
            </div>
            <div>
              <h2 className="font-semibold">{selectedMatch.name}</h2>
              <p className="text-xs text-muted-foreground">
                {selectedMatch.isOnline ? 'Online' : 'Last seen 1h ago'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="rounded-full">
              <Phone className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              <Video className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="sm" className="rounded-full">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {messages.map((message) => (
          <div key={message.id}>
            {message.type === 'icebreaker' ? (
              <Card className="mx-auto max-w-xs p-4 bg-accent/10 border-accent/20 text-center">
                <div className="flex justify-center mb-2">
                  <Heart className="w-5 h-5 text-accent" />
                </div>
                <p className="text-sm font-medium text-accent-foreground">
                  Icebreaker
                </p>
                <p className="text-sm mt-1">{message.content}</p>
              </Card>
            ) : (
              <div className={`flex ${message.senderId === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-xs px-4 py-2 rounded-2xl ${
                    message.senderId === 'me'
                      ? 'bg-gradient-primary text-white'
                      : 'bg-card border border-border shadow-soft'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <p className={`text-xs mt-1 ${
                    message.senderId === 'me' ? 'text-white/70' : 'text-muted-foreground'
                  }`}>
                    {message.timestamp}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Message Input */}
      <div className="sticky bottom-0 bg-card/90 backdrop-blur-lg border-t border-border p-4">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" className="rounded-full">
            <Gift className="w-5 h-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-12 bg-muted/50 border-0 rounded-full"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />
            <Button
              onClick={handleSendMessage}
              size="sm"
              className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full w-8 h-8 p-0 bg-gradient-primary"
              disabled={!newMessage.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernChatScreen;