import SwipeUpInterface from '@/components/swipe/SwipeUpInterface';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

interface SwipePageProps {
  onNavigate: (view: string) => void;
}

const SwipePage = ({ onNavigate }: SwipePageProps) => {
  return (
    <UnifiedLayout title="Swipe" showHeader={false}>
      <SwipeUpInterface onNavigate={onNavigate} />
    </UnifiedLayout>
  );
};

export default SwipePage;
