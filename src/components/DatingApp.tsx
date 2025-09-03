import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  MessageCircle, 
  User, 
  Zap, 
  Settings,
  Eye,
  Star
} from 'lucide-react';
import ModernSwipeCards from '@/components/dating/ModernSwipeCards';
import MatchesList from '@/components/dating/MatchesList';
import { useAuth } from '@/contexts/AuthContext';

type View = 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches';

const DatingApp = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const { user } = useAuth();

  // Mock user data - in real app, this would come from profile API
  const userProfile = {
    firstName: 'Sarah',
    swipesLeft: 8,
    maxSwipes: 10,
    matches: 3,
    likes: 12,
    isVerified: false,
    subscriptionTier: 'free' as const
  };

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };

  const renderStats = () => (
    <div className="grid grid-cols-3 gap-4 mb-6">
      <Card className="text-center p-4 bg-gradient-card border-0 shadow-card">
        <CardContent className="p-0">
          <div className="text-2xl font-bold text-primary">{userProfile.swipesLeft}</div>
          <div className="text-sm text-muted-foreground">Swipes Left</div>
          <div className="text-xs opacity-70">of {userProfile.maxSwipes} daily</div>
        </CardContent>
      </Card>
      
      <Card className="text-center p-4 bg-gradient-card border-0 shadow-card">
        <CardContent className="p-0">
          <div className="text-2xl font-bold text-secondary">{userProfile.matches}</div>
          <div className="text-sm text-muted-foreground">Matches</div>
          <div className="text-xs opacity-70">new conversations</div>
        </CardContent>
      </Card>
      
      <Card className="text-center p-4 bg-gradient-card border-0 shadow-card">
        <CardContent className="p-0">
          <div className="text-2xl font-bold text-accent">{userProfile.likes}</div>
          <div className="text-sm text-muted-foreground">Likes</div>
          <div className="text-xs opacity-70">people liked you</div>
        </CardContent>
      </Card>
    </div>
  );

  const renderQuickActions = () => (
    <div className="space-y-3 mb-6">
      <Button 
        onClick={() => setCurrentView('swipe')}
        className="w-full h-16 bg-gradient-primary hover:opacity-90 transition-all shadow-soft text-lg font-semibold"
        disabled={userProfile.swipesLeft === 0}
      >
        <Heart className="w-6 h-6 mr-3" />
        {userProfile.swipesLeft === 0 ? 'No Swipes Left Today' : 'Start Swiping'}
      </Button>
      
      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('matches')}
          className="h-14 bg-card/50 hover:bg-card border-2 border-primary/20 hover:border-primary transition-all"
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="font-semibold">Matches</div>
            <div className="text-xs text-muted-foreground">{userProfile.matches} active</div>
          </div>
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setCurrentView('blind-date')}
          className="h-14 bg-card/50 hover:bg-card border-2 border-secondary/20 hover:border-secondary transition-all"
        >
          <Eye className="w-5 h-5 mr-2" />
          <div className="text-left">
            <div className="font-semibold">Blind Date</div>
            <div className="text-xs text-muted-foreground">Try something new</div>
          </div>
        </Button>
      </div>
    </div>
  );

  const renderSubscriptionPromo = () => {
    if (userProfile.subscriptionTier !== 'free') return null;

    return (
      <Card className="mb-6 bg-gradient-secondary border-0 text-white shadow-medium">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-5 h-5" />
                <span className="font-semibold">Upgrade to Premium</span>
              </div>
              <div className="text-sm opacity-90">
                Unlimited swipes, advanced filters & more
              </div>
            </div>
            <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
              <Zap className="w-4 h-4 mr-1" />
              Upgrade
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderDashboard = () => (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-lg border-b border-border shadow-soft">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">CampusConnect</h1>
              <div className="text-sm text-muted-foreground">
                Hey {userProfile.firstName}! 👋
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {!userProfile.isVerified && (
              <Badge variant="outline" className="text-xs">
                Verify Account
              </Badge>
            )}
            <Button variant="ghost" size="sm" onClick={() => setCurrentView('profile')}>
              <User className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Welcome Message */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Ready to connect?</h2>
          <p className="text-muted-foreground">
            Discover amazing people on your campus
          </p>
        </div>

        {renderStats()}
        {renderSubscriptionPromo()}
        {renderQuickActions()}

        {/* Recent Activity */}
        <Card className="shadow-card border-0">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Recent Activity</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-success rounded-full"></div>
                <span>Emma liked your profile</span>
                <span className="text-muted-foreground ml-auto">2h ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span>You matched with Alex</span>
                <span className="text-muted-foreground ml-auto">1d ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 bg-secondary rounded-full"></div>
                <span>Sophia sent you a message</span>
                <span className="text-muted-foreground ml-auto">2d ago</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Route to different views
  switch (currentView) {
    case 'swipe':
      return <ModernSwipeCards onNavigate={handleNavigate} />;
    case 'matches':
      return <MatchesList onNavigate={handleNavigate} />;
    case 'profile':
      // TODO: Create ProfileManagement component
      return (
        <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
          <Card className="text-center p-8">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">Profile Management</h2>
              <p className="text-muted-foreground mb-6">
                Profile creation and editing will be implemented here
              </p>
              <Button onClick={() => setCurrentView('home')}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    case 'blind-date':
      // TODO: Create BlindDate component
      return (
        <div className="min-h-screen bg-gradient-soft flex items-center justify-center p-4">
          <Card className="text-center p-8">
            <CardContent>
              <h2 className="text-2xl font-bold mb-4">Blind Date</h2>
              <p className="text-muted-foreground mb-6">
                Blind date matching will be implemented here
              </p>
              <Button onClick={() => setCurrentView('home')}>
                Back to Home
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    default:
      return renderDashboard();
  }
};

export default DatingApp;