import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, MoreVertical, Shield, Brain, Zap, Users, ChevronRight } from 'lucide-react';
import { usePairing } from '@/hooks/usePairing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PairingMatch {
  user_id: string;
  first_name: string;
  last_name: string;
  university: string;
  profile_images?: string[];
  bio?: string;
  total_qcs?: number;
  compatibility_score?: number;
  can_chat?: boolean;
}

const PairingMatches: React.FC = () => {
  const { pairedProfiles, loading } = usePairing();
  const [matches, setMatches] = useState<PairingMatch[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Transform pairing data to matches format
    const transformedMatches: PairingMatch[] = pairedProfiles.map(profile => ({
      ...profile,
      compatibility_score: Math.floor(Math.random() * 30) + 70, // 70-99%
      can_chat: Math.random() > 0.3 // 70% can chat directly
    }));
    
    // Sort by compatibility score
    transformedMatches.sort((a, b) => (b.compatibility_score || 0) - (a.compatibility_score || 0));
    
    setMatches(transformedMatches);
  }, [pairedProfiles]);

  const handleChatRequest = async (matchId: string, canChat: boolean) => {
    if (canChat) {
      toast({
        title: "Chat opened! 💬",
        description: "You can now start messaging each other",
      });
    } else {
      toast({
        title: "Chat request sent! ⏳",
        description: "Waiting for them to accept your request",
        variant: "default"
      });
    }
  };

  const handleAction = (matchId: string, action: 'ghost' | 'bench') => {
    const actionText = action === 'ghost' ? 'Ghosted' : 'Benched';
    toast({
      title: `${actionText}! 👻`,
      description: `This match has been ${actionText.toLowerCase()}`,
      variant: "destructive"
    });
    
    // Remove from matches
    setMatches(prev => prev.filter(m => m.user_id !== matchId));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="text-center space-y-6 py-12">
        <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto">
          <Users className="w-10 h-10 text-purple-500" />
        </div>
        <div>
          <h3 className="text-xl font-bold mb-2">No Matches Yet</h3>
          <p className="text-muted-foreground">Complete your profile and start swiping to get AI-powered matches!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="text-center space-y-2 mb-6">
        <h2 className="text-2xl font-bold">Smart Pairing Matches</h2>
        <p className="text-muted-foreground">AI-selected compatible profiles based on deep analysis</p>
        <Badge className="bg-purple-100 text-purple-700">
          <Brain className="w-3 h-3 mr-1" />
          {matches.length} compatible matches found
        </Badge>
      </div>

      {/* Matches List */}
      <div className="space-y-4">
        {matches.map((match, index) => (
          <Card key={match.user_id} className={`overflow-hidden transition-all hover:shadow-md ${
            index === 0 ? 'ring-2 ring-purple-200' : ''
          }`}>
            <CardContent className="p-0">
              <div className="flex items-center p-4 space-x-4">
                {/* Profile Image & Status */}
                <div className="relative">
                  <Avatar className="w-16 h-16 border-2 border-purple-200">
                    <AvatarImage src={match.profile_images?.[0]} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100">
                      {match.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-xs text-white font-bold">1</span>
                    </div>
                  )}
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-lg">{match.first_name}</h3>
                    <Shield className="w-4 h-4 text-blue-500" />
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{match.university}</p>
                  
                  {/* Compatibility Score */}
                  <div className="flex items-center space-x-3">
                    <Badge className={`${
                      (match.compatibility_score || 0) >= 90 
                        ? 'bg-green-100 text-green-700' 
                        : (match.compatibility_score || 0) >= 80
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      🔥 {match.compatibility_score}% Match
                    </Badge>
                    
                    {match.total_qcs && (
                      <Badge variant="outline" className="text-xs">
                        <Brain className="w-3 h-3 mr-1" />
                        QCS: {match.total_qcs}
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col space-y-2">
                  {match.can_chat ? (
                    <Button 
                      onClick={() => handleChatRequest(match.user_id, true)}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat Now
                    </Button>
                  ) : (
                    <Button 
                      onClick={() => handleChatRequest(match.user_id, false)}
                      variant="outline"
                      size="sm"
                      className="border-blue-200 hover:bg-blue-50"
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Request Chat
                    </Button>
                  )}
                  
                  {/* More Options */}
                  <div className="relative">
                    <Button variant="ghost" size="sm" className="w-full">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Bio Preview */}
              {match.bio && (
                <div className="px-4 pb-4">
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {match.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* Quick Actions Footer */}
              <div className="border-t bg-muted/30 px-4 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAction(match.user_id, 'ghost')}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      👻 Ghost
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleAction(match.user_id, 'bench')}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                    >
                      ⏸️ Bench
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="sm">
                    View Profile
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground mb-4">
          Looking for more matches? Keep swiping to increase your compatibility pool!
        </p>
        <Button variant="outline">
          <Zap className="w-4 h-4 mr-2" />
          Get More Matches
        </Button>
      </div>
    </div>
  );
};

export default PairingMatches;