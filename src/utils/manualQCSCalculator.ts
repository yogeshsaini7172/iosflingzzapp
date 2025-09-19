// Manual QCS Calculator based on the provided Python algorithm
export function calculateManualQCS(profile: any): number {
  console.log('🔍 Manual QCS Calculation for:', profile.first_name, profile.last_name);
  
  const EDUCATION_WEIGHTS = {
    "high school": 0.6,
    "undergraduate": 0.8,
    "postgraduate": 0.9,
    "phd": 1.0,
    "doctorate": 1.0,
    "working professional": 0.9,
    "entrepreneur": 0.95,
    "other": 0.7
  };

  const PROFESSION_KEYWORDS = {
    "engineer": 0.9,
    "developer": 0.9,
    "computer": 0.9,
    "manager": 0.9,
    "teacher": 0.85,
    "doctor": 1.0,
    "research": 0.95,
    "student": 0.7,
    "entrepreneur": 0.95
  };

  const BODY_TYPE_WEIGHTS = {
    "slim": 0.8,
    "athletic": 1.0,
    "average": 0.75,
    "curvy": 0.7,
    "plus size": 0.65,
    "prefer not to say": 0.7
  };

  const SKIN_TONE_WEIGHTS = {
    "very fair": 0.7,
    "fair": 0.75,
    "medium": 0.8,
    "olive": 0.8,
    "brown": 0.75,
    "dark": 0.7
  };

  const PERSONALITY_WEIGHTS = {
    "adventurous": 0.95,
    "analytical": 0.9,
    "creative": 0.95,
    "outgoing": 0.9,
    "introverted": 0.75,
    "empathetic": 0.98,
    "ambitious": 0.96
  };

  const VALUES_WEIGHTS = {
    "family-oriented": 0.95,
    "career-focused": 0.9,
    "career_focused": 0.9,
    "health-conscious": 0.95,
    "spiritual": 0.7,
    "traditional": 0.65
  };

  const MINDSET_WEIGHTS = {
    "growth mindset": 1.0,
    "growth": 1.0,
    "positive thinking": 0.98,
    "pragmatic": 0.87,
    "optimistic": 0.9
  };

  const INTERESTS_WEIGHTS = {
    "travel": 0.95,
    "reading": 0.9,
    "music": 0.85,
    "sports": 0.9,
    "cooking": 0.8,
    "technology": 0.98,
    "fitness": 1.0
  };

  const CATEGORY_WEIGHTS = {
    "basic": 15,
    "physical": 15,
    "personality": 15,
    "values": 15,
    "mindset": 10,
    "relationship": 10,
    "interests": 10,
    "bio": 10
  };

  let totalContribution = 0;
  let totalWeight = 0;
  const breakdown: any = {};

  // 1. BASIC (Age + Education + Field)
  const basicComponents = [];
  
  // Age calculation
  if (profile.date_of_birth) {
    try {
      const birthDate = new Date(profile.date_of_birth);
      const age = (new Date().getTime() - birthDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      const ageDiff = Math.abs(age - 30);
      const ageFraction = Math.max(0, 1 - (ageDiff / 50));
      basicComponents.push(ageFraction);
      console.log(`  Age: ${age.toFixed(1)} years, fraction: ${ageFraction.toFixed(3)}`);
    } catch (e) {
      console.log('  Age: Could not calculate');
    }
  }

  // Education (from year_of_study)
  if (profile.year_of_study) {
    const year = profile.year_of_study;
    let eduType = "other";
    if (year >= 1 && year <= 4) eduType = "undergraduate";
    else if (year > 4) eduType = "postgraduate";
    
    const eduFraction = EDUCATION_WEIGHTS[eduType] || 0.7;
    basicComponents.push(eduFraction);
    console.log(`  Education (Year ${year}): ${eduType}, fraction: ${eduFraction}`);
  }

  // Field/Profession
  if (profile.field_of_study || profile.major) {
    const field = (profile.field_of_study || profile.major || "").toLowerCase();
    let profFraction = 0.7; // default
    
    for (const [keyword, weight] of Object.entries(PROFESSION_KEYWORDS)) {
      if (field.includes(keyword)) {
        profFraction = weight;
        break;
      }
    }
    basicComponents.push(profFraction);
    console.log(`  Field (${field}): fraction: ${profFraction}`);
  }

  if (basicComponents.length > 0) {
    const basicFraction = basicComponents.reduce((a, b) => a + b, 0) / basicComponents.length;
    breakdown.basic = basicFraction;
    totalContribution += basicFraction * CATEGORY_WEIGHTS.basic;
    totalWeight += CATEGORY_WEIGHTS.basic;
    console.log(`  BASIC Total: ${basicFraction.toFixed(3)} (weight: ${CATEGORY_WEIGHTS.basic})`);
  }

  // 2. PHYSICAL
  const physicalComponents = [];
  
  if (profile.height) {
    const heightDiff = Math.abs(profile.height - 175);
    const heightFraction = Math.max(0, 1 - (heightDiff / 40));
    physicalComponents.push(heightFraction);
    console.log(`  Height (${profile.height}cm): fraction: ${heightFraction.toFixed(3)}`);
  }

  if (profile.body_type) {
    const bodyFraction = BODY_TYPE_WEIGHTS[profile.body_type.toLowerCase()] || 0.7;
    physicalComponents.push(bodyFraction);
    console.log(`  Body Type (${profile.body_type}): fraction: ${bodyFraction}`);
  }

  if (profile.skin_tone) {
    const skinFraction = SKIN_TONE_WEIGHTS[profile.skin_tone.toLowerCase()] || 0.7;
    physicalComponents.push(skinFraction);
    console.log(`  Skin Tone (${profile.skin_tone}): fraction: ${skinFraction}`);
  }

  if (physicalComponents.length > 0) {
    const physicalFraction = physicalComponents.reduce((a, b) => a + b, 0) / physicalComponents.length;
    breakdown.physical = physicalFraction;
    totalContribution += physicalFraction * CATEGORY_WEIGHTS.physical;
    totalWeight += CATEGORY_WEIGHTS.physical;
    console.log(`  PHYSICAL Total: ${physicalFraction.toFixed(3)} (weight: ${CATEGORY_WEIGHTS.physical})`);
  }

  // 3. PERSONALITY
  if (profile.personality_type || profile.personality_traits) {
    const personality = profile.personality_type || (profile.personality_traits && profile.personality_traits[0]) || "";
    const personalityFraction = PERSONALITY_WEIGHTS[personality.toLowerCase()] || 0.7;
    breakdown.personality = personalityFraction;
    totalContribution += personalityFraction * CATEGORY_WEIGHTS.personality;
    totalWeight += CATEGORY_WEIGHTS.personality;
    console.log(`  PERSONALITY (${personality}): fraction: ${personalityFraction} (weight: ${CATEGORY_WEIGHTS.personality})`);
  }

  // 4. VALUES
  if (profile.values || profile.values_array) {
    const values = profile.values_array || (typeof profile.values === 'string' ? [profile.values] : profile.values) || [];
    let valuesTotal = 0;
    for (const value of values) {
      const valueFraction = VALUES_WEIGHTS[value.toLowerCase().replace(/ /g, '_')] || VALUES_WEIGHTS[value.toLowerCase()] || 0.6;
      valuesTotal += valueFraction;
      console.log(`    Value (${value}): ${valueFraction}`);
    }
    if (values.length > 0) {
      const valuesFraction = valuesTotal / values.length;
      breakdown.values = valuesFraction;
      totalContribution += valuesFraction * CATEGORY_WEIGHTS.values;
      totalWeight += CATEGORY_WEIGHTS.values;
      console.log(`  VALUES Total: ${valuesFraction.toFixed(3)} (weight: ${CATEGORY_WEIGHTS.values})`);
    }
  }

  // 5. MINDSET
  if (profile.mindset) {
    const mindset = typeof profile.mindset === 'string' ? profile.mindset : (profile.mindset[0] || "");
    const mindsetFraction = MINDSET_WEIGHTS[mindset.toLowerCase()] || 0.7;
    breakdown.mindset = mindsetFraction;
    totalContribution += mindsetFraction * CATEGORY_WEIGHTS.mindset;
    totalWeight += CATEGORY_WEIGHTS.mindset;
    console.log(`  MINDSET (${mindset}): fraction: ${mindsetFraction} (weight: ${CATEGORY_WEIGHTS.mindset})`);
  }

  // 6. INTERESTS
  if (profile.interests && Array.isArray(profile.interests)) {
    let interestsTotal = 0;
    for (const interest of profile.interests) {
      const interestFraction = INTERESTS_WEIGHTS[interest.toLowerCase()] || 0.6;
      interestsTotal += interestFraction;
      console.log(`    Interest (${interest}): ${interestFraction}`);
    }
    if (profile.interests.length > 0) {
      const interestsFraction = interestsTotal / profile.interests.length;
      breakdown.interests = interestsFraction;
      totalContribution += interestsFraction * CATEGORY_WEIGHTS.interests;
      totalWeight += CATEGORY_WEIGHTS.interests;
      console.log(`  INTERESTS Total: ${interestsFraction.toFixed(3)} (weight: ${CATEGORY_WEIGHTS.interests})`);
    }
  }

  // 7. BIO
  if (profile.bio) {
    const bioLength = profile.bio.length;
    const bioFraction = Math.min(1.0, bioLength / 80);
    breakdown.bio = bioFraction;
    totalContribution += bioFraction * CATEGORY_WEIGHTS.bio;
    totalWeight += CATEGORY_WEIGHTS.bio;
    console.log(`  BIO (${bioLength} chars): fraction: ${bioFraction.toFixed(3)} (weight: ${CATEGORY_WEIGHTS.bio})`);
  }

  const finalScore = totalWeight > 0 ? (totalContribution / totalWeight) * 100 : 50;
  
  console.log('\n📊 MANUAL QCS BREAKDOWN:');
  console.log('  Total Contribution:', totalContribution.toFixed(2));
  console.log('  Total Weight:', totalWeight);
  console.log('  Final Score:', finalScore.toFixed(1));
  console.log('  Database Score:', profile.total_qcs);
  console.log('  Breakdown:', breakdown);

  return Math.round(finalScore);
}

// Test with the provided profile
const testProfile = {
  "id": "d00fa7bd-da97-4a7c-a1f5-3b23ecf6fd50",
  "user_id": "ERZk8CGQhmRwrEdehgweidhNMel2",
  "first_name": "SIDHARTHA",
  "last_name": "NAYAK",
  "date_of_birth": "2005-02-10",
  "gender": "female",
  "bio": "CHECKING",
  "interests": ["Travel", "Reading"],
  "university": "IIT DELHI",
  "major": "COMPUTER",
  "year_of_study": 4,
  "height": 170,
  "relationship_goals": ["Serious relationship", "Casual dating"],
  "lifestyle": "active",
  "personality_type": "adventurous",
  "love_language": "words_of_affirmation",
  "body_type": "athletic",
  "skin_tone": "very_fair",
  "face_type": "oval",
  "values": "career_focused",
  "mindset": "growth",
  "field_of_study": "COMPUTER",
  "total_qcs": 60,
  "values_array": ["career_focused"],
  "personality_traits": ["adventurous"]
};

console.log('🚀 Running Manual QCS Calculation...');
const manualScore = calculateManualQCS(testProfile);
console.log(`\n🎯 RESULT: Manual Score = ${manualScore}, Database Score = ${testProfile.total_qcs}`);