import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Brain, Star, MapPin, GraduationCap, Sparkles, Users, RefreshCw, MessageCircle, Zap, Crown } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DetailedProfileModal from '@/components/profile/DetailedProfileModalNew';
import RebuiltChatSystem from '@/components/chat/RebuiltChatSystem';
import { useRequiredAuth } from '@/hooks/useRequiredAuth';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import ProfileImageHandler from '@/components/common/ProfileImageHandler';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import { useSubscriptionEntitlements } from '@/hooks/useSubscriptionEntitlements';
import { PairingLimitService } from '@/services/pairingLimits';

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
  matched_criteria?: string[];
  not_matched_criteria?: string[];
  // Additional fields for detailed profile view
  face_type?: string;
  personality_type?: string;
  personality_traits?: string[];
  body_type?: string;
  skin_tone?: string;
  values?: string[];
  mindset?: string[];
  relationship_goals?: string[];
  height?: number;
  location?: string;
  lifestyle?: string;
  love_language?: string;
  field_of_study?: string;
  profession?: string;
  education_level?: string;
}

interface PairingPageProps {
  onNavigate: (view: string) => void;
}

const PairingPage = ({ onNavigate }: PairingPageProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedProfiles, setHasLoadedProfiles] = useState(false);
  const [shouldShowExistingProfiles, setShouldShowExistingProfiles] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [selectedProfile, setSelectedProfile] = useState<Match | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string>("");

  const { userId, isLoading: authLoading } = useRequiredAuth();
  const [myReq, setMyReq] = useState<any>(null);
  const [myQual, setMyQual] = useState<any>(null);

  // Subscription and pairing limits
  const { entitlements, loading: subscriptionLoading, refreshEntitlements } = useSubscriptionEntitlements();
  const [pairingLimits, setPairingLimits] = useState({
    canRequest: true,
    usedToday: 0,
    dailyLimit: 1,
    remainingRequests: 1
  });

  // Show loading state while auth is being checked
  if (authLoading || !userId) {
    return (
      <UnifiedLayout title="Smart Pairing">
        <div className="flex items-center justify-center h-96">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 bg-gradient-royal rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <p className="text-foreground/70 font-modern text-lg">Loading your elite matches...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  const parseJsonSafe = (v: any) => {
    if (!v) return null;
    try {
      // Handle stored strings like "\"{...}\""
      const s = typeof v === 'string' ? v.replace(/^"|"$/g, '') : v;
      return typeof s === 'string' ? JSON.parse(s) : s;
    } catch {
      return null;
    }
  };

  // Check pairing limits when user or subscription changes
  useEffect(() => {
    if (userId) {
      // Use entitlements if available, otherwise fallback to free plan
      const planId = entitlements?.plan.id || 'free';
      const limits = PairingLimitService.canMakePairingRequest(userId, planId);
      setPairingLimits(limits);
      console.log('🎯 Pairing limits updated:', limits, 'for plan:', planId);
      console.log('🎯 Full entitlements:', entitlements);
      
      // Clean up old localStorage data
      PairingLimitService.cleanupOldUsageData(userId);
    }
  }, [userId, entitlements]);

  useEffect(() => {
    console.log('🎯 PairingPage useEffect triggered with userId:', userId);
    if (!userId) {
      console.log('⚠️ No userId available, skipping QCS fetch');
      return;
    }
    
    const fetchUserData = async () => {
      console.log('🔍 Fetching user data for:', userId);
      
      // Fetch current user's QCS and requirements via Edge Function (bypasses RLS)
      try {
        const response = await fetchWithFirebaseAuth('/functions/v1/data-management', {
          method: 'POST',
          body: JSON.stringify({ action: 'get_profile' })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          console.error('❌ get_profile failed:', err);
          setCurrentUser({ id: userId, profile: { total_qcs: 0 } });
        } else {
          const result = await response.json();
          const profile = result?.data?.profile || null;
          console.log('✅ Profile via function:', profile);
          setCurrentUser({ id: userId, profile: { total_qcs: profile?.total_qcs || 0 } });
          setMyReq(parseJsonSafe(profile?.requirements));
        }
      } catch (e) {
        console.error('❌ Error calling data-management.get_profile:', e);
        setCurrentUser({ id: userId, profile: { total_qcs: 0 } });
      }
    };

    // Only fetch user data initially, not matches automatically
    // But check if we should show existing profiles
    fetchUserData();
    checkExistingProfiles();
  }, [userId]);

  // Additional effect to handle page refresh and ensure profiles persist
  useEffect(() => {
    if (userId && !hasLoadedProfiles && !shouldShowExistingProfiles && !isLoading) {
      console.log('🔄 Checking for existing profiles on page load/refresh...');
      checkExistingProfiles();
    }
  }, [userId, hasLoadedProfiles, shouldShowExistingProfiles, isLoading]);

  // Check if there are existing profiles to show (from previous pairing requests)
  const checkExistingProfiles = async () => {
    if (!userId) return;
    
    try {
      // Check if user has made any pairing requests today
      const today = new Date().toLocaleDateString('en-CA');
      const usage = PairingLimitService.getDailyUsage(userId);
      
      console.log('🔍 Checking existing profiles - Usage:', usage);
      
      if (usage && usage.pairing_requests_used > 0) {
        // User has made requests today, try to load existing matches
        console.log('🔍 User has made pairing requests today, loading existing matches...');
        
        // Add a timeout to prevent infinite loading
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            console.log('⏰ Loading timeout reached, stopping...');
            setIsLoading(false);
            resolve(false);
          }, 10000); // 10 second timeout
        });
        
        const loadPromise = loadMatchesForDisplay(userId);
        const hasMatches = await Promise.race([loadPromise, timeoutPromise]);
        
        if (hasMatches) {
          setHasLoadedProfiles(true);
          setShouldShowExistingProfiles(true);
        } else {
          // If no matches found but user has used requests, still show the interface
          console.log('� No matches found but user has used requests today');
          setHasLoadedProfiles(true);
          setShouldShowExistingProfiles(true);
        }
      } else {
        // No usage recorded, just set loading to false
        console.log('🔍 No usage recorded, setting up fresh state...');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error checking existing profiles:', error);
      setIsLoading(false);
    }
  };

  // Load matches for display without incrementing usage (for showing existing matches)
  const loadMatchesForDisplay = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      console.log("🔍 Loading existing matches for display:", userId);

      const { data: pairingResults, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('❌ Error loading existing matches:', error);
        setIsLoading(false);
        // Return false if we can't load matches, but don't clear existing ones
        return matches.length > 0;
      }

      if (!pairingResults.success) {
        console.error('Pairing function returned error:', pairingResults.error);
        setIsLoading(false);
        // Return false if pairing function fails, but don't clear existing ones  
        return matches.length > 0;
      }

      // Handle the response format from deterministic-pairing
      let candidatesData = [];
      
      // Check if we have matches or top_candidates
      if (pairingResults.matches && Array.isArray(pairingResults.matches)) {
        candidatesData = pairingResults.matches;
        console.log('✅ Found matches in response:', candidatesData.length);
      } else if (pairingResults.top_candidates && Array.isArray(pairingResults.top_candidates)) {
        candidatesData = pairingResults.top_candidates;
        console.log('✅ Found top_candidates in response:', candidatesData.length);
      } else {
        console.log('⚠️ No matches or candidates found in response');
        setIsLoading(false);
        return false;
      }

      const formattedMatches = candidatesData.map((match: any) => {
        // Handle both formats - direct match format and candidate format
        if (match.candidate_id) {
          // Candidate format from deterministic-pairing
          const [first, ...rest] = (match.candidate_name || '').split(' ');
          return {
            user_id: match.candidate_id,
            first_name: first || 'User',
            last_name: rest.join(' '),
            university: match.candidate_university || 'University',
            bio: match.candidate_bio || 'No bio available',
            profile_images: match.candidate_images || [],
            age: match.candidate_age || 0,
            interests: match.candidate_interests || [],
            total_qcs: match.candidate_qcs || 0,
            compatibility_score: Math.round(Number(match.final_score) || Number(match.deterministic_score) || 0),
            physical_score: Math.round(Number(match.physical_score) || 0),
            mental_score: Math.round(Number(match.mental_score) || 0),
            matched_criteria: match.debug_info?.matched || [],
            not_matched_criteria: match.debug_info?.not_matched || [],
            face_type: match.candidate_face_type,
            personality_type: match.candidate_personality_type,
            personality_traits: match.candidate_personality_traits || [],
            body_type: match.candidate_body_type,
            skin_tone: match.candidate_skin_tone,
            values: match.candidate_values,
            mindset: match.candidate_mindset,
            relationship_goals: match.candidate_relationship_goals || [],
            height: match.candidate_height,
            location: match.candidate_location,
            lifestyle: match.candidate_lifestyle,
            love_language: match.candidate_love_language,
            field_of_study: match.candidate_field_of_study,
            profession: match.candidate_profession,
            education_level: match.candidate_education_level
          };
        } else {
          // Direct match format
          return {
            user_id: match.user_id,
            first_name: match.first_name,
            last_name: match.last_name,
            university: match.university,
            bio: match.bio,
            profile_images: match.profile_images || [],
            age: match.age,
            interests: match.interests || [],
            total_qcs: match.total_qcs,
            compatibility_score: match.compatibility_score,
            physical_score: match.physical_score,
            mental_score: match.mental_score,
            matched_criteria: match.matched_criteria || [],
            not_matched_criteria: match.not_matched_criteria || [],
            face_type: match.face_type,
            personality_type: match.personality_type,
            personality_traits: match.personality_traits || [],
            body_type: match.body_type,
            skin_tone: match.skin_tone,
            values: match.values,
            mindset: match.mindset,
            relationship_goals: match.relationship_goals || [],
            height: match.height,
            location: match.location,
            lifestyle: match.lifestyle,
            love_language: match.love_language,
            field_of_study: match.field_of_study,
            profession: match.profession,
            education_level: match.education_level
          };
        }
      });

      setMatches(formattedMatches);
      console.log('✅ Existing matches loaded for display:', formattedMatches.length);
      return formattedMatches.length > 0;
    } catch (error) {
      console.error('❌ Error in loadMatchesForDisplay:', error);
      // Don't clear existing matches on error, keep what we have
      return matches.length > 0;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatches = async (userId: string) => {
    setIsLoading(true);
    try {
      console.log("🔍 Loading matches for user:", userId);

      // Compute REAL compatibility first; only show profiles after scoring
      console.log("📡 Calling deterministic-pairing function...");
      const { data: pairingResults, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { user_id: userId }
      });

      if (error) {
        console.error('❌ Error invoking deterministic-pairing:', error);
        toast.error(`Pairing error: ${error.message || 'Unknown error'}`);
        setMatches([]);
        return;
      }

      console.log('✅ Deterministic pairing results:', pairingResults);

      // Handle different response types
      if (!pairingResults.success) {
        console.error('Pairing function returned error:', pairingResults.error);
        if (pairingResults.error?.includes('profile not found')) {
          toast.error('Please complete your profile setup first to use pairing.');
        } else {
          toast.error(pairingResults.error || 'Pairing unavailable right now');
        }
        setMatches([]);
        return;
      }

      const candidates = pairingResults?.top_candidates || [];
      console.log(`Found ${candidates.length} candidates from deterministic pairing`);

      if (candidates.length === 0) {
        toast.info(pairingResults.message || 'No matches found. Try again later!');
        setMatches([]);
        return;
      }

      // Display exact scores calculated by deterministic algorithm
      console.log('🔍 Raw candidates from deterministic-pairing:', candidates);
      
      const formattedMatches = candidates
        .filter((c: any) => c?.candidate_id)
        .map((c: any) => {
          const [first, ...rest] = (c.candidate_name || '').split(' ');
          
          // Use EXACT scores from deterministic algorithm - no fallbacks
          const compatibilityScore = Number(c.final_score) || Number(c.deterministic_score) || 0;
          const physicalScore = Number(c.physical_score) || 0;
          const mentalScore = Number(c.mental_score) || 0;
          
          console.log(`📊 ${c.candidate_name}:`, {
            compatibility: compatibilityScore,
            physical: physicalScore, 
            mental: mentalScore,
            matched: c.debug_info?.matched || [],
            not_matched: c.debug_info?.not_matched || []
          });
          
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
            compatibility_score: Math.round(compatibilityScore),
            physical_score: Math.round(physicalScore),
            mental_score: Math.round(mentalScore),
            // Add debugging info for display
            matched_criteria: c.debug_info?.matched || [],
            not_matched_criteria: c.debug_info?.not_matched || [],
            // Map additional profile fields from deterministic-pairing response
            face_type: c.candidate_face_type,
            personality_type: c.candidate_personality_type,
            personality_traits: c.candidate_personality_traits,
            body_type: c.candidate_body_type,
            skin_tone: c.candidate_skin_tone,
            values: c.candidate_values,
            mindset: c.candidate_mindset,
            relationship_goals: c.candidate_relationship_goals,
            height: c.candidate_height,
            location: c.candidate_location,
            lifestyle: c.candidate_lifestyle,
            love_language: c.candidate_love_language,
            field_of_study: c.candidate_field_of_study,
            profession: c.candidate_profession,
            education_level: c.candidate_education_level
          };
        })
        .sort((a: any, b: any) => (b.compatibility_score || 0) - (a.compatibility_score || 0));

      setMatches(formattedMatches);
      toast.success(`Found ${formattedMatches.length} calculated matches`);
    } catch (error) {
      console.error('Error in loadMatches:', error);
      toast.error('Failed to load matches. Please check your internet connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatClick = async (match: Match) => {
    const compatibilityScore = match.compatibility_score || 0;
    
    // If compatibility score is 80% or below, send a chat request
    if (compatibilityScore <= 80) {
      try {
        const response = await fetchWithFirebaseAuth('/functions/v1/chat-request-handler', {
          method: 'POST',
          body: JSON.stringify({
            action: 'send_request',
            recipient_id: match.user_id,
            message: `Hi ${match.first_name}! I would like to start a conversation with you.`
          })
        });
        if (!response.ok) throw new Error('Failed to send chat request');
        toast.success(`Chat request sent to ${match.first_name}! 💌`);
        toast.info("They'll be notified and can choose to accept your request.");
        return;
      } catch (error: any) {
        console.error('Error sending chat request:', error);
        toast.error(error.message || 'Failed to send chat request');
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
        <RebuiltChatSystem onNavigate={onNavigate} selectedChatId={selectedChatId} />
      </div>
    );
  }

  const handleRefresh = async () => {
    // Check if user can make more pairing requests
    if (!pairingLimits.canRequest) {
      // Always ensure existing profiles are visible when limit is reached
      if (!hasLoadedProfiles && !shouldShowExistingProfiles) {
        const hasMatches = await loadMatchesForDisplay(userId);
        if (hasMatches) {
          setHasLoadedProfiles(true);
          setShouldShowExistingProfiles(true);
        }
      }
      
      // Show upgrade prompt but keep existing profiles visible
      toast.error(
        `Daily pairing limit reached! You've used ${pairingLimits.usedToday}/${pairingLimits.dailyLimit} requests today.`,
        {
          action: {
            label: "Upgrade Plan",
            onClick: () => onNavigate('subscription')
          },
          duration: 5000
        }
      );
      return;
    }

    // Increment usage count for new requests
    if (userId) {
      const success = PairingLimitService.incrementDailyUsage(userId);
      if (success) {
        // Update local limits state using fallback plan if needed
        const planId = entitlements?.plan.id || 'free';
        const newLimits = PairingLimitService.canMakePairingRequest(userId, planId);
        setPairingLimits(newLimits);
        
        console.log(`🎯 Pairing request used: ${newLimits.usedToday}/${newLimits.dailyLimit} (plan: ${planId})`);
        
        // Show remaining requests if getting close to limit
        if (newLimits.remainingRequests <= 2 && newLimits.remainingRequests > 0) {
          toast.warning(`${newLimits.remainingRequests} pairing requests remaining today`);
        }
      }
    }

    await loadMatches(userId);
    setHasLoadedProfiles(true);
    setShouldShowExistingProfiles(true);
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
    <UnifiedLayout title="Smart Pairing">
      <div className="container mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-elegant font-bold text-gradient-primary mb-2">
                Smart Pairing
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                AI-powered compatibility matching based on your profile and preferences
              </p>
            </div>
            <Button
              onClick={handleRefresh}
              disabled={isLoading || !pairingLimits.canRequest}
              className="bg-gradient-primary shadow-royal hover:opacity-90 text-sm px-3 py-2 sm:px-4 sm:py-2 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className={`h-4 w-4 mr-2 ${isLoading ? 'animate-pulse' : ''}`} />
              {!pairingLimits.canRequest ? 'Daily Limit Reached' : 'Get Today\'s Pair'}
            </Button>
          </div>

          {/* Subscription Status & Daily Limits */}
          <div className="bg-gradient-subtle border border-primary/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Crown className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {entitlements?.plan.display_name || 'Free'} Plan
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Daily Pairing Requests: {pairingLimits.usedToday}/{pairingLimits.dailyLimit}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-primary">
                  {pairingLimits.remainingRequests} Remaining
                </p>
                {pairingLimits.remainingRequests === 0 && (
                  <Button 
                    size="sm" 
                    onClick={() => onNavigate('subscription')}
                    className="bg-gradient-gold text-xs mt-1"
                  >
                    Upgrade Plan
                  </Button>
                )}
                {/* Debug button for development - remove in production */}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={refreshEntitlements}
                  className="text-xs mt-1 opacity-50"
                >
                  🔄 Refresh
                </Button>
              </div>
            </div>
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
                    <p className="text-2xl font-bold">{(hasLoadedProfiles || shouldShowExistingProfiles) ? matches.length : '—'}</p>
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
                    <p className="text-2xl font-bold">{currentUser?.profile?.total_qcs || 0}</p>
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
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setIsLoading(false);
                  console.log('🛑 User cancelled loading');
                }}
                className="mt-4"
              >
                Cancel Loading
              </Button>
            </div>
          </div>
        )}

        {/* Initial State - No profiles loaded yet */}
        {!isLoading && !(hasLoadedProfiles || shouldShowExistingProfiles) && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gradient-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="h-12 w-12 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to find your perfect match?</h3>
            <p className="text-muted-foreground mb-4">
              Click the button below to get your personalized daily pairing based on compatibility scoring.
            </p>
            <Button 
              onClick={handleRefresh} 
              disabled={!pairingLimits.canRequest}
              className="bg-gradient-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className="h-4 w-4 mr-2" />
              {!pairingLimits.canRequest ? 'Daily Limit Reached' : 'Get Today\'s Pair'}
            </Button>
          </div>
        )}

        {/* Empty State - Daily limit reached but no profiles to show */}
        {!isLoading && matches.length === 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && !pairingLimits.canRequest && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Crown className="h-12 w-12 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Daily Pairing Limit Reached</h3>
            <p className="text-muted-foreground mb-4">
              You've used all {pairingLimits.dailyLimit} of your daily pairing requests. Upgrade your plan for more requests or try again tomorrow!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => onNavigate('subscription')}
                className="bg-gradient-gold"
              >
                <Crown className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
              <Button 
                variant="outline"
                onClick={() => {
                  // Try to refresh/check for existing profiles again
                  checkExistingProfiles();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Again
              </Button>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && matches.length > 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <Card key={match.user_id} className="bg-gradient-card border-border/50 hover-elegant shadow-card">
                <CardContent className="p-0">
                  {/* Profile Image - Shorter */}
                  <div className="relative h-32 overflow-hidden rounded-t-lg">
                    <ProfileImageHandler
                      src={match.profile_images?.[0]}
                      alt={`${match.first_name} ${match.last_name}`}
                      className="w-full h-full object-cover"
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

                    {/* Detailed Scoring Breakdown */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center">
                            <Zap className="h-3 w-3 mr-1 text-amber-500" />
                            <span className="font-medium">Physical: {match.physical_score}%</span>
                          </div>
                          <div className="flex items-center">
                            <Brain className="h-3 w-3 mr-1 text-blue-500" />
                            <span className="font-medium">Mental: {match.mental_score}%</span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs font-bold">
                          QCS: {match.total_qcs}
                        </Badge>
                      </div>
                      
                      {/* Match Criteria Breakdown */}
                      {(match.matched_criteria?.length > 0 || match.not_matched_criteria?.length > 0) && (
                        <div className="text-xs space-y-1">
                          {match.matched_criteria?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-green-600 font-medium">✓</span>
                              {match.matched_criteria.map((criteria, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-green-100 text-green-700">
                                  {criteria.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {match.not_matched_criteria?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              <span className="text-red-500 font-medium">✗</span>
                              {match.not_matched_criteria.slice(0, 3).map((criteria, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs text-red-600 border-red-200">
                                  {criteria.replace('_', ' ')}
                                </Badge>
                              ))}
                              {match.not_matched_criteria.length > 3 && (
                                <span className="text-xs text-muted-foreground">+{match.not_matched_criteria.length - 3} more</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - Compact */}
                    <div className="flex space-x-2 relative z-10">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-muted/80 text-xs py-1 cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('🔍 View Profile clicked for:', match.first_name, match.user_id);
                          setSelectedProfile(match);
                        }}
                      >
                        View Profile
                      </Button>
                      
                      {/* Conditional Chat Button based on compatibility score */}
                      {(match.compatibility_score || 0) > 80 ? (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-lg text-white cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('💬 Chat Now clicked for:', match.first_name, match.user_id);
                            handleChatClick(match);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Chat Now
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 border-rose-300 text-rose-600 hover:bg-rose-50 hover:border-rose-400 cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('📨 Chat Request clicked for:', match.first_name, match.user_id);
                            handleChatClick(match);
                          }}
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
        {!isLoading && matches.length === 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              Get your daily pair or update your preferences to find more compatible matches.
            </p>
            <Button 
              onClick={handleRefresh} 
              disabled={!pairingLimits.canRequest}
              className="bg-gradient-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Heart className="h-4 w-4 mr-2" />
              {!pairingLimits.canRequest ? 'Daily Limit Reached' : 'Get Today\'s Pair'}
            </Button>
          </div>
        )}

        {/* Profile Modal */}
        {selectedProfile && (
          <DetailedProfileModal
            profile={{
              user_id: selectedProfile.user_id,
              first_name: selectedProfile.first_name,
              last_name: selectedProfile.last_name,
              university: selectedProfile.university,
              profile_images: selectedProfile.profile_images,
              bio: selectedProfile.bio,
              age: selectedProfile.age,
              can_chat: selectedProfile.compatibility_score ? selectedProfile.compatibility_score > 80 : false,
              compatibility_score: selectedProfile.compatibility_score,
              physical_score: selectedProfile.physical_score,
              mental_score: selectedProfile.mental_score,
              total_qcs: selectedProfile.total_qcs,
              matched_criteria: selectedProfile.matched_criteria,
              not_matched_criteria: selectedProfile.not_matched_criteria,
              interests: selectedProfile.interests,
              // Pass all additional profile fields for complete display
              face_type: selectedProfile.face_type,
              personality_type: selectedProfile.personality_type,
              personality_traits: selectedProfile.personality_traits,
              body_type: selectedProfile.body_type,
              skin_tone: selectedProfile.skin_tone,
              values: selectedProfile.values,
              mindset: selectedProfile.mindset,
              relationship_goals: selectedProfile.relationship_goals,
              height: selectedProfile.height,
              location: selectedProfile.location,
              lifestyle: selectedProfile.lifestyle,
              love_language: selectedProfile.love_language,
              field_of_study: selectedProfile.field_of_study,
              profession: selectedProfile.profession,
              education_level: selectedProfile.education_level
            }}
            isOpen={!!selectedProfile}
            onClose={() => {
              console.log('🔴 Closing modal');
              setSelectedProfile(null);
            }}
            onChatRequest={(userId) => {
              console.log('💬 Chat request from modal for:', userId);
              const m = matches.find(m => m.user_id === userId) || selectedProfile;
              if (m) handleChatClick(m);
            }}
          />
        )}
      </div>

      {/* Bottom navigation handled globally by UnifiedLayout */}
    </UnifiedLayout>
  );
};

export default PairingPage;