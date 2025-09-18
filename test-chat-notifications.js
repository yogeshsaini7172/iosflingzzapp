// Test script to verify chat notification count functionality
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cchvsqeqiavhanurnbeo.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key-here';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testChatNotifications() {
  console.log('🧪 Testing Chat Notification Count System...\n');

  // Test 1: Get unread count for a user
  console.log('1️⃣ Testing get_unread_count...');
  try {
    const { data, error } = await supabase.functions.invoke('chat-management', {
      body: { action: 'get_unread_count', user_id: 'test-user-1' }
    });
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success:', data);
      console.log(`📊 Unread count: ${data.data}\n`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }

  // Test 2: Get chat rooms for a user  
  console.log('2️⃣ Testing get_rooms...');
  try {
    const { data, error } = await supabase.functions.invoke('chat-management', {
      body: { action: 'get_rooms', user_id: 'test-user-1' }
    });
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success:', data);
      console.log(`🏠 Found ${data.data?.length || 0} chat rooms\n`);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }

  // Test 3: Check for unread messages in database directly
  console.log('3️⃣ Testing database direct query...');
  try {
    const { data, error } = await supabase
      .from('chat_messages_enhanced')
      .select('id, sender_id, read_at, created_at')
      .is('read_at', null)
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error);
    } else {
      console.log('✅ Success: Found unread messages:');
      console.log(data);
    }
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
  }
}

// Only run if called directly
if (require.main === module) {
  testChatNotifications().then(() => {
    console.log('\n🎉 Test completed!');
    process.exit(0);
  }).catch(err => {
    console.error('\n💥 Test failed:', err);
    process.exit(1);
  });
}

module.exports = { testChatNotifications };