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
  const renderStats = () => <div className="grid grid-cols-3 gap-3 mb-6">
      <Card className="relative overflow-hidden border-0 shadow-card bg-gradient-to-br from-primary/10 to-primary/5 hover:shadow-medium transition-all group">
        <CardContent className="p-4 text-center">
          <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
          <Sparkles className="w-5 h-5 text-primary mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-2xl font-bold text-primary">{userProfile.swipesLeft}</div>
          <div className="text-xs text-muted-foreground">Swipes Left</div>
          <div className="text-xs opacity-70">of {userProfile.maxSwipes} daily</div>
        </CardContent>
      </Card>
      
      <Card className="relative overflow-hidden border-0 shadow-card bg-gradient-to-br from-secondary/10 to-secondary/5 hover:shadow-medium transition-all group">
        <CardContent className="p-4 text-center">
          <div className="absolute inset-0 bg-gradient-secondary opacity-0 group-hover:opacity-5 transition-opacity" />
          <Heart className="w-5 h-5 text-secondary mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-2xl font-bold text-secondary">{userProfile.matches}</div>
          <div className="text-xs text-muted-foreground">Matches</div>
          <div className="text-xs opacity-70">active chats</div>
        </CardContent>
      </Card>
      
      <Card className="relative overflow-hidden border-0 shadow-card bg-gradient-to-br from-accent/10 to-accent/5 hover:shadow-medium transition-all group">
        <CardContent className="p-4 text-center">
          <div className="absolute inset-0 bg-gradient-to-r from-accent to-secondary opacity-0 group-hover:opacity-5 transition-opacity" />
          <TrendingUp className="w-5 h-5 text-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
          <div className="text-2xl font-bold text-accent">{userProfile.profileViews}</div>
          <div className="text-xs text-muted-foreground">Profile Views</div>
          <div className="text-xs opacity-70">this week</div>
        </CardContent>
      </Card>
    </div>;
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
      return <Card className="mb-6 bg-gradient-secondary border-0 text-white shadow-medium relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5" />
          <CardContent className="p-4 relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-5 h-5 text-amber-300" />
                  <span className="font-semibold">Unlock Premium Magic</span>
                </div>
                <div className="text-sm opacity-90">
                  Unlimited swipes • Super Likes • See who liked you
                </div>
              </div>
              <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0 font-semibold">
                <Zap className="w-4 h-4 mr-1" />
                Upgrade
              </Button>
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
                <Heart className="w-6 h-6 text-white" />
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
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('profile')} className="hover:bg-primary/5">
              <User className="w-4 h-4" />
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

        {renderStats()}
        {renderPremiumStatus()}
        {renderQuickActions()}

        {/* Recent Activity */}
        <Card className="shadow-medium border-0 bg-gradient-to-br from-card to-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
                {userProfile.profileViews} views this week
              </Badge>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-success/5 to-success/10 border border-success/20 hover:from-success/10 hover:to-success/15 transition-all">
                <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-success" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Emma liked your profile</p>
                  <p className="text-xs text-muted-foreground">Psychology major • 2h ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 hover:from-primary/10 hover:to-primary/15 transition-all">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">New match with Alex!</p>
                  <p className="text-xs text-muted-foreground">Computer Science • 1d ago</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-xl bg-gradient-to-r from-secondary/5 to-secondary/10 border border-secondary/20 hover:from-secondary/10 hover:to-secondary/15 transition-all">
                <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-secondary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Sophia sent a message</p>
                  <p className="text-xs text-muted-foreground">"Let's grab coffee sometime!" • 2d ago</p>
                </div>
              </div>
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