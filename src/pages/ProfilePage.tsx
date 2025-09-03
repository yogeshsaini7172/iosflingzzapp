import ProfileManagement from '@/components/profile/ProfileManagement';

interface ProfilePageProps {
  onNavigate: (view: string) => void;
}

const ProfilePage = ({ onNavigate }: ProfilePageProps) => {
  return <ProfileManagement onNavigate={onNavigate} />;
};

export default ProfilePage;