import { calculateQCS, updateProfileCompletion } from './qcs';

export async function fixAllQCS() {
  const userIds = [
    '11111111-1111-1111-1111-111111111001', // Alice
    '22222222-2222-2222-2222-222222222002', // Bob  
    '33333333-3333-3333-3333-333333333003', // Charlie
    '44444444-4444-4444-4444-444444444004', // Diana
    '55555555-5555-5555-5555-555555555005'  // Eva
  ];

  console.log('Fixing QCS scores for all users...');
  
  for (const userId of userIds) {
    try {
      console.log(`Processing ${userId}...`);
      
      // Update profile completion first
      await updateProfileCompletion(userId);
      
      // Calculate and sync QCS
      const qcsScore = await calculateQCS(userId);
      
      console.log(`✅ QCS updated for ${userId}: ${qcsScore} points`);
    } catch (error) {
      console.error(`❌ Error processing ${userId}:`, error);
    }
  }
  
  console.log('QCS fix complete!');
}

// Auto-run fix on import for demo
fixAllQCS();