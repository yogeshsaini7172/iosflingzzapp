import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
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
  Target
} from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';

interface EnhancedProfileManagementProps {
  onNavigate: (view: string) => void;
}

const EnhancedProfileManagement = ({ onNavigate }: EnhancedProfileManagementProps) => {
  const { profile, preferences, isLoading, updateProfile, updatePreferences } = useProfileData();
  const [activeTab, setActiveTab] = useState<'basic' | 'what-you-are' | 'who-you-want' | 'photos' | 'privacy'>('basic');

  // Local state for form management
  const [formData, setFormData] = useState({
    // Basic info
    firstName: profile?.first_name || '',
    lastName: profile?.last_name || '',
    bio: profile?.bio || '',
    
    // What You Are data
    height: profile?.height?.toString() || '',
    bodyType: profile?.body_type || '',
    skinTone: profile?.skin_tone || '',
    personalityType: profile?.personality_type || '',
    values: profile?.values || '',
    mindset: profile?.mindset || '',
    relationshipGoals: profile?.relationship_goals || [],
    interests: profile?.interests || [],
    
    // Who You Want data
    preferredGender: preferences?.preferred_gender || [],
    ageRangeMin: preferences?.age_range_min || 18,
    ageRangeMax: preferences?.age_range_max || 30,
    preferredRelationshipGoal: preferences?.preferred_relationship_goal || [],
    
    // Settings
    isVisible: profile?.show_profile !== false,
    profileImages: profile?.profile_images || []
  });

  const handleSaveChanges = async () => {
    // Update profile
    await updateProfile({
      first_name: formData.firstName,
      last_name: formData.lastName,
      bio: formData.bio,
      height: formData.height ? parseInt(formData.height) : undefined,
      body_type: formData.bodyType,
      skin_tone: formData.skinTone,
      personality_type: formData.personalityType,
      values: formData.values,
      mindset: formData.mindset,
      relationship_goals: formData.relationshipGoals,
      interests: formData.interests,
      show_profile: formData.isVisible
    });

    // Update preferences
    await updatePreferences({
      preferred_gender: formData.preferredGender,
      age_range_min: formData.ageRangeMin,
      age_range_max: formData.ageRangeMax,
      preferred_relationship_goal: formData.preferredRelationshipGoal
    });
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
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const personalityTypes = [
    "Adventurous", "Analytical", "Creative", "Outgoing", "Introverted", 
    "Empathetic", "Ambitious", "Laid-back", "Intellectual", "Spontaneous"
  ];

  const valueOptions = [
    "Family-oriented", "Career-focused", "Adventure-seeking", "Spiritual", 
    "Health-conscious", "Creative", "Intellectual", "Social justice", 
    "Environmental", "Traditional"
  ];

  const relationshipGoalOptions = [
    "Serious relationship", "Casual dating", "Marriage", "Friendship first", 
    "Open to anything", "Long-term commitment"
  ];

  const interestOptions = [
    "Travel", "Reading", "Music", "Movies", "Sports", "Cooking", "Art", 
    "Technology", "Nature", "Photography", "Dancing", "Gaming", "Fitness", 
    "Writing", "Volunteering", "Fashion", "Food", "History", "Science", "Politics"
  ];

  const genderOptions = ["Male", "Female", "Non-binary", "All"];

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

      <div className="space-y-2">
        <Label>University</Label>
        <Input
          value={profile?.university || ''}
          disabled
          className="bg-muted border-primary/20"
        />
      </div>

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
                  <SelectItem value="slim">Slim</SelectItem>
                  <SelectItem value="athletic">Athletic</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="curvy">Curvy</SelectItem>
                  <SelectItem value="plus_size">Plus Size</SelectItem>
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
                <SelectItem value="very_fair">Very Fair</SelectItem>
                <SelectItem value="fair">Fair</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="olive">Olive</SelectItem>
                <SelectItem value="brown">Brown</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
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
          <div className="space-y-2">
            <Label>Personality Type</Label>
            <Select value={formData.personalityType} onValueChange={(value) => setFormData(prev => ({...prev, personalityType: value}))}>
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="Select personality type" />
              </SelectTrigger>
              <SelectContent>
                {personalityTypes.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Core Values</Label>
            <Select value={formData.values} onValueChange={(value) => setFormData(prev => ({...prev, values: value}))}>
              <SelectTrigger className="border-primary/20 focus:border-primary">
                <SelectValue placeholder="Select your core values" />
              </SelectTrigger>
              <SelectContent>
                {valueOptions.map((value) => (
                  <SelectItem key={value} value={value.toLowerCase().replace(/[^a-z0-9]/g, '_')}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Relationship Goals</Label>
            <div className="flex flex-wrap gap-2">
              {relationshipGoalOptions.map((goal) => {
                const isSelected = formData.relationshipGoals.includes(goal.toLowerCase().replace(/[^a-z0-9]/g, '_'));
                return (
                  <Badge
                    key={goal}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('relationshipGoals', goal.toLowerCase().replace(/[^a-z0-9]/g, '_'), 3)}
                  >
                    {goal}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => {
                const isSelected = formData.interests.includes(interest.toLowerCase());
                return (
                  <Badge
                    key={interest}
                    variant={isSelected ? "default" : "outline"}
                    className={`cursor-pointer ${
                      isSelected 
                        ? 'bg-gradient-primary text-white hover:opacity-90' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                    onClick={() => toggleArrayItem('interests', interest.toLowerCase(), 10)}
                  >
                    {interest}
                  </Badge>
                );
              })}
            </div>
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
        <p className="text-muted-foreground text-sm">What are you looking for in a partner?</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="w-5 h-5" />
            Partner Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label>Interested in</Label>
            <div className="flex flex-wrap gap-2">
              {genderOptions.map((gender) => {
                const isSelected = formData.preferredGender.includes(gender.toLowerCase());
                return (
                  <Button
                    key={gender}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleArrayItem('preferredGender', gender.toLowerCase(), 4)}
                    className={`rounded-full ${
                      isSelected 
                        ? 'bg-gradient-primary' 
                        : 'border-primary/20 hover:border-primary'
                    }`}
                  >
                    {gender}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Age Range: {formData.ageRangeMin} - {formData.ageRangeMax} years</Label>
            <div className="px-2">
              <Slider
                value={[formData.ageRangeMin, formData.ageRangeMax]}
                onValueChange={([min, max]) => {
                  setFormData(prev => ({...prev, ageRangeMin: min, ageRangeMax: max}));
                }}
                min={18}
                max={50}
                step={1}
                className="w-full"
              />
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
                    onClick={() => toggleArrayItem('preferredRelationshipGoal', goalKey, 3)}
                  >
                    {goal}
                  </Badge>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPhotos = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Your Photos</h3>
        <p className="text-muted-foreground text-sm mb-6">
          Add up to 6 photos to show your personality
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {formData.profileImages.map((image, index) => (
          <div key={index} className="aspect-square relative group overflow-hidden rounded-xl border-2 border-primary/20">
            <img
              src={image}
              alt={`Profile ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <Button variant="secondary" size="sm">
                <Edit3 className="w-4 h-4" />
              </Button>
            </div>
            {index === 0 && (
              <Badge className="absolute top-2 left-2 bg-primary text-white border-0">
                Main
              </Badge>
            )}
          </div>
        ))}
        
        {Array.from({ length: 6 - formData.profileImages.length }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="aspect-square border-2 border-dashed border-primary/30 rounded-xl flex items-center justify-center hover:border-primary/60 transition-colors cursor-pointer group"
          >
            <div className="text-center">
              <Camera className="w-8 h-8 text-primary/60 group-hover:text-primary transition-colors mx-auto mb-2" />
              <span className="text-xs text-muted-foreground">Add Photo</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-primary" />
            <div>
              <div className="font-medium">Profile Visibility</div>
              <div className="text-sm text-muted-foreground">Show your profile to others</div>
            </div>
          </div>
          <Switch
            checked={formData.isVisible}
            onCheckedChange={(checked) => setFormData(prev => ({...prev, isVisible: checked}))}
          />
        </div>

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

        <div className="flex items-center justify-between p-4 border border-primary/20 rounded-lg">
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

  const tabs = [
    { id: 'basic', label: 'Basic Info', icon: User },
    { id: 'what-you-are', label: 'What You Are', icon: User },
    { id: 'who-you-want', label: 'Who You Want', icon: Heart },
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Edit Profile</h1>
              <p className="text-sm text-muted-foreground">Make yourself shine ✨</p>
            </div>
          </div>
          <Button className="bg-gradient-primary" onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {/* Profile Summary Card */}
        <Card className="mb-6 shadow-medium border-0 overflow-hidden">
          <div className="bg-gradient-primary p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20">
                <img
                  src={formData.profileImages[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400'}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{formData.firstName} {formData.lastName}</h2>
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="w-4 h-4" />
                  <span>Age: {new Date().getFullYear() - (profile?.date_of_birth ? new Date(profile.date_of_birth).getFullYear() : 2000)}</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span>{profile?.university}</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <Card className="mb-6 shadow-medium border-0">
          <div className="flex overflow-x-auto">
            {tabs.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                variant={activeTab === id ? "default" : "ghost"}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 rounded-none border-b-2 text-xs sm:text-sm ${
                  activeTab === id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4 mr-1" />
                {label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Content */}
        <Card className="shadow-medium border-0">
          <CardHeader>
            <CardTitle className="capitalize">{activeTab.replace('-', ' ')} Settings</CardTitle>
          </CardHeader>
          <CardContent>
            {activeTab === 'basic' && renderBasicInfo()}
            {activeTab === 'what-you-are' && renderWhatYouAre()}
            {activeTab === 'who-you-want' && renderWhoYouWant()}
            {activeTab === 'photos' && renderPhotos()}
            {activeTab === 'privacy' && renderPrivacy()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedProfileManagement;