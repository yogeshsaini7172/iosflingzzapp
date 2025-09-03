import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DemoProfile {
  user_id: string;
  first_name: string;
  last_name: string;
  email?: string;
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

interface DemoPreferences {
  user_id: string;
  preferred_gender: string[];
  age_range_min: number;
  age_range_max: number;
  preferred_relationship_goal: string[];
}

export const useDemoProfile = () => {
  const [profile, setProfile] = useState<DemoProfile | null>(null);
  const [preferences, setPreferences] = useState<DemoPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchDemoData = () => {
    try {
      setIsLoading(true);
      
      const profileData = localStorage.getItem('demoProfile');
      const preferencesData = localStorage.getItem('demoPreferences');
      
      if (profileData) {
        setProfile(JSON.parse(profileData));
      }
      
      if (preferencesData) {
        setPreferences(JSON.parse(preferencesData));
      }
    } catch (error) {
      console.error('Error loading demo data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = (updates: Partial<DemoProfile>) => {
    if (!profile) return;

    try {
      const updatedProfile = { ...profile, ...updates };
      setProfile(updatedProfile);
      localStorage.setItem('demoProfile', JSON.stringify(updatedProfile));
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully"
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error updating profile",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  const updatePreferences = (updates: Partial<DemoPreferences>) => {
    try {
      const demoUserId = localStorage.getItem('demoUserId');
      if (!demoUserId) return;

      const updatedPreferences = preferences ? 
        { ...preferences, ...updates } : 
        { user_id: demoUserId, ...updates } as DemoPreferences;
      
      setPreferences(updatedPreferences);
      localStorage.setItem('demoPreferences', JSON.stringify(updatedPreferences));
      
      toast({
        title: "Preferences updated",
        description: "Your partner preferences have been saved"
      });
    } catch (error: any) {
      console.error('Error updating preferences:', error);
      toast({
        title: "Error updating preferences",
        description: "Failed to save changes",
        variant: "destructive"
      });
    }
  };

  const getCurrentUserId = () => {
    return localStorage.getItem('demoUserId') || null;
  };

  useEffect(() => {
    fetchDemoData();
  }, []);

  return {
    profile,
    preferences,
    isLoading,
    updateProfile,
    updatePreferences,
    refetch: fetchDemoData,
    getCurrentUserId
  };
};