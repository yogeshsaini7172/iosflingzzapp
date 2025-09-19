import { calculateQCS } from '@/services/qcs';

// Test the fixed QCS calculation for SIDHARTHA NAYAK
const userId = 'ERZk8CGQhmRwrEdehgweidhNMel2';

console.log(`🔄 Testing FIXED QCS calculation for user: ${userId}`);
console.log('Expected: Higher score than 60 (should be ~80-85 based on profile quality)');

calculateQCS(userId).then(score => {
  console.log(`✅ NEW QCS calculation result for ${userId}: ${score}`);
  
  // Manual calculation comparison
  import('./manualQCSCalculator').then(({ calculateManualQCS }) => {
    const sampleProfile = {
      "first_name": "SIDHARTHA",
      "last_name": "NAYAK", 
      "date_of_birth": "2005-02-10",
      "bio": "CHECKING",
      "interests": ["Travel", "Reading"],
      "university": "IIT DELHI",
      "major": "COMPUTER",
      "year_of_study": 4,
      "height": 170,
      "personality_type": "adventurous",
      "body_type": "athletic",
      "skin_tone": "very_fair",
      "values": "career_focused",
      "mindset": "growth",
      "field_of_study": "COMPUTER",
      "total_qcs": score, // New calculated score
      "values_array": ["career_focused"],
      "personality_traits": ["adventurous"]
    };
    
    const manualScore = calculateManualQCS(sampleProfile);
    
    console.log('\n📊 SCORE COMPARISON:');
    console.log(`Edge Function Score: ${score}`);
    console.log(`Manual Calculated Score: ${manualScore}`);
    console.log(`Difference: ${Math.abs(manualScore - score)} points`);
    
    if (Math.abs(manualScore - score) <= 10) {
      console.log('✅ Scores are reasonably close');
    } else {
      console.log('❌ Still significant difference - needs further investigation');
    }
  });
}).catch(error => {
  console.error(`❌ QCS calculation failed for ${userId}:`, error);
});

export {};