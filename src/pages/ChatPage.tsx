import RebuiltChatSystem from '@/components/chat/RebuiltChatSystem';

interface ChatPageProps {
  onNavigate: (view: string) => void;
}

const ChatPage = ({ onNavigate }: ChatPageProps) => {
  return <RebuiltChatSystem onNavigate={onNavigate} />;
};

export default ChatPage;