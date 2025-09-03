import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
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
  height?: number;
  body_type?: string;
  skin_tone?: string;
  values?: string;
  mindset?: string;
  show_profile?: boolean;
  major?: string;
  location?: string;
  face_type?: string;
  field_of_study?: string;
  year_of_study?: number;
  relationship_status?: string;
  college_tier?: string;
  govt_id_verified?: boolean;
  student_id_verified?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
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
  const { toast } = useToast();

  // Use demo user ID since auth is removed
  const getCurrentUserId = () => {
    return localStorage.getItem('demoUserId') || 'alice-johnson-123';
  };

  const fetchProfileData = async () => {
    const userId = getCurrentUserId();

    try {
      setIsLoading(true);

      // Fetch profile using edge function
      const response = await fetch('/functions/v1/profile-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer dummy-token-${userId}`,
        },
        body: JSON.stringify({
          action: 'get',
          user_id: userId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(result.data.profile);
        
        // Also fetch partner preferences
        const { data: preferencesData } = await supabase
          .from('partner_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();
        
        setPreferences(preferencesData);
      } else {
        // If profile doesn't exist, try to get from test data
        const { data: testProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
          
        if (testProfile) {
          setProfile(testProfile);
          
          const { data: preferencesData } = await supabase
            .from('partner_preferences')
            .select('*')
            .eq('user_id', userId)
            .single();
          
          setPreferences(preferencesData);
        }
      }

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
    const userId = getCurrentUserId();
    if (!profile) return;

    try {
      // Use edge function for profile updates
      const response = await fetch('/functions/v1/profile-management', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer dummy-token-${userId}`,
        },
        body: JSON.stringify({
          action: 'update',
          user_id: userId,
          profile: updates
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setProfile(prev => prev ? { ...prev, ...updates } : null);
        
        toast({
          title: "Profile updated",
          description: "Your changes have been saved successfully"
        });
      } else {
        throw new Error(result.error);
      }

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
    const userId = getCurrentUserId();

    try {
      const { error } = await supabase
        .from('partner_preferences')
        .upsert({
          user_id: userId,
          ...updates
        });

      if (error) throw error;

      setPreferences(prev => prev ? { ...prev, ...updates } : { user_id: userId, ...updates } as PartnerPreferences);
      
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
  }, []);

  return {
    profile,
    preferences,
    isLoading,
    updateProfile,
    updatePreferences,
    refetch: fetchProfileData
  };
};