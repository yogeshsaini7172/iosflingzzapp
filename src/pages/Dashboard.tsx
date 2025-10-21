import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, User, Zap, Settings, Eye, Star, Sparkles, TrendingUp } from 'lucide-react';
import HeartAnimation from '@/components/ui/HeartAnimation';

interface DashboardProps {
  onNavigate: (view: string) => void;
}

const Dashboard = ({ onNavigate }: DashboardProps) => {
  // Enhanced mock user data with premium features
  const userProfile = {
    firstName: 'Sidhartha',
    lastName: 'Kumar',
    swipesLeft: 15,
    maxSwipes: 20,
    matches: 12,
    likes: 34,
    profileViews: 278,
    isVerified: true,
    subscriptionTier: 'premium' as 'free' | 'premium',
    completionPercentage: 92,
    lastActive: 'now'
  };

  const renderPremiumStatus = () => {
    if (userProfile.subscriptionTier === 'free') {
      return (
        <Card className="mb-6 bg-gradient-card border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary/5" />
          <CardContent className="p-6 relative">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-primary p-0.5">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face" 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-foreground">Upgrade to Premium</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    Recommended
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  Unlock unlimited swipes, see who likes you, and access premium matching!
                </p>
              </div>
              
              <Button size="sm" className="bg-gradient-primary hover:shadow-royal transition-luxury">
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <Card className="mb-6 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/20 shadow-medium">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center">
                <Star className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="font-semibold text-amber-700">Premium Active</div>
                <div className="text-sm text-amber-600">Unlimited swipes & premium features</div>
              </div>
            </div>
            <Badge className="bg-amber-100 text-amber-700 border-0">
              Premium
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-elegant">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-primary/80 backdrop-blur-lg border-b border-primary/20 shadow-royal">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg">
                <HeartAnimation size={40} />
              </div>
              {userProfile.subscriptionTier === 'premium' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  FLINGZZ App
                </h1>
                {userProfile.subscriptionTier === 'premium' && (
                  <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                    Premium
                  </Badge>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                Hey {userProfile.firstName}! ✨ {userProfile.lastActive}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userProfile.isVerified ? (
              <Badge className="bg-success/10 text-success border-success/20 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-amber-500/20 text-amber-600">
                Verify Account
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => onNavigate('chat')} className="hover:bg-primary/5">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('profile')} className="hover:bg-primary/5">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-md bg-gradient-royal/5 backdrop-blur-sm rounded-t-3xl shadow-premium border-t border-primary/10">
        {/* User Stats */}
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card className="text-center p-4 bg-gradient-card border-0 shadow-medium">
              <div className="text-2xl font-bold text-primary">{userProfile.swipesLeft}</div>
              <div className="text-xs text-muted-foreground">Swipes Left</div>
            </Card>
            <Card className="text-center p-4 bg-gradient-card border-0 shadow-medium">
              <div className="text-2xl font-bold text-secondary">{userProfile.matches}</div>
              <div className="text-xs text-muted-foreground">Matches</div>
            </Card>
            <Card className="text-center p-4 bg-gradient-card border-0 shadow-medium">
              <div className="text-2xl font-bold text-accent">{userProfile.likes}</div>
              <div className="text-xs text-muted-foreground">Likes</div>
            </Card>
          </div>
        </div>

        {/* Connection Options */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-primary rounded-full mb-3 shadow-lg">
              <Heart className="w-6 h-6 text-white animate-pulse" />
            </div>
            <p className="text-muted-foreground text-lg">
              Discover amazing people who share your vibe ✨
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <Button 
              onClick={() => onNavigate('swipe')} 
              className="h-20 bg-gradient-primary hover:scale-105 hover:shadow-xl transition-all group relative overflow-hidden" 
              disabled={userProfile.swipesLeft === 0}
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-center gap-4">
                <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">Swipe & Match</div>
                  <div className="text-sm text-white/90">Classic dating experience</div>
                </div>
              </div>
            </Button>
            
            <Button 
              onClick={() => onNavigate('matches')} 
              className="h-20 bg-gradient-secondary hover:scale-105 hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-center gap-4">
                <Heart className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">Smart Pairing</div>
                  <div className="text-sm text-white/90">AI-powered connections</div>
                </div>
              </div>
            </Button>
            
            <Button 
              onClick={() => onNavigate('blind-date')} 
              className="h-20 bg-gradient-to-r from-accent to-secondary hover:scale-105 hover:shadow-xl transition-all group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-center gap-4">
                <Eye className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">Blind Date</div>
                  <div className="text-sm text-white/90">Mystery connections</div>
                </div>
              </div>
            </Button>
          </div>
        </div>

        {renderPremiumStatus()}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Button 
            variant="outline" 
            onClick={() => onNavigate('chat')} 
            className="h-16 bg-gradient-to-br from-card to-muted/50 hover:from-primary/5 hover:to-primary/10 border-2 border-primary/20 hover:border-primary hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="text-center">
              <MessageCircle className="w-6 h-6 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-semibold">Messages</div>
              <div className="text-xs text-muted-foreground">{userProfile.matches} active</div>
            </div>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => onNavigate('profile')} 
            className="h-16 bg-gradient-to-br from-card to-muted/50 hover:from-secondary/5 hover:to-secondary/10 border-2 border-secondary/20 hover:border-secondary hover:shadow-lg transition-all group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-5 transition-opacity" />
            <div className="text-center">
              <User className="w-6 h-6 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <div className="font-semibold">Profile</div>
              <div className="text-xs text-muted-foreground">{userProfile.completionPercentage}% complete</div>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;