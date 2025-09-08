import MatchesList from '@/components/dating/MatchesList';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

interface MatchesPageProps {
  onNavigate: (view: string) => void;
}

const MatchesPage = ({ onNavigate }: MatchesPageProps) => {
  return (
    <UnifiedLayout title="Matches">
      <MatchesList onNavigate={onNavigate} />
    </UnifiedLayout>
  );
};

export default MatchesPage;