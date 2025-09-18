# Fix Chat Notification Badge Unread Count Update

## Problem
The chat notification badge (like button count) does not update after the chat message is seen. Currently, it uses a demo unread count that doesn't reflect actual message read status.

## Solution Overview
Implement proper message read/seen status tracking in the chat system:
1. Add read status to chat messages in the database
2. Mark messages as seen when viewed in ChatConversation
3. Update ChatNotificationBadge to fetch actual unread counts
4. Extend chat-management edge function with new actions

## Steps
- [ ] Extend chat-management edge function with 'mark_seen' action
- [ ] Extend chat-management edge function with 'get_unread_count' action
- [ ] Update ChatConversation to mark messages as seen when viewed
- [ ] Update ChatNotificationBadge to fetch actual unread counts
- [ ] Test the unread count updates after viewing messages
