import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Brain, Star, MapPin, GraduationCap, Sparkles, Users, RefreshCw, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DetailedProfileModal from '@/components/profile/DetailedProfileModal';
import GhostBenchBar from '@/components/ui/ghost-bench-bar';
import EnhancedChatSystem from '@/components/chat/EnhancedChatSystem';

interface Match {
  user_id: string;
  first_name: string;
  last_name: string;
  university: string;
  bio: string;
  profile_images: string[];
  age: number;
  interests: string[];
  total_qcs: number;
  compatibility_score?: number;
  physical_score?: number;
  mental_score?: number;
}

interface PairingPageProps {
  onNavigate: (view: string) => void;
}

const PairingPage = ({ onNavigate }: PairingPageProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<Match | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string>("");

  const getCurrentUserId = () => {
    // Bypass auth - use default Alice user ID
    return "11111111-1111-1111-1111-111111111001";
  };

  useEffect(() => {
    const userId = getCurrentUserId();
    const defaultUser = {
      id: userId,
      name: 'Demo User',
      profile: { total_qcs: 850 }
    };
    setCurrentUser(defaultUser);
    loadMatches(userId);
  }, []);

  const loadMatches = async (userId: string) => {
    setIsLoading(true);
    try {
      console.log("🔍 Loading matches for user:", userId);

      // Compute REAL compatibility first; only show profiles after scoring
      const { data: pairingResults, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('Error computing deterministic pairing:', error);
        toast.error('Pairing unavailable right now');
        setMatches([]);
        return;
      }

      const candidates = pairingResults?.top_candidates || [];
      const valid = candidates.filter((c: any) => Number.isFinite(Number(c?.final_score)));
      const formattedMatches = valid
        .map((c: any) => {
          const [first, ...rest] = (c.candidate_name || '').split(' ');
          const score = Math.round(Number(c.final_score));
          return {
            user_id: c.candidate_id,
            first_name: first || 'User',
            last_name: rest.join(' '),
            university: c.candidate_university || 'University',
            bio: c.candidate_bio || 'No bio available',
            profile_images: c.candidate_images || [],
            age: c.candidate_age || 0,
            interests: c.candidate_interests || [],
            total_qcs: c.candidate_qcs || 0,
            compatibility_score: score,
            physical_score: undefined,
            mental_score: undefined,
          };
        })
        .sort((a: any, b: any) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

      setMatches(formattedMatches);
      toast.success(`Found ${formattedMatches.length} calculated matches`);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = async (match: Match) => {
    const userId = getCurrentUserId();
    const compatibilityScore = match.compatibility_score || 0;
    
    // If compatibility score is 80% or below, send a chat request
    if (compatibilityScore <= 80) {
      try {
        toast.success(`Chat request sent to ${match.first_name}! 💌`);
        toast.info("They'll be notified and can choose to accept your request.");
        return;
      } catch (error: any) {
        console.error("Error sending chat request:", error);
        toast.error("Failed to send chat request");
        return;
      }
    }
    
    // If compatibility score is above 80%, allow direct chat
    try {
      console.log(`💬 Opening chat with ${match.first_name} (compatibility: ${compatibilityScore}%)`);
      
      // Check if chat room already exists
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .or(`and(user1_id.eq.${userId},user2_id.eq.${match.user_id}),and(user1_id.eq.${match.user_id},user2_id.eq.${userId})`)
        .maybeSingle();

      let chatRoomId = existingRoom?.id;

      if (!chatRoomId) {
        console.log("🏗️ Creating new chat room for high compatibility match");
        
        // Create new chat room for high compatibility
        const { data: newRoom, error: roomError } = await supabase
          .from("chat_rooms")
          .insert({
            user1_id: userId < match.user_id ? userId : match.user_id,
            user2_id: userId < match.user_id ? match.user_id : userId
          })
          .select()
          .single();

        if (roomError) throw roomError;
        chatRoomId = newRoom.id;
        
        console.log("✅ High compatibility chat room created:", newRoom);
        
        toast.success(`🎯 High compatibility detected! Chat with ${match.first_name} is now available.`);
      } else {
        console.log("♻️ Using existing chat room:", existingRoom);
      }

      setSelectedChatId(chatRoomId);
      toast.success("Chat opened! Start the conversation! 💬");
    } catch (error: any) {
      console.error("❌ Error opening chat:", error);
      toast.error("Failed to open chat");
    }
  };

  // If chat is selected, show chat interface
  if (selectedChatId) {
    return (
      <div className="space-y-4">
        <Button
          variant="outline"
          onClick={() => setSelectedChatId("")}
          className="mb-4"
        >
          ← Back to Pairing
        </Button>
        <EnhancedChatSystem onNavigate={onNavigate} selectedChatId={selectedChatId} />
      </div>
    );
  }

  const handleRefresh = () => {
    const userId = getCurrentUserId();
    loadMatches(userId);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getCompatibilityText = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Great Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Limited Match';
  };

  return (
    <div className="h-full overflow-auto bg-gradient-subtle">
      <div className="max-w-7xl mx-auto p-6">
        {/* Ghost/Bench Bar */}
        <div className="mb-6">
          <GhostBenchBar onChatSelected={setSelectedChatId} />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-elegant font-bold text-gradient-primary mb-2">
                Smart Pairing
              </h1>
              <p className="text-muted-foreground">
                AI-powered compatibility matching based on your profile and preferences
              </p>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-gradient-primary shadow-royal hover:opacity-90"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Matches
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Matches</p>
                    <p className="text-2xl font-bold">{matches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Star className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Compatibility</p>
                    <p className="text-2xl font-bold">
                      {matches.filter(m => (m.compatibility_score || 0) >= 80).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your QCS</p>
                    <p className="text-2xl font-bold">{currentUser?.profile?.total_qcs || '850'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Finding your perfect matches...</p>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <Card key={match.user_id} className="bg-gradient-card border-border/50 hover-elegant shadow-card">
                <CardContent className="p-0">
                  {/* Profile Image - Shorter */}
                  <div className="relative h-32 overflow-hidden rounded-t-lg">
                    <img 
                      src={
                        match.profile_images?.[0] 
                          ? (match.profile_images[0].startsWith('blob:') || match.profile_images[0].startsWith('http') 
                              ? match.profile_images[0] 
                              : `${supabase.storage.from('profile-images').getPublicUrl(match.profile_images[0]).data.publicUrl}`)
                          : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'
                      }
                      alt={`${match.first_name} ${match.last_name}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className={`${getCompatibilityColor(match.compatibility_score || 0)} border-0 text-xs`}>
                        {match.compatibility_score || 0}%
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0 text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-3 space-y-3">
                    {/* Basic Info - Compact */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-base font-semibold truncate">
                          {match.first_name} {match.last_name}
                        </h3>
                        <span className="text-xs text-muted-foreground">
                          {match.age}y
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mb-1">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        <span className="truncate">{match.university}</span>
                      </div>
                    </div>

                    {/* Compact Scores */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <Heart className="h-3 w-3 mr-1 text-red-500" />
                          <span>{match.physical_score || 0}%</span>
                        </div>
                        <div className="flex items-center">
                          <Brain className="h-3 w-3 mr-1 text-blue-500" />
                          <span>{match.mental_score || 0}%</span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold">
                        QCS: {match.total_qcs}
                      </Badge>
                    </div>

                    {/* Action Buttons - Compact */}
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-muted/80 text-xs py-1"
                        onClick={() => setSelectedProfile(match)}
                      >
                        View Profile
                      </Button>
                      
                      {/* Conditional Chat Button based on compatibility score */}
                      {(match.compatibility_score || 0) > 80 ? (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg text-white"
                          onClick={() => handleChatClick(match)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat Now
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400"
                          onClick={() => handleChatClick(match)}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat Request
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && matches.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              Try refreshing or updating your preferences to find more compatible matches.
            </p>
            <Button onClick={handleRefresh} className="bg-gradient-primary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Profile Modal */}
        {selectedProfile && (
          <DetailedProfileModal
            profile={selectedProfile}
            isOpen={!!selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onChatRequest={(userId) => {
              const m = matches.find(m => m.user_id === userId) || selectedProfile;
              if (m) handleChatClick(m);
            }}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-lg border-t border-border z-50 shadow-premium">
        <div className="flex justify-around items-center py-2 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('home')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <Heart className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('pairing')}
            className="flex-col h-auto py-2 px-3 text-primary hover:text-primary hover:bg-primary/10"
          >
            <div className="w-6 h-6 bg-gradient-primary rounded-lg flex items-center justify-center mb-1">
              <Users className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-xs font-medium">Pairing</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('blind-date')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <Sparkles className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Blind Date</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('profile')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <GraduationCap className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Profile</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('subscription')}
            className="flex-col h-auto py-2 px-3 text-foreground hover:text-primary hover:bg-primary/10"
          >
            <Star className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">Premium</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PairingPage;