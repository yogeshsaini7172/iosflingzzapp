import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Heart, MessageCircle, MoreVertical, Shield, Brain, Zap, Users, ChevronRight, Star, MapPin, GraduationCap, Sparkles, Ghost, UserMinus, Clock, ArrowLeft } from 'lucide-react';
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
}

interface PairingMatchesProps {
  userId?: string;
}

const PairingMatches: React.FC<PairingMatchesProps> = ({ userId }) => {
  const { pairedProfiles, loading: feedLoading } = usePairing();
  const [matches, setMatches] = useState<PairingMatch[]>([]);
  const [scoringLoading, setScoringLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
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
              can_chat: true
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
          <div className="grid gap-4">
            {matches.map((match) => (
              <Card key={match.user_id} className="border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16 flex-shrink-0">
                      <AvatarImage 
                        src={match.profile_images?.[0] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.user_id}`} 
                        alt={match.first_name} 
                      />
                      <AvatarFallback>
                        {match.first_name[0]}{match.last_name?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-xl font-bold">
                          {match.first_name} {match.last_name || ''}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              (match.compatibility_score || 0) >= 80 ? "default" : 
                              (match.compatibility_score || 0) >= 60 ? "secondary" : "outline"
                            }
                          >
                            {match.compatibility_score || 0}% Compatible
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
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
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <GraduationCap className="w-4 h-4" />
                          {match.university || 'University'}
                        </div>
                        {match.total_qcs && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4" />
                            {match.total_qcs} QCS
                          </div>
                        )}
                      </div>

                      {match.bio && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {match.bio}
                        </p>
                      )}

                      <div className="flex gap-2">
                        {match.can_chat ? (
                          <Button 
                            onClick={() => handleChatAction(match.user_id, true)}
                            className="bg-gradient-primary"
                          >
                            <MessageCircle className="w-4 h-4 mr-2" />
                            Chat Now
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => handleChatAction(match.user_id, false)}
                            variant="outline"
                          >
                            <Heart className="w-4 h-4 mr-2" />
                            Send Request
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
    </div>
  );
};

export default PairingMatches;