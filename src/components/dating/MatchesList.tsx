import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MessageCircle, Heart, Calendar, Send, MoreVertical, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRequiredAuth } from "@/hooks/useRequiredAuth";
import { useMatchNotifications } from "@/hooks/useMatchNotifications";
import { fetchWithFirebaseAuth } from "@/lib/fetchWithFirebaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useRealtime } from "@/hooks/useRealtime";

interface MatchesListProps {
  onNavigate: (view: 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches' | 'chat') => void;
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
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useRequiredAuth();
  const { toast } = useToast();

  // Enable match and message notifications
  useMatchNotifications();

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
      const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-management', {
        method: 'POST',
        body: JSON.stringify({
          action: 'list'
        })
      });

      if (!response.ok) throw new Error('Failed to fetch matches');
      const data = await response.json();
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
            className="hover:shadow-md transition-all border-l-4 border-l-primary/20 hover:border-l-primary"
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
                      {profile.first_name} {profile.last_name}
                    </h3>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {new Date(match.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs text-muted-foreground truncate">
                      {profile.major} at {profile.university}
                    </span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground truncate">
                    {profile.bio || 'No bio available'}
                  </p>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onNavigate('chat')}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </Button>
                  <Badge variant="default" className="text-xs bg-red-100 text-red-700">
                    <Heart className="w-3 h-3 mr-1" />
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


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate('home')}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Matches</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      {/* Content */}
      <div className="pt-16 h-screen flex flex-col">
        <div className="flex-1 overflow-y-auto p-4">
          <div className="container mx-auto max-w-2xl">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold mb-2">Your Matches</h2>
              <p className="text-muted-foreground">
                People you've matched with - click "Chat" to start a conversation
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
      </div>
    </div>
  );
};

export default MatchesList;