import { useNavigate } from 'react-router-dom';
import InstagramUI from '@/components/InstagramUI';

const DatingAppContainer = () => {
  const navigate = useNavigate();

  const handleNavigate = (view: string) => {
    navigate(`/${view === 'instagram' ? '' : view}`);
  };

  // Instagram-like responsive container with PWA optimizations
  return (
    <div className="genZ-app-container pwa-ready smooth-scroll safe-area-top safe-area-bottom">
      <div className="min-h-screen w-full relative overflow-x-hidden">
        {/* Mobile-first responsive content */}
        <div className="w-full h-full sm:max-w-md sm:mx-auto lg:max-w-none lg:mx-0">
          <InstagramUI onNavigate={handleNavigate} />
        </div>
      </div>
    </div>
  );
};

export default DatingAppContainer;