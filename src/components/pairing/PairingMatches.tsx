import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, MoreVertical, Shield, Brain, Zap, Users, ChevronRight, Star, MapPin, GraduationCap, Sparkles } from 'lucide-react';
import { usePairing } from '@/hooks/usePairing';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import DetailedProfileModal from '@/components/profile/DetailedProfileModal';

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
  const [selectedProfile, setSelectedProfile] = useState<PairingMatch | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
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

  const openProfileModal = (match: PairingMatch) => {
    setSelectedProfile(match);
    setIsProfileModalOpen(true);
  };

  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
    setSelectedProfile(null);
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
      <div className="space-y-3">
        {matches.map((match, index) => (
          <Card 
            key={match.user_id} 
            className={`overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-[1.01] cursor-pointer group ${
              index === 0 ? 'ring-2 ring-purple-200 shadow-lg bg-gradient-to-br from-purple-50/50 to-pink-50/50' : 'hover:bg-gradient-to-br hover:from-purple-50/30 hover:to-pink-50/30'
            }`}
          >
            <CardContent className="p-0">
              <div 
                className="flex items-center p-4 space-x-3"
                onClick={() => openProfileModal(match)}
              >
                {/* Profile Image & Status */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-16 h-16 md:w-20 md:h-20 border-3 border-purple-200 shadow-md transition-transform group-hover:scale-110">
                    <AvatarImage src={match.profile_images?.[0]} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 text-lg md:text-xl font-bold">
                      {match.first_name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {index === 0 && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-pulse-glow">
                      <span className="text-xs md:text-sm text-white font-bold">1</span>
                    </div>
                  )}
                  {/* Online Status */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 md:w-5 md:h-5 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-lg md:text-xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                      {match.first_name}
                    </h3>
                    <Shield className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
                    <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-yellow-500 flex-shrink-0" />
                  </div>
                  
                  <div className="flex items-center space-x-1 mb-2">
                    <GraduationCap className="w-3 h-3 md:w-4 md:h-4 text-purple-500 flex-shrink-0" />
                    <p className="text-xs md:text-sm text-muted-foreground font-medium truncate">{match.university}</p>
                  </div>
                  
                  {/* Enhanced Compatibility Score */}
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge className={`text-xs md:text-sm py-1 px-2 font-bold animate-fade-in ${
                      (match.compatibility_score || 0) >= 90 
                        ? 'bg-gradient-to-r from-green-400 to-green-600 text-white shadow-lg' 
                        : (match.compatibility_score || 0) >= 80
                        ? 'bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg'
                        : 'bg-gradient-to-r from-purple-400 to-purple-600 text-white shadow-lg'
                    }`}>
                      🔥 {match.compatibility_score}%
                    </Badge>
                    
                    {match.total_qcs && (
                      <Badge variant="outline" className="text-xs border-purple-200 bg-purple-50 hidden sm:inline-flex">
                        <Brain className="w-3 h-3 mr-1" />
                        QCS: {match.total_qcs}
                      </Badge>
                    )}
                  </div>

                  {/* Quick Info Tags - Mobile Optimized */}
                  <div className="flex gap-1 flex-wrap">
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5">
                      📍 2km
                    </Badge>
                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 px-2 py-0.5">
                      🟢 Active
                    </Badge>
                    {index < 3 && (
                      <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 hidden sm:inline-flex">
                        ⭐ Top
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Enhanced Action Buttons - Mobile Optimized */}
                <div className="flex flex-col space-y-2 flex-shrink-0">
                  {match.can_chat ? (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatRequest(match.user_id, true);
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs md:text-sm px-3 py-2"
                      size="sm"
                    >
                      <MessageCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Chat Now</span>
                      <span className="sm:hidden">Chat</span>
                    </Button>
                  ) : (
                    <Button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChatRequest(match.user_id, false);
                      }}
                      className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs md:text-sm px-3 py-2"
                      size="sm"
                    >
                      <MessageCircle className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                      <span className="hidden sm:inline">Chat Request</span>
                      <span className="sm:hidden">Request</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Enhanced Bio Preview - Mobile Optimized */}
              {match.bio && (
                <div className="px-4 pb-3">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-3 border border-purple-100">
                    <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 leading-relaxed italic">
                      "{match.bio}"
                    </p>
                  </div>
                </div>
              )}

              {/* Enhanced Quick Actions Footer - Mobile Optimized */}
              <div className="border-t bg-gradient-to-r from-purple-50/50 to-pink-50/50 px-4 py-3">
                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(match.user_id, 'ghost');
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 text-xs px-2 py-1"
                    >
                      👻 <span className="hidden sm:inline ml-1">Ghost</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(match.user_id, 'bench');
                      }}
                      className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 transition-all duration-200 text-xs px-2 py-1"
                    >
                      ⏸️ <span className="hidden sm:inline ml-1">Bench</span>
                    </Button>
                  </div>
                  
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => openProfileModal(match)}
                    className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 font-semibold transition-all duration-200 text-xs px-2 py-1"
                  >
                    <span className="hidden sm:inline">View Full Profile</span>
                    <span className="sm:hidden">View Profile</span>
                    <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile Modal */}
      {selectedProfile && (
        <DetailedProfileModal
          isOpen={isProfileModalOpen}
          onClose={closeProfileModal}
          profile={selectedProfile}
          onChatRequest={handleChatRequest}
        />
      )}

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