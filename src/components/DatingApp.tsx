import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, MessageCircle, User, Zap, Settings, Eye, Star, Sparkles, TrendingUp } from 'lucide-react';
import PremiumSwipeCards from '@/components/dating/PremiumSwipeCards';
import MatchesList from '@/components/dating/MatchesList';
import ProfileManagement from '@/components/profile/ProfileManagement';
import ChatSystem from '@/components/chat/ChatSystem';
type View = 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches' | 'chat';
const DatingApp = () => {
  console.log('DatingApp component rendered');
  const [currentView, setCurrentView] = useState<View>('home');

  // Enhanced mock user data with premium features
  const userProfile = {
    firstName: 'Sarah',
    lastName: 'Johnson',
    swipesLeft: 8,
    maxSwipes: 10,
    matches: 7,
    likes: 23,
    profileViews: 156,
    isVerified: true,
    subscriptionTier: 'free' as 'free' | 'premium',
    completionPercentage: 85,
    lastActive: 'now'
  };
  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };
  const renderQuickActions = () => <div className="space-y-4 mb-6">
      <Button onClick={() => setCurrentView('swipe')} className="w-full h-16 bg-gradient-primary hover:scale-105 hover:shadow-xl transition-all text-lg font-semibold group relative overflow-hidden" disabled={userProfile.swipesLeft === 0}>
        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Sparkles className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
        {userProfile.swipesLeft === 0 ? 'No Swipes Left Today' : 'Discover Amazing People'}
        {userProfile.subscriptionTier === 'premium' && <Star className="w-4 h-4 ml-2 text-amber-300" />}
      </Button>
      
      <div className="grid grid-cols-2 gap-3">
        <Button variant="outline" onClick={() => setCurrentView('chat')} className="h-16 bg-gradient-to-br from-card to-muted/50 hover:from-primary/5 hover:to-primary/10 border-2 border-primary/20 hover:border-primary hover:shadow-lg transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
          <div className="text-center">
            <MessageCircle className="w-6 h-6 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <div className="font-semibold">Messages</div>
            <div className="text-xs text-muted-foreground">{userProfile.matches} active</div>
          </div>
        </Button>
        
        <Button variant="outline" onClick={() => setCurrentView('matches')} className="h-16 bg-gradient-to-br from-card to-muted/50 hover:from-secondary/5 hover:to-secondary/10 border-2 border-secondary/20 hover:border-secondary hover:shadow-lg transition-all group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-5 transition-opacity" />
          <div className="text-center">
            <Heart className="w-6 h-6 mx-auto mb-1 group-hover:scale-110 transition-transform" />
            <div className="font-semibold">Matches</div>
            <div className="text-xs text-muted-foreground">{userProfile.likes} new likes</div>
          </div>
        </Button>
      </div>
    </div>;
  const renderPremiumStatus = () => {
    if (userProfile.subscriptionTier === 'free') {
      return <Card className="mb-6 bg-gradient-card border-0 shadow-elegant relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-primary/5" />
          <CardContent className="p-6 relative">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full bg-gradient-primary p-0.5">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=400&h=400&fit=crop&crop=face" 
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
                  <h3 className="font-semibold text-lg text-foreground">Emma, 21</h3>
                  <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
                    CS Junior
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  "Love hiking and coding! Looking for someone to explore the city with 🌟"
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>📍 0.5 miles away</span>
                  <span>•</span>
                  <span>💎 Premium</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-2">
                <Button size="sm" className="bg-gradient-primary hover:shadow-royal transition-luxury">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="outline" className="border-2 hover-luxury">
                  <MessageCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>;
    }
    return <Card className="mb-6 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/20 shadow-medium">
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
      </Card>;
  };
  const renderDashboard = () => <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center shadow-lg">
                <User className="w-6 h-6 text-white" />
              </div>
              {userProfile.subscriptionTier === 'premium' && <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                  <Star className="w-2.5 h-2.5 text-white" />
                </div>}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  CampusConnect
                </h1>
                {userProfile.subscriptionTier === 'premium' && <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">
                    Premium
                  </Badge>}
              </div>
              <div className="text-sm text-muted-foreground">
                Hey {userProfile.firstName}! ✨ {userProfile.lastActive}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userProfile.isVerified ? <Badge className="bg-success/10 text-success border-success/20 text-xs">
                <Star className="w-3 h-3 mr-1" />
                Verified
              </Badge> : <Badge variant="outline" className="text-xs border-amber-500/20 text-amber-600">
                Verify Account
              </Badge>}
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('chat')} className="hover:bg-primary/5">
              <MessageCircle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" className="hover:bg-primary/5">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-md">
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
            <Button onClick={() => setCurrentView('swipe')} className="h-20 bg-gradient-primary hover:scale-105 hover:shadow-xl transition-all group relative overflow-hidden" disabled={userProfile.swipesLeft === 0}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-center gap-4">
                <Sparkles className="w-8 h-8 group-hover:rotate-12 transition-transform" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">Swipe & Match</div>
                  <div className="text-sm text-white/90">Classic dating experience</div>
                </div>
              </div>
            </Button>
            
            <Button onClick={() => setCurrentView('matches')} className="h-20 bg-gradient-secondary hover:scale-105 hover:shadow-xl transition-all group relative overflow-hidden">
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-center gap-4">
                <Heart className="w-8 h-8 group-hover:scale-110 transition-transform" />
                <div className="text-center">
                  <div className="text-lg font-bold text-white">Smart Pairing</div>
                  <div className="text-sm text-white/90">AI-powered connections</div>
                </div>
              </div>
            </Button>
            
            <Button onClick={() => setCurrentView('blind-date')} className="h-20 bg-gradient-to-r from-accent to-secondary hover:scale-105 hover:shadow-xl transition-all group relative overflow-hidden">
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
        {renderQuickActions()}

        {/* Subscription Pricing */}
        <Card className="shadow-medium border-0 bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Premium Plans</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                Limited Time
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-100/50 to-slate-200/50 border border-slate-300/20 hover:from-slate-200/50 hover:to-slate-300/50 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Star className="w-4 h-4 text-slate-600" />
                    <p className="font-semibold text-slate-600">⭐ Silver Plan</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Unlock & see all 10 profiles • Unlimited swipes • 2 Blind Date requests</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-600">₹49</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-yellow-100/50 to-yellow-200/50 border border-yellow-300/20 hover:from-yellow-200/50 hover:to-yellow-300/50 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles className="w-4 h-4 text-yellow-600" />
                    <p className="font-semibold text-yellow-600">💛 Gold Plan</p>
                    <Badge className="bg-success/10 text-success border-success/20 text-xs">Most Popular</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Everything in Silver + 2 extra pairings/day + 4 Blind Date requests</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-yellow-600">₹89</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-purple-100/50 to-purple-200/50 border border-purple-300/20 hover:from-purple-200/50 hover:to-purple-300/50 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-purple-600" />
                    <p className="font-semibold text-purple-600">🔥 Platinum Plan</p>
                    <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">Premium</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">Everything in Gold + 10 extra pairings/day + Unlimited Blind Dates</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-purple-600">₹129</div>
                  <div className="text-xs text-muted-foreground">/month</div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 p-3 rounded-lg bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/10">
              <p className="text-sm text-center text-muted-foreground">
                ✨ All plans include: Unlimited swipes, Super likes, See who liked you, Advanced filters, Priority support
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;

  // Route to different views
  switch (currentView) {
    case 'swipe':
      return <PremiumSwipeCards onNavigate={handleNavigate} />;
    case 'matches':
      return <MatchesList onNavigate={handleNavigate} />;
    case 'chat':
      return <ChatSystem onNavigate={handleNavigate} />;
    case 'profile':
      return <ProfileManagement onNavigate={handleNavigate} />;
    case 'blind-date':
      // TODO: Create BlindDate component
      return <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
          <Card className="text-center p-8 shadow-medium border-0">
            <CardContent>
              <div className="w-16 h-16 bg-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Blind Date Experience</h2>
              <p className="text-muted-foreground mb-6">
                Connect with someone special without seeing their profile first. Coming soon! 🎭
              </p>
              <Button onClick={() => setCurrentView('home')} className="bg-gradient-primary">
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>;
    default:
      return renderDashboard();
  }
};
export default DatingApp;