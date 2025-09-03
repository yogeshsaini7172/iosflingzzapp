import MatchesList from '@/components/dating/MatchesList';

interface MatchesPageProps {
  onNavigate: (view: string) => void;
}

const MatchesPage = ({ onNavigate }: MatchesPageProps) => {
  return <MatchesList onNavigate={onNavigate} />;
};

export default MatchesPage;