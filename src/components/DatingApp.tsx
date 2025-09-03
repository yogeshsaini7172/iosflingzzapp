import { useState } from 'react';
import Dashboard from '@/pages/Dashboard';
import SwipePage from '@/pages/SwipePage';
import MatchesPage from '@/pages/MatchesPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import BlindDatePage from '@/pages/BlindDatePage';
type View = 'home' | 'profile' | 'swipe' | 'blind-date' | 'matches' | 'chat';

const DatingApp = () => {
  console.log('DatingApp component rendered');
  const [currentView, setCurrentView] = useState<View>('home');

  const handleNavigate = (view: View) => {
    setCurrentView(view);
  };
  // Route to different views
  switch (currentView) {
    case 'swipe':
      return <SwipePage onNavigate={handleNavigate} />;
    case 'matches':
      return <MatchesPage onNavigate={handleNavigate} />;
    case 'chat':
      return <ChatPage onNavigate={handleNavigate} />;
    case 'profile':
      return <ProfilePage onNavigate={handleNavigate} />;
    case 'blind-date':
      return <BlindDatePage onNavigate={handleNavigate} />;
    default:
      return <Dashboard onNavigate={handleNavigate} />;
  }
};
export default DatingApp;