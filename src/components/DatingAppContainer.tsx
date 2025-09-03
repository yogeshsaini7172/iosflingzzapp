import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Dashboard from '@/pages/Dashboard';
import SwipePage from '@/pages/SwipePage';
import PairingPage from '@/pages/PairingPage';
import MatchesPage from '@/pages/MatchesPage';
import ChatPage from '@/pages/ChatPage';
import ProfilePage from '@/pages/ProfilePage';
import BlindDatePage from '@/pages/BlindDatePage';

type View = 'dashboard' | 'swipe' | 'pairing' | 'matches' | 'chat' | 'profile' | 'blind-date';

const DatingAppContainer = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const handleNavigate = (view: string) => {
    setCurrentView(view as View);
  };

  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} />;
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
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <AppLayout currentView={currentView} onViewChange={setCurrentView}>
      {renderContent()}
    </AppLayout>
  );
};

export default DatingAppContainer;