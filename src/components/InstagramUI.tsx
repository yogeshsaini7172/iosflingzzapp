import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Play, 
  Heart,
  MessageCircle,
  Send,
  Bookmark,
  MoreHorizontal,
  Settings,
  User,
  Sparkles,
  Zap,
  Coffee
} from 'lucide-react';
import { useProfileData } from '@/hooks/useProfileData';
// Import QCS fix - this will auto-run to sync scores
import '@/services/fix-qcs';

interface InstagramUIProps {
  onNavigate: (view: string) => void;
}

const InstagramUI = ({ onNavigate }: InstagramUIProps) => {
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'create' | 'reels' | 'profile'>('home');
  const { profile } = useProfileData();

  const stories = [
    { id: 1, name: 'Your story', image: profile?.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150', hasStory: false, isOwn: true },
    { id: 2, name: 'alice_j', image: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150', hasStory: true },
    { id: 3, name: 'bob_m', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', hasStory: true },
    { id: 4, name: 'emma_s', image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', hasStory: true },
    { id: 5, name: 'david_k', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150', hasStory: true }
  ];

  const posts = [
    {
      id: 1,
      username: 'alice_j',
      userImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b47c?w=150',
      location: 'Stanford University',
      image: 'https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=500',
      likes: 247,
      caption: 'Beautiful sunset from my dorm room 🌅 #StanfordLife #sunset #gratitude',
      timeAgo: '2h'
    },
    {
      id: 2,
      username: 'bob_m',
      userImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      location: 'MIT Campus',
      image: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=500',
      likes: 189,
      caption: 'Late night coding session ☕️💻 #MIT #coding #hustle',
      timeAgo: '4h'
    }
  ];

  const renderStories = () => (
    <div className="flex space-x-4 p-4 overflow-x-auto bg-card border-b">
      {stories.map((story) => (
        <div key={story.id} className="flex flex-col items-center space-y-1 flex-shrink-0">
          <div className={`relative ${story.hasStory ? 'p-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full' : ''}`}>
            <div className="w-16 h-16 rounded-full overflow-hidden bg-card border-2 border-background">
              <img src={story.image} alt={story.name} className="w-full h-full object-cover" />
            </div>
            {story.isOwn && !story.hasStory && (
              <div className="absolute -bottom-0 -right-0 w-5 h-5 bg-primary text-white rounded-full flex items-center justify-center border-2 border-background">
                <PlusSquare className="w-3 h-3" />
              </div>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate w-16 text-center">
            {story.isOwn ? 'Your story' : story.name}
          </span>
        </div>
      ))}
    </div>
  );

  const renderPost = (post: any) => (
    <Card key={post.id} className="border-0 rounded-none bg-card shadow-none">
      {/* Post Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full overflow-hidden">
            <img src={post.userImage} alt={post.username} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-semibold text-sm">{post.username}</p>
            <p className="text-xs text-muted-foreground">{post.location}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <MoreHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* Post Image */}
      <div className="relative">
        <img src={post.image} alt="Post" className="w-full aspect-square object-cover" />
        
        {/* Dating App Overlay - This is the key differentiator */}
        <div className="absolute top-3 right-3 flex space-x-2">
          <Badge className="bg-gradient-primary text-white border-0 shadow-lg">
            <Sparkles className="w-3 h-3 mr-1" />
            Dating Mode
          </Badge>
        </div>
        
        {/* Quick Action Buttons - Dating specific */}
        <div className="absolute bottom-3 left-3 right-3 flex justify-between">
          <Button 
            size="sm" 
            className="bg-red-500 hover:bg-red-600 text-white rounded-full"
            onClick={() => onNavigate('swipe')}
          >
            <Heart className="w-4 h-4 mr-1" />
            Swipe
          </Button>
          <Button 
            size="sm" 
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-full"
            onClick={() => onNavigate('pairing')}
          >
            <Zap className="w-4 h-4 mr-1" />
            Smart Pair
          </Button>
          <Button 
            size="sm" 
            className="bg-purple-500 hover:bg-purple-600 text-white rounded-full"
            onClick={() => onNavigate('blind-date')}
          >
            <Coffee className="w-4 h-4 mr-1" />
            Blind Date
          </Button>
        </div>
      </div>

      {/* Post Actions */}
      <div className="p-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex space-x-4">
            <Button variant="ghost" size="sm" className="h-8 px-0">
              <Heart className="w-6 h-6" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 px-0"
              onClick={() => onNavigate('chat')}
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-0">
              <Send className="w-6 h-6" />
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="h-8 px-0">
            <Bookmark className="w-6 h-6" />
          </Button>
        </div>

        <p className="font-semibold text-sm mb-1">{post.likes} likes</p>
        <p className="text-sm">
          <span className="font-semibold">{post.username}</span> {post.caption}
        </p>
        <p className="text-xs text-muted-foreground mt-1">{post.timeAgo}</p>
      </div>
    </Card>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="flex-1 overflow-y-auto">
            {renderStories()}
            <div className="divide-y">
              {posts.map(renderPost)}
            </div>
          </div>
        );
      case 'search':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Search className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Discover People</h3>
              <p className="text-muted-foreground mb-4">Find your perfect match</p>
              <Button onClick={() => onNavigate('swipe')} className="bg-gradient-primary">
                Start Swiping
              </Button>
            </div>
          </div>
        );
      case 'create':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <PlusSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Create Post</h3>
              <p className="text-muted-foreground mb-4">Share your best moments</p>
              <Button className="bg-gradient-primary">
                Choose Photo
              </Button>
            </div>
          </div>
        );
      case 'reels':
        return (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Dating Reels</h3>
              <p className="text-muted-foreground mb-4">Coming soon...</p>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="flex-1 overflow-y-auto p-4">
            <div className="text-center mb-6">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-2 border-primary">
                <img 
                  src={profile?.profile_images?.[0] || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200'} 
                  alt="Profile" 
                  className="w-full h-full object-cover" 
                />
              </div>
              <h2 className="text-xl font-bold">{profile?.first_name} {profile?.last_name}</h2>
              <p className="text-muted-foreground">{profile?.bio}</p>
              
              <div className="flex justify-center space-x-8 mt-4">
                <div className="text-center">
                  <p className="font-semibold">12</p>
                  <p className="text-sm text-muted-foreground">Posts</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">247</p>
                  <p className="text-sm text-muted-foreground">Matches</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold">189</p>
                  <p className="text-sm text-muted-foreground">Likes</p>
                </div>
              </div>
              
              <div className="flex space-x-3 mt-6">
                <Button 
                  onClick={() => onNavigate('profile')} 
                  className="flex-1 bg-gradient-primary"
                >
                  Edit Profile
                </Button>
                <Button variant="outline" size="icon">
                  <Settings className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Button 
                variant="outline" 
                className="h-16 flex-col space-y-2"
                onClick={() => onNavigate('matches')}
              >
                <Heart className="w-6 h-6 text-red-500" />
                <span className="text-sm">My Matches</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-16 flex-col space-y-2"
                onClick={() => onNavigate('pairing')}
              >
                <Zap className="w-6 h-6 text-purple-500" />
                <span className="text-sm">Smart Pairing</span>
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            CampusConnect
          </h1>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={() => onNavigate('chat')}>
              <MessageCircle className="w-6 h-6" />
            </Button>
            <Button variant="ghost" size="icon">
              <Heart className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {renderContent()}

      {/* Bottom Navigation */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t">
        <div className="flex items-center justify-around py-2">
          {[
            { id: 'home', icon: Home, label: 'Home' },
            { id: 'search', icon: Search, label: 'Search' },
            { id: 'create', icon: PlusSquare, label: 'Create' },
            { id: 'reels', icon: Play, label: 'Reels' },
            { id: 'profile', icon: User, label: 'Profile' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              className={`flex-col space-y-1 h-auto py-2 ${
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground'
              }`}
              onClick={() => setActiveTab(tab.id as any)}
            >
              <tab.icon className="w-6 h-6" />
              <span className="text-xs">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InstagramUI;