import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Heart, Brain, Star, MapPin, Sparkles, Users, MessageCircle, Zap, Crown, Eye, ShieldCheck, TrendingUp, Target, Award, GraduationCap, ChevronLeft, ChevronRight, Check, SlidersHorizontal } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import HeartAnimation from '@/components/ui/HeartAnimation';
import Loader from '@/components/ui/Loader';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';

import UnifiedLayout from '@/components/layout/UnifiedLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionEntitlements } from '@/hooks/useSubscriptionEntitlements';
import { PairingLimitService } from '@/services/pairingLimits';
import { supabase } from '@/integrations/supabase/client';
import { fetchWithFirebaseAuth } from '@/lib/fetchWithFirebaseAuth';
import DetailedProfileModal from '@/components/profile/DetailedProfileModalEnhanced';
import CompatibilityModal from '@/components/profile/CompatibilityModal';
import ProfileImageHandler from '@/components/common/ProfileImageHandler';
import { useToast } from '@/hooks/use-toast';
import { useRealtime } from '@/hooks/useRealtime';

const PairingPage = ({ onNavigate }: { onNavigate: (view: string) => void }) => {
  // Auth & entitlements
  const { user, isLoading: authLoading, userId } = useAuth();
  const { entitlements } = useSubscriptionEntitlements();

  // Local state (kept minimal here - full state exists later in file)
  const [pairingLimits, setPairingLimits] = useState({ canRequest: true, remainingRequests: 1, usedToday: 0, dailyLimit: 1 });
  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedProfiles, setHasLoadedProfiles] = useState(false);
  const [shouldShowExistingProfiles, setShouldShowExistingProfiles] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [requestedRecipients, setRequestedRecipients] = useState<string[]>([]);
  const [sendingRequests, setSendingRequests] = useState<string[]>([]);
  const [requestedStatus, setRequestedStatus] = useState<Record<string, string>>({});
  const [requestedChatRooms, setRequestedChatRooms] = useState<Record<string, string>>({});
  const [radiusKm, setRadiusKm] = useState<number>(50);

  // Persist requested recipients so UI state survives refresh
  const REQUESTED_KEY = (uid: string) => `chat_requested_recipients_${uid}`;

  useEffect(() => {
    if (!userId) return;

    // Load sent chat requests - first try localStorage for instant load, then sync with DB
    (async () => {
      // STEP 1: Load from localStorage immediately for instant UI update
      try {
        const raw = localStorage.getItem(REQUESTED_KEY(userId));
        const rawStatus = localStorage.getItem(`${REQUESTED_KEY(userId)}:status`);
        const rawRooms = localStorage.getItem(`${REQUESTED_KEY(userId)}:rooms`);
        
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log('[PairingPage] 📦 Loaded from localStorage:', parsed);
            setRequestedRecipients(parsed);
          }
        }
        if (rawStatus) {
          const parsed = JSON.parse(rawStatus);
          if (parsed && typeof parsed === 'object') setRequestedStatus(parsed);
        }
        if (rawRooms) {
          const parsed = JSON.parse(rawRooms);
          if (parsed && typeof parsed === 'object') setRequestedChatRooms(parsed);
        }
      } catch (err) {
        console.warn('[PairingPage] Failed to load from localStorage', err);
      }

      // STEP 2: Sync with database via Edge Function (optional enhancement)
      try {
        // Silently try to sync with database
        const response = await fetchWithFirebaseAuth('/functions/v1/chat-request-handler', {
          method: 'POST',
          body: JSON.stringify({ 
            action: 'get_sent_requests',
            user_id: userId 
          })
        });

        if (!response.ok) {
          // Silently fall back to localStorage
          return;
        }

        const result = await response.json();
        
        if (!result.success || !Array.isArray(result.data)) {
          // Silently fall back to localStorage
          return;
        }
        
        console.log('[PairingPage] ✅ Database sync successful');
        const data = result.data;

        // reduce to the latest request per recipient (use updated_at order)
        const latestByRecipient: Record<string, any> = {};
        for (const rawRow of data) {
          const row: any = rawRow; // cast to any to account for migration-affected shape
          const rid = row.recipient_id;
          if (!rid) continue;
          if (!latestByRecipient[rid]) latestByRecipient[rid] = row;
        }

        const recips = Object.keys(latestByRecipient).map(r => String(r));
        const statusMap: Record<string, string> = {};
        const roomMap: Record<string, string> = {};

        for (const rid of recips) {
          const row = latestByRecipient[rid];
          const key = String(rid);
          statusMap[key] = row.status;
          if (row.status === 'accepted') {
            if (row.chat_room_id) {
              roomMap[key] = row.chat_room_id;
            } else {
              try {
                const roomsQuery = await supabase
                  .from('chat_rooms')
                  .select('id')
                  .or(`and(user1_id.eq.${userId},user2_id.eq.${rid}),and(user1_id.eq.${rid},user2_id.eq.${userId})`)
                  .limit(1);

                if (roomsQuery.data && roomsQuery.data.length > 0) {
                  roomMap[key] = roomsQuery.data[0].id;
                }
              } catch (e) {
                // ignore room lookup failures
              }
            }
          }
        }

        try {
          // eslint-disable-next-line no-console
          console.log('[PairingPage] Hydrating requested recipients from DB', { recips, statusMap, roomMap });
        } catch (e) {}

        setRequestedRecipients(() => Array.from(new Set([...recips])));
        setRequestedStatus(() => ({ ...statusMap }));
        setRequestedChatRooms(() => ({ ...roomMap }));

        try {
          localStorage.setItem(REQUESTED_KEY(userId), JSON.stringify(recips));
          localStorage.setItem(`${REQUESTED_KEY(userId)}:status`, JSON.stringify(statusMap));
          localStorage.setItem(`${REQUESTED_KEY(userId)}:rooms`, JSON.stringify(roomMap));
        } catch (e) {
          // ignore storage errors
        }

        return;
      } catch (err) {
        console.warn('[PairingPage] ⚠️ Database sync failed, using localStorage only:', err);
        // localStorage data is already loaded, so we're good
      }
    })();
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    try {
      const recipientsToSave = requestedRecipients || [];
      const statusToSave = requestedStatus || {};
      const roomsToSave = requestedChatRooms || {};
      
      localStorage.setItem(REQUESTED_KEY(userId), JSON.stringify(recipientsToSave));
      localStorage.setItem(`${REQUESTED_KEY(userId)}:status`, JSON.stringify(statusToSave));
      localStorage.setItem(`${REQUESTED_KEY(userId)}:rooms`, JSON.stringify(roomsToSave));
      
      console.log('[PairingPage] 💾 Saved to localStorage:', {
        recipients: recipientsToSave,
        status: statusToSave,
        rooms: roomsToSave
      });
    } catch (err) {
      console.warn('Failed to save requested recipients to storage', err);
    }
  }, [userId, requestedRecipients, requestedStatus, requestedChatRooms]);
  // Local helpers/state used by various bits in this page
  type Match = any;
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [myReq, setMyReq] = useState<any>(null);
  
  const parseJsonSafe = (v: any) => {
    if (!v) return null;
    try { return JSON.parse(v); } catch (e) { return null; }
  };
  const { toast } = useToast();

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
        
        const loadPromise = loadMatchesForDisplay(userId, radiusKm);
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

  const loadMatchesForDisplay = async (userId: string, maxDistanceKm?: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      // First try QCS-distributed matches (2 from 100-80, 3 from 80-60, 2 from 60-40)
      try {
        const distributed = await PairingLimitService.getQCSDistributedMatches(userId, maxDistanceKm);
        if (distributed && Array.isArray(distributed) && distributed.length > 0) {
          // Map distributed matches to the page's match shape
          const formatted = distributed.map((m: any) => {
            const src = m.matched_user || m.user_profile || m.user || m;
            const displayName = (src?.first_name || src?.name || '') as string;
            const [first, ...rest] = (displayName || '').split(' ');
            return {
              user_id: src?.id || src?.user_id || m.user_id,
              first_name: first || 'User',
              last_name: rest.join(' '),
              university: src?.university || 'University',
              bio: src?.bio || '',
              profile_images: src?.profile_images || src?.profile_images || [],
              age: src?.age || 0,
              interests: src?.interests || [],
              total_qcs: src?.qcs_score || m.qcs_score || 0,
              compatibility_score: Math.round(Number(m.compatibility_score || m.qcs_score || 0)),
              physical_score: Math.round(Number(m.physical_score || 0)),
              mental_score: Math.round(Number(m.mental_score || 0)),
              matched_criteria: m.matched_criteria || [],
              not_matched_criteria: m.not_matched_criteria || [],
              face_type: src?.face_type,
              personality_type: src?.personality_type,
              personality_traits: src?.personality_traits || [],
              body_type: src?.body_type,
              skin_tone: src?.skin_tone,
              values: src?.values,
              mindset: src?.mindset,
              relationship_goals: src?.relationship_goals || [],
              height: src?.height,
              location: src?.location,
              lifestyle: src?.lifestyle,
              love_language: src?.love_language,
              field_of_study: src?.field_of_study,
              profession: src?.profession,
              education_level: src?.education_level,
              distance_km: m.distance_km || null
            };
          });

          setMatches(formatted);
          setIsLoading(false);
          return formatted.length > 0;
        }
      } catch (err) {
        console.warn('QCS-distributed fetch failed, falling back to deterministic pairing', err);
      }
      const { data: pairingResults, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { 
          user_id: userId,
          max_distance_km: maxDistanceKm || 50
        }
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
            education_level: match.candidate_education_level,
            distance_km: match.distance_km || null
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

  const loadMatches = async (userId: string, maxDistanceKm?: number) => {
    setIsLoading(true);
    try {
      const { data: pairingResults, error } = await supabase.functions.invoke('deterministic-pairing', {
        body: { 
          user_id: userId,
          max_distance_km: maxDistanceKm || 50
        }
      });

      if (error) {
        toast({ title: 'Pairing error', description: error.message || 'Unknown error', variant: 'destructive' });
        setMatches([]);
        return;
      }

      if (!pairingResults.success) {
        if (pairingResults.error?.includes('profile not found')) {
          toast({ title: 'Complete profile', description: 'Please complete your profile setup first to use pairing.', variant: 'destructive' });
        } else {
          toast({ title: 'Pairing unavailable', description: pairingResults.error || 'Pairing unavailable right now', variant: 'destructive' });
        }
        setMatches([]);
        return;
      }

      const candidates = pairingResults?.top_candidates || [];

      // Debug: Check if distance_km is in the response
      console.log('[PairingPage] 🔍 Sample candidate data:', candidates[0]);
      console.log('[PairingPage] 📍 Has distance_km?', candidates[0]?.distance_km);

      if (candidates.length === 0) {
        toast({ title: 'No matches', description: pairingResults.message || 'No matches found. Try again later!' });
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
            education_level: c.candidate_education_level,
            distance_km: c.distance_km || null
          };
        });

      setMatches(formattedMatches);
      setHasLoadedProfiles(true);
      setShouldShowExistingProfiles(true);
  toast({ title: 'Pairing Complete', description: `Found ${formattedMatches.length} compatible matches!` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load matches', variant: 'destructive' });
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!pairingLimits.canRequest) {
        toast({ title: 'Limit reached', description: `Daily pairing limit reached! You've used ${pairingLimits.usedToday}/${pairingLimits.dailyLimit} requests today.`, variant: 'destructive' });
      return;
    }

    if (!userId) return;

    try {
      const success = PairingLimitService.incrementDailyUsage(userId);
      
      if (success) {
        const newLimits = PairingLimitService.canMakePairingRequest(userId, entitlements?.plan.id || 'free');
        setPairingLimits(newLimits);
        
        if (newLimits.remainingRequests > 0) {
          toast({ title: 'Pairing requests', description: `${newLimits.remainingRequests} pairing requests remaining today` });
        }
      }

      await loadMatches(userId, radiusKm);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to load matches', variant: 'destructive' });
    }
  };

  // Reload matches when radius changes
  const handleRadiusChange = async (newRadius: number) => {
    setRadiusKm(newRadius);
    
    // Debounce to avoid too many requests
    if (hasLoadedProfiles && userId) {
      setIsLoading(true);
      try {
        await loadMatches(userId, newRadius);
        toast({ 
          title: 'Filter Updated', 
          description: `Now showing profiles within ${newRadius} km`,
          duration: 2000
        });
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to update filter', variant: 'destructive' });
      }
    }
  };

  const handleChatClick = async (match: Match) => {
    if (!userId) {
      toast({ title: 'Not signed in', description: 'Please sign in to start a chat', variant: 'destructive' });
      return;
    }

    // If compatibility is high, create or open a chat room immediately
    const score = Number(match.compatibility_score || 0);
    if (score > 80) {
      try {
        const response = await fetchWithFirebaseAuth('/functions/v1/chat-management', {
          method: 'POST',
          body: JSON.stringify({ action: 'create_room', user1_id: userId, user2_id: match.user_id })
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error(err.error || 'Failed to create chat room');
        }

        const result = await response.json();
        const room = result?.data;
        if (result.success && room?.id) {
          toast({ title: 'Chat Ready', description: 'Opening chat...' });
          setSelectedChatId(room.id);
          if (onNavigate) onNavigate(`chat/${room.id}`);
          return;
        }

        throw new Error('Chat room not returned');
      } catch (error: any) {
        console.error('Failed to create chat room:', error);
        toast({ title: 'Error', description: error.message || 'Failed to open chat', variant: 'destructive' });
        return;
      }
    }

    // Otherwise, send a chat request
    if (requestedRecipients.includes(String(match.user_id))) {
      toast({ title: 'Already requested', description: 'Chat request already sent', variant: 'default' });
      return;
    }

    try {
  setSendingRequests(prev => [...prev, String(match.user_id)]);

      const response = await fetchWithFirebaseAuth('/functions/v1/chat-request-handler', {
        method: 'POST',
        body: JSON.stringify({ action: 'send_request', recipient_id: match.user_id, message: 'Hi! I would like to chat.' })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to send chat request');
      }

      const result = await response.json();
      if (result.success) {
        // Server may indicate it was already sent; still record so UI reflects state
        const recipientIdStr = String(match.user_id);
        
        setRequestedRecipients(prev => {
          const updated = Array.from(new Set([...prev, recipientIdStr]));
          // Immediately save to localStorage
          try {
            localStorage.setItem(REQUESTED_KEY(userId), JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed to save to localStorage', e);
          }
          return updated;
        });
        
        // if server returned a status or chat_room_id, prefer those
        const returnedStatus = (result?.data?.status || result?.status) || 'pending';
        const returnedRoom = result?.data?.chat_room_id || result?.chat_room_id || null;
        
        setRequestedStatus(prev => {
          const updated = { ...prev, [recipientIdStr]: returnedStatus };
          // Save to localStorage
          try {
            localStorage.setItem(`${REQUESTED_KEY(userId)}:status`, JSON.stringify(updated));
          } catch (e) {
            console.warn('Failed to save status to localStorage', e);
          }
          return updated;
        });
        
        if (returnedRoom) {
          setRequestedChatRooms(prev => {
            const updated = { ...prev, [recipientIdStr]: returnedRoom };
            // Save to localStorage
            try {
              localStorage.setItem(`${REQUESTED_KEY(userId)}:rooms`, JSON.stringify(updated));
            } catch (e) {
              console.warn('Failed to save rooms to localStorage', e);
            }
            return updated;
          });
        }
        
        console.log('[PairingPage] ✅ Chat request sent successfully, state updated:', {
          recipient: recipientIdStr,
          status: returnedStatus,
          room: returnedRoom
        });
        
        toast({ title: 'Chat Request Sent!', description: result.message || 'Your request has been delivered.' });
      } else {
        throw new Error(result.error || 'Failed to send request');
      }
    } catch (error: any) {
      console.error('Chat request failed:', error);
      toast({ title: 'Error', description: error.message || 'Failed to send chat request', variant: 'destructive' });
    } finally {
      setSendingRequests(prev => prev.filter(id => id !== String(match.user_id)));
    }
  };

  // Realtime listener: watch updates to chat_requests where current user is the sender
  useRealtime({
    table: 'chat_requests',
    event: 'UPDATE',
    filter: userId ? `sender_id=eq.${userId}` : 'sender_id=eq.00000000-0000-0000-0000-000000000000',
    onUpdate: (payload) => {
      try {
        const updated = payload.new;
        const recipient = updated.recipient_id;
        if (!recipient) return;

        if (updated.status === 'accepted') {
          setRequestedStatus(prev => ({ ...prev, [recipient]: 'accepted' }));
          setRequestedRecipients(prev => Array.from(new Set([...prev, recipient])));
          if (updated.chat_room_id) {
            setRequestedChatRooms(prev => ({ ...prev, [recipient]: updated.chat_room_id }));
            // navigate to chat room if possible
            toast({ title: 'Request accepted', description: 'Opening chat...', });
            if (onNavigate) onNavigate(`chat/${updated.chat_room_id}`);
          } else {
            toast({ title: 'Request accepted', description: 'Your chat request was accepted.' });
          }
        } else if (updated.status === 'declined') {
          setRequestedStatus(prev => ({ ...prev, [recipient]: 'declined' }));
          toast({ title: 'Request declined', description: 'Your chat request was declined', variant: 'destructive' });
        }
      } catch (err) {
        console.error('Realtime chat_request update handler error', err);
      }
    }
  });

  // Also listen for newly created chat_requests (INSERT) so that when the edge
  // function creates the row we reflect it immediately (useful for other tabs)
  useRealtime({
    table: 'chat_requests',
    event: 'INSERT',
    filter: userId ? `sender_id=eq.${userId}` : 'sender_id=eq.00000000-0000-0000-0000-000000000000',
    onUpdate: (payload) => {
      try {
        const inserted: any = payload.new;
        const recipient = inserted.recipient_id;
        if (!recipient) return;

        setRequestedRecipients(prev => Array.from(new Set([...prev, recipient])));
        setRequestedStatus(prev => ({ ...prev, [recipient]: inserted.status }));
        if (inserted.chat_room_id) {
          setRequestedChatRooms(prev => ({ ...prev, [recipient]: inserted.chat_room_id }));
        }
      } catch (err) {
        console.error('Realtime chat_request insert handler error', err);
      }
    }
  });

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
            <HeartAnimation size={64} />
            <p className="text-base font-medium text-muted-foreground mt-3">Loading matches...</p>
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
                {/* Two Hearts Merging Animation */}
                <div className="relative w-24 h-24 flex items-center justify-center">
                  {/* Background glow */}
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                  
                  {/* Hearts container */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    {/* Left Purple Heart - moves right */}
                    <motion.div
                      animate={{
                        x: [-20, -5, -20],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute"
                      style={{ mixBlendMode: 'screen' }}
                    >
                      <Heart 
                        className="w-16 h-16" 
                        strokeWidth={3}
                        style={{
                          stroke: 'hsl(var(--primary))',
                          fill: 'hsl(var(--primary) / 0.4)',
                          filter: 'drop-shadow(0 0 15px hsl(var(--primary) / 0.8))'
                        }}
                      />
                    </motion.div>

                    {/* Right White Heart - moves left */}
                    <motion.div
                      animate={{
                        x: [20, 5, 20],
                        opacity: [0.7, 1, 0.7],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 0
                      }}
                      className="absolute"
                      style={{ mixBlendMode: 'screen' }}
                    >
                      <Heart 
                        className="w-16 h-16" 
                        strokeWidth={3}
                        style={{
                          stroke: 'white',
                          fill: 'rgba(255, 255, 255, 0.3)',
                          filter: 'drop-shadow(0 0 15px rgba(255, 255, 255, 0.8))'
                        }}
                      />
                    </motion.div>

                    {/* Center merged heart effect */}
                    <motion.div
                      animate={{
                        scale: [0.9, 1.1, 0.9],
                        opacity: [0.3, 0.6, 0.3],
                      }}
                      transition={{
                        duration: 2.5,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="absolute"
                    >
                      <Heart 
                        className="w-14 h-14" 
                        strokeWidth={4}
                        style={{
                          stroke: 'hsl(var(--primary-glow))',
                          fill: 'none',
                          filter: 'blur(2px) drop-shadow(0 0 20px hsl(var(--primary) / 0.6))'
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
                      {isLoading ? <Loader size={20} className="inline-block" /> : <Sparkles className="w-5 h-5" />}
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
            <>
              {/* Radius Filter Control */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-2xl p-6 shadow-elegant border border-border"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                      <SlidersHorizontal className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Distance Filter</h3>
                      <p className="text-sm text-muted-foreground">Showing profiles within {radiusKm} km</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{radiusKm} km</p>
                    <p className="text-xs text-muted-foreground">
                      {matches.filter(m => !m.distance_km || m.distance_km <= radiusKm).length} matches
                    </p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Slider
                    value={[radiusKm]}
                    onValueChange={(value) => setRadiusKm(value[0])}
                    onValueCommit={(value) => handleRadiusChange(value[0])}
                    min={0}
                    max={50}
                    step={1}
                    className="w-full"
                    disabled={isLoading}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 km</span>
                    <span>25 km</span>
                    <span>50 km</span>
                  </div>
                </div>
              </motion.div>

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
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
                      <div className={`px-4 py-2 rounded-full text-sm font-bold text-white shadow-elegant backdrop-blur-md ${
                        (match.compatibility_score || 0) >= 80 ? 'bg-success/90' :
                        (match.compatibility_score || 0) >= 60 ? 'bg-primary/90' :
                        'bg-muted/90'
                      }`}>
                        {match.compatibility_score || 0}%
                      </div>
                      <div className="flex items-center gap-2">
                        {match.distance_km && (
                          <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-blue-500/90 to-purple-500/90 backdrop-blur-md shadow-elegant">
                            <MapPin className="w-4 h-4 text-white" />
                            <span className="text-sm font-bold text-white">{match.distance_km}km</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-black/60 backdrop-blur-md">
                          <Award className="w-4 h-4 text-accent" />
                          <span className="text-sm font-bold text-white">{match.total_qcs}</span>
                        </div>
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
                      
                      <div className="space-y-2 mb-3">
                        {match.university && (
                          <div className="flex items-center gap-2 text-white/90">
                            <GraduationCap className="w-4 h-4" />
                            <p className="text-sm font-medium">{match.university}</p>
                          </div>
                        )}
                        {match.distance_km && (
                          <div className="flex items-center gap-2 text-white/90">
                            <MapPin className="w-4 h-4" />
                            <p className="text-sm font-medium">{match.distance_km} km away</p>
                          </div>
                        )}
                      </div>

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

                      {(() => {
                        const isHigh = (match.compatibility_score || 0) > 80;
                        const isRequested = requestedRecipients.includes(String(match.user_id));
                        const isSending = sendingRequests.includes(String(match.user_id));

                        const baseClass = `px-4 py-3 rounded-xl font-semibold text-white transition-all flex items-center justify-center gap-2 text-sm`;

                        if (isHigh) {
                          return (
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => handleChatClick(match)}
                              className={`${baseClass} bg-gradient-to-r from-success to-success/90 shadow-medium hover:shadow-glow`}
                            >
                              <MessageCircle className="w-4 h-4" />
                              Chat
                            </motion.button>
                          );
                        }

                        return (
                          <>
                            {requestedStatus[String(match.user_id)] === 'accepted' ? (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                onClick={() => {
                                  const roomId = requestedChatRooms[String(match.user_id)];
                                  if (roomId) {
                                    if (onNavigate) onNavigate(`chat/${roomId}`);
                                  } else {
                                    toast({ title: 'Accepted', description: 'Chat accepted by user' });
                                  }
                                }}
                                className={`${baseClass} bg-success/80 shadow-medium`}
                              >
                                <Check className="w-4 h-4" />
                                Accepted
                              </motion.button>
                            ) : (
                              <motion.button
                                whileHover={{ scale: isRequested || isSending ? 1 : 1.03 }}
                                whileTap={{ scale: isRequested || isSending ? 1 : 0.97 }}
                                onClick={() => handleChatClick(match)}
                                disabled={isRequested || isSending}
                                className={`${baseClass} ${isRequested ? 'bg-muted/60 cursor-not-allowed' : 'bg-gradient-primary shadow-medium hover:shadow-glow'}`}
                              >
                                <MessageCircle className="w-4 h-4" />
                                {isSending ? 'Sending...' : isRequested ? 'Requested' : 'Request'}
                              </motion.button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </motion.div>
                ))}
              </motion.div>
            </>
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
          <CompatibilityModal
            profile={{
              user_id: selectedProfile.user_id,
              first_name: selectedProfile.first_name,
              age: selectedProfile.age,
              gender: selectedProfile.gender,
              profile_images: selectedProfile.profile_images,
              compatibility_score: selectedProfile.compatibility_score,
              physical_score: selectedProfile.physical_score,
              mental_score: selectedProfile.mental_score,
              total_qcs: selectedProfile.total_qcs,
              matched_criteria: selectedProfile.matched_criteria,
              not_matched_criteria: selectedProfile.not_matched_criteria,
              interests: selectedProfile.interests,
              values: selectedProfile.values,
              personality_type: selectedProfile.personality_type,
              lifestyle: selectedProfile.lifestyle
            }}
            isOpen={!!selectedProfile}
            onClose={() => setSelectedProfile(null)}
            onRequestChat={() => {
              handleChatClick(selectedProfile);
            }}
          />
        )}
      </div>
    </UnifiedLayout>
  );
};

export default PairingPage;
