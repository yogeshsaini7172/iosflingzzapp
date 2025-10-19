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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-3 animate-pulse">
              <Heart className="w-8 h-8 text-white" />
            </div>
            <p className="text-base font-medium text-muted-foreground">Loading matches...</p>
          </div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout title="Smart Pairing">
      <div className="h-screen relative overflow-y-auto">
        <div className="container relative z-10 mx-auto px-4 py-[3vh] space-y-[3vh] max-w-7xl min-h-full">
          
          {/* Premium Stats & Action Card */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-2xl p-[2vh] shadow-elegant border border-border"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Section: Info & Stats */}
              <div className="space-y-4">
                {/* Header */}
                <div>
                  <h1 className="text-[clamp(1.5rem,4vw,1.75rem)] font-display font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                    Smart Pairing System
                  </h1>
                  <p className="text-[clamp(0.75rem,2.5vw,0.875rem)] text-muted-foreground">
                    {pairingLimits.remainingRequests} of {pairingLimits.dailyLimit} daily requests remaining
                  </p>
                </div>

                {/* How It Works - Point System */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1">AI-Powered Compatibility</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Our algorithm analyzes physical attributes, mental traits, values, and QCS scores to find your best matches
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-success to-success/80 flex items-center justify-center text-white text-xs font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold mb-1">Quality Over Quantity</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Matches above 80% compatibility unlock instant chat - focus on meaningful connections
                      </p>
                    </div>
                  </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border/50">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users className="w-4 h-4 text-primary" />
                      <p className="text-xl font-bold">
                        {(hasLoadedProfiles || shouldShowExistingProfiles) ? matches.length : '—'}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">Matches</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-success" />
                      <p className="text-xl font-bold text-success">
                        {matches.filter(m => (m.compatibility_score || 0) >= 80).length}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">High QCS</p>
                  </div>

                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Target className="w-4 h-4 text-accent" />
                      <p className="text-xl font-bold text-accent">
                        {currentUser?.profile?.total_qcs || 0}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">Your QCS</p>
                  </div>
                </div>
              </div>

              {/* Right Section: Visual & Action */}
              <div className="flex flex-col items-center justify-center gap-4">
                {/* Two Hearts Animation */}
                <div className="relative w-24 h-20 group">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-primary rounded-full opacity-0 group-hover:opacity-20 blur-2xl transition-all duration-500" />
                  
                  {/* Hearts container */}
                  <div className="relative w-full h-full flex items-center justify-center gap-2">
                    {/* Left Heart */}
                    <motion.div
                      animate={{
                        x: [-1, -2, -1],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                    >
                      <Heart 
                        className="w-8 h-8" 
                        strokeWidth={2.5}
                        style={{
                          stroke: 'hsl(var(--primary))',
                          fill: 'none',
                          filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))'
                        }}
                      />
                    </motion.div>

                    {/* Match count */}
                    <motion.span 
                      animate={{
                        scale: [1, 1.1, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="text-2xl font-bold text-primary min-w-[2rem] text-center"
                    >
                      {matches.length}
                    </motion.span>

                    {/* Right Heart */}
                    <motion.div
                      animate={{
                        x: [1, 2, 1],
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0.3
                      }}
                    >
                      <Heart 
                        className="w-8 h-8" 
                        strokeWidth={2.5}
                        style={{
                          stroke: 'hsl(var(--primary))',
                          fill: 'none',
                          filter: 'drop-shadow(0 0 6px hsl(var(--primary) / 0.4))'
                        }}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Action Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  disabled={isLoading || !pairingLimits.canRequest}
                  className="px-8 py-4 rounded-xl bg-gradient-primary text-white font-bold shadow-elegant hover:shadow-glow transition-elegant disabled:opacity-50 disabled:cursor-not-allowed text-base w-full max-w-xs"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Sparkles className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {!pairingLimits.canRequest ? 'Daily Limit Reached' : isLoading ? 'Finding Matches...' : 'Find My Matches'}
                    </span>
                  </div>
                </motion.button>

                {/* Progress Indicator */}
                {pairingLimits.canRequest && (
                  <div className="w-full max-w-xs">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-primary transition-all duration-500"
                        style={{ width: `${(pairingLimits.remainingRequests / pairingLimits.dailyLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl p-[5vh] text-center shadow-card border border-border"
            >
              <div className="w-[clamp(4rem,15vw,5rem)] h-[clamp(4rem,15vw,5rem)] bg-gradient-primary rounded-full animate-pulse flex items-center justify-center mx-auto mb-[2vh]">
                <Heart className="w-[clamp(2rem,8vw,2.5rem)] h-[clamp(2rem,8vw,2.5rem)] text-white" />
              </div>
              <p className="text-[clamp(1rem,4vw,1.125rem)] font-semibold mb-[1vh]">Finding your matches</p>
              <p className="text-[clamp(0.875rem,3vw,1rem)] text-muted-foreground">Analyzing compatibility...</p>
            </motion.div>
          )}

          {/* Initial Empty State */}
          {!isLoading && !(hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-[5vh] text-center shadow-card border border-border"
            >
              <div className="w-[clamp(5rem,18vw,6rem)] h-[clamp(5rem,18vw,6rem)] bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-[3vh] shadow-glow">
                <Heart className="w-[clamp(2.5rem,10vw,3rem)] h-[clamp(2.5rem,10vw,3rem)] text-white" />
              </div>
              <h3 className="text-[clamp(1.125rem,4.5vw,1.25rem)] font-bold mb-[1.5vh]">Ready to find matches?</h3>
              <p className="text-muted-foreground mb-[3vh] max-w-sm mx-auto text-[clamp(0.875rem,3.5vw,1rem)]">
                Get personalized matches based on compatibility and shared interests
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh} 
                disabled={!pairingLimits.canRequest}
                className="px-[4vw] py-[1.5vh] rounded-xl bg-gradient-primary text-white font-semibold shadow-elegant hover:shadow-glow transition-elegant disabled:opacity-50 text-[clamp(0.875rem,3.5vw,1rem)]"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-[clamp(1rem,4vw,1.25rem)] h-[clamp(1rem,4vw,1.25rem)]" />
                  <span>
                    {!pairingLimits.canRequest ? 'Limit Reached' : 'Start Matching'}
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Premium Match Cards - Responsive Grid */}
          {!isLoading && matches.length > 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-[3vh]"
            >
              {matches.map((match, index) => (
                <motion.div
                  key={match.user_id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl bg-card shadow-elegant hover:shadow-royal transition-all duration-500 border border-border hover:border-primary/30"
                >
                  {/* Image Section with Overlay Info */}
                  <div className="relative h-80 overflow-hidden">
                    <Carousel className="w-full h-full">
                      <CarouselContent>
                        {match.profile_images && match.profile_images.length > 0 ? (
                          match.profile_images.map((image, imgIndex) => (
                            <CarouselItem key={imgIndex}>
                              <div className="relative w-full h-80">
                                <ProfileImageHandler
                                  src={image}
                                  alt={`${match.first_name}`}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                                {/* Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                              </div>
                            </CarouselItem>
                          ))
                        ) : (
                          <CarouselItem>
                            <div className="w-full h-80 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
                              <span className="text-6xl opacity-30">👤</span>
                            </div>
                          </CarouselItem>
                        )}
                      </CarouselContent>
                      {match.profile_images && match.profile_images.length > 1 && (
                        <>
                          <CarouselPrevious className="left-3 h-9 w-9 bg-black/60 backdrop-blur-md border-0 text-white hover:bg-black/80" />
                          <CarouselNext className="right-3 h-9 w-9 bg-black/60 backdrop-blur-md border-0 text-white hover:bg-black/80" />
                        </>
                      )}
                    </Carousel>
                    
                    {/* Top Badges */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <div className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-elegant backdrop-blur-md ${
                        (match.compatibility_score || 0) >= 80 ? 'bg-success/90' :
                        (match.compatibility_score || 0) >= 60 ? 'bg-primary/90' :
                        'bg-muted/90'
                      }`}>
                        {match.compatibility_score || 0}%
                      </div>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md">
                        <Award className="w-4 h-4 text-accent" />
                        <span className="text-sm font-bold text-white">{match.total_qcs}</span>
                      </div>
                    </div>

                    {/* Bottom Profile Info Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-2xl font-bold">
                          {match.first_name}, {match.age}
                        </h3>
                        <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
                      </div>
                      
                      {match.university && (
                        <div className="flex items-center gap-2 text-white/90 mb-3">
                          <GraduationCap className="w-4 h-4" />
                          <p className="text-sm font-medium">{match.university}</p>
                        </div>
                      )}

                      {/* Score Indicators */}
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm">
                          <Zap className="w-3.5 h-3.5 text-accent" />
                          <span className="text-xs font-semibold">{match.physical_score}%</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/40 backdrop-blur-sm">
                          <Brain className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-semibold">{match.mental_score}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons Section */}
                  <div className="p-4 bg-gradient-card">
                    <div className="grid grid-cols-2 gap-3">
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedProfile(match)}
                        className="px-4 py-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors font-semibold flex items-center justify-center gap-2 text-sm border border-border/50"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </motion.button>

                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => handleChatClick(match)}
                        className={`px-4 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm ${
                          (match.compatibility_score || 0) > 80
                            ? 'bg-gradient-to-r from-success to-success/90 shadow-medium hover:shadow-glow'
                            : 'bg-gradient-primary shadow-medium hover:shadow-glow'
                        }`}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {(match.compatibility_score || 0) > 80 ? 'Chat' : 'Request'}
                      </motion.button>
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
              className="bg-card rounded-2xl p-[5vh] text-center shadow-card border border-border"
            >
              <div className="w-[clamp(4rem,15vw,5rem)] h-[clamp(4rem,15vw,5rem)] bg-muted rounded-full flex items-center justify-center mx-auto mb-[2vh]">
                <Users className="w-[clamp(2rem,8vw,2.5rem)] h-[clamp(2rem,8vw,2.5rem)] text-muted-foreground" />
              </div>
              <h3 className="text-[clamp(1rem,4vw,1.125rem)] font-bold mb-[1vh]">No matches found</h3>
              <p className="text-muted-foreground mb-[3vh] text-[clamp(0.875rem,3.5vw,1rem)]">
                Complete your profile to find compatible matches
              </p>
              {pairingLimits.canRequest && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  className="px-[4vw] py-[1.5vh] rounded-xl bg-gradient-primary text-white font-semibold shadow-elegant hover:shadow-glow transition-elegant text-[clamp(0.875rem,3.5vw,1rem)]"
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
