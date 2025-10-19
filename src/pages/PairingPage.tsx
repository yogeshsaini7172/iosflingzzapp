import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Brain, Star, MapPin, GraduationCap, Sparkles, Users, RefreshCw, MessageCircle, Zap, Crown, Eye, ShieldCheck } from 'lucide-react';
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

  const { entitlements, loading: subscriptionLoading, refreshEntitlements } = useSubscriptionEntitlements();
  const [pairingLimits, setPairingLimits] = useState({
    canRequest: true,
    usedToday: 0,
    dailyLimit: 1,
    remainingRequests: 1
  });

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
      const s = typeof v === 'string' ? v.replace(/^\"|\"$/g, '') : v;
      return typeof s === 'string' ? JSON.parse(s) : s;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (userId) {
      const planId = entitlements?.plan.id || 'free';
      const limits = PairingLimitService.canMakePairingRequest(userId, planId);
      setPairingLimits(limits);
      PairingLimitService.cleanupOldUsageData(userId);
    }
  }, [userId, entitlements]);

  useEffect(() => {
    if (!userId) return;
    
    const fetchUserData = async () => {
      try {
        const response = await fetchWithFirebaseAuth('/functions/v1/data-management', {
          method: 'POST',
          body: JSON.stringify({ action: 'get_profile' })
        });

        if (!response.ok) {
          setCurrentUser({ id: userId, profile: { total_qcs: 0 } });
        } else {
          const result = await response.json();
          const profile = result?.data?.profile || null;
          setCurrentUser({ id: userId, profile: { total_qcs: profile?.total_qcs || 0 } });
          setMyReq(parseJsonSafe(profile?.requirements));
        }
      } catch (e) {
        setCurrentUser({ id: userId, profile: { total_qcs: 0 } });
      }
    };

    fetchUserData();
    checkExistingProfiles();
  }, [userId]);

  useEffect(() => {
    if (userId && !hasLoadedProfiles && !shouldShowExistingProfiles && !isLoading) {
      checkExistingProfiles();
    }
  }, [userId, hasLoadedProfiles, shouldShowExistingProfiles, isLoading]);

  const checkExistingProfiles = async () => {
    if (!userId) return;
    
    try {
      const usage = PairingLimitService.getDailyUsage(userId);
      
      if (usage && usage.pairing_requests_used > 0) {
        const timeoutPromise = new Promise<boolean>((resolve) => {
          setTimeout(() => {
            setIsLoading(false);
            resolve(false);
          }, 10000);
        });
        
        const loadPromise = loadMatchesForDisplay(userId);
        const hasMatches = await Promise.race([loadPromise, timeoutPromise]);
        
        if (hasMatches) {
          setHasLoadedProfiles(true);
          setShouldShowExistingProfiles(true);
        } else {
          setHasLoadedProfiles(true);
          setShouldShowExistingProfiles(true);
        }
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  const loadMatchesForDisplay = async (userId: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data: pairingResults, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { user_id: userId }
      });

      if (error || !pairingResults.success) {
        setIsLoading(false);
        return matches.length > 0;
      }

      let candidatesData = [];
      if (pairingResults.matches && Array.isArray(pairingResults.matches)) {
        candidatesData = pairingResults.matches;
      } else if (pairingResults.top_candidates && Array.isArray(pairingResults.top_candidates)) {
        candidatesData = pairingResults.top_candidates;
      } else {
        setIsLoading(false);
        return false;
      }

      const formattedMatches = candidatesData.map((match: any) => {
        if (match.candidate_id) {
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
          return match;
        }
      });

      setMatches(formattedMatches);
      return formattedMatches.length > 0;
    } catch (error) {
      return matches.length > 0;
    } finally {
      setIsLoading(false);
    }
  };

  const loadMatches = async (userId: string) => {
    setIsLoading(true);
    try {
      const { data: pairingResults, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { user_id: userId }
      });

      if (error) {
        toast.error(`Pairing error: ${error.message || 'Unknown error'}`);
        setMatches([]);
        return;
      }

      if (!pairingResults.success) {
        if (pairingResults.error?.includes('profile not found')) {
          toast.error('Please complete your profile setup first to use pairing.');
        } else {
          toast.error(pairingResults.error || 'Pairing unavailable right now');
        }
        setMatches([]);
        return;
      }

      const candidates = pairingResults?.top_candidates || [];

      if (candidates.length === 0) {
        toast.info(pairingResults.message || 'No matches found. Try again later!');
        setMatches([]);
        return;
      }

      const formattedMatches = candidates
        .filter((c: any) => c?.candidate_id)
        .map((c: any) => {
          const [first, ...rest] = (c.candidate_name || '').split(' ');
          
          const compatibilityScore = Number(c.final_score) || Number(c.deterministic_score) || 0;
          const physicalScore = Number(c.physical_score) || 0;
          const mentalScore = Number(c.mental_score) || 0;
          
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
            matched_criteria: c.debug_info?.matched || [],
            not_matched_criteria: c.debug_info?.not_matched || [],
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
        });

      setMatches(formattedMatches);
      setHasLoadedProfiles(true);
      setShouldShowExistingProfiles(true);
      toast.success(`Found ${formattedMatches.length} compatible matches!`);
    } catch (error) {
      toast.error('Failed to load matches');
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!pairingLimits.canRequest) {
      toast.error(
        `Daily pairing limit reached! You've used ${pairingLimits.usedToday}/${pairingLimits.dailyLimit} requests today.`,
        { duration: 4000 }
      );
      return;
    }

    if (!userId) return;

    try {
      const success = PairingLimitService.incrementDailyUsage(userId);
      
      if (success) {
        const newLimits = PairingLimitService.canMakePairingRequest(userId, entitlements?.plan.id || 'free');
        setPairingLimits(newLimits);
        
        if (newLimits.remainingRequests > 0) {
          toast.warning(`${newLimits.remainingRequests} pairing requests remaining today`);
        }
      }

      await loadMatches(userId);
    } catch (error) {
      toast.error('Failed to load matches');
    }
  };

  const handleChatClick = (match: Match) => {
    setSelectedChatId(match.user_id);
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'bg-success text-white';
    if (score >= 60) return 'bg-primary text-white';
    return 'bg-muted text-foreground';
  };

  return (
    <UnifiedLayout title="Smart Pairing">
      <div className="container mx-auto px-4 py-8 space-y-8">

        {/* Premium Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-royal p-8 sm:p-10 shadow-premium animate-fade-in">
          <div className="absolute inset-0 bg-gradient-magic opacity-50" />
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-glow/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-secondary-glow/20 rounded-full blur-3xl" />
          
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 backdrop-blur-sm rounded-xl">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-display font-bold text-white drop-shadow-lg">
                    Smart Pairing
                  </h1>
                </div>
                <p className="text-white/90 text-base sm:text-lg font-medium max-w-2xl">
                  AI-powered compatibility matching based on advanced algorithms and personality analysis
                </p>
                
                {/* Plan Badge */}
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2">
                  <Crown className="w-4 h-4 text-accent" />
                  <span className="text-white font-semibold text-sm">
                    {entitlements?.plan.display_name || 'Free'} Plan
                  </span>
                  <span className="text-white/70 text-xs">•</span>
                  <span className="text-white/90 text-sm">
                    {pairingLimits.remainingRequests}/{pairingLimits.dailyLimit} Requests
                  </span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading || !pairingLimits.canRequest}
                  className="group relative overflow-hidden rounded-2xl bg-white px-8 py-4 shadow-elegant hover:shadow-royal transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative flex items-center justify-center gap-3">
                    <Heart className={`h-5 w-5 text-primary ${isLoading ? 'animate-pulse' : ''}`} />
                    <span className="font-bold text-lg bg-gradient-royal bg-clip-text text-transparent">
                      {!pairingLimits.canRequest ? 'Limit Reached' : 'Find Matches'}
                    </span>
                  </div>
                </button>
                
                {pairingLimits.remainingRequests === 0 && (
                  <button
                    onClick={() => onNavigate('subscription')}
                    className="rounded-xl bg-gradient-gold px-6 py-2.5 shadow-gold hover:shadow-elegant transition-all duration-300 active:scale-95"
                  >
                    <span className="font-semibold text-sm text-white">Upgrade Plan</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          {/* Total Matches */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-card border border-primary/20 p-6 shadow-card hover:shadow-elegant transition-all duration-500 hover:scale-[1.02] animate-fade-in">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">Total Matches</p>
                <p className="text-4xl font-display font-bold text-foreground">
                  {(hasLoadedProfiles || shouldShowExistingProfiles) ? matches.length : '—'}
                </p>
                <p className="text-xs text-muted-foreground">Available profiles</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
            </div>
          </div>

          {/* High Compatibility */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-card border border-success/20 p-6 shadow-card hover:shadow-elegant transition-all duration-500 hover:scale-[1.02] animate-fade-in [animation-delay:100ms]">
            <div className="absolute inset-0 bg-gradient-to-br from-success/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">High Match</p>
                <p className="text-4xl font-display font-bold text-success">
                  {matches.filter(m => (m.compatibility_score || 0) >= 80).length}
                </p>
                <p className="text-xs text-muted-foreground">80%+ compatible</p>
              </div>
              <div className="p-3 bg-success/10 rounded-xl group-hover:bg-success/20 transition-colors">
                <Star className="h-6 w-6 text-success" />
              </div>
            </div>
          </div>

          {/* Your QCS */}
          <div className="group relative overflow-hidden rounded-2xl bg-gradient-card border border-accent/20 p-6 shadow-card hover:shadow-elegant transition-all duration-500 hover:scale-[1.02] animate-fade-in [animation-delay:200ms]">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-muted-foreground text-sm font-medium">Your QCS</p>
                <p className="text-4xl font-display font-bold text-accent">
                  {currentUser?.profile?.total_qcs || 0}
                </p>
                <p className="text-xs text-muted-foreground">Quality score</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-xl group-hover:bg-accent/20 transition-colors">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="text-center space-y-6 animate-fade-in">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-royal rounded-full animate-pulse-glow flex items-center justify-center mx-auto">
                  <Heart className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <div>
                <p className="text-lg font-semibold mb-1">Finding your perfect matches</p>
                <p className="text-sm text-muted-foreground">Analyzing compatibility...</p>
              </div>
            </div>
          </div>
        )}

        {/* Initial State */}
        {!isLoading && !(hasLoadedProfiles || shouldShowExistingProfiles) && (
          <div className="text-center py-20">
            <div className="relative inline-block mb-6">
              <div className="w-28 h-28 bg-gradient-royal rounded-full flex items-center justify-center animate-float">
                <Heart className="h-14 w-14 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-12 h-12 bg-accent rounded-full flex items-center justify-center animate-bounce-in">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-display font-bold mb-3">Ready to find your match?</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Get personalized matches based on compatibility, personality, and shared interests
            </p>
            <button 
              onClick={handleRefresh} 
              disabled={!pairingLimits.canRequest}
              className="group relative overflow-hidden rounded-2xl bg-gradient-royal px-8 py-4 shadow-elegant hover:shadow-royal transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
              <div className="relative flex items-center justify-center gap-3">
                <Heart className="h-5 w-5 text-white" />
                <span className="font-bold text-white">
                  {!pairingLimits.canRequest ? 'Limit Reached' : 'Start Matching'}
                </span>
              </div>
            </button>
          </div>
        )}

        {/* Premium Matches Grid */}
        {!isLoading && matches.length > 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <div 
                key={match.user_id}
                className="group relative overflow-hidden rounded-3xl bg-gradient-card border border-border/50 shadow-card hover:shadow-elegant transition-all duration-500 hover:scale-[1.02] animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Profile Image */}
                <div className="relative h-80 overflow-hidden">
                  <ProfileImageHandler
                    src={match.profile_images?.[0]}
                    alt={`${match.first_name} ${match.last_name}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient Overlays */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent" />
                  
                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                    <Badge className="bg-black/70 backdrop-blur-md text-white border-0 px-3 py-1.5 font-bold">
                      #{index + 1}
                    </Badge>
                    <Badge className={`${getCompatibilityColor(match.compatibility_score || 0)} border-0 px-3 py-1.5 font-bold shadow-lg`}>
                      {match.compatibility_score || 0}%
                    </Badge>
                  </div>

                  {/* Bottom Info */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-2xl font-display font-bold text-white drop-shadow-lg">
                        {match.first_name}, {match.age}
                      </h3>
                      <ShieldCheck className="w-5 h-5 text-success drop-shadow-lg" />
                    </div>
                    <div className="flex items-center gap-2 text-white/90 text-sm mb-3">
                      <GraduationCap className="w-4 h-4" />
                      <span className="drop-shadow-md truncate">{match.university}</span>
                    </div>
                    
                    {/* Score Pills */}
                    <div className="flex gap-2">
                      <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                        <Zap className="w-3.5 h-3.5 text-accent" />
                        <span className="text-xs font-semibold text-white">{match.physical_score}%</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                        <Brain className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs font-semibold text-white">{match.mental_score}%</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 bg-black/50 backdrop-blur-md rounded-full px-3 py-1.5 border border-white/10">
                        <Star className="w-3.5 h-3.5 text-success" />
                        <span className="text-xs font-semibold text-white">{match.total_qcs}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="p-5 space-y-3">
                  {/* Bio Preview */}
                  {match.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{match.bio}</p>
                  )}

                  {/* Interests */}
                  {match.interests && match.interests.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {match.interests.slice(0, 3).map((interest, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs px-2.5 py-1 bg-primary/10 text-primary border-0">
                          {interest}
                        </Badge>
                      ))}
                      {match.interests.length > 3 && (
                        <Badge variant="secondary" className="text-xs px-2.5 py-1 border-0">
                          +{match.interests.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      onClick={() => setSelectedProfile(match)}
                      className="flex-1 rounded-xl bg-card hover:bg-muted border border-border transition-all duration-300 py-3 active:scale-95"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <Eye className="w-4 h-4" />
                        <span className="text-sm font-semibold">View</span>
                      </div>
                    </button>
                    
                    {(match.compatibility_score || 0) > 80 ? (
                      <button
                        onClick={() => handleChatClick(match)}
                        className="flex-1 rounded-xl bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 shadow-lg transition-all duration-300 py-3 active:scale-95"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <MessageCircle className="w-4 h-4 text-white" />
                          <span className="text-sm font-bold text-white">Chat</span>
                        </div>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleChatClick(match)}
                        className="flex-1 rounded-xl bg-gradient-royal hover:opacity-90 shadow-elegant transition-all duration-300 py-3 active:scale-95"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <MessageCircle className="w-4 h-4 text-white" />
                          <span className="text-sm font-bold text-white">Request</span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && matches.length === 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-display font-bold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-6">
              Complete your profile and preferences to find compatible matches
            </p>
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
            onClose={() => setSelectedProfile(null)}
            onChatRequest={(userId) => {
              const m = matches.find(m => m.user_id === userId) || selectedProfile;
              if (m) handleChatClick(m);
            }}
          />
        )}

        {/* Chat System */}
        {selectedChatId && (
          <RebuiltChatSystem
            onClose={() => setSelectedChatId("")}
            targetUserId={selectedChatId}
          />
        )}
      </div>
    </UnifiedLayout>
  );
};

export default PairingPage;
