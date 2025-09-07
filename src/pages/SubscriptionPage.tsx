import SubscriptionSelectionPage from '@/components/subscription/SubscriptionSelectionPage';

interface SubscriptionPageProps {
  onComplete: (tier: string) => void;
}

const SubscriptionPage = ({ onComplete }: SubscriptionPageProps) => {
  return <SubscriptionSelectionPage onComplete={onComplete} />;
};

export default SubscriptionPage;