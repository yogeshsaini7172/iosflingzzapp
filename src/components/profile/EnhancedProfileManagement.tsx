import { useState, useEffect } from 'react';
import GenZBackground from '@/components/ui/genZ-background';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import LocationPermission from '@/components/common/LocationPermission';
import LocationDisplay from '@/components/common/LocationDisplay';
import { PremiumTabSlider } from '@/components/ui/premium-tab-slider';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Camera, 
  Star, 
  MapPin, 
  Calendar, 
  Heart,
  Shield,
  Sparkles,
  Edit3,
  Eye,
  User,
  Users,
  Target,
  LogOut,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  Move,
  X,
  MoreHorizontal
} from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PROFESSIONS } from '@/components/profile/ProfessionCombobox';

interface EnhancedProfileManagementProps {
  onNavigate: (view: string) => void;
}

const EnhancedProfileManagement = ({ onNavigate }: EnhancedProfileManagementProps) => {
  // Transform single database value to UI key format (for dropdowns)
  const transformSingleValueToUI = (dbValue: string) => {
    const transformMap: Record<string, string> = {
      // Body types (for Select dropdown - need key format)
      'slim': 'slim',
      'athletic': 'athletic', 
      'average': 'average',
      'curvy': 'curvy',
      'plus_size': 'plus_size',
      
      // Skin tones (for Select dropdown - need key format)
      'very_fair': 'very_fair',
      'fair': 'fair',
      'medium': 'medium',
      'olive': 'olive',
      'brown': 'brown',
      'dark': 'dark',
      
      // Face types
      'round': 'round',
      'oval': 'oval',
      'square': 'square',
      'heart': 'heart',
      'diamond': 'diamond',
      'long': 'long',
      'Round': 'round',
      'Oval': 'oval',
      'Square': 'square',
      'Heart': 'heart',
      'Diamond': 'diamond',
      'Long': 'long',
      
      // Love languages  
      'words_of_affirmation': 'words_of_affirmation',
      'acts_of_service': 'acts_of_service',
      'receiving_gifts': 'receiving_gifts',
      'quality_time': 'quality_time',
      'physical_touch': 'physical_touch',
      'Words of Affirmation': 'words_of_affirmation',
      'Acts of Service': 'acts_of_service',
      'Receiving Gifts': 'receiving_gifts',
      'Quality Time': 'quality_time',
      'Physical Touch': 'physical_touch',
      
      // Lifestyle options (for Badge components)
      'active': 'active',
      'relaxed': 'relaxed',
      'social': 'social',
      'homebody': 'homebody',
      'adventurous': 'adventurous',
      'career_focused': 'career_focused',
      'family_oriented': 'family_oriented',
      'health_conscious': 'health_conscious',
      'party_goer': 'party_goer',
      'minimalist': 'minimalist',
      'creative': 'creative',
      'intellectual': 'intellectual',
      'Active': 'active',
      'Relaxed': 'relaxed',
      'Social': 'social',
      'Homebody': 'homebody',
      'Adventurous': 'adventurous',
      'Career-focused': 'career_focused',
      'Family-oriented': 'family_oriented',
      'Health-conscious': 'health_conscious',
      'Party-goer': 'party_goer',
      'Minimalist': 'minimalist',
      'Creative': 'creative',
      'Intellectual': 'intellectual',
    };
    return transformMap[dbValue] || dbValue;
  };

  // Transform database values to UI format (handle case sensitivity)
  const transformDatabaseToUI = (dbValues: string[]) => {
    if (!Array.isArray(dbValues)) return [];
    return dbValues.map(value => {
      // Convert database format to UI key format (what the UI logic expects)
      // The UI logic uses: option.toLowerCase().replace(/[^a-z0-9]/g, '_')
      // So we need to return the KEY format, not the display format
      const transformMap: Record<string, string> = {
        // Personality traits - return key format
        'adventurous': 'adventurous',
        'Adventurous': 'adventurous',
        'analytical': 'analytical', 
        'Analytical': 'analytical',
        'creative': 'creative',
        'Creative': 'creative',
        'outgoing': 'outgoing',
        'Outgoing': 'outgoing',
        'empathetic': 'empathetic',
        'Empathetic': 'empathetic',
        
        // Values - return key format  
        'family_oriented': 'family_oriented',
        'Family-oriented': 'family_oriented',
        'career_focused': 'career_focused',
        'Career-focused': 'career_focused',
        'health_conscious': 'health_conscious',
        'Health-conscious': 'health_conscious',
        
        // Mindset - return key format
        'growth': 'growth_mindset',
        'Growth Mindset': 'growth_mindset',
        'growth_mindset': 'growth_mindset',
        
        // Relationship goals - return key format
        'serious_relationship': 'serious_relationship',
        'Serious relationship': 'serious_relationship',
        
        // Skin tones (synonyms)
        'Very fair': 'very_fair',
        'very fair': 'very_fair',
        'Very Light': 'very_fair',
        'Light': 'fair',
        'light': 'fair',
        'Fair': 'fair',
        'Medium': 'medium',
        'Olive': 'olive',
        'Brown': 'brown',
        'Dark': 'dark',
        
        // Love languages
        'Words of Affirmation': 'words_of_affirmation',
        'Acts of Service': 'acts_of_service',
        'Receiving Gifts': 'receiving_gifts',
        'Quality Time': 'quality_time',
        'Physical Touch': 'physical_touch',
        
        // Face types
        'Round': 'round',
        'Oval': 'oval',
        'Square': 'square',
        'Heart': 'heart',
        'Diamond': 'diamond',
        'Long': 'long',
      };
      
      // If we have a mapping, use it, otherwise convert to key format
      if (transformMap[value]) {
        return transformMap[value];
      }
      
      // Default: convert any value to key format
      return value.toLowerCase().replace(/[^a-z0-9]/g, '_');
    });
  };
  // Remove photo from profileImages
  const removePhoto = (index: number) => {
    const newImages = (formData.profileImages || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, profileImages: newImages }));
    // Optionally, auto-save after removal
    updateProfile({ profile_images: newImages });
  };
  const { profile, preferences, isLoading, updateProfile, updatePreferences } = useProfileData();
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'basic' | 'location' | 'what-you-are' | 'who-you-want' | 'photos' | 'privacy'>('basic');
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null);

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    if (!user?.uid) {
      throw new Error('User must be authenticated to access profile');
    }
    return user.uid;
  };

  // Local state for form management - Initialize with empty values initially
  const [formData, setFormData] = useState({
    // Basic info
    firstName: '',
    lastName: '',
    bio: '',
    university: '',
    educationLevel: '',
    profession: '',
    professionDescription: '',

    // Physical Attributes
    height: '',
    bodyType: '',
    skinTone: '',
    faceType: '',
    loveLanguage: '',
    lifestyle: '',

    // Location
    location: null as any,
    matchRadiusKm: 50,
    matchByState: false,
    state: '',

    // Personality & Values (arrays)
    personalityTraits: [] as string[],
    values: [] as string[],
    mindset: [] as string[],

    // Goals & Interests
    relationshipGoals: [] as string[],
    interests: [] as string[],

    // Who You Want data
    preferredGender: [] as string[],
    ageRangeMin: 18,
    ageRangeMax: 30,
    heightRangeMin: 150,
    heightRangeMax: 200,
    preferredBodyTypes: [] as string[],
    preferredValues: [] as string[],
    preferredMindset: [] as string[],
    preferredPersonalityTraits: [] as string[],
    preferredRelationshipGoal: [] as string[],
    preferredSkinTone: [] as string[],
    preferredFaceType: [] as string[],
    preferredLoveLanguage: [] as string[],
    preferredLifestyle: [] as string[],
    preferredDrinking: [] as string[],
    preferredSmoking: [] as string[],
    preferredProfessions: [] as string[],

    // Settings - Don't default to true, wait for actual database value
    isVisible: false,
    profileImages: [] as string[]
  });

  // Track whether we've loaded profile data from database
  const [hasLoadedProfileData, setHasLoadedProfileData] = useState(false);

  // Helper function to normalize keys to match UI format
  const normalizeKey = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '_');
  const normalizeArray = (arr: string[]) => arr.map(normalizeKey);

  // Alias maps to harmonize legacy/canonical keys to UI keys (display-only)
  const aliasMaps = {
    mindset: {
      growth: 'growth_mindset',
      positive: 'positive_thinking',
    } as Record<string, string>,
    lifestyle: {
      // From older step component labels
      active_outdoorsy: 'active',
      active___outdoorsy: 'active',
      social_party: 'social',
      social___party: 'social',
      quiet_homebody: 'homebody',
      quiet___homebody: 'homebody',
      studious_academic: 'intellectual',
      studious___academic: 'intellectual',
    } as Record<string, string>,
  } as const;

  const normalizeWithAliases = (arr: string[], domain: keyof typeof aliasMaps) =>
    arr.map(normalizeKey).map((k) => aliasMaps[domain][k] || k);

  // Update form data when profile/preferences load
  useEffect(() => {
    // Wrap the entire transform in try/catch to surface silent errors
    try {
      if (profile) {
        console.log("📊 Loading profile data into form:", profile);
        console.log("🔍 Current show_profile value:", profile.show_profile, "Type:", typeof profile.show_profile);

        // Step 1: Transform profile data
        const transformedData = {
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          bio: profile.bio || '',
          university: profile.university || '',
          educationLevel: (profile as any).education_level || '',
          profession: (profile as any).profession || '',
          professionDescription: (profile as any).profession_description || '',
          height: profile.height?.toString() || '',
          bodyType: transformSingleValueToUI((profile as any).body_type || ''),
          skinTone: transformSingleValueToUI((profile as any).skin_tone || ''),
          faceType: transformSingleValueToUI((profile as any).face_type || ''),
          loveLanguage: transformSingleValueToUI((profile as any).love_language || ''),
          lifestyle: transformSingleValueToUI((profile as any).lifestyle || ''),

          // Location data
          location: (profile as any).location ? (() => {
            try {
              return JSON.parse((profile as any).location);
            } catch {
              return {
                city: (profile as any).city || '',
                latitude: (profile as any).latitude || null,
                longitude: (profile as any).longitude || null,
                source: 'manual'
              };
            }
          })() : null,
          matchRadiusKm: (profile as any).match_radius_km || 50,
          matchByState: (profile as any).match_by_state || false,
          state: (profile as any).state || '',

          // Normalize arrays into UI key format
          personalityTraits: transformDatabaseToUI((profile as any).personality_traits || []),
          values: transformDatabaseToUI(
            Array.isArray((profile as any).values)
              ? (profile as any).values
              : Array.isArray((profile as any).values_array)
                ? (profile as any).values_array
                : (profile as any).values
                  ? [(profile as any).values]
                  : []
          ),
          mindset: transformDatabaseToUI(
            Array.isArray((profile as any).mindset)
              ? (profile as any).mindset
              : (profile as any).mindset
                ? [(profile as any).mindset]
                : []
          ),
          relationshipGoals: transformDatabaseToUI(profile.relationship_goals || []),
          interests: Array.isArray(profile.interests) ? transformDatabaseToUI(profile.interests as any) : [],
          isVisible: typeof profile.show_profile === 'boolean' ? profile.show_profile : true,
          profileImages: profile.profile_images || [],
        };

        console.log("🔄 Setting isVisible to:", typeof profile.show_profile === 'boolean' ? profile.show_profile : true);

        // Step 2: Debug transformed data
        console.log("🔄 Transformed data:", transformedData);

        // Step 3: Update formData only if we haven't loaded profile data before or if the visibility changed
        setFormData(prev => ({
          ...prev,
          ...transformedData,
        }));

        // Mark that we've loaded profile data
        setHasLoadedProfileData(true);

        // Debug: Log transformed values
        console.log("🔄 Transformed profile values:", {
          bodyType: transformSingleValueToUI((profile as any).body_type || ''),
          skinTone: transformSingleValueToUI((profile as any).skin_tone || ''),
          personalityTraits: transformDatabaseToUI((profile as any).personality_traits || []),
          values: transformDatabaseToUI((profile as any).values || []),
          mindset: transformDatabaseToUI((profile as any).mindset || []),
          relationshipGoals: transformDatabaseToUI(profile.relationship_goals || []),
        });

        // Debug: Log raw database values
        console.log("🗄️ Raw database values:", {
          personality_traits: (profile as any).personality_traits,
          values: (profile as any).values,
          mindset: (profile as any).mindset,
          relationship_goals: profile.relationship_goals,
        });

        // ❗ At this point `formData` is NOT updated yet because `setFormData` is async
        // If you want to log the final state, use another useEffect([formData]) instead
      }

      if (preferences) {
        console.log("📊 Loading preferences data into form:", preferences);

        setFormData(prev => ({
          ...prev,
          preferredGender: Array.isArray(preferences.preferred_gender)
            ? transformDatabaseToUI(preferences.preferred_gender.map((g: any) => g.toString()))
            : ['male', 'female'], // Default to both genders
          ageRangeMin: preferences.age_range_min || 18,
          ageRangeMax: preferences.age_range_max || 30,
          heightRangeMin: preferences.height_range_min || 150,
          heightRangeMax: preferences.height_range_max || 200,
          preferredBodyTypes:
            Array.isArray(preferences.preferred_body_types) && preferences.preferred_body_types.length > 0
              ? transformDatabaseToUI(preferences.preferred_body_types)
              : ['slim', 'athletic', 'average'],
          preferredValues:
            Array.isArray(preferences.preferred_values) && preferences.preferred_values.length > 0
              ? transformDatabaseToUI(preferences.preferred_values)
              : ['family_oriented', 'career_focused'],
          preferredMindset:
            Array.isArray(preferences.preferred_mindset) && preferences.preferred_mindset.length > 0
              ? transformDatabaseToUI(preferences.preferred_mindset)
              : ['growth_mindset'],
          preferredPersonalityTraits:
            Array.isArray(preferences.preferred_personality_traits) && preferences.preferred_personality_traits.length > 0
              ? transformDatabaseToUI(preferences.preferred_personality_traits)
              : ['outgoing', 'empathetic'],
          preferredRelationshipGoal:
            Array.isArray((preferences as any).preferred_relationship_goals)
              ? transformDatabaseToUI((preferences as any).preferred_relationship_goals)
              : Array.isArray((preferences as any).preferred_relationship_goal)
                ? transformDatabaseToUI((preferences as any).preferred_relationship_goal)
                : ['serious_relationship'],
          preferredSkinTone: Array.isArray((preferences as any).preferred_skin_tone)
            ? transformDatabaseToUI((preferences as any).preferred_skin_tone)
            : Array.isArray((preferences as any).preferred_skin_types)
              ? transformDatabaseToUI((preferences as any).preferred_skin_types)
              : [],
          preferredFaceType: Array.isArray((preferences as any).preferred_face_types)
            ? transformDatabaseToUI((preferences as any).preferred_face_types)
            : Array.isArray((preferences as any).preferred_face_type)
              ? transformDatabaseToUI((preferences as any).preferred_face_type)
              : [],
          preferredLoveLanguage: Array.isArray((preferences as any).preferred_love_languages)
            ? transformDatabaseToUI((preferences as any).preferred_love_languages)
            : Array.isArray((preferences as any).preferred_love_language)
              ? transformDatabaseToUI((preferences as any).preferred_love_language)
              : [],
          preferredLifestyle: Array.isArray(preferences.preferred_lifestyle) 
            ? transformDatabaseToUI(preferences.preferred_lifestyle) 
            : [],
          preferredDrinking: Array.isArray((preferences as any).preferred_drinking)
            ? transformDatabaseToUI((preferences as any).preferred_drinking)
            : [],
          preferredSmoking: Array.isArray((preferences as any).preferred_smoking)
            ? transformDatabaseToUI((preferences as any).preferred_smoking)
            : [],
          preferredProfessions: Array.isArray((preferences as any).preferred_professions)
            ? (preferences as any).preferred_professions
            : [],
        }));
      }
    } catch (err) {
      console.error('Error transforming profile/preferences into formData:', err);
      // Ensure we don't leave the UI stuck on the loader if transform fails
      setHasLoadedProfileData(true);
    }
  }, [profile, preferences]);

// Debug: print final form data after any change
useEffect(() => {
  console.log('✅ Final formData for UI rendering:', formData);
}, [formData]);


  const handleLogout = async () => {
    try {
      // Clear Firebase auth
      await signOut();
      
      // Clear local storage
      localStorage.removeItem('demoProfile');
      localStorage.removeItem('demoPreferences');  
      localStorage.removeItem('demoUserId');
      localStorage.removeItem('demoQCS');
      localStorage.removeItem('subscription_plan');
      localStorage.removeItem('profile_complete');
      
      // The AuthContext will handle navigation automatically
      console.log('✅ Logout completed, AuthContext will handle navigation');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleSaveChanges = async () => {
    try {
      // Update profile
      await updateProfile({
        first_name: formData.firstName,
        last_name: formData.lastName,
        university: formData.university,
        bio: formData.bio,
        education_level: formData.educationLevel,
        profession: formData.profession,
        profession_description: formData.professionDescription,
        height: formData.height ? parseInt(formData.height) : undefined,
        body_type: formData.bodyType,
        skin_tone: formData.skinTone,
        face_type: formData.faceType,
        love_language: formData.loveLanguage,
        lifestyle: formData.lifestyle,
        personality_traits: formData.personalityTraits,
        values: formData.values,
        mindset: formData.mindset,
        relationship_goals: formData.relationshipGoals,
        interests: formData.interests,
        profile_images: formData.profileImages,
        show_profile: formData.isVisible,
        // Location data
        location: formData.location ? JSON.stringify(formData.location) : null,
        latitude: formData.location?.latitude || null,
        longitude: formData.location?.longitude || null,
        city: formData.location?.city || null,
        state: formData.state || formData.location?.region || null,
        match_radius_km: formData.matchRadiusKm || 50,
        match_by_state: formData.matchByState || false
      } as any);

      // Update preferences with validation
      const preferencesToUpdate = {
        preferred_gender: formData.preferredGender.length > 0 ? formData.preferredGender as any : ['male', 'female'], // Default to both if empty
        age_range_min: formData.ageRangeMin,
        age_range_max: formData.ageRangeMax,
        height_range_min: formData.heightRangeMin,
        height_range_max: formData.heightRangeMax,
        preferred_body_types: formData.preferredBodyTypes.length > 0 ? formData.preferredBodyTypes : ['slim', 'athletic', 'average'], // Default to common types
        preferred_values: formData.preferredValues.length > 0 ? formData.preferredValues : ['family_oriented', 'career_focused'], // Default values
        preferred_mindset: formData.preferredMindset.length > 0 ? formData.preferredMindset : ['growth_mindset'], // Default mindset
        preferred_personality_traits: formData.preferredPersonalityTraits.length > 0 ? formData.preferredPersonalityTraits : ['outgoing', 'empathetic'], // Default traits
        preferred_relationship_goals: formData.preferredRelationshipGoal.length > 0 ? formData.preferredRelationshipGoal : ['serious_relationship'], // Default goal
        preferred_skin_types: formData.preferredSkinTone,
        preferred_face_types: formData.preferredFaceType,
        preferred_love_languages: formData.preferredLoveLanguage,
        preferred_lifestyle: formData.preferredLifestyle,
        preferred_drinking: formData.preferredDrinking,
        preferred_smoking: formData.preferredSmoking,
        preferred_professions: formData.preferredProfessions
      };

      await updatePreferences(preferencesToUpdate);

      // Show success notification
      toast({
        title: "Profile Saved",
        description: "Your profile and preferences have been saved successfully.",
      });
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleArrayItem = (field: keyof typeof formData, item: string, maxItems: number = 10) => {
    const currentArray = formData[field] as string[];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i: string) => i !== item)
      : currentArray.length < maxItems
      ? [...currentArray, item]
      : currentArray;
    
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Temporary debug UI: if we have stopped the primary loading but the form hasn't been populated,
  // show raw profile + preferences so we can confirm data arrival. This will help distinguish
  // "no data" vs "transform error". Remove after debugging.
  if (!hasLoadedProfileData) {
    return (
      <div className="min-h-screen bg-gradient-hero p-6">
        <h3 className="text-lg font-semibold mb-2">Debug: profile not applied to form yet</h3>
        <div className="mb-4">
          <strong>Profile (raw):</strong>
          <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto max-h-40">{JSON.stringify(profile, null, 2)}</pre>
        </div>
        <div>
          <strong>Preferences (raw):</strong>
          <pre className="text-xs bg-muted p-3 rounded mt-2 overflow-auto max-h-40">{JSON.stringify(preferences, null, 2)}</pre>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">If these are populated, the transform should have set formData — check console for errors.</div>
      </div>
    );
  }

  const personalityTraitOptions = [
    "Adventurous", "Analytical", "Creative", "Outgoing", "Introverted", 
    "Empathetic", "Ambitious", "Laid-back", "Intellectual", "Spontaneous",
    "Humorous", "Practical", "Responsible", "Emotional"
  ];

  const valueOptions = [
    "Family-oriented", "Career-focused", "Health-conscious", "Spiritual", 
    "Traditional", "Social justice", "Environmental", "Creative", 
    "Intellectual", "Open-minded", "Adventure-seeking", "Financially responsible"
  ];

  const mindsetOptions = [
    "Growth Mindset", "Positive Thinking", "Pragmatic", "Optimistic", 
    "Realistic", "Ambitious", "Balanced"
  ];

  const relationshipGoalOptions = [
    "Serious relationship", "Casual dating", "Marriage", "Friendship first", 
    "Long-term commitment", "Short-term fun", "Open to anything"
  ];

  const interestOptions = [
    "Travel", "Reading", "Music", "Movies", "Sports", "Cooking", "Art", 
    "Technology", "Nature", "Photography", "Dancing", "Gaming", "Fitness", 
    "Writing", "Volunteering", "Fashion", "Food", "History", "Science", 
    "Politics", "Spirituality", "Adventure activities"
  ];

  const educationOptions = [
    "High School", "Undergraduate", "Postgraduate", "PhD / Doctorate", 
    "Working Professional", "Entrepreneur", "Other"
  ];

  const genderOptions = [
    { label: "Male", value: "male" as const },
    { label: "Female", value: "female" as const }, 
    { label: "Non-binary", value: "non_binary" as const },
    { label: "Other", value: "prefer_not_to_say" as const },
    { label: "All", value: "prefer_not_to_say" as const }
  ];

  const bodyTypeOptions = [
    "Slim", "Athletic", "Average", "Curvy", "Plus size", "Prefer not to say"
  ];

  const skinToneOptions = [
    "Very fair", "Fair", "Medium", "Olive", "Brown", "Dark"
  ];

  const faceTypeOptions = [
    "Round", "Oval", "Square", "Heart", "Diamond", "Long"
  ];

  const loveLanguageOptions = [
    "Words of Affirmation", "Acts of Service", "Receiving Gifts", 
    "Quality Time", "Physical Touch"
  ];

  const lifestyleOptions = [
    "Active", "Active & Outdoorsy", "Relaxed", "Social", "Homebody", "Adventurous", 
    "Career-focused", "Family-oriented", "Health-conscious", 
    "Party-goer", "Minimalist", "Creative", "Intellectual"
  ];

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({...prev, firstName: e.target.value}))}
            className="border-primary/20 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({...prev, lastName: e.target.value}))}
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">About Me</Label>
        <Textarea
          id="bio"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({...prev, bio: e.target.value}))}
          placeholder="Tell us about yourself..."
          className="min-h-[100px] border-primary/20 focus:border-primary resize-none"
        />
        <div className="text-right text-xs text-muted-foreground">
          {formData.bio?.length || 0}/500
        </div>
      </div>

      {/* Show University only for Students */}
      {(!formData.profession || formData.profession.toLowerCase() === 'student') && (
        <div className="space-y-2">
          <Label>University</Label>
          <Input
            value={formData.university}
            onChange={(e) => setFormData(prev => ({...prev, university: e.target.value}))}
            placeholder="Enter your university"
            className="border-primary/20 focus:border-primary"
          />
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Education Level</Label>
          <Select value={formData.educationLevel} onValueChange={(value) => setFormData(prev => ({...prev, educationLevel: value}))}>
            <SelectTrigger className="border-primary/20 focus:border-primary">
              <SelectValue placeholder="Select education level" />
            </SelectTrigger>
            <SelectContent>
              {educationOptions.map((edu) => (
                <SelectItem key={edu} value={edu.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{edu}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>Profession</Label>
          <Input
            value={formData.profession}
            onChange={(e) => setFormData(prev => ({...prev, profession: e.target.value}))}
            placeholder="Your profession or field"
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      {/* Show About Your Work only for non-students */}
      {formData.profession && formData.profession.toLowerCase() !== 'student' && (
        <div className="space-y-2">
          <Label>About Your Work</Label>
          <Textarea
            value={formData.professionDescription}
            onChange={(e) => setFormData(prev => ({...prev, professionDescription: e.target.value}))}
            placeholder="Describe your work, what you do, your role, or your career..."
            className="border-primary/20 focus:border-primary min-h-[80px]"
            rows={3}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Email</Label>
        <Input
          value={profile?.email || ''}
          disabled
          className="bg-muted border-primary/20"
        />
      </div>
    </div>
  );

  const renderLocationSection = () => {
    const radius = formData.matchRadiusKm || 50;
    
    return (
      <div className="space-y-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold mb-2">Location Settings</h3>
          <p className="text-muted-foreground text-sm">Manage your location preferences for better matching</p>
        </div>

        <LocationPermission
          onLocationUpdate={(location) => {
            setFormData(prev => ({
              ...prev,
              location: {
                latitude: location.latitude,
                longitude: location.longitude,
                city: location.city,
                region: location.region,
                country: location.country,
                address: location.address,
                source: location.source
              },
              state: location.region || prev.state
            }));
          }}
          showCard={false}
          autoFetch={true}
          className="space-y-4"
        />

        {formData.location && (
          <div className="mt-4">
            <LocationDisplay
              location={JSON.stringify(formData.location)}
              showSource={true}
              className="text-sm"
            />
          </div>
        )}

        {/* Matching Preferences Card */}
        {formData.location && (
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Matching Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* State-wise matching toggle */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-primary" />
                    <div>
                      <Label htmlFor="state-match-edit" className="font-medium">
                        Match by State Only
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formData.state ? `Show only profiles from ${formData.state}` : 'Set your state to enable'}
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="state-match-edit"
                    checked={formData.matchByState || false}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, matchByState: checked }))
                    }
                    disabled={!formData.state}
                  />
                </div>
              </div>

              {/* Radius slider - disabled when state-wise matching is enabled */}
              {!formData.matchByState && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Move className="w-5 h-5 text-primary" />
                      <Label className="font-medium">Match Radius</Label>
                    </div>
                    <Badge variant="secondary" className="text-sm">
                      {radius} km
                    </Badge>
                  </div>
                  <Slider
                    value={[radius]}
                    onValueChange={(value) => 
                      setFormData(prev => ({ ...prev, matchRadiusKm: value[0] }))
                    }
                    min={10}
                    max={500}
                    step={10}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>10 km</span>
                    <span>500 km</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    {radius < 50 && "🏘️ Nearby area"}
                    {radius >= 50 && radius < 150 && "🌆 Same city & surroundings"}
                    {radius >= 150 && radius < 300 && "🗺️ Regional matches"}
                    {radius >= 300 && "🌍 Nationwide matches"}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  const renderWhatYouAre = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold">What You Are</h3>
        <p className="text-muted-foreground text-sm">Tell us about your physical attributes and personality</p>
      </div>

      {/* Physical Attributes */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Physical Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Height (cm)</Label>
              <Input
                type="number"
                placeholder="175"
                value={formData.height}
                onChange={(e) => setFormData(prev => ({...prev, height: e.target.value}))}
                className="border-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label>Body Type</Label>
              <Select value={formData.bodyType} onValueChange={(value) => setFormData(prev => ({...prev, bodyType: value}))}>
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select body type" />
                </SelectTrigger>
                <SelectContent>
                  {bodyTypeOptions.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Skin Tone</Label>
            <Select value={formData.skinTone} onValueChange={(value) => setFormData(prev => ({...prev, skinTone: value}))}>
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="Select skin tone" />
              </SelectTrigger>
              <SelectContent>
                {skinToneOptions.map((tone) => (
                  <SelectItem key={tone} value={tone.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{tone}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Personality */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Personality & Values</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Personality Traits (Pick up to 3)</Label>
            <div className="flex flex-wrap gap-2">
              {personalityTraitOptions.map((trait) => {
                const traitKey = trait.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.personalityTraits.includes(traitKey);
                
                // Simple debug for all traits to see what's happening
                console.log(`🔍 Trait: "${trait}" -> Key: "${traitKey}" -> Selected: ${isSelected} -> Array: [${formData.personalityTraits.join(', ')}]`);
                
                return (
                  <Badge
                    key={trait}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('personalityTraits', traitKey, 3)}
                  >
                    {trait}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.personalityTraits.length}/3 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Core Values (Pick up to 3)</Label>
            <div className="flex flex-wrap gap-2">
              {valueOptions.map((value) => {
                const valueKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.values.includes(valueKey);
                
                // Simple debug for all values to see what's happening
                console.log(`🔍 Value: "${value}" -> Key: "${valueKey}" -> Selected: ${isSelected} -> Array: [${formData.values.join(', ')}]`);
                
                return (
                  <Badge
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('values', valueKey, 3)}
                  >
                    {value}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.values.length}/3 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Mindset (Pick 1-2)</Label>
            <div className="flex flex-wrap gap-2">
              {mindsetOptions.map((mindset) => {
                const mindsetKey = mindset.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.mindset.includes(mindsetKey);
                return (
                  <Badge
                    key={mindset}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('mindset', mindsetKey, 2)}
                  >
                    {mindset}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.mindset.length}/2 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Relationship Goals (Pick up to 2)</Label>
            <div className="flex flex-wrap gap-2">
              {relationshipGoalOptions.map((goal) => {
                const goalKey = goal.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.relationshipGoals.includes(goalKey);
                return (
                  <Badge
                    key={goal}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('relationshipGoals', goalKey, 2)}
                  >
                    {goal}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.relationshipGoals.length}/2 selected
            </div>
          </div>

          <div className="space-y-3">
            <Label>Interests (Pick up to 10)</Label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const interestKey = interest.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.interests.includes(interestKey);
                return (
                  <Badge
                    key={interest}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('interests', interestKey, 10)}
                  >
                    {interest}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              {formData.interests.length}/10 selected
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional Attributes */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Additional Attributes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Face Type</Label>
              <Select value={formData.faceType} onValueChange={(value) => setFormData(prev => ({...prev, faceType: value}))}>
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select face type" />
                </SelectTrigger>
                <SelectContent>
                  {faceTypeOptions.map((type) => (
                    <SelectItem key={type} value={type.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Love Language</Label>
              <Select value={formData.loveLanguage} onValueChange={(value) => setFormData(prev => ({...prev, loveLanguage: value}))}>
                <SelectTrigger className="border-primary/20 focus:border-primary">
                  <SelectValue placeholder="Select love language" />
                </SelectTrigger>
                <SelectContent>
                  {loveLanguageOptions.map((language) => (
                    <SelectItem key={language} value={language.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Lifestyle</Label>
            <Select value={formData.lifestyle} onValueChange={(value) => setFormData(prev => ({...prev, lifestyle: value}))}>
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="Select lifestyle" />
              </SelectTrigger>
              <SelectContent>
                {lifestyleOptions.map((style) => (
                  <SelectItem key={style} value={style.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{style}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderWhoYouWant = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Heart className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Who You Want</h3>
        <p className="text-muted-foreground text-sm">Tell us about your ideal partner</p>
      </div>

      {/* Basic Preferences */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Basic Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Preferred Gender</Label>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => {
                const isSelected = formData.preferredGender.includes(gender.value);
                return (
                  <Badge
                    key={gender.value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredGender', gender.value, 4)}
                  >
                    {gender.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Age Range: {formData.ageRangeMin} - {formData.ageRangeMax} years</Label>
            <Slider
              value={[formData.ageRangeMin, formData.ageRangeMax]}
              onValueChange={([min, max]) => {
                setFormData(prev => ({ ...prev, ageRangeMin: min, ageRangeMax: max }));
              }}
              min={18}
              max={50}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label>Height Range: {formData.heightRangeMin} - {formData.heightRangeMax} cm</Label>
            <Slider
              value={[formData.heightRangeMin, formData.heightRangeMax]}
              onValueChange={([min, max]) => {
                setFormData(prev => ({ ...prev, heightRangeMin: min, heightRangeMax: max }));
              }}
              min={140}
              max={220}
              step={1}
              className="w-full"
            />
          </div>

          <div className="space-y-3">
            <Label>Preferred Body Types</Label>
            <div className="flex flex-wrap gap-2">
              {bodyTypeOptions.map((type) => {
                const typeKey = type.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredBodyTypes.includes(typeKey);
                return (
                  <Badge
                    key={type}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredBodyTypes', typeKey)}
                  >
                    {type}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality Preferences */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">Personality & Values Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Preferred Values</Label>
            <div className="flex flex-wrap gap-2">
              {valueOptions.map((value) => {
                const valueKey = value.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredValues.includes(valueKey);
                return (
                  <Badge
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredValues', valueKey)}
                  >
                    {value}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Mindset</Label>
            <div className="flex flex-wrap gap-2">
              {mindsetOptions.map((mindset) => {
                const mindsetKey = mindset.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredMindset.includes(mindsetKey);
                return (
                  <Badge
                    key={mindset}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredMindset', mindsetKey)}
                  >
                    {mindset}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Personality Traits</Label>
            <div className="flex flex-wrap gap-2">
              {personalityTraitOptions.map((trait) => {
                const traitKey = trait.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredPersonalityTraits.includes(traitKey);
                return (
                  <Badge
                    key={trait}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredPersonalityTraits', traitKey)}
                  >
                    {trait}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Relationship Goals</Label>
            <div className="flex flex-wrap gap-2">
              {relationshipGoalOptions.map((goal) => {
                const goalKey = goal.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredRelationshipGoal.includes(goalKey);
                return (
                  <Badge
                    key={goal}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredRelationshipGoal', goalKey)}
                  >
                    {goal}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Skin Tone</Label>
            <div className="flex flex-wrap gap-2">
              {skinToneOptions.map((tone) => {
                const toneKey = tone.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredSkinTone.includes(toneKey);
                return (
                  <Badge
                    key={tone}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredSkinTone', toneKey)}
                  >
                    {tone}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Face Type</Label>
            <div className="flex flex-wrap gap-2">
              {faceTypeOptions.map((face) => {
                const faceKey = face.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredFaceType.includes(faceKey);
                return (
                  <Badge
                    key={face}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredFaceType', faceKey)}
                  >
                    {face}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Love Language</Label>
            <div className="flex flex-wrap gap-2">
              {loveLanguageOptions.map((language) => {
                const languageKey = language.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredLoveLanguage.includes(languageKey);
                return (
                  <Badge
                    key={language}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredLoveLanguage', languageKey)}
                  >
                    {language}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Lifestyle</Label>
            <div className="flex flex-wrap gap-2">
              {lifestyleOptions.map((lifestyle) => {
                const lifestyleKey = lifestyle.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredLifestyle.includes(lifestyleKey);
                return (
                  <Badge
                    key={lifestyle}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredLifestyle', lifestyleKey)}
                  >
                    {lifestyle}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Drinking Habits</Label>
            <div className="flex flex-wrap gap-2">
              {['Never', 'Socially', 'Regularly', 'Any'].map((habit) => {
                const habitKey = habit.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredDrinking.includes(habitKey);
                return (
                  <Badge
                    key={habit}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredDrinking', habitKey)}
                  >
                    {habit}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Smoking Habits</Label>
            <div className="flex flex-wrap gap-2">
              {['Never', 'Socially', 'Regularly', 'Any'].map((habit) => {
                const habitKey = habit.toLowerCase().replace(/[^a-z0-9]/g, '_');
                const isSelected = formData.preferredSmoking.includes(habitKey);
                return (
                  <Badge
                    key={habit}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('preferredSmoking', habitKey)}
                  >
                    {habit}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Preferred Professions (Optional)</Label>
            <div className="flex flex-wrap gap-2">
              {PROFESSIONS.map((profession) => {
                const isSelected = formData.preferredProfessions.includes(profession);
                return (
                  <Badge
                    key={profession}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => {
                      const newProfessions = isSelected
                        ? formData.preferredProfessions.filter(p => p !== profession)
                        : [...formData.preferredProfessions, profession];
                      setFormData(prev => ({ ...prev, preferredProfessions: newProfessions }));
                    }}
                  >
                    {profession}
                  </Badge>
                );
              })}
            </div>
            <div className="text-xs text-muted-foreground">
              Select professions you prefer in a partner
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPhotos = () => {
    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;

      const maxFiles = 6 - formData.profileImages.length;
      const filesToProcess = files.slice(0, maxFiles);

      console.log(`📸 Starting upload of ${filesToProcess.length} file(s)`);

      try {
        const uploadedUrls: string[] = [];
        const userId = getCurrentUserId();

        for (let i = 0; i < filesToProcess.length; i++) {
          const file = filesToProcess[i];
          console.log(`📸 Processing file ${i + 1}:`, file.name, file.size);

          // Validate file
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error(`File ${file.name} is too large. Maximum size is 5MB.`);
          }

          if (!file.type.startsWith('image/')) {
            throw new Error(`File ${file.name} is not an image. Please select image files only.`);
          }

          // Create unique filename
          const timestamp = Date.now();
          const fileExt = file.name.split('.').pop()?.toLowerCase();
          const fileName = `${userId}/${timestamp}_${i}.${fileExt}`;

          // Upload to Supabase Storage
          const { data, error } = await supabase.storage
            .from('profile-images')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (error) {
            console.error('Storage upload error:', error);
            throw new Error(`Failed to upload ${file.name}: ${error.message}`);
          }

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('profile-images')
            .getPublicUrl(data.path);

          uploadedUrls.push(urlData.publicUrl);
        }

        // Update local state immediately
        const newImages = [...formData.profileImages, ...uploadedUrls];
        setFormData(prev => ({ ...prev, profileImages: newImages }));

        // Auto-save to backend
        await updateProfile({ profile_images: newImages });

        toast({
          title: "Photos uploaded",
          description: `Successfully uploaded ${uploadedUrls.length} photo${uploadedUrls.length > 1 ? 's' : ''}`,
        });
      } catch (error: any) {
        toast({
          title: "Upload failed",
          description: error.message || "Failed to upload photos. Please try again.",
          variant: "destructive",
        });
      }
    };

    // Filter out empty, null, or invalid image URLs
    const validImages = (formData.profileImages || []).filter(
      (img) => typeof img === 'string' && img.trim() !== '' && img.startsWith('http')
    );

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Your Photos</h3>
          <p className="text-muted-foreground text-sm mb-2">
            Add up to 6 photos to show your personality. Drag to reorder.
          </p>
          <p className="text-xs text-muted-foreground mb-6">
            The first photo will be your main profile picture that others see first.
          </p>
        </div>

        {/* Main Photo Avatar */}
        <div className="flex flex-col items-center mb-6">
          {validImages[0] ? (
            <div className="relative">
              <img
                src={validImages[0]}
                alt="Main Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-primary shadow"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder.svg';
                }}
              />
              <div className="absolute top-2 left-2 bg-primary/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                Main
              </div>
              <div className="absolute bottom-2 right-2">
                <Button
                  size="sm"
                  variant="destructive"
                  className="bg-red-500/80 hover:bg-red-600/80"
                  onClick={() => removePhoto(0)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            <label className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border cursor-pointer">
              <Camera className="w-10 h-10 text-muted-foreground" />
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          )}
          <span className="text-sm text-muted-foreground mt-2">Main Profile Photo</span>
        </div>

        {/* Remaining 5 Slots */}
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, idx) => {
            const image = validImages[idx + 1];
            if (image) {
              return (
                <div
                  key={`profile-img-${idx + 1}`}
                  className="aspect-square relative group overflow-hidden rounded-xl border-2 transition-all duration-300 cursor-pointer border-primary/20 hover:border-primary/60"
                >
                  <img
                    src={image}
                    alt={`Profile ${idx + 2}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.svg';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-500/80 hover:bg-red-600/80"
                      onClick={() => removePhoto(idx + 1)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            } else {
              return (
                <label
                  key={`empty-slot-${idx}`}
                  className="aspect-square border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center hover:border-primary/60 transition-colors cursor-pointer group bg-muted/20"
                >
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors mx-auto mb-2" />
                    <span className="text-xs text-muted-foreground">Add Photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              );
            }
          })}
        </div>

        {/* Photo Tips */}
        {validImages.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-4 mt-6">
            <h4 className="font-medium mb-2">📸 Photo Tips</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Use high-quality, well-lit photos</li>
              <li>• Show your face clearly in the first photo</li>
              <li>• Include variety: close-ups, full body, activities</li>
              <li>• Smile and look confident</li>
              <li>• Avoid group photos as your main picture</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Shield className="w-12 h-12 text-primary mx-auto mb-3" />
        <h3 className="text-lg font-semibold">Privacy & Visibility</h3>
        <p className="text-muted-foreground text-sm">Control how others see your profile</p>
      </div>

      <Card className="border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base font-medium">Profile Visibility</Label>
              <p className="text-sm text-muted-foreground">
                Make your profile visible to other users for matching
                {!hasLoadedProfileData && (
                  <span className="ml-1 text-amber-600">(Loading...)</span>
                )}
              </p>
            </div>
            <Switch
              checked={formData.isVisible}
              onCheckedChange={async (checked) => {
                console.log("🔄 Switch toggled to:", checked);
                setFormData(prev => ({ ...prev, isVisible: checked }));
                
                // Auto-save visibility setting immediately using existing updateProfile function
                try {
                  console.log("💾 Auto-saving visibility setting:", checked);
                  await updateProfile({ show_profile: checked });
                  console.log("✅ Visibility setting saved successfully");
                  toast({
                    title: "Saved",
                    description: `Profile visibility ${checked ? 'enabled' : 'disabled'}`,
                  });
                } catch (error) {
                  console.error("❌ Error saving visibility:", error);
                  toast({
                    title: "Error",
                    description: "Failed to save visibility setting",
                    variant: "destructive",
                  });
                  // Revert the change if save failed
                  setFormData(prev => ({ ...prev, isVisible: !checked }));
                }
              }}
              disabled={!hasLoadedProfileData}
            />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg opacity-50">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Verification Status</div>
              <div className="text-sm text-muted-foreground">Get verified for more matches</div>
            </div>
          </div>
          <Badge variant="outline" className="border-amber-500 text-amber-600">
            {profile?.verification_status || 'Pending'}
          </Badge>
        </div>

        <div 
          className="flex items-center justify-between p-4 border border-primary/20 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => onNavigate('subscription')}
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-secondary" />
            <div>
              <div className="font-medium">Premium Features</div>
              <div className="text-sm text-muted-foreground">Unlock advanced matching</div>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="bg-gradient-secondary">
            <Star className="w-4 h-4 mr-1" />
            Upgrade
          </Button>
        </div>
      </div>
    </div>
  );

  // Main navigation tabs
  const mainTabs = [
    { id: 'basic', label: 'Basic', icon: User },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  // Slider tabs for the three-section slider
  const sliderTabs = [
    { id: 'location', label: 'Location', icon: <MapPin size={20} /> },
    { id: 'what-you-are', label: 'You Are', icon: <User size={20} /> },
    { id: 'who-you-want', label: 'You Want', icon: <Heart size={20} /> }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-float delay-200" />
      </div>

      {/* Header - Premium Style */}
      <div className="glass-premium border-b border-white/10 px-4 py-3 safe-area-top relative z-10">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Button 
              variant="glass" 
              size="icon-sm" 
              onClick={() => onNavigate('home')} 
              className="hover-lift"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/40 shadow-glow">
              {formData.profileImages?.[0] ? (
                <img
                  src={formData.profileImages[0]}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.user_id || 'default'}`; }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-primary flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            <h1 className="text-lg font-bold gradient-text">Profile</h1>
          </div>
          <Button 
            variant="premium" 
            size="sm" 
            onClick={handleSaveChanges}
            className="shadow-glow"
          >
            <Sparkles className="w-4 h-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl pb-24 relative z-10">
        {/* Premium Profile Header Card */}
        <Card className="premium-card mb-6 overflow-hidden group animate-fade-in">
          <div className="relative">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-hero opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            
            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-white/30 shadow-elegant hover-lift transition-all duration-300">
                    {formData.profileImages?.[0] ? (
                      <img
                        src={formData.profileImages[0]}
                        alt="Profile"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=profile-${profile?.user_id || 'default'}`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-white/20 flex items-center justify-center">
                        <User className="w-10 h-10 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center border-2 border-background shadow-elegant">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                </div>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-1">
                    {formData.firstName} {formData.lastName}
                  </h2>
                  <div className="flex items-center gap-2 text-white/90">
                    <GraduationCap className="w-4 h-4" />
                    <span className="text-sm font-medium">{profile?.university || 'University'}</span>
                  </div>
                  {formData.profession && (
                    <div className="flex items-center gap-2 text-white/80 mt-1">
                      <Sparkles className="w-3 h-3" />
                      <span className="text-xs">{formData.profession}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Navigation Tabs */}
        <Card className="premium-card mb-4 animate-fade-in delay-100">
          <div className="flex gap-2 p-2">
            {mainTabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? "premium" : "glass"}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all hover-lift ${
                  activeTab === id 
                    ? 'shadow-glow' 
                    : 'hover:shadow-soft'
                }`}
                size="sm"
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Premium Slider Navigation - Always visible, highlights active */}
        <div className="mb-6">
          <div className="text-center mb-3">
            <h3 className="text-sm font-semibold text-muted-foreground">Profile Sections</h3>
          </div>
          <PremiumTabSlider 
            tabs={sliderTabs}
            activeTab={activeTab} 
            onTabChange={(tab) => setActiveTab(tab as any)}
          />
        </div>

        {/* Premium Content Card with animation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ 
              duration: 0.4,
              ease: [0.4, 0, 0.2, 1]
            }}
          >
            <Card className="premium-card overflow-hidden">
              <CardContent className="p-6">
                {activeTab === 'basic' && renderBasicInfo()}
                {activeTab === 'location' && renderLocationSection()}
                {activeTab === 'what-you-are' && renderWhatYouAre()}
                {activeTab === 'who-you-want' && renderWhoYouWant()}
                {activeTab === 'photos' && renderPhotos()}
                {activeTab === 'privacy' && renderPrivacy()}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default EnhancedProfileManagement;