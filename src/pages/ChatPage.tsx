import EnhancedChatSystem from '@/components/chat/EnhancedChatSystem';
import UnifiedLayout from '@/components/layout/UnifiedLayout';

interface ChatPageProps {
  onNavigate: (view: string) => void;
}

const ChatPage = ({ onNavigate }: ChatPageProps) => {
  return (
    <UnifiedLayout title="Chat">
      <EnhancedChatSystem onNavigate={onNavigate} />
    </UnifiedLayout>
  );
};

export default ChatPage;