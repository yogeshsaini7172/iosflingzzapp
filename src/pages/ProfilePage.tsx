import EnhancedProfileManagement from '@/components/profile/EnhancedProfileManagement';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  return (
    <UnifiedLayout title="Profile">
      <EnhancedProfileManagement onNavigate={onNavigate} />
    </UnifiedLayout>
  );
};

export default ProfilePage;