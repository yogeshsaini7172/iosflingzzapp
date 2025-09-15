import { calculateQCSForUser } from '@/services/test-qcs';

// Calculate QCS for the specific user
const targetUserId = 'qKWmi3xeOvVbdUzUfyghkwejzZE2';

console.log(`Starting QCS calculation for user: ${targetUserId}`);

calculateQCSForUser(targetUserId).then(score => {
  console.log(`✅ QCS calculation complete for ${targetUserId}: ${score}`);
}).catch(error => {
  console.error(`❌ QCS calculation failed for ${targetUserId}:`, error);
});