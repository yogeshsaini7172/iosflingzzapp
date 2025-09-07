import { useNavigate } from 'react-router-dom';
import CampusConnectHome from '@/components/campus/CampusConnectHome';

interface HomePageProps {
  onNavigate?: (view: string) => void;
}

const HomePage = ({ onNavigate }: HomePageProps) => {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    // Handle navigation to different sections
    switch (view) {
      case 'discover':
        navigate('/swipe');
        break;
      case 'blind-date':
        navigate('/blind-date');
        break;
      case 'pairing':
        navigate('/pairing');
        break;
      case 'matches':
        navigate('/matches');
        break;
      case 'chat':
        navigate('/chat');
        break;
      case 'profile':
        navigate('/profile');
        break;
      case 'subscription':
        // Handle subscription navigation if needed
        console.log('Navigate to subscription');
        break;
      default:
        if (onNavigate) {
          onNavigate(view);
        }
    }
  };

  return <CampusConnectHome onNavigate={handleNavigate} />;
};

export default HomePage;