import React from 'react';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { ArrowLeft, MoreVertical, Phone, Video, Wifi, WifiOff, AlertTriangle, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChatUser {
  id?: string;
  first_name?: string;
  last_name?: string;
  profile_images?: string[];
  university?: string;
}

interface ChatHeaderProps {
  chatId?: string;
  userName?: string;
  isOnline?: boolean;
  showBackButton?: boolean;
  user?: ChatUser;
  wsConnected?: boolean;
  onBack?: () => void;
  onReportUser?: () => void;
  onBlockUser?: () => void;
}

export default function ChatHeader({ 
  chatId, 
  userName = "Chat", 
  isOnline = false, 
  showBackButton = true,
  user,
  wsConnected = false,
  onBack,
  onReportUser,
  onBlockUser
}: ChatHeaderProps) {
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (onBack) {
      onBack();
    } else if (chatId) {
      navigate('/chat');
    } else {
      navigate(-1);
    }
  };

  const getConnectionStatusColor = () => {
    if (wsConnected) {
      return 'text-green-600';
    } else {
      return 'text-red-600';
    }
  };

  // Use user data if provided, otherwise fall back to userName prop
  const displayName = user ? `${user.first_name} ${user.last_name}` : userName;
  const userAvatar = user?.profile_images?.[0];
  const userInitials = user ? `${user.first_name?.[0]}${user.last_name?.[0]}` : userName.charAt(0).toUpperCase();

  return (
    <div className="flex flex-row items-center space-y-0 pb-4 bg-card/90 backdrop-blur-lg border-b border-border px-4 py-3">
      {showBackButton && (
        <Button variant="ghost" onClick={handleBackClick} className="mr-3">
          <ArrowLeft className="w-5 h-5" />
        </Button>
      )}
      
      <div className="relative mr-3">
        <Avatar className="w-10 h-10">
          <AvatarImage 
            src={userAvatar} 
            alt={user?.first_name}
          />
          <AvatarFallback className="bg-gradient-primary text-white">
            {userInitials}
          </AvatarFallback>
        </Avatar>
        {isOnline && (
          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
        )}
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold">
            {displayName}
          </h2>
          {isOnline && (
            <Badge variant="secondary" className="text-xs">
              Online
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {user?.university && (
            <p className="text-xs text-muted-foreground">
              {user.university}
            </p>
          )}
          {wsConnected ? (
            <Wifi className={`h-3 w-3 ${getConnectionStatusColor()}`} />
          ) : (
            <WifiOff className={`h-3 w-3 ${getConnectionStatusColor()}`} />
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {onReportUser && (
              <DropdownMenuItem onClick={onReportUser} className="text-orange-600">
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report User
              </DropdownMenuItem>
            )}
            {onReportUser && onBlockUser && <DropdownMenuSeparator />}
            {onBlockUser && (
              <DropdownMenuItem onClick={onBlockUser} className="text-red-600">
                <UserX className="mr-2 h-4 w-4" />
                Block User
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}