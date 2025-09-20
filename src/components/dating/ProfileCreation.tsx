import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Upload, Camera, Shield } from "lucide-react";

interface ProfileCreationProps {
  onComplete: () => void;
}


const ProfileCreation = ({ onComplete }: ProfileCreationProps) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    gender: '',
    bio: '',
    university: '',
    major: '',
    yearOfStudy: '',
    location: '',
    interests: [] as string[]
  });

  const [currentInterest, setCurrentInterest] = useState('');
  const [step, setStep] = useState<'basic' | 'photo' | 'complete'>('basic');
  // Profile photo state
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);

  // Handle profile photo upload
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const suggestedInterests = [
    'Photography', 'Music', 'Sports', 'Reading', 'Cooking', 'Travel', 
    'Gaming', 'Art', 'Dancing', 'Fitness', 'Movies', 'Technology'
  ];

  const addInterest = (interest: string) => {
    if (interest && !formData.interests.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
      setCurrentInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('photo');
  };

  const handleVerificationSubmit = () => {
    setStep('complete');
  };

  const renderBasicInfo = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent">
          Create Your Profile
        </CardTitle>
        <p className="text-muted-foreground">Tell us about yourself to find your perfect match</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleBasicSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="non_binary">Non-binary</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">University</Label>
            <Input
              id="university"
              value={formData.university}
              onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
              placeholder="e.g., Harvard University"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="major">Major</Label>
              <Input
                id="major"
                value={formData.major}
                onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                placeholder="e.g., Computer Science"
              />
            </div>
            <div className="space-y-2">
              <Label>Year of Study</Label>
              <Select value={formData.yearOfStudy} onValueChange={(value) => setFormData(prev => ({ ...prev, yearOfStudy: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(year => (
                    <SelectItem key={year} value={year.toString()}>Year {year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about yourself, your hobbies, and what you're looking for..."
              className="min-h-24"
            />
          </div>

          <div className="space-y-4">
            <Label>Interests</Label>
            <div className="flex gap-2">
              <Input
                value={currentInterest}
                onChange={(e) => setCurrentInterest(e.target.value)}
                placeholder="Add an interest"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addInterest(currentInterest);
                  }
                }}
              />
              <Button type="button" onClick={() => addInterest(currentInterest)}>
                Add
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {suggestedInterests.map(interest => (
                <Badge
                  key={interest}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => addInterest(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>

            {formData.interests.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-lg">
                {formData.interests.map(interest => (
                  <Badge key={interest} variant="default" className="flex items-center gap-1">
                    {interest}
                    <X
                      size={14}
                      className="cursor-pointer hover:text-destructive"
                      onClick={() => removeInterest(interest)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button type="submit" className="w-full" size="lg">
            Continue to Verification
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderPhotoStep = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Shield className="w-6 h-6" />
          Upload Photo
        </CardTitle>
        <p className="text-muted-foreground">Create your perfect GenZ profile 🚀</p>
      </CardHeader>
      <CardContent className="space-y-8">
        <div className="flex flex-col items-center gap-4">
          <label htmlFor="profile-photo-upload" className="cursor-pointer">
            {profilePhoto ? (
              <img
                src={profilePhoto}
                alt="Profile Preview"
                className="w-40 h-40 rounded-full object-cover border-4 border-primary shadow"
              />
            ) : (
              <div className="w-40 h-40 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-primary">
                <Upload className="w-14 h-14 text-primary" />
              </div>
            )}
            <input
              id="profile-photo-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleProfilePhotoChange}
              disabled={!!profilePhoto}
            />
          </label>
          <span className="text-lg font-semibold mt-2">Main Photo</span>
          <span className="text-sm text-muted-foreground">Upload only 1 photo as your main profile image</span>
          {profilePhoto && (
            <Button size="sm" variant="destructive" onClick={() => { setProfilePhoto(null); setProfilePhotoFile(null); }}>
              Remove Photo
            </Button>
          )}
        </div>
        <div className="flex gap-4 mt-8">
          <Button variant="outline" onClick={() => setStep('basic')} className="flex-1">
            Back
          </Button>
          <Button onClick={handleVerificationSubmit} className="flex-1" disabled={!profilePhotoFile}>
            Save & Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderComplete = () => (
    <Card className="max-w-2xl mx-auto text-center">
      <CardContent className="p-8">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold mb-2">Profile Created Successfully!</h2>
        <p className="text-muted-foreground mb-6">
          Your profile has been created and submitted for verification. 
          You can start exploring and matching with other verified students.
        </p>
        <Button onClick={onComplete} size="lg">
          Start Exploring
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 pt-20">
      <div className="container mx-auto">
  {step === 'basic' && renderBasicInfo()}
  {step === 'photo' && renderPhotoStep()}
  {step === 'complete' && renderComplete()}
      </div>
    </div>
  );
};

export default ProfileCreation;