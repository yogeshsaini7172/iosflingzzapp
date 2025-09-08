import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Heart, Calendar, Send, MoreVertical, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";

interface MatchesListProps {
  onNavigate: (view: 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches') => void;
}

const MatchesList = ({ onNavigate }: MatchesListProps) => {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useRequiredAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      fetchMatches();
    }
  }, [userId]);

  // Real-time updates for new matches and messages
  useRealtime({
    table: 'enhanced_matches',
    event: '*',
    filter: `user1_id=eq.${userId},user2_id=eq.${userId}`,
    onInsert: () => fetchMatches(),
    onUpdate: () => fetchMatches()
  });

  const fetchMatches = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('chat-management', {
        body: {
          action: 'get_user_matches',
          user_id: userId
        }
      });

      if (error) throw error;
      setMatches(data?.matches || []);
    } catch (error) {
      console.error('Error fetching matches:', error);
      toast({
        title: "Error loading matches",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Replace mock data with empty array since we're loading from API
  const mockData = [
    {
      id: '1',
      firstName: 'Emma',
      lastName: 'Johnson',
      age: 21,
      university: 'NYU',
      major: 'Fine Arts',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616c57c8458?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Hey! Thanks for the match 😊',
      lastMessageTime: '2 hours ago',
      isOnline: true,
      matchedAt: '2024-01-15T10:00:00Z',
      messages: [
        { id: '1', senderId: '1', content: 'Hey! Thanks for the match 😊', timestamp: '2024-01-15T10:30:00Z' },
        { id: '2', senderId: 'me', content: 'Hi Emma! Great to match with you too!', timestamp: '2024-01-15T10:35:00Z' },
        { id: '3', senderId: '1', content: 'I saw you\'re into photography too! Do you have a favorite spot on campus?', timestamp: '2024-01-15T10:40:00Z' }
      ]
    },
    {
      id: '2',
      firstName: 'Alex',
      lastName: 'Chen',
      age: 22,
      university: 'Stanford',
      major: 'Computer Science',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'Want to grab coffee sometime?',
      lastMessageTime: '1 day ago',
      isOnline: false,
      matchedAt: '2024-01-14T15:00:00Z',
      messages: [
        { id: '1', senderId: '2', content: 'Hi there! Love your profile!', timestamp: '2024-01-14T15:30:00Z' },
        { id: '2', senderId: 'me', content: 'Thank you! Your projects look amazing', timestamp: '2024-01-14T15:35:00Z' },
        { id: '3', senderId: '2', content: 'Want to grab coffee sometime?', timestamp: '2024-01-14T16:00:00Z' }
      ]
    },
    {
      id: '3',
      firstName: 'Sophia',
      lastName: 'Martinez',
      age: 20,
      university: 'Harvard',
      major: 'Biology',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      lastMessage: 'You: That sounds fun! When are you free?',
      lastMessageTime: '3 days ago',
      isOnline: true,
      matchedAt: '2024-01-12T09:00:00Z',
      messages: [
        { id: '1', senderId: '3', content: 'Hey! I see we both love hiking!', timestamp: '2024-01-12T09:30:00Z' },
        { id: '2', senderId: 'me', content: 'Yes! Do you know any good trails around campus?', timestamp: '2024-01-12T09:35:00Z' },
        { id: '3', senderId: '3', content: 'There\'s a beautiful trail about 20 minutes from Harvard. Want to check it out together?', timestamp: '2024-01-12T10:00:00Z' },
        { id: '4', senderId: 'me', content: 'That sounds fun! When are you free?', timestamp: '2024-01-12T10:15:00Z' }
      ]
    }
  ];

  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      // Here you would normally send the message to your backend
      console.log('Sending message:', message);
      setMessage('');
    }
  };

  const renderMatchesList = () => (
    <div className="space-y-3">
      {matches.map((match) => (
        <Card 
          key={match.id}
          className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary/20 hover:border-l-primary"
          onClick={() => setSelectedMatch(match.id)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-14 h-14">
                  <AvatarImage src={match.avatar} alt={match.firstName} />
                  <AvatarFallback>{match.firstName[0]}{match.lastName[0]}</AvatarFallback>
                </Avatar>
                {match.isOnline && (
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold text-base truncate">
                    {match.firstName}, {match.age}
                  </h3>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {match.lastMessageTime}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    {match.major} at {match.university}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground truncate">
                  {match.lastMessage}
                </p>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <MessageCircle className="w-5 h-5 text-primary" />
                {match.isOnline && (
                  <Badge variant="secondary" className="text-xs">
                    Online
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderChat = () => {
    if (!selectedMatchData) return null;

    return (
      <div className="flex flex-col h-full">
        {/* Chat Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border bg-card">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedMatch(null)}
          >
            ← Back
          </Button>
          
          <Avatar className="w-10 h-10">
            <AvatarImage src={selectedMatchData.avatar} alt={selectedMatchData.firstName} />
            <AvatarFallback>{selectedMatchData.firstName[0]}{selectedMatchData.lastName[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold">{selectedMatchData.firstName}</h3>
            <p className="text-sm text-muted-foreground">
              {selectedMatchData.isOnline ? 'Online now' : 'Last seen recently'}
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Match Info */}
        <div className="bg-muted/50 p-3 text-center border-b border-border">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-red-500" />
            <span className="text-sm font-medium">You matched on {new Date(selectedMatchData.matchedAt).toLocaleDateString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {selectedMatchData.major} at {selectedMatchData.university}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedMatchData.messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex ${msg.senderId === 'me' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.senderId === 'me' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.senderId === 'me' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="p-4 border-t border-border bg-card">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" disabled={!message.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate('home')}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">
            {selectedMatch ? selectedMatchData?.firstName : 'Matches'}
          </h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 h-screen flex flex-col">
        {selectedMatch ? (
          <div className="flex-1">
            {renderChat()}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="container mx-auto max-w-2xl">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold mb-2">Your Matches</h2>
                <p className="text-muted-foreground">
                  Start a conversation with your matches
                </p>
              </div>
              
              {matches.length > 0 ? (
                renderMatchesList()
              ) : (
                <Card className="text-center p-8">
                  <CardContent>
                    <div className="text-4xl mb-4">💕</div>
                    <h3 className="text-xl font-semibold mb-2">No Matches Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start swiping to find your perfect match!
                    </p>
                    <Button onClick={() => onNavigate('swipe')}>
                      Start Swiping
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchesList;