import { useState } from 'react';
import InstagramUI from '@/components/InstagramUI';
import SwipePage from '@/pages/SwipePage';
import PairingPage from '@/pages/PairingPage';
import MatchesPage from '@/pages/MatchesPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import BlindDatePage from '@/pages/BlindDatePage';

type View = 'instagram' | 'swipe' | 'pairing' | 'matches' | 'chat' | 'profile' | 'blind-date';

const DatingAppContainer = () => {
  const [currentView, setCurrentView] = useState<View>('instagram');

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'instagram':
        return <InstagramUI onNavigate={handleNavigate} />;
      case 'swipe':
        return <SwipePage onNavigate={handleNavigate} />;
      case 'pairing':
        return <PairingPage onNavigate={handleNavigate} />;
      case 'matches':
        return <MatchesPage onNavigate={handleNavigate} />;
      case 'chat':
        return <ChatPage onNavigate={handleNavigate} />;
      case 'profile':
        return <ProfilePage onNavigate={handleNavigate} />;
      case 'blind-date':
        return <BlindDatePage onNavigate={handleNavigate} />;
      default:
        return <InstagramUI onNavigate={handleNavigate} />;
    }
  };

  // Return just the content without AppLayout wrapper for Instagram-style UI
  return renderContent();
};

export default DatingAppContainer;