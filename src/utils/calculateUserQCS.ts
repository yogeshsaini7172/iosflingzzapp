// QCS test service was removed during cleanup
// Using manual calculator instead
import { calculateManualQCS } from './manualQCSCalculator';

// Calculate QCS for the specific user
const targetUserId = 'qKWmi3xeOvVbdUzUfyghkwejzZE2';

console.log(`Starting manual QCS calculation for user: ${targetUserId}`);

// Mock profile for testing
const mockProfile = {
  user_id: targetUserId,
  profile_images: ['image1.jpg', 'image2.jpg'],
  bio: 'Sample bio for testing',
  interests: ['coding', 'music', 'travel'],
  height: 175,
  body_type: 'athletic',
  personality_type: 'INTJ'
};

const score = calculateManualQCS(mockProfile);
console.log(`✅ Manual QCS calculation complete for ${targetUserId}: ${score}`);
