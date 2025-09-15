// Create test data to verify message loading works
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cchvsqeqiavhanurnbeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjaHZzcWVxaWF2aGFudXJuYmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1MjI4OTMsImV4cCI6MjA3MjA5ODg5M30.6EII7grfX9gCUx6haU2wIfoiMDPrFTQn2XMDi6cY5-U';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestData() {
  console.log('🧪 Creating test data for message loading...');
  
  try {
    // Test Firebase UID format (text, not UUID)
    const testUser1 = 'firebase_user_123abc';
    const testUser2 = 'firebase_user_456def';
    
    console.log('\n1️⃣ Creating test profiles...');
    
    // Create test profiles
    const { data: profile1, error: profile1Error } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: testUser1,
        first_name: 'Alice',
        last_name: 'Smith',
        university: 'Test University'
      })
      .select()
      .single();
    
    if (profile1Error && !profile1Error.message.includes('duplicate')) {
      console.log('❌ Profile 1 creation failed:', profile1Error.message);
    } else {
      console.log('✅ Profile 1 created/exists');
    }
    
    const { data: profile2, error: profile2Error } = await supabase
      .from('profiles')
      .insert({
        firebase_uid: testUser2,
        first_name: 'Bob',
        last_name: 'Johnson',
        university: 'Test University'
      })
      .select()
      .single();
    
    if (profile2Error && !profile2Error.message.includes('duplicate')) {
      console.log('❌ Profile 2 creation failed:', profile2Error.message);
    } else {
      console.log('✅ Profile 2 created/exists');
    }
    
    console.log('\n2️⃣ Creating test enhanced match...');
    
    // Create enhanced match
    const { data: match, error: matchError } = await supabase
      .from('enhanced_matches')
      .insert({
        user1_id: testUser1,
        user2_id: testUser2,
        status: 'matched',
        user1_swiped: true,
        user2_swiped: true
      })
      .select()
      .single();
    
    if (matchError && !matchError.message.includes('duplicate')) {
      console.log('❌ Match creation failed:', matchError.message);
      return;
    } else {
      console.log('✅ Match created/exists');
    }
    
    console.log('\n3️⃣ Creating test chat room...');
    
    // Create chat room
    const { data: room, error: roomError } = await supabase
      .from('chat_rooms')
      .insert({
        match_id: match?.id || 'test-match-id',
        user1_id: testUser1,
        user2_id: testUser2
      })
      .select()
      .single();
    
    if (roomError && !roomError.message.includes('duplicate')) {
      console.log('❌ Chat room creation failed:', roomError.message);
      return;
    } else {
      console.log('✅ Chat room created/exists');
    }
    
    console.log('\n4️⃣ Creating test messages...');
    
    const chatRoomId = room?.id || 'test-room-id';
    
    // Create test messages
    const testMessages = [
      { sender_id: testUser1, message_text: 'Hey there! How are you?' },
      { sender_id: testUser2, message_text: 'Hi! I\'m doing great, thanks for asking!' },
      { sender_id: testUser1, message_text: 'That\'s awesome! What are you studying?' },
      { sender_id: testUser2, message_text: 'Computer Science! What about you?' },
      { sender_id: testUser1, message_text: 'Same here! We should study together sometime.' }
    ];
    
    for (let i = 0; i < testMessages.length; i++) {
      const msg = testMessages[i];
      const { error: msgError } = await supabase
        .from('chat_messages_enhanced')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: msg.sender_id,
          message_text: msg.message_text,
          created_at: new Date(Date.now() + i * 60000).toISOString() // 1 minute apart
        });
      
      if (msgError && !msgError.message.includes('duplicate')) {
        console.log(`❌ Message ${i + 1} creation failed:`, msgError.message);
      } else {
        console.log(`✅ Message ${i + 1} created`);
      }
    }
    
    console.log('\n🎉 Test data creation complete!');
    console.log(`📋 Test users: ${testUser1}, ${testUser2}`);
    console.log(`🏠 Chat room ID: ${chatRoomId}`);
    
  } catch (error) {
    console.error('❌ Test data creation failed:', error);
  }
}

createTestData();