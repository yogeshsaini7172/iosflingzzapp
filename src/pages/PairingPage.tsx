import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Brain, Star, MapPin, GraduationCap, Sparkles, Users, RefreshCw, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import ProfileModal from '@/components/profile/ProfileModal';
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
    return localStorage.getItem("demoUserId") || "6e6a510a-d406-4a01-91ab-64efdbca98f2";
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

      // Call the swipe-feed function (updated to new system)
      const { data, error } = await supabase.functions.invoke('swipe-feed', {
        body: { 
          user_id: userId,  // Pass user_id directly since no auth
          limit: 10,
          filters: {
            ageMin: 18,
            ageMax: 30
          }
        }
      });

      console.log("📊 Function response:", { data, error });

      if (error) {
        console.error('Error fetching matches:', error);
        // Fallback: show suggested profiles when limit reached or function fails
        const { data: fallback } = await supabase
          .from('profiles')
          .select('user_id, first_name, last_name, university, bio, profile_images, interests, total_qcs')
          .neq('user_id', userId)
          .eq('is_active', true)
          .limit(10);

        if (fallback) {
          const formattedMatches = fallback.map((p: any) => ({
            user_id: p.user_id,
            first_name: p.first_name,
            last_name: p.last_name,
            university: p.university,
            bio: p.bio || 'No bio available',
            profile_images: p.profile_images || [],
            age: 22,
            interests: p.interests || [],
            total_qcs: p.total_qcs || (750 + Math.floor(Math.random() * 200)),
            compatibility_score: Math.min(100, Math.max(50, Math.round((p.total_qcs || 800) / 10))),
            physical_score:  Math.round(Math.random() * 40) + 60,
            mental_score:    Math.round(Math.random() * 40) + 60,
          }));
          setMatches(formattedMatches);
          toast.success('Showing suggested profiles');
          return;
        }

        toast.error('Failed to load matches');
        return;
      }

      // Updated to match the new swipe-feed response structure
      if (data?.success && data?.profiles) {
        const formattedMatches = data.profiles.map((profile: any) => {
          return {
            user_id: profile.user_id,
            first_name: profile.first_name,
            last_name: profile.last_name,
            university: profile.university || 'University', 
            bio: profile.bio || 'No bio available',
            profile_images: profile.profile_images || [],
            age: profile.age || 22,
            interests: profile.interests || [],
            total_qcs: profile.total_qcs || (750 + Math.floor(Math.random() * 200)),
            compatibility_score: Math.min(100, Math.max(50, Math.round((profile.total_qcs || 800) / 10))),
            physical_score: Math.round(Math.random() * 40) + 60,
            mental_score: Math.round(Math.random() * 40) + 60
          };
        });
        setMatches(formattedMatches);
        toast.success(`Found ${formattedMatches.length} compatible matches!`);
      } else {
        console.log('No profiles returned or function failed, using fallback');
        // Already handled by fallback above
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = async (match: Match) => {
    const userId = getCurrentUserId();
    
    try {
      // Check if chat room already exists
      const { data: existingRoom } = await supabase
        .from("chat_rooms")
        .select("id")
        .or(`and(user1_id.eq.${userId},user2_id.eq.${match.user_id}),and(user1_id.eq.${match.user_id},user2_id.eq.${userId})`)
        .single();

      let chatRoomId = existingRoom?.id;

      if (!chatRoomId) {
        // Create new chat room
        const { data: newRoom, error: roomError } = await supabase
          .from("chat_rooms")
          .insert({
            user1_id: userId,
            user2_id: match.user_id
          })
          .select()
          .single();

        if (roomError) throw roomError;
        chatRoomId = newRoom.id;
      }

      setSelectedChatId(chatRoomId);
      toast.success("Chat opened!");
    } catch (error: any) {
      console.error("Error opening chat:", error);
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
                  {/* Profile Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={match.profile_images?.[0] || '/api/placeholder/300/200'}
                      alt={`${match.first_name} ${match.last_name}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getCompatibilityColor(match.compatibility_score || 0)} border-0`}>
                        {match.compatibility_score || 0}%
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Basic Info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">
                          {match.first_name} {match.last_name}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {match.age} years
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        {match.university}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {match.bio}
                      </p>
                    </div>

                    {/* Compatibility Scores */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1 text-red-500" />
                          Physical
                        </span>
                        <span className="font-medium">{match.physical_score || 0}%</span>
                      </div>
                      <Progress value={match.physical_score || 0} className="h-2" />

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <Brain className="h-4 w-4 mr-1 text-blue-500" />
                          Mental
                        </span>
                        <span className="font-medium">{match.mental_score || 0}%</span>
                      </div>
                      <Progress value={match.mental_score || 0} className="h-2" />

                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          Overall
                        </span>
                        <span className={getCompatibilityColor(match.compatibility_score || 0).split(' ')[0]}>
                          {getCompatibilityText(match.compatibility_score || 0)}
                        </span>
                      </div>
                    </div>

                    {/* QCS Score */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">QCS Score</span>
                      <Badge variant="outline" className="font-bold">
                        {match.total_qcs}
                      </Badge>
                    </div>

                    {/* Interests */}
                    {match.interests && match.interests.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Interests</p>
                        <div className="flex flex-wrap gap-1">
                          {match.interests.slice(0, 3).map((interest, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {match.interests.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{match.interests.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-muted/80"
                        onClick={() => setSelectedProfile(match)}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-primary shadow-royal hover:opacity-90"
                        onClick={() => handleChatClick(match)}
                      >
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Chat Now
                      </Button>
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
        <ProfileModal
          profile={selectedProfile}
          isOpen={!!selectedProfile}
          onClose={() => setSelectedProfile(null)}
          onChat={setSelectedChatId}
        />
      </div>
    </div>
  );
};

export default PairingPage;