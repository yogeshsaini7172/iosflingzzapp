import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChatNotificationContextType {
  refreshBadge: () => void;
  badgeKey: number; // Used to trigger re-renders
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined);

export const useChatNotification = () => {
  const context = useContext(ChatNotificationContext);
  if (!context) {
    throw new Error('useChatNotification must be used within a ChatNotificationProvider');
  }
  return context;
};

export const ChatNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [badgeKey, setBadgeKey] = useState(0);

  const refreshBadge = useCallback(() => {
    setBadgeKey(prev => prev + 1);
  }, []);

  return (
    <ChatNotificationContext.Provider value={{ refreshBadge, badgeKey }}>
      {children}
    </ChatNotificationContext.Provider>
  );
};
