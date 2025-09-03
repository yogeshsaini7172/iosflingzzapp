import PremiumSwipeCards from '@/components/dating/PremiumSwipeCards';

interface SwipePageProps {
  onNavigate: (view: string) => void;
}

const SwipePage = ({ onNavigate }: SwipePageProps) => {
  return <PremiumSwipeCards onNavigate={onNavigate} />;
};

export default SwipePage;