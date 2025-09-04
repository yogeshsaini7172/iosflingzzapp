import EnhancedChatSystem from '@/components/chat/EnhancedChatSystem';

interface ChatPageProps {
  onNavigate: (view: string) => void;
}

const ChatPage = ({ onNavigate }: ChatPageProps) => {
  return <EnhancedChatSystem onNavigate={onNavigate} />;
};

export default ChatPage;