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
      <div className="min-h-screen relative pb-20">
        {/* Subtle premium background */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
        </div>

        <div className="container relative z-10 mx-auto px-4 py-4 space-y-4 max-w-2xl">
          
          {/* Compact Unified Header & Stats */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="rounded-2xl bg-card/80 backdrop-blur-lg p-4 shadow-lg border border-border/50"
          >
            {/* Top Row: Title & Action */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-xl font-bold mb-0.5">
                  <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                    Discover Matches
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">
                  {pairingLimits.remainingRequests}/{pairingLimits.dailyLimit} requests today
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isLoading || !pairingLimits.canRequest}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Heart className={`w-4 h-4 ${isLoading ? 'animate-pulse' : ''}`} />
                  <span className="text-sm">
                    {!pairingLimits.canRequest ? 'Limit' : isLoading ? 'Finding...' : 'Find'}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Unified Stats Row */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-border/50">
              <div className="flex items-center gap-2 flex-1">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Matches</p>
                  <p className="text-lg font-bold text-foreground">
                    {(hasLoadedProfiles || shouldShowExistingProfiles) ? matches.length : '—'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-1">
                <div className="p-2 rounded-lg bg-success/10">
                  <Star className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">High Match</p>
                  <p className="text-lg font-bold text-foreground">
                    {matches.filter(m => (m.compatibility_score || 0) >= 80).length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-1">
                <div className="p-2 rounded-lg bg-accent/10">
                  <Target className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Your QCS</p>
                  <p className="text-lg font-bold text-foreground">
                    {currentUser?.profile?.total_qcs || 0}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Compact Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-full animate-pulse flex items-center justify-center mx-auto mb-3">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <p className="text-base font-semibold mb-1">Finding matches</p>
              <p className="text-xs text-muted-foreground">Analyzing compatibility...</p>
            </motion.div>
          )}

          {/* Compact Initial Empty State */}
          {!isLoading && !(hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Ready to find matches?</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Get personalized matches based on compatibility and shared interests
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh} 
                disabled={!pairingLimits.canRequest}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4" />
                  <span>
                    {!pairingLimits.canRequest ? 'Limit Reached' : 'Start Matching'}
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Compact Modern Match Cards */}
          {!isLoading && matches.length > 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {matches.map((match, index) => (
                <motion.div
                  key={match.user_id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-xl bg-card/80 backdrop-blur-lg shadow-md hover:shadow-xl transition-all duration-300 border border-border/50"
                >
                  <div className="flex gap-3 p-3">
                    {/* Compact Image with Carousel */}
                    <div className="relative flex-shrink-0">
                      <Carousel className="w-28 h-28">
                        <CarouselContent>
                          {match.profile_images && match.profile_images.length > 0 ? (
                            match.profile_images.map((image, imgIndex) => (
                              <CarouselItem key={imgIndex}>
                                <div className="relative w-28 h-28 rounded-lg overflow-hidden">
                                  <ProfileImageHandler
                                    src={image}
                                    alt={`${match.first_name}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>
                              </CarouselItem>
                            ))
                          ) : (
                            <CarouselItem>
                              <div className="w-28 h-28 rounded-lg bg-muted flex items-center justify-center">
                                <span className="text-3xl">👤</span>
                              </div>
                            </CarouselItem>
                          )}
                        </CarouselContent>
                        {match.profile_images && match.profile_images.length > 1 && (
                          <>
                            <CarouselPrevious className="left-1 h-6 w-6 bg-black/50 backdrop-blur-sm border-0 text-white" />
                            <CarouselNext className="right-1 h-6 w-6 bg-black/50 backdrop-blur-sm border-0 text-white" />
                          </>
                        )}
                      </Carousel>
                      
                      {/* Match Score Badge */}
                      <div className={`absolute -top-1 -right-1 px-2 py-0.5 rounded-full text-xs font-bold text-white shadow-md ${
                        (match.compatibility_score || 0) >= 80 ? 'bg-gradient-to-r from-success to-success/80' :
                        (match.compatibility_score || 0) >= 60 ? 'bg-gradient-to-r from-primary to-accent' :
                        'bg-muted'
                      }`}>
                        {match.compatibility_score || 0}%
                      </div>
                    </div>

                    {/* Compact Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <h3 className="text-base font-bold truncate">
                            {match.first_name}, {match.age}
                          </h3>
                          <ShieldCheck className="w-3.5 h-3.5 text-success flex-shrink-0" />
                        </div>
                        
                        {match.university && (
                          <div className="flex items-center gap-1 mb-2">
                            <GraduationCap className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                            <p className="text-xs text-muted-foreground truncate">{match.university}</p>
                          </div>
                        )}

                        {/* Compact Score Pills */}
                        <div className="flex gap-1.5 mb-2">
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/10">
                            <Zap className="w-3 h-3 text-accent" />
                            <span className="text-xs font-semibold">{match.physical_score}%</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10">
                            <Brain className="w-3 h-3 text-primary" />
                            <span className="text-xs font-semibold">{match.mental_score}%</span>
                          </div>
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-success/10">
                            <Award className="w-3 h-3 text-success" />
                            <span className="text-xs font-semibold">{match.total_qcs}</span>
                          </div>
                        </div>
                      </div>

                      {/* Compact Action Buttons */}
                      <div className="flex gap-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedProfile(match)}
                          className="flex-1 px-3 py-1.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors text-xs font-semibold"
                        >
                          <Eye className="w-3 h-3 inline mr-1" />
                          View
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleChatClick(match)}
                          className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all ${
                            (match.compatibility_score || 0) > 80
                              ? 'bg-gradient-to-r from-success to-success/80 hover:shadow-md'
                              : 'bg-gradient-to-r from-primary to-accent hover:shadow-md'
                          }`}
                        >
                          <MessageCircle className="w-3 h-3 inline mr-1" />
                          {(match.compatibility_score || 0) > 80 ? 'Chat' : 'Request'}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Compact Empty Results State */}
          {!isLoading && matches.length === 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 text-center"
            >
              <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-base font-bold mb-1">No matches found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Complete your profile to find compatible matches
              </p>
              {pairingLimits.canRequest && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-primary to-accent text-white font-semibold shadow-md hover:shadow-lg transition-all"
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
