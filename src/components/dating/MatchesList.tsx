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

interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  chat_room_id: string;
  profile?: {
    first_name: string;
    last_name: string;
    profile_images: string[];
    university: string;
    major: string;
    bio: string;
  };
  last_message?: {
    message_text: string;
    created_at: string;
    sender_id: string;
  };
}

const MatchesList = ({ onNavigate }: MatchesListProps) => {
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [matches, setMatches] = useState<Match[]>([]);
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
    table: 'chat_rooms',
    event: '*',
    onInsert: () => fetchMatches(),
    onUpdate: () => fetchMatches()
  });

  useRealtime({
    table: 'chat_messages_enhanced',
    event: 'INSERT',
    onInsert: () => fetchMatches() // Refresh to get latest message
  });

  const fetchMatches = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('chat-management', {
        body: {
          action: 'list',
          user_id: userId
        }
      });

      if (error) throw error;
      const rooms = data?.data || [];
      // Map rooms to Match type expected by UI
      const mapped: Match[] = rooms.map((r: any) => ({
        id: r.id,
        user1_id: r.user1_id,
        user2_id: r.user2_id,
        created_at: r.created_at,
        chat_room_id: r.id,
        profile: r.other_user ? {
          first_name: r.other_user.first_name,
          last_name: r.other_user.last_name || '',
          profile_images: r.other_user.profile_images || [],
          university: r.other_user.university || '',
          major: r.other_user.major || '',
          bio: r.other_user.bio || ''
        } : undefined,
        last_message: r.last_message ? {
          message_text: r.last_message,
          created_at: r.last_message_time,
          sender_id: ''
        } : undefined
      }));
      setMatches(mapped);
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

  const selectedMatchData = matches.find(m => m.id === selectedMatch);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && selectedMatchData && userId) {
      try {
        // Send message via Supabase edge function
        await supabase.functions.invoke('chat-management', {
          body: {
            action: 'send_message',
            chat_room_id: selectedMatchData.chat_room_id,
            message: message.trim(),
            user_id: userId
          }
        });
        setMessage('');
        // Refresh matches to show new message
        fetchMatches();
      } catch (error) {
        console.error('Error sending message:', error);
        toast({
          title: "Error sending message",
          description: "Please try again",
          variant: "destructive"
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-foreground font-medium">Loading matches...</p>
        </div>
      </div>
    );
  }

  const renderMatchesList = () => (
    <div className="space-y-3">
      {matches.map((match) => {
        const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
        const profile = match.profile;
        if (!profile) return null;

        return (
          <Card 
            key={match.id}
            className="cursor-pointer hover:shadow-md transition-all border-l-4 border-l-primary/20 hover:border-l-primary"
            onClick={() => setSelectedMatch(match.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="w-14 h-14">
                    <AvatarImage 
                      src={profile.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} 
                      alt={profile.first_name} 
                    />
                    <AvatarFallback>{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold text-base truncate">
                      {profile.first_name}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {match.last_message ? new Date(match.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {profile.major} at {profile.university}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {match.last_message 
                      ? (match.last_message.sender_id === userId ? 'You: ' : '') + match.last_message.message_text
                      : 'Start a conversation!'
                    }
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <Badge variant="secondary" className="text-xs">
                    Match
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderChat = () => {
    if (!selectedMatchData) return null;
    const profile = selectedMatchData.profile;
    if (!profile) return null;

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
            <AvatarImage 
              src={profile.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.first_name}`} 
              alt={profile.first_name} 
            />
            <AvatarFallback>{profile.first_name[0]}{profile.last_name[0]}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h3 className="font-semibold">{profile.first_name}</h3>
            <p className="text-sm text-muted-foreground">
              Online now
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
            <span className="text-sm font-medium">You matched on {new Date(selectedMatchData.created_at).toLocaleDateString()}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {profile.major} at {profile.university}
          </p>
        </div>

        {/* Messages would be loaded here via chat component */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="text-center text-muted-foreground">
            <p>Chat messages will appear here</p>
            <p className="text-xs">This will be integrated with the full chat system</p>
          </div>
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
            {selectedMatch ? selectedMatchData?.profile?.first_name : 'Matches'}
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