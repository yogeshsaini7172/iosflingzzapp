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
- [x] Extend chat-management edge function with 'mark_seen' action (updated to use read_at timestamp)
- [x] Extend chat-management edge function with 'get_unread_count' action (updated to use correct table and columns)
- [x] Update ChatConversation to mark messages as seen when viewed (with badge refresh trigger)
- [x] Update ChatNotificationBadge to fetch actual unread counts (with real-time listeners)
- [x] Fix database column naming inconsistencies (user1_id/user2_id vs user_a_id/user_b_id)
- [x] Add real-time listeners for immediate count updates when messages arrive/are read
- [ ] Test the unread count updates after viewing messages
- [ ] Deploy updated edge function to production

## Implementation Details

### Database Schema
- Uses `chat_messages_enhanced` table with `read_at` timestamp column
- `read_at` is NULL for unread messages, timestamp when message is seen

### Edge Function Actions
- `mark_seen`: Sets `read_at` timestamp for unread messages in a chat room for a specific user
- `get_unread_count`: Counts messages with NULL `read_at` that user didn't send

### UI Updates
- ChatConversation automatically marks messages as seen when loaded
- ChatNotificationBadge uses real-time listeners for instant updates
- Badge count refreshes via ChatNotificationContext when messages are marked seen
