import { calculateManualQCS } from './manualQCSCalculator';

// Test the manual QCS calculation for SIDHARTHA NAYAK (ACTUAL DATA FROM DB)
const sampleProfile = {
  "id": "d00fa7bd-da97-4a7c-a1f5-3b23ecf6fd50",
  "user_id": "5Lwwzy91cYby88u3p9oAtNS9Mq53",
  "firebase_uid": "5Lwwzy91cYby88u3p9oAtNS9Mq53",
  "first_name": "SIDHARTHA",
  "last_name": "NAYAK",
  "date_of_birth": "2005-02-10",
  "gender": "female",
  "bio": "CHECKINHG", // Actual bio from DB (typo included)
  "interests": ["travel", "reading", "music"], // Actual interests from DB
  "university": "IIT DELHI",
  "major": "COMPUTER",
  "year_of_study": 4,
  "height": 170,
  "relationship_goals": ["Serious relationship", "Casual dating"],
  "lifestyle": "active",
  "personality_type": "adventurous",
  "love_language": "words_of_affirmation",
  "body_type": "slim", // Actual body type from DB
  "skin_tone": "fair", // Actual skin tone from DB
  "face_type": "oval",
  "values": "family_oriented", // Actual values from DB
  "mindset": "growth",
  "field_of_study": "COMPUTER",
  "total_qcs": 43, // Current database value
  "values_array": ["family_oriented"],
  "personality_traits": ["adventurous"]
};

console.log('🧮 MANUAL QCS TEST FOR USER:', sampleProfile.first_name, sampleProfile.last_name);
console.log('==================================================');

const calculatedScore = calculateManualQCS(sampleProfile);

console.log('\n🎯 COMPARISON:');
console.log(`Database Score: ${sampleProfile.total_qcs}`);
console.log(`Manual Calculated Score: ${calculatedScore}`);
console.log(`Difference: ${calculatedScore - sampleProfile.total_qcs} points`);

if (Math.abs(calculatedScore - sampleProfile.total_qcs) > 5) {
  console.log('❌ SIGNIFICANT DIFFERENCE DETECTED - QCS function needs fixing!');
} else {
  console.log('✅ Scores match reasonably');
}

export { calculatedScore };