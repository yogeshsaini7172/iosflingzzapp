import EnhancedSwipeInterface from '@/components/swipe/EnhancedSwipeInterface';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

interface SwipePageProps {
  onNavigate: (view: string) => void;
}

const SwipePage = ({ onNavigate }: SwipePageProps) => {
  return (
    <UnifiedLayout title="Swipe" showHeader={false}>
      <EnhancedSwipeInterface onNavigate={onNavigate} />
    </UnifiedLayout>
  );
};

export default SwipePage;