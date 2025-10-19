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
        <div className="container relative z-10 mx-auto px-4 py-6 space-y-6 max-w-lg">
          
          {/* Premium Stats & Action Card */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-2xl p-5 shadow-elegant border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-display font-bold mb-1">
                  Discover Matches
                </h1>
                <p className="text-sm text-muted-foreground">
                  {pairingLimits.remainingRequests} of {pairingLimits.dailyLimit} requests left
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh}
                disabled={isLoading || !pairingLimits.canRequest}
                className="px-6 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-medium hover:shadow-glow transition-elegant disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center gap-2">
                  <Heart className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
                  <span>
                    {!pairingLimits.canRequest ? 'Limit' : isLoading ? 'Finding...' : 'Find'}
                  </span>
                </div>
              </motion.button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-primary flex items-center justify-center shadow-medium">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold">
                  {(hasLoadedProfiles || shouldShowExistingProfiles) ? matches.length : '—'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Total</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br from-success to-success/80 flex items-center justify-center shadow-medium">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold">
                  {matches.filter(m => (m.compatibility_score || 0) >= 80).length}
                </p>
                <p className="text-xs text-muted-foreground mt-1">High QCS</p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-gold flex items-center justify-center shadow-medium">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <p className="text-2xl font-bold">
                  {currentUser?.profile?.total_qcs || 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Your QCS</p>
              </div>
            </div>
          </motion.div>

          {/* Loading State */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-card rounded-2xl p-12 text-center shadow-card border border-border"
            >
              <div className="w-20 h-20 bg-gradient-primary rounded-full animate-pulse flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-white" />
              </div>
              <p className="text-lg font-semibold mb-2">Finding your matches</p>
              <p className="text-sm text-muted-foreground">Analyzing compatibility...</p>
            </motion.div>
          )}

          {/* Initial Empty State */}
          {!isLoading && !(hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card rounded-2xl p-12 text-center shadow-card border border-border"
            >
              <div className="w-24 h-24 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow">
                <Heart className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3">Ready to find matches?</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                Get personalized matches based on compatibility and shared interests
              </p>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleRefresh} 
                disabled={!pairingLimits.canRequest}
                className="px-8 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-elegant hover:shadow-glow transition-elegant disabled:opacity-50"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5" />
                  <span>
                    {!pairingLimits.canRequest ? 'Limit Reached' : 'Start Matching'}
                  </span>
                </div>
              </motion.button>
            </motion.div>
          )}

          {/* Premium Match Cards */}
          {!isLoading && matches.length > 0 && (hasLoadedProfiles || shouldShowExistingProfiles) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {matches.map((match, index) => (
                <motion.div
                  key={match.user_id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative overflow-hidden rounded-2xl bg-card shadow-elegant hover:shadow-royal transition-all duration-300 border border-border"
                >
                  <div className="p-4">
                    {/* Image Carousel */}
                    <div className="relative mb-4">
                      <Carousel className="w-full">
                        <CarouselContent>
                          {match.profile_images && match.profile_images.length > 0 ? (
                            match.profile_images.map((image, imgIndex) => (
                              <CarouselItem key={imgIndex}>
                                <div className="relative w-full h-64 rounded-xl overflow-hidden">
                                  <ProfileImageHandler
                                    src={image}
                                    alt={`${match.first_name}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                </div>
                              </CarouselItem>
                            ))
                          ) : (
                            <CarouselItem>
                              <div className="w-full h-64 rounded-xl bg-muted flex items-center justify-center">
                                <span className="text-6xl">👤</span>
                              </div>
                            </CarouselItem>
                          )}
                        </CarouselContent>
                        {match.profile_images && match.profile_images.length > 1 && (
                          <>
                            <CarouselPrevious className="left-2 h-8 w-8 bg-black/70 backdrop-blur-sm border-0 text-white hover:bg-black/90" />
                            <CarouselNext className="right-2 h-8 w-8 bg-black/70 backdrop-blur-sm border-0 text-white hover:bg-black/90" />
                          </>
                        )}
                      </Carousel>
                      
                      {/* Match Score Badge */}
                      <div className={`absolute top-2 right-2 px-3 py-1.5 rounded-full text-sm font-bold text-white shadow-elegant ${
                        (match.compatibility_score || 0) >= 80 ? 'bg-gradient-to-r from-success to-success/80' :
                        (match.compatibility_score || 0) >= 60 ? 'bg-gradient-primary' :
                        'bg-muted'
                      }`}>
                        {match.compatibility_score || 0}% Match
                      </div>
                    </div>

                    {/* Profile Info */}
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-bold">
                              {match.first_name}, {match.age}
                            </h3>
                            <ShieldCheck className="w-5 h-5 text-success flex-shrink-0" />
                          </div>
                          
                          {match.university && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <GraduationCap className="w-4 h-4" />
                              <p className="text-sm">{match.university}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Score Pills */}
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-gold/10 border border-accent/20">
                          <Zap className="w-4 h-4 text-accent" />
                          <span className="text-sm font-semibold">{match.physical_score}% Physical</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                          <Brain className="w-4 h-4 text-primary" />
                          <span className="text-sm font-semibold">{match.mental_score}% Mental</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border">
                        <Award className="w-4 h-4 text-success" />
                        <span className="text-sm font-semibold">{match.total_qcs} QCS Points</span>
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedProfile(match)}
                          className="px-4 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors font-semibold flex items-center justify-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View Profile
                        </motion.button>

                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleChatClick(match)}
                          className={`px-4 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 ${
                            (match.compatibility_score || 0) > 80
                              ? 'bg-gradient-to-r from-success to-success/80 shadow-medium hover:shadow-glow'
                              : 'bg-gradient-primary shadow-medium hover:shadow-glow'
                          }`}
                        >
                          <MessageCircle className="w-4 h-4" />
                          {(match.compatibility_score || 0) > 80 ? 'Chat Now' : 'Request Chat'}
                        </motion.button>
                      </div>
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
              className="bg-card rounded-2xl p-12 text-center shadow-card border border-border"
            >
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-bold mb-2">No matches found</h3>
              <p className="text-muted-foreground mb-6">
                Complete your profile to find compatible matches
              </p>
              {pairingLimits.canRequest && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleRefresh}
                  className="px-8 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-elegant hover:shadow-glow transition-elegant"
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
