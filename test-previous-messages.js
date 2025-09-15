// Test script to check if previous messages can be loaded
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cchvsqeqiavhanurnbeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPreviousMessages() {
  console.log('🧪 Testing previous message loading...');
  
  try {
    // Test 1: Check if we can query chat_messages_enhanced table
    console.log('\n1️⃣ Testing direct Supabase query...');
    const { data: messages, error } = await supabase
      .from('chat_messages_enhanced')
      .select('*')
      .limit(5);
    
    if (error) {
      console.log('❌ Direct query failed:', error.message);
      console.log('💡 This suggests schema fix may not be applied yet');
    } else {
      console.log('✅ Direct query successful!');
      console.log(`📊 Found ${messages?.length || 0} messages in database`);
    }
    
    // Test 2: Check chat_rooms table schema
    console.log('\n2️⃣ Testing chat_rooms table...');
    const { data: rooms, error: roomsError } = await supabase
      .from('chat_rooms')
      .select('*')
      .limit(3);
    
    if (roomsError) {
      console.log('❌ Chat rooms query failed:', roomsError.message);
    } else {
      console.log('✅ Chat rooms query successful!');
      console.log(`🏠 Found ${rooms?.length || 0} chat rooms`);
      if (rooms && rooms.length > 0) {
        console.log('📋 Sample room user IDs:', {
          user1_id: rooms[0].user1_id,
          user2_id: rooms[0].user2_id,
          user1_type: typeof rooms[0].user1_id,
          user2_type: typeof rooms[0].user2_id
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPreviousMessages();