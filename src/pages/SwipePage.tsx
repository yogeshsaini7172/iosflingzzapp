import EnhancedSwipeInterface from '@/components/swipe/EnhancedSwipeInterface';

interface SwipePageProps {
  onNavigate: (view: string) => void;
}

const SwipePage = ({ onNavigate }: SwipePageProps) => {
  return <EnhancedSwipeInterface onNavigate={onNavigate} />;
};

export default SwipePage;