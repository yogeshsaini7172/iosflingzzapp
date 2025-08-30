import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Heart, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface BlindDateSetupProps {
  onNavigate: (view: 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches') => void;
}

const BlindDateSetup = ({ onNavigate }: BlindDateSetupProps) => {
  const [view, setView] = useState<'setup' | 'requests' | 'matches'>('setup');
  const [dateRequest, setDateRequest] = useState({
    preferredDate: '',
    preferredTime: '',
    location: '',
    message: '',
    ageRange: { min: 18, max: 25 },
    university: '',
    interests: [] as string[]
  });
  const { toast } = useToast();

  // Mock data for demonstration
  const blindDateRequests = [
    {
      id: '1',
      message: 'Looking for someone fun to grab coffee with this weekend!',
      proposedDate: '2024-01-20',
      location: 'Central Park Cafe',
      status: 'pending',
      commonInterests: ['Coffee', 'Art', 'Music']
    },
    {
      id: '2',
      message: 'Want to explore the new art museum together?',
      proposedDate: '2024-01-22',
      location: 'Modern Art Museum',
      status: 'accepted',
      commonInterests: ['Art', 'Photography', 'Culture']
    }
  ];

  const blindMatches = [
    {
      id: '1',
      scheduledDate: '2024-01-18',
      location: 'Starbucks Downtown',
      status: 'upcoming',
      revealTime: '2024-01-18T14:00:00'
    }
  ];

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Blind Date Request Sent! 🎭",
      description: "We're looking for the perfect match based on your preferences.",
    });
  };

  const renderSetup = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl bg-gradient-primary bg-clip-text text-transparent flex items-center justify-center gap-2">
          <Eye className="w-6 h-6" />
          Set Up Blind Date
        </CardTitle>
        <p className="text-muted-foreground">
          Experience the excitement of meeting someone new without seeing them first
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmitRequest} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredDate">Preferred Date</Label>
              <Input
                id="preferredDate"
                type="date"
                value={dateRequest.preferredDate}
                onChange={(e) => setDateRequest(prev => ({ ...prev, preferredDate: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input
                id="preferredTime"
                type="time"
                value={dateRequest.preferredTime}
                onChange={(e) => setDateRequest(prev => ({ ...prev, preferredTime: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Suggested Location</Label>
            <Input
              id="location"
              value={dateRequest.location}
              onChange={(e) => setDateRequest(prev => ({ ...prev, location: e.target.value }))}
              placeholder="e.g., Central Park Cafe, Downtown Bookstore"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Age Range Preference</Label>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="minAge">Min:</Label>
                <Input
                  id="minAge"
                  type="number"
                  min="18"
                  max="35"
                  className="w-20"
                  value={dateRequest.ageRange.min}
                  onChange={(e) => setDateRequest(prev => ({
                    ...prev,
                    ageRange: { ...prev.ageRange, min: parseInt(e.target.value) }
                  }))}
                />
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="maxAge">Max:</Label>
                <Input
                  id="maxAge"
                  type="number"
                  min="18"
                  max="35"
                  className="w-20"
                  value={dateRequest.ageRange.max}
                  onChange={(e) => setDateRequest(prev => ({
                    ...prev,
                    ageRange: { ...prev.ageRange, max: parseInt(e.target.value) }
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="university">University Preference (Optional)</Label>
            <Input
              id="university"
              value={dateRequest.university}
              onChange={(e) => setDateRequest(prev => ({ ...prev, university: e.target.value }))}
              placeholder="Leave blank for any university"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              value={dateRequest.message}
              onChange={(e) => setDateRequest(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Tell potential matches what you're looking for or suggest an activity..."
              className="min-h-20"
            />
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <EyeOff className="w-4 h-4" />
              How Blind Dating Works
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• We match you based on interests, university, and preferences</li>
              <li>• You can chat before the date but won't see photos</li>
              <li>• Photos are revealed 30 minutes before your scheduled date</li>
              <li>• Meet in a public place for safety</li>
            </ul>
          </div>

          <Button type="submit" className="w-full" size="lg">
            <Heart className="w-4 h-4 mr-2" />
            Find My Blind Date
          </Button>
        </form>
      </CardContent>
    </Card>
  );

  const renderRequests = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Blind Date Requests</CardTitle>
        <p className="text-muted-foreground">Respond to incoming blind date requests</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {blindDateRequests.map((request) => (
          <Card key={request.id} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{request.proposedDate}</span>
                    <Badge variant={request.status === 'accepted' ? 'default' : 'secondary'}>
                      {request.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <MapPin className="w-4 h-4" />
                    {request.location}
                  </div>
                </div>
              </div>
              
              <p className="text-sm mb-3">{request.message}</p>
              
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs text-muted-foreground">Common interests:</span>
                {request.commonInterests.map(interest => (
                  <Badge key={interest} variant="outline" className="text-xs">
                    {interest}
                  </Badge>
                ))}
              </div>

              {request.status === 'pending' && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Decline
                  </Button>
                  <Button size="sm" className="flex-1">
                    Accept
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  const renderMatches = () => (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upcoming Blind Dates</CardTitle>
        <p className="text-muted-foreground">Your scheduled mystery meetings</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {blindMatches.map((match) => (
          <Card key={match.id} className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-green-500" />
                <span className="font-semibold">{match.scheduledDate}</span>
                <Badge variant="default" className="bg-green-500">
                  {match.status}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                <MapPin className="w-4 h-4" />
                {match.location}
              </div>

              <div className="bg-muted/50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="font-semibold text-sm">Photo Reveal</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Photos will be revealed at {new Date(match.revealTime).toLocaleTimeString()}
                </p>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Chat
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Get Directions
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => onNavigate('home')}>
            ← Back
          </Button>
          <h1 className="text-xl font-bold">Blind Dating</h1>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="pt-20 pb-6">
        <div className="container mx-auto px-4">
          <div className="flex justify-center mb-6">
            <div className="bg-muted rounded-lg p-1 flex">
              <Button
                variant={view === 'setup' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('setup')}
              >
                Setup
              </Button>
              <Button
                variant={view === 'requests' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('requests')}
              >
                Requests
              </Button>
              <Button
                variant={view === 'matches' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setView('matches')}
              >
                Matches
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-8">
        {view === 'setup' && renderSetup()}
        {view === 'requests' && renderRequests()}
        {view === 'matches' && renderMatches()}
      </div>
    </div>
  );
};

export default BlindDateSetup;