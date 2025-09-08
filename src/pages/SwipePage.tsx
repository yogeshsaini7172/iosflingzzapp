import EnhancedSwipeInterface from '@/components/swipe/EnhancedSwipeInterface';
import UnifiedLayout from '@/components/layout/UnifiedLayout';
import LikeNotificationHandler from '@/components/swipe/LikeNotificationHandler';

interface SwipePageProps {
  onNavigate: (view: string) => void;
}

const SwipePage = ({ onNavigate }: SwipePageProps) => {
  return (
    <UnifiedLayout title="Swipe" showHeader={false}>
      <LikeNotificationHandler />
      <EnhancedSwipeInterface onNavigate={onNavigate} />
    </UnifiedLayout>
  );
};

export default SwipePage;