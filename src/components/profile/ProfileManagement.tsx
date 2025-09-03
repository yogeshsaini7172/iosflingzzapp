import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  User
} from 'lucide-react';

interface ProfileManagementProps {
  onNavigate: (view: string) => void;
}

const ProfileManagement = ({ onNavigate }: ProfileManagementProps) => {
  const [profile, setProfile] = useState({
    firstName: 'Sarah',
    lastName: 'Johnson',
    age: 22,
    gender: 'female',
    location: 'Stanford University',
    bio: 'Psychology major who loves hiking, coffee, and deep conversations under the stars ✨',
    height: 165,
    interests: ['hiking', 'coffee', 'psychology', 'photography', 'yoga'],
    lookingFor: 'serious',
    isVisible: true,
    images: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400'
    ]
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'photos' | 'preferences' | 'privacy'>('basic');

  const interests = [
    'hiking', 'coffee', 'psychology', 'photography', 'yoga', 'reading', 'music', 'travel',
    'cooking', 'dancing', 'art', 'fitness', 'movies', 'gaming', 'sports'
  ];

  const renderBasicInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            value={profile.firstName}
            onChange={(e) => setProfile({...profile, firstName: e.target.value})}
            className="border-primary/20 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            value={profile.lastName}
            onChange={(e) => setProfile({...profile, lastName: e.target.value})}
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">About Me</Label>
        <Textarea
          id="bio"
          value={profile.bio}
          onChange={(e) => setProfile({...profile, bio: e.target.value})}
          placeholder="Tell us about yourself..."
          className="min-h-[100px] border-primary/20 focus:border-primary resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Age</Label>
          <Input
            type="number"
            value={profile.age}
            onChange={(e) => setProfile({...profile, age: parseInt(e.target.value)})}
            className="border-primary/20 focus:border-primary"
          />
        </div>
        <div className="space-y-2">
          <Label>Height (cm)</Label>
          <Input
            type="number"
            value={profile.height}
            onChange={(e) => setProfile({...profile, height: parseInt(e.target.value)})}
            className="border-primary/20 focus:border-primary"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <Select value={profile.gender} onValueChange={(value) => setProfile({...profile, gender: value})}>
          <SelectTrigger className="border-primary/20 focus:border-primary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="non-binary">Non-binary</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Location</Label>
        <Input
          value={profile.location}
          onChange={(e) => setProfile({...profile, location: e.target.value})}
          placeholder="Your university or city"
          className="border-primary/20 focus:border-primary"
        />
      </div>
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
        {profile.images.map((image, index) => (
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
        
        {Array.from({ length: 6 - profile.images.length }).map((_, index) => (
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

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label className="text-base font-medium">Looking For</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            {['serious', 'casual', 'friendship', 'networking'].map((option) => (
              <Button
                key={option}
                variant={profile.lookingFor === option ? "default" : "outline"}
                onClick={() => setProfile({...profile, lookingFor: option})}
                className={`capitalize ${profile.lookingFor === option ? 'bg-gradient-primary' : 'border-primary/20 hover:border-primary'}`}
              >
                {option}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-base font-medium mb-3 block">Interests</Label>
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <Badge
                key={interest}
                variant={profile.interests.includes(interest) ? "default" : "outline"}
                className={`cursor-pointer capitalize ${
                  profile.interests.includes(interest) 
                    ? 'bg-gradient-primary text-white hover:opacity-90' 
                    : 'border-primary/20 hover:border-primary'
                }`}
                onClick={() => {
                  const newInterests = profile.interests.includes(interest)
                    ? profile.interests.filter(i => i !== interest)
                    : [...profile.interests, interest];
                  setProfile({...profile, interests: newInterests});
                }}
              >
                {interest}
              </Badge>
            ))}
          </div>
        </div>
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
            checked={profile.isVisible}
            onCheckedChange={(checked) => setProfile({...profile, isVisible: checked})}
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
            Pending
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
    { id: 'photos', label: 'Photos', icon: Camera },
    { id: 'preferences', label: 'Preferences', icon: Heart },
    { id: 'privacy', label: 'Privacy', icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => onNavigate('home')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Edit Profile</h1>
              <p className="text-sm text-muted-foreground">Make yourself shine ✨</p>
            </div>
          </div>
          <Button className="bg-gradient-primary">
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
                  src={profile.images[0]}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile.firstName} {profile.lastName}</h2>
                <div className="flex items-center gap-2 text-white/90">
                  <Calendar className="w-4 h-4" />
                  <span>{profile.age} years old</span>
                </div>
                <div className="flex items-center gap-2 text-white/90">
                  <MapPin className="w-4 h-4" />
                  <span>{profile.location}</span>
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
                className={`flex-1 rounded-none border-b-2 ${
                  activeTab === id 
                    ? 'border-primary bg-primary/10 text-primary' 
                    : 'border-transparent hover:bg-muted'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
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
            {activeTab === 'photos' && renderPhotos()}
            {activeTab === 'preferences' && renderPreferences()}
            {activeTab === 'privacy' && renderPrivacy()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProfileManagement;