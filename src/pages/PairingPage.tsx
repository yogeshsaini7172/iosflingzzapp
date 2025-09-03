import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Heart, Brain, Star, MapPin, GraduationCap, Sparkles, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
}

interface PairingPageProps {
  onNavigate: (view: string) => void;
}

const PairingPage = ({ onNavigate }: PairingPageProps) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      loadMatches(JSON.parse(user).id);
    }
  }, []);

  const loadMatches = async (userId: string) => {
    setIsLoading(true);
    try {
      // Call the pairing-matches edge function
      const { data, error } = await supabase.functions.invoke('pairing-matches', {
        body: { limit: 10 }
      });

      if (error) {
        console.error('Error fetching matches:', error);
        toast.error('Failed to load matches');
        return;
      }

      if (data?.matches) {
        setMatches(data.matches);
        toast.success(`Found ${data.matches.length} compatible matches!`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load matches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    if (currentUser) {
      loadMatches(currentUser.id);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-green-500 bg-green-500/10';
    if (score >= 60) return 'text-yellow-500 bg-yellow-500/10';
    return 'text-red-500 bg-red-500/10';
  };

  const getCompatibilityText = (score: number) => {
    if (score >= 90) return 'Excellent Match';
    if (score >= 80) return 'Great Match';
    if (score >= 70) return 'Good Match';
    if (score >= 60) return 'Fair Match';
    return 'Limited Match';
  };

  return (
    <div className="h-full overflow-auto bg-gradient-subtle">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-elegant font-bold text-gradient-primary mb-2">
                Smart Pairing
              </h1>
              <p className="text-muted-foreground">
                AI-powered compatibility matching based on your profile and preferences
              </p>
            </div>
            <Button 
              onClick={handleRefresh}
              disabled={isLoading}
              className="bg-gradient-primary shadow-royal hover:opacity-90"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Matches
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Matches</p>
                    <p className="text-2xl font-bold">{matches.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Star className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">High Compatibility</p>
                    <p className="text-2xl font-bold">
                      {matches.filter(m => (m.compatibility_score || 0) >= 80).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg">
                    <Sparkles className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Your QCS</p>
                    <p className="text-2xl font-bold">{currentUser?.profile?.total_qcs || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Finding your perfect matches...</p>
            </div>
          </div>
        )}

        {/* Matches Grid */}
        {!isLoading && matches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match, index) => (
              <Card key={match.user_id} className="bg-gradient-card border-border/50 hover-elegant shadow-card">
                <CardContent className="p-0">
                  {/* Profile Image */}
                  <div className="relative h-48 overflow-hidden rounded-t-lg">
                    <img 
                      src={match.profile_images?.[0] || '/api/placeholder/300/200'}
                      alt={`${match.first_name} ${match.last_name}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <Badge className={`${getCompatibilityColor(match.compatibility_score || 0)} border-0`}>
                        {match.compatibility_score || 0}%
                      </Badge>
                    </div>
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        #{index + 1}
                      </Badge>
                    </div>
                  </div>

                  <div className="p-4 space-y-4">
                    {/* Basic Info */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold">
                          {match.first_name} {match.last_name}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          {match.age} years
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground mb-2">
                        <GraduationCap className="h-4 w-4 mr-1" />
                        {match.university}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {match.bio}
                      </p>
                    </div>

                    {/* Compatibility Scores */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <Heart className="h-4 w-4 mr-1 text-red-500" />
                          Physical
                        </span>
                        <span className="font-medium">{match.physical_score || 0}%</span>
                      </div>
                      <Progress value={match.physical_score || 0} className="h-2" />

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center">
                          <Brain className="h-4 w-4 mr-1 text-blue-500" />
                          Mental
                        </span>
                        <span className="font-medium">{match.mental_score || 0}%</span>
                      </div>
                      <Progress value={match.mental_score || 0} className="h-2" />

                      <div className="flex items-center justify-between text-sm font-medium">
                        <span className="flex items-center">
                          <Star className="h-4 w-4 mr-1 text-yellow-500" />
                          Overall
                        </span>
                        <span className={getCompatibilityColor(match.compatibility_score || 0).split(' ')[0]}>
                          {getCompatibilityText(match.compatibility_score || 0)}
                        </span>
                      </div>
                    </div>

                    {/* QCS Score */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">QCS Score</span>
                      <Badge variant="outline" className="font-bold">
                        {match.total_qcs}
                      </Badge>
                    </div>

                    {/* Interests */}
                    {match.interests && match.interests.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Interests</p>
                        <div className="flex flex-wrap gap-1">
                          {match.interests.slice(0, 3).map((interest, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                          {match.interests.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{match.interests.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 hover:bg-muted/80"
                        onClick={() => toast.info('Profile view coming soon!')}
                      >
                        View Profile
                      </Button>
                      <Button 
                        size="sm" 
                        className="flex-1 bg-gradient-primary shadow-royal hover:opacity-90"
                        onClick={() => toast.success(`Liked ${match.first_name}!`)}
                      >
                        <Heart className="h-4 w-4 mr-1" />
                        Like
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && matches.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No matches found</h3>
            <p className="text-muted-foreground mb-4">
              Try refreshing or updating your preferences to find more compatible matches.
            </p>
            <Button onClick={handleRefresh} className="bg-gradient-primary">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PairingPage;