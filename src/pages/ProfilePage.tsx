import EnhancedProfileManagement from '@/components/profile/EnhancedProfileManagement';
import BottomNav from '@/components/navigation/BottomNav';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  return (
    <div className="min-h-screen pb-20">
      <EnhancedProfileManagement onNavigate={onNavigate} />
      {/* Consistent bottom navigation */}
      <BottomNav />
    </div>
  );
};

export default ProfilePage;