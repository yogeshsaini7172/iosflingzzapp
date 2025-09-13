import { calculateQCS, updateProfileCompletion } from './qcs';

export async function testQCSCalculation() {
  console.log('Testing QCS calculation for Alice...');
  
  // Test with Alice's user ID
  const aliceId = '11111111-1111-1111-1111-111111111001';
  
  try {
    // Update profile completion first
    await updateProfileCompletion(aliceId);
    
    // Calculate QCS
    const qcsScore = await calculateQCS(aliceId);
    
    console.log(`QCS calculated for Alice: ${qcsScore}`);
    
    return qcsScore;
  } catch (error) {
    console.error('Error testing QCS:', error);
    return 0;
  }
}

export async function calculateQCSForUser(userId: string) {
  console.log(`Calculating QCS for user: ${userId}`);
  
  try {
    // Update profile completion first
    await updateProfileCompletion(userId);
    
    // Calculate QCS using the new algorithm
    const qcsScore = await calculateQCS(userId);
    
    console.log(`QCS calculated for user ${userId}: ${qcsScore}`);
    
    return qcsScore;
  } catch (error) {
    console.error(`Error calculating QCS for user ${userId}:`, error);
    return 0;
  }
}