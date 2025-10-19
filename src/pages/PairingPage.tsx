import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Brain, Star, MapPin, Sparkles, Users, MessageCircle, Zap, Crown, Eye, ShieldCheck, TrendingUp, Target, Award, GraduationCap, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import DetailedProfileModal from '@/components/profile/DetailedProfileModalNew';
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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const { userId, isLoading: authLoading } = useRequiredAuth();
  const [myReq, setMyReq] = useState<any>(null);

  const { entitlements, loading: subscriptionLoading, refreshEntitlements } = useSubscriptionEntitlements();
  const [pairingLimits, setPairingLimits] = useState({
    canRequest: true,
    usedToday: 0,
    dailyLimit: 1,
    remainingRequests: 1
  });

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
    if (score >= 80) return 'from-success to-success/80';
    if (score >= 60) return 'from-primary to-primary-glow';
    return 'from-muted to-muted/80';
  };

  if (authLoading || !userId) {
    return (
      <UnifiedLayout title="Smart Pairing">
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0">
            <div className="absolute top-1/4 -left-48 w-[500px] h-[500px] bg-gradient-primary opacity-20 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-1/4 -right-48 w-[500px] h-[500px] bg-gradient-secondary opacity-20 rounded-full blur-3xl floating" style={{ animationDelay: '1.5s' }} />
          </div>
          <div className="relative text-center animate-fade-in">
            <div className="w-20 h-20 bg-gradient-royal rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <p className="text-lg font-medium text-muted-foreground">Loading your matches...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout title="Smart Pairing">
      <div className="min-h-screen relative pb-20">
        {/* Premium floating background orbs */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 -left-48 w-96 h-96 bg-gradient-primary opacity-20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 -right-48 w-96 h-96 bg-gradient-secondary opacity-20 rounded-full blur-3xl floating" style={{ animationDelay: '2s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-royal opacity-10 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-6 space-y-6">
          
          {/* Premium Header with glass morphism */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-premium rounded-3xl p-6 sm:p-8 shadow-premium border border-primary/20"
          >
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-royal/10 border border-primary/30 mb-3">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-primary blur-sm" />
                    <Sparkles className="relative w-4 h-4 text-primary" />
                  </div>
                  <span className="text-sm font-semibold bg-gradient-royal bg-clip-text text-transparent">
                    {entitlements?.plan.display_name || 'Free'} Member
                  </span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-display font-bold mb-2">
                  <span className="bg-gradient-royal bg-clip-text text-transparent">
                    Discover Matches
                  </span>
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base">
                  {pairingLimits.remainingRequests} of {pairingLimits.dailyLimit} daily requests remaining
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isLoading || !pairingLimits.canRequest}
                className="relative group overflow-hidden rounded-2xl px-8 py-4 bg-gradient-royal shadow-royal hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                <div className="relative flex items-center gap-3">
                  <Heart className={`w-5 h-5 text-white ${isLoading ? 'animate-pulse' : ''}`} />
                  <span className="font-bold text-white">
                    {!pairingLimits.canRequest ? 'Limit Reached' : isLoading ? 'Finding...' : 'Find Matches'}
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Premium Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Total Matches', value: (hasLoadedProfiles || shouldShowExistingProfiles) ? matches.length : '—', gradient: 'from-primary to-primary-glow', delay: 0 },
              { icon: Star, label: 'High Match', value: matches.filter(m => (m.compatibility_score || 0) >= 80).length, gradient: 'from-success to-success/80', delay: 0.1 },
              { icon: Target, label: 'Your QCS', value: currentUser?.profile?.total_qcs || 0, gradient: 'from-accent to-accent-glow', delay: 0.2 },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: stat.delay }}
                className="group relative overflow-hidden rounded-2xl glass-premium p-6 shadow-card hover:shadow-elegant transition-all duration-500 border border-border/50"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                    <p className="text-4xl font-display font-bold">
                      <span className={`bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                        {stat.value}
                      </span>
                    </p>
                  </div>
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="relative inline-block mb-6">
                <div className="w-20 h-20 bg-gradient-royal rounded-full animate-pulse-glow flex items-center justify-center">
                  <Heart className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <p className="text-lg font-semibold mb-1">Finding your perfect matches</p>
              <p className="text-sm text-muted-foreground">Analyzing compatibility...</p>
            </motion.div>
          )}

          {/* Initial Empty State */}
          {!isLoading && !(hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-20 text-center"
            >
              <div className="relative inline-block mb-8">
                <div className="w-28 h-28 bg-gradient-royal rounded-full flex items-center justify-center animate-float">
                  <Heart className="w-14 h-14 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-gold rounded-full flex items-center justify-center animate-bounce-in">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3">Ready to find your match?</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Get personalized matches based on compatibility, personality, and shared interests
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh} 
                disabled={!pairingLimits.canRequest}
                className="relative group overflow-hidden rounded-2xl px-8 py-4 bg-gradient-royal shadow-royal hover:shadow-glow transition-all duration-300 disabled:opacity-50"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 group-hover:animate-shimmer" />
                <div className="relative flex items-center gap-3">
                  <Heart className="w-5 h-5 text-white" />
                  <span className="font-bold text-white">
                    {!pairingLimits.canRequest ? 'Limit Reached' : 'Start Matching'}
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Premium Magazine-Style Match Cards */}
          {!isLoading && matches.length > 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {matches.map((match, index) => (
                <motion.div
                  key={match.user_id}
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="group relative overflow-hidden rounded-3xl glass-premium shadow-premium hover:shadow-glow transition-all duration-700 border border-border/50"
                >
                  {/* Image Carousel Section */}
                  <Carousel className="w-full">
                    <CarouselContent>
                      {match.profile_images && match.profile_images.length > 0 ? (
                        match.profile_images.map((image, imgIndex) => (
                          <CarouselItem key={imgIndex}>
                            <div className="relative aspect-[4/5] sm:aspect-[16/9] overflow-hidden">
                              <ProfileImageHandler
                                src={image}
                                alt={`${match.first_name} photo ${imgIndex + 1}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                              />
                              {/* Gradient overlays */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-transparent" />
                            </div>
                          </CarouselItem>
                        ))
                      ) : (
                        <CarouselItem>
                          <div className="relative aspect-[4/5] sm:aspect-[16/9] bg-gradient-subtle flex items-center justify-center">
                            <div className="text-center">
                              <div className="w-20 h-20 bg-primary/20 rounded-full mx-auto mb-4 flex items-center justify-center">
                                <span className="text-4xl">👤</span>
                              </div>
                              <p className="text-muted-foreground">No photo</p>
                            </div>
                          </div>
                        </CarouselItem>
                      )}
                    </CarouselContent>
                    {match.profile_images && match.profile_images.length > 1 && (
                      <>
                        <CarouselPrevious className="left-4 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70" />
                        <CarouselNext className="right-4 bg-black/50 backdrop-blur-sm border-white/20 text-white hover:bg-black/70" />
                      </>
                    )}

                    {/* Floating badges on image */}
                    <div className="absolute top-4 left-4 right-4 flex items-start justify-between z-10 pointer-events-none">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/10">
                        <span className="text-sm font-bold text-white">#{index + 1}</span>
                      </div>
                      <div className={`px-4 py-2 rounded-full bg-gradient-to-r ${getCompatibilityColor(match.compatibility_score || 0)} shadow-glow`}>
                        <span className="text-sm font-bold text-white">{match.compatibility_score || 0}% Match</span>
                      </div>
                    </div>

                    {/* Bottom profile info overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 z-10">
                      <div className="flex items-end justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-2xl sm:text-3xl font-display font-bold text-white drop-shadow-lg truncate">
                              {match.first_name}, {match.age}
                            </h3>
                            <ShieldCheck className="w-6 h-6 text-success drop-shadow-lg flex-shrink-0" />
                          </div>
                          {match.university && (
                            <div className="flex items-center gap-2 text-white/90 mb-3">
                              <GraduationCap className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium drop-shadow-md truncate">{match.university}</span>
                            </div>
                          )}
                          {/* Score pills */}
                          <div className="flex flex-wrap gap-2">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                              <Zap className="w-3.5 h-3.5 text-accent" />
                              <span className="text-xs font-bold text-white">{match.physical_score}%</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                              <Brain className="w-3.5 h-3.5 text-primary" />
                              <span className="text-xs font-bold text-white">{match.mental_score}%</span>
                            </div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10">
                              <Award className="w-3.5 h-3.5 text-success" />
                              <span className="text-xs font-bold text-white">QCS {match.total_qcs}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Carousel>

                  {/* Content Section with glass effect */}
                  <div className="p-6 space-y-4 bg-gradient-card/50 backdrop-blur-sm">
                    {/* Bio */}
                    {match.bio && (
                      <p className="text-sm text-foreground/80 line-clamp-2 leading-relaxed">
                        {match.bio}
                      </p>
                    )}

                    {/* Interests */}
                    {match.interests && match.interests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {match.interests.slice(0, 4).map((interest, idx) => (
                          <span key={idx} className="px-3 py-1.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            {interest}
                          </span>
                        ))}
                        {match.interests.length > 4 && (
                          <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted/50 border border-border">
                            +{match.interests.length - 4} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedProfile(match)}
                        className="flex-1 rounded-xl bg-card/50 hover:bg-muted/50 border border-border transition-all duration-300 py-3.5 backdrop-blur-sm"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span className="text-sm font-semibold">View Profile</span>
                        </div>
                      </motion.button>

                      {(match.compatibility_score || 0) > 80 ? (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleChatClick(match)}
                          className="flex-1 rounded-xl bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 shadow-lg transition-all duration-300 py-3.5"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <MessageCircle className="w-4 h-4 text-white" />
                            <span className="text-sm font-bold text-white">Chat Now</span>
                          </div>
                        </motion.button>
                      ) : (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleChatClick(match)}
                          className="flex-1 rounded-xl bg-gradient-royal hover:opacity-90 shadow-elegant transition-all duration-300 py-3.5"
                        >
                          <div className="flex items-center justify-center gap-2">
                            <MessageCircle className="w-4 h-4 text-white" />
                            <span className="text-sm font-bold text-white">Send Request</span>
                          </div>
                        </motion.button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty Results State */}
          {!isLoading && matches.length === 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-20 text-center"
            >
              <div className="w-24 h-24 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">No matches found</h3>
              <p className="text-muted-foreground mb-6">
                Complete your profile and preferences to find compatible matches
              </p>
              {pairingLimits.canRequest && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  className="px-8 py-3 rounded-xl bg-gradient-royal text-white font-semibold shadow-royal hover:shadow-glow transition-all"
                >
                  Try Again
                </motion.button>
              )}
            </motion.div>
          )}
        </div>

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
      </div>
    </UnifiedLayout>
  );
};

export default PairingPage;
