import EnhancedProfileManagement from '@/components/profile/EnhancedProfileManagement';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  return <EnhancedProfileManagement onNavigate={onNavigate} />;
};

export default ProfilePage;