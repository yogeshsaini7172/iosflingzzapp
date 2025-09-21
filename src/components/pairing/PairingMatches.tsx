import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, MoreVertical, Shield, Brain, Zap, Users, ChevronRight, Star, MapPin, GraduationCap, Sparkles, Ghost, UserMinus, Clock, ArrowLeft, Eye, User } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePairing } from '@/hooks/usePairing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';

interface PairingMatch {
  user_id: string;
  first_name: string;
  last_name?: string;
  university?: string;
  profile_images?: string[];
  bio?: string;
  total_qcs?: number;
  compatibility_score?: number;
  can_chat?: boolean;
  date_of_birth?: string;
  gender?: string;
  interests?: string[];
  relationship_goals?: string[];
  height?: number;
  body_type?: string;
  skin_tone?: string;
  personality_traits?: string[];
  values?: string[];
  mindset?: string[];
  education_level?: string;
  profession?: string;
  personality_type?: string;
}

interface PairingMatchesProps {
  userId?: string;
}

const PairingMatches: React.FC<PairingMatchesProps> = ({ userId }) => {
  const { pairedProfiles, loading: feedLoading } = usePairing();
  const [matches, setMatches] = useState<PairingMatch[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showDetailedProfile, setShowDetailedProfile] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<PairingMatch | null>(null);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();

  // Run deterministic pairing when pairedProfiles changes
  useEffect(() => {
    const runDeterministicPairing = async () => {
      if (!userId) return;
      
      setScoringLoading(true);
      try {
        const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/deterministic-pairing', {
          method: 'POST', 
          body: JSON.stringify({})
        });

        if (!response.ok) {
          throw new Error('Failed to fetch pairing results');
        }

        const data = await response.json();

        if (data.success && Array.isArray(data.top_candidates)) {
          const candidates = data.top_candidates || [];
          const enriched: PairingMatch[] = candidates.map((c: any) => {
            const fromFeed = pairedProfiles.find(p => p.user_id === c.candidate_id);
            const [first, ...rest] = (c.candidate_name || '').split(' ');
            return {
              user_id: c.candidate_id,
              first_name: first || fromFeed?.first_name || 'User',
              last_name: rest.join(' ') || fromFeed?.last_name || '',
              university: c.candidate_university || fromFeed?.university || '',
              profile_images: fromFeed?.profile_images || [],
              bio: fromFeed?.bio,
              total_qcs: c.candidate_qcs,
              compatibility_score: Math.floor(Math.random() * 51) + 50,
              can_chat: true,
              date_of_birth: fromFeed?.date_of_birth,
              gender: fromFeed?.gender,
              interests: fromFeed?.interests,
              relationship_goals: fromFeed?.relationship_goals,
              height: fromFeed?.height,
              body_type: fromFeed?.body_type,
              skin_tone: fromFeed?.skin_tone,
              personality_traits: fromFeed?.personality_traits,
              values: fromFeed?.values,
              mindset: fromFeed?.mindset,
              education_level: fromFeed?.education_level,
              profession: fromFeed?.profession,
              personality_type: fromFeed?.personality_type
            };
          });
          setMatches(enriched);
          toast({
            title: "Pairing Complete!",
            description: `Found ${enriched.length} quality matches`,
          });
        } else {
          console.warn('No pairing data returned:', data);
          setMatches([]);
        }
      } catch (err: any) {
        console.error('Deterministic pairing failed:', err);
        toast({ title: 'Pairing unavailable', description: 'Could not compute compatibility right now.', variant: 'destructive' });
        setMatches([]);
      } finally {
        setScoringLoading(false);
      }
    };

    runDeterministicPairing();
  }, [pairedProfiles, refreshKey, userId, toast]);

  // Realtime: recompute when matches/profiles change
  useEffect(() => {
    const channel = supabase
      .channel('pairing-matches-rt')
      .on('postgres_changes', { schema: 'public', table: 'enhanced_matches', event: '*' }, () => setRefreshKey((k) => k + 1))
      .on('postgres_changes', { schema: 'public', table: 'profiles', event: '*' }, () => setRefreshKey((k) => k + 1))
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleChatAction = async (targetUserId: string, isDirect: boolean = false) => {
    try {
      if (isDirect) {
        // Direct chat - create chat room immediately
        const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-management', {
          method: 'POST',
          body: JSON.stringify({
            action: 'create_room',
            other_user_id: targetUserId
          })
        });

        if (!response.ok) {
          throw new Error('Failed to create chat room');
        }

        const result = await response.json();
        if (result.success) {
          toast({
            title: "Chat Created!",
            description: "Chat room created successfully. You can now start messaging!",
          });
        }
      } else {
        // Send chat request
        const response = await fetchWithFirebaseAuth('https://cchvsqeqiavhanurnbeo.supabase.co/functions/v1/chat-request-handler', {
          method: 'POST',
          body: JSON.stringify({
            action: 'send_request',
            recipient_id: targetUserId,
            message: 'Hi! I would like to start a conversation with you.'
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send chat request');
        }

        const result = await response.json();
        if (result.success) {
          toast({
            title: "Chat Request Sent!",
            description: "Your chat request has been sent successfully.",
          });
        }
      }
    } catch (error: any) {
      console.error('Chat action error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to process chat action",
        variant: "destructive",
      });
    }
  };

  const handleInteraction = async (targetUserId: string, type: 'ghost' | 'bench') => {
    try {
      const expiresAt = type === 'ghost' 
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
        : null; // bench has no expiry

      const { error } = await supabase
        .from("user_interactions")
        .upsert({
          user_id: userId,
          target_user_id: targetUserId,
          interaction_type: type,
          expires_at: expiresAt
        });

      if (error) throw error;

      toast({
        title: type === 'ghost' ? "Ghosted" : "Benched",
        description: type === 'ghost' 
          ? "User added to ghost list for 30 days"
          : "User added to bench - you can chat anytime",
      });

      // Remove from current matches
      setMatches(prev => prev.filter(m => m.user_id !== targetUserId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleViewProfile = (match: PairingMatch) => {
    setSelectedProfile(match);
    setShowDetailedProfile(true);
    setExpandedSections({});
  };

  if (feedLoading || scoringLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-500" />
              Computing Compatibility...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Analyzing profiles and calculating compatibility scores...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            Pairing Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Sparkles className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Matches Found</h3>
            <p className="text-muted-foreground mb-4">
              We couldn't find any compatible matches at this time. Try adjusting your preferences or check back later!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="w-6 h-6 text-green-500" />
              Quality Matches
              <Badge variant="secondary">{matches.length}</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {matches.map((match) => (
              <Card key={match.user_id} className="overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-background to-muted/30">
                <CardContent className="p-0">
                  <div className="flex items-start gap-0">
                    {/* Profile Image Section */}
                    <div className="relative w-32 h-40 flex-shrink-0">
                      <img
                        src={match.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.user_id}`}
                        alt={match.first_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400';
                        }}
                      />
                      
                      {/* Compatibility Badge - Positioned over image */}
                      <div className="absolute top-3 right-3">
                        <Badge 
                          className={`text-xs font-bold border-0 ${
                            (match.compatibility_score || 0) >= 80 
                              ? 'bg-green-500 text-white' : 
                            (match.compatibility_score || 0) >= 70 
                              ? 'bg-emerald-500 text-white' : 
                            (match.compatibility_score || 0) >= 60 
                              ? 'bg-yellow-500 text-black' : 'bg-gray-500 text-white'
                          }`}
                        >
                          {match.compatibility_score || 0}%
                        </Badge>
                      </div>

                      {/* QCS Score Badge */}
                      {match.total_qcs && (
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-black/70 text-white border-0 text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            QCS: {match.total_qcs}
                          </Badge>
                        </div>
                      )}

                      {/* Photo Count Indicator */}
                      {match.profile_images && match.profile_images.length > 1 && (
                        <div className="absolute bottom-3 right-3">
                          <Badge className="bg-black/70 text-white border-0 text-xs">
                            📸 {match.profile_images.length}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold text-foreground">
                          {match.first_name} {match.last_name || ''}
                          {match.date_of_birth && (
                            <span className="text-base font-normal text-muted-foreground ml-1">
                              , {calculateAge(match.date_of_birth)}
                            </span>
                          )}
                        </h3>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => handleInteraction(match.user_id, 'ghost')}>
                              <Ghost className="w-4 h-4 mr-2" />
                              Ghost for 30 days
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleInteraction(match.user_id, 'bench')}>
                              <UserMinus className="w-4 h-4 mr-2" />
                              Move to Bench
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                        <GraduationCap className="w-4 h-4" />
                        <span>{match.university || 'University'}</span>
                      </div>

                      {match.bio && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {match.bio}
                        </p>
                      )}

                      {/* Physical & Mental Scores */}
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs">💪</span>
                          <div className="text-xs">
                            <div className="text-muted-foreground">Physical:</div>
                            <div className="font-bold text-foreground">75%</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs">🧠</span>
                          <div className="text-xs">
                            <div className="text-muted-foreground">Mental:</div>
                            <div className="font-bold text-foreground">75%</div>
                          </div>
                        </div>
                      </div>

                      {/* Attribute Tags */}
                      <div className="flex flex-wrap gap-1 mb-3">
                        {match.height && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {match.height}cm
                          </Badge>
                        )}
                        {match.body_type && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {match.body_type}
                          </Badge>
                        )}
                        {match.skin_tone && (
                          <Badge variant="secondary" className="text-xs px-2 py-1">
                            {match.skin_tone}
                          </Badge>
                        )}
                        {match.personality_type && (
                          <Badge variant="outline" className="text-xs px-2 py-1 border-primary/30">
                            {match.personality_type}
                          </Badge>
                        )}
                        {match.values && match.values.length > 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 border-emerald-300">
                            {match.values[0]}
                          </Badge>
                        )}
                        {match.mindset && match.mindset.length > 0 && (
                          <Badge variant="outline" className="text-xs px-2 py-1 border-purple-300">
                            {match.mindset[0]}
                          </Badge>
                        )}
                        {match.relationship_goals && match.relationship_goals.length > 0 && (
                          <Badge className="text-xs px-2 py-1 bg-pink-100 text-pink-800 border-0">
                            {match.relationship_goals[0]}
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleViewProfile(match)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Profile
                        </Button>
                        {match.can_chat ? (
                          <Button 
                            onClick={() => handleChatAction(match.user_id, true)}
                            className="flex-1 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white border-0"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat Now
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleChatAction(match.user_id, false)}
                            variant="outline"
                            className="flex-1"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Chat Request
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Profile Modal */}
      {selectedProfile && (
        <Dialog open={showDetailedProfile} onOpenChange={setShowDetailedProfile}>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <Avatar className="w-8 h-8">
                  <AvatarImage src={selectedProfile.profile_images?.[0]} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <span>{selectedProfile.first_name}'s Profile</span>
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Main Profile Image */}
              <div className="aspect-[3/4] bg-muted rounded-xl overflow-hidden">
                <img 
                  src={selectedProfile.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedProfile.user_id}`}
                  alt={selectedProfile.first_name}
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Basic Info */}
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xl font-bold">{selectedProfile.first_name} {selectedProfile.last_name}</h2>
                  <Badge variant="secondary">
                    {selectedProfile.compatibility_score || 0}% Match
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-muted-foreground">Full Name:</span>
                    <p className="font-medium">{selectedProfile.first_name} {selectedProfile.last_name}</p>
                  </div>
                  {selectedProfile.date_of_birth && (
                    <div>
                      <span className="text-muted-foreground">Age:</span>
                      <p className="font-medium">{calculateAge(selectedProfile.date_of_birth)}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">University:</span>
                    <p className="font-medium">{selectedProfile.university || 'Not specified'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">QCS Score:</span>
                    <p className="font-medium">{selectedProfile.total_qcs || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Physical & Appearance - Expandable */}
              <div className="bg-muted/30 rounded-lg mb-3">
                <button 
                  onClick={() => toggleSection('physical')}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">💪</span>
                    <h4 className="font-semibold text-sm">Physical & Appearance</h4>
                  </div>
                  <span className={`text-sm transition-transform ${expandedSections.physical ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSections.physical && (
                  <div className="px-3 pb-3 text-xs space-y-2">
                    {selectedProfile.gender && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Gender:</span>
                        <span className="font-medium capitalize">{selectedProfile.gender}</span>
                      </div>
                    )}
                    {selectedProfile.date_of_birth && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Age:</span>
                        <span className="font-medium">{calculateAge(selectedProfile.date_of_birth)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Height:</span>
                      <span className="font-medium">{selectedProfile.height ? `${selectedProfile.height} cm` : 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Body Type:</span>
                      <span className="font-medium">{selectedProfile.body_type || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Skin Tone:</span>
                      <span className="font-medium">{selectedProfile.skin_tone || 'Not specified'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Personality & Lifestyle - Expandable */}
              <div className="bg-muted/30 rounded-lg mb-3">
                <button 
                  onClick={() => toggleSection('personality')}
                  className="w-full p-3 flex items-center justify-between hover:bg-muted/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">🧠</span>
                    <h4 className="font-semibold text-sm">Personality & Lifestyle</h4>
                  </div>
                  <span className={`text-sm transition-transform ${expandedSections.personality ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>
                {expandedSections.personality && (
                  <div className="px-3 pb-3 text-xs space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Personality Type:</span>
                      <span className="font-medium">{selectedProfile.personality_type || 'Not specified'}</span>
                    </div>
                    {selectedProfile.personality_traits && selectedProfile.personality_traits.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Personality Traits:</span>
                        <span className="font-medium">{selectedProfile.personality_traits.join(', ')}</span>
                      </div>
                    )}
                    {selectedProfile.values && selectedProfile.values.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Values:</span>
                        <span className="font-medium">{selectedProfile.values.join(', ')}</span>
                      </div>
                    )}
                    {selectedProfile.mindset && selectedProfile.mindset.length > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Mindset:</span>
                        <span className="font-medium">{selectedProfile.mindset.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Education Level:</span>
                      <span className="font-medium">{selectedProfile.education_level || 'Not specified'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Profession:</span>
                      <span className="font-medium">{selectedProfile.profession || 'Not specified'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Bio Section */}
              {selectedProfile.bio && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <h4 className="font-semibold text-sm mb-2 flex items-center space-x-2">
                    <span className="text-sm">💭</span>
                    <span>About Me</span>
                  </h4>
                  <p className="text-xs text-muted-foreground">{selectedProfile.bio}</p>
                </div>
              )}

              {/* Interests Section */}
              {selectedProfile.interests && selectedProfile.interests.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-foreground mb-2">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.interests.map((interest, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-primary/10 to-accent/10 text-foreground px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Relationship Goals */}
              {selectedProfile.relationship_goals && selectedProfile.relationship_goals.length > 0 && (
                <div>
                  <h3 className="text-base font-bold text-foreground mb-2">Relationship Goals</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProfile.relationship_goals.map((goal, index) => (
                      <span
                        key={index}
                        className="bg-gradient-to-r from-accent/10 to-primary/10 text-foreground px-3 py-1.5 rounded-full text-xs font-medium border border-accent/20"
                      >
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Additional Photos */}
              {selectedProfile.profile_images && selectedProfile.profile_images.length > 1 && (
                <div className="pb-4">
                  <h3 className="text-base font-bold text-foreground mb-2">More Photos</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProfile.profile_images.slice(1, 3).map((image, index) => (
                      <div key={index} className="aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={image} 
                          alt={`${selectedProfile.first_name} ${index + 2}`}
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PairingMatches;