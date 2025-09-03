import ChatSystem from '@/components/chat/ChatSystem';

interface ChatPageProps {
  onNavigate: (view: string) => void;
}

const ChatPage = ({ onNavigate }: ChatPageProps) => {
  return <ChatSystem onNavigate={onNavigate} />;
};

export default ChatPage;