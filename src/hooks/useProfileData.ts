import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string;
  gender: 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
  university: string;
  bio?: string;
  interests?: string[];
  profile_images?: string[];
  personality_type?: string;
  humor_type?: string;
  love_language?: string;
  relationship_goals?: string[];
  subscription_tier: string;
  swipes_left: number;
  pairing_requests_left: number;
  blinddate_requests_left: number;
  is_profile_public: boolean;
  verification_status: string;
}

interface PartnerPreferences {
  id?: string;
  user_id: string;
  preferred_gender: string[];
  age_range_min: number;
  age_range_max: number;
  preferred_relationship_goal: string[];
}

export const useProfileData = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [preferences, setPreferences] = useState<PartnerPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchProfileData = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fetch partner preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('partner_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        console.log('No preferences found, will create default ones');
      }

      setProfile(profileData);
      setPreferences(preferencesData);

    } catch (error: any) {
      console.error('Error fetching profile data:', error);
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully"
      });

    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updatePreferences = async (updates: Partial<PartnerPreferences>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('partner_preferences')
        .upsert({
          user_id: user.id,
          ...updates
        });

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : { user_id: user.id, ...updates } as PartnerPreferences);
      
      toast({
        title: "Preferences updated",
        description: "Your partner preferences have been saved"
      });

    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error updating preferences",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  return {
    profile,
    preferences,
    isLoading,
    updateProfile,
    updatePreferences,
    refetch: fetchProfileData
  };
};