import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Heart, 
  Users, 
  Sparkles, 
  Shield, 
  MapPin, 
  GraduationCap,
  Settings,
  Bell,
  Search
} from "lucide-react";

interface CampusConnectHomeProps {
  onNavigate: (view: string) => void;
  userProfile?: {
    name: string;
    college: string;
    isVerified: boolean;
    subscriptionTier: 'free' | 'starter' | 'plus' | 'pro';
  };
}

const CampusConnectHome = ({ 
  onNavigate, 
  userProfile = {
    name: "Alex",
    college: "Stanford University",
    isVerified: true,
    subscriptionTier: 'free'
  }
}: CampusConnectHomeProps) => {
  const [campusMode, setCampusMode] = useState<'in-campus' | 'cross-campus'>('in-campus');

  const stats = {
    matches: 12,
    views: 34,
    likes: 18
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="bg-gradient-primary text-white shadow-medium">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Hey {userProfile.name}! 👋</h1>
                <div className="flex items-center space-x-2">
                  <span className="text-sm opacity-90">{userProfile.college}</span>
                  {userProfile.isVerified && (
                    <Badge variant="secondary" className="bg-success text-success-foreground text-xs">
                      ✓ Verified
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.matches}</div>
              <div className="text-sm opacity-90">Matches</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.views}</div>
              <div className="text-sm opacity-90">Profile Views</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.likes}</div>
              <div className="text-sm opacity-90">Likes</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card 
            className="shadow-card hover:shadow-medium transition-all duration-300 cursor-pointer hover:-translate-y-1 border-0"
            onClick={() => onNavigate('discover')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-coral rounded-full flex items-center justify-center mx-auto mb-3">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">Discover</h3>
              <p className="text-sm text-muted-foreground font-prompt">Find your perfect match</p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-card hover:shadow-medium transition-all duration-300 cursor-pointer hover:-translate-y-1 border-0"
            onClick={() => onNavigate('blind-date')}
          >
            <CardContent className="p-6 text-center">
              <div className="w-12 h-12 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-semibold mb-1">Blind Date</h3>
              <p className="text-sm text-muted-foreground font-prompt">Mystery connections</p>
            </CardContent>
          </Card>
        </div>

        {/* Campus Mode Toggle */}
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Campus Mode</h3>
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={campusMode === 'in-campus' ? 'default' : 'outline'}
                onClick={() => setCampusMode('in-campus')}
                className="rounded-xl"
              >
                In-Campus
              </Button>
              <Button
                variant={campusMode === 'cross-campus' ? 'default' : 'outline'}
                onClick={() => setCampusMode('cross-campus')}
                className="rounded-xl"
              >
                Cross-Campus
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2 font-prompt">
              {campusMode === 'in-campus' 
                ? 'Connect with students from your university'
                : 'Explore matches from nearby universities'
              }
            </p>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="shadow-card border-0 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-accent/10">
                <div className="w-8 h-8 bg-gradient-coral rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New match with Sarah!</p>
                  <p className="text-xs text-muted-foreground">2 minutes ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-primary/10">
                <div className="w-8 h-8 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">3 people viewed your profile</p>
                  <p className="text-xs text-muted-foreground">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subscription Prompt */}
        {userProfile.subscriptionTier === 'free' && (
          <Card className="shadow-coral border-0 bg-gradient-coral">
            <CardContent className="p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold mb-1">Unlock Premium Features</h3>
                  <p className="text-sm opacity-90 font-prompt">
                    Send unlimited messages & get priority matching
                  </p>
                </div>
                <Button 
                  variant="secondary"
                  size="sm"
                  onClick={() => onNavigate('subscription')}
                  className="bg-white text-accent hover:bg-white/90"
                >
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Bottom Navigation handled globally by UnifiedLayout */}
      <div className="hidden">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-around items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('discover')}
              className="flex-col h-auto py-2 px-3 rounded-xl"
            >
              <Search className="w-5 h-5 mb-1" />
              <span className="text-xs">Discover</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('matches')}
              className="flex-col h-auto py-2 px-3 rounded-xl"
            >
              <Heart className="w-5 h-5 mb-1" />
              <span className="text-xs">Matches</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('chat')}
              className="flex-col h-auto py-2 px-3 rounded-xl"
            >
              <Users className="w-5 h-5 mb-1" />
              <span className="text-xs">Chat</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNavigate('profile')}
              className="flex-col h-auto py-2 px-3 rounded-xl"
            >
              <GraduationCap className="w-5 h-5 mb-1" />
              <span className="text-xs">Profile</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusConnectHome;