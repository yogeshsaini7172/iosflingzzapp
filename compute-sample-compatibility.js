const parseJSON = (jsonString, fallback = {}) => {
  try {
    return jsonString ? JSON.parse(jsonString) : fallback;
  } catch (e) {
    console.warn("Could not parse JSON:", e);
    return fallback;
  }
};

const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

function calculatePhysicalCompatibility(qualities1, requirements1, qualities2, requirements2, profile1, profile2) {
  let score = 0;
  let maxScore = 0;

  // Height compatibility
  maxScore += 20;
  if (profile1.height && profile2.height) {
    const height1 = profile1.height;
    const height2 = profile2.height;
    const req2Min = requirements2.height_range_min || 150;
    const req2Max = requirements2.height_range_max || 200;
    if (height1 >= req2Min && height1 <= req2Max) score += 10;
    const req1Min = requirements1.height_range_min || 150;
    const req1Max = requirements1.height_range_max || 200;
    if (height2 >= req1Min && height2 <= req1Max) score += 10;
  }

  // Body type compatibility
  maxScore += 15;
  if (qualities1.body_type && qualities2.body_type) {
    const bodyType1 = qualities1.body_type;
    const bodyType2 = qualities2.body_type;
    const preferredBodies1 = requirements1.preferred_body_types || [];
    const preferredBodies2 = requirements2.preferred_body_types || [];
    if (preferredBodies1.length === 0) score += 7;
    else if (preferredBodies1.includes(bodyType2)) score += 15;
    if (preferredBodies2.length === 0) score += 8;
    else if (preferredBodies2.includes(bodyType1)) score += 15;
  }

  // Age compatibility
  maxScore += 15;
  if (profile1.date_of_birth && profile2.date_of_birth) {
    const age1 = calculateAge(profile1.date_of_birth);
    const age2 = calculateAge(profile2.date_of_birth);
    const ageMin1 = requirements1.age_range_min || 18;
    const ageMax1 = requirements1.age_range_max || 30;
    const ageMin2 = requirements2.age_range_min || 18;
    const ageMax2 = requirements2.age_range_max || 30;
    if (age2 >= ageMin1 && age2 <= ageMax1) score += 7;
    if (age1 >= ageMin2 && age1 <= ageMax2) score += 8;
  }

  return Math.round((score / maxScore) * 100);
}

function calculateMentalCompatibility(qualities1, requirements1, qualities2, requirements2) {
  let score = 0;
  let maxScore = 0;

  // Shared interests
  maxScore += 30;
  const interests1 = qualities1.interests || [];
  const interests2 = qualities2.interests || [];
  const sharedInterests = interests1.filter((interest) => interests2.includes(interest));
  const interestCompatibility = Math.min(sharedInterests.length * 10, 30);
  score += interestCompatibility;

  // Personality traits
  maxScore += 25;
  const traits1 = qualities1.personality_traits || [];
  const traits2 = qualities2.personality_traits || [];
  const preferredTraits1 = requirements1.preferred_personality_traits || [];
  const preferredTraits2 = requirements2.preferred_personality_traits || [];
  if (preferredTraits1.length > 0) {
    const traitMatches1 = traits2.filter((trait) => preferredTraits1.includes(trait)).length;
    score += Math.min(traitMatches1 * 8, 12);
  } else {
    score += 8;
  }
  if (preferredTraits2.length > 0) {
    const traitMatches2 = traits1.filter((trait) => preferredTraits2.includes(trait)).length;
    score += Math.min(traitMatches2 * 8, 13);
  } else {
    score += 9;
  }

  // Values
  maxScore += 20;
  const values1 = qualities1.values || [];
  const values2 = qualities2.values || [];
  const preferredValues1 = requirements1.preferred_values || [];
  const preferredValues2 = requirements2.preferred_values || [];
  if (preferredValues1.length > 0) {
    const valueMatches1 = values2.filter((value) => preferredValues1.includes(value)).length;
    score += Math.min(valueMatches1 * 6, 10);
  } else {
    score += 6;
  }
  if (preferredValues2.length > 0) {
    const valueMatches2 = values1.filter((value) => preferredValues2.includes(value)).length;
    score += Math.min(valueMatches2 * 6, 10);
  } else {
    score += 6;
  }

  // Relationship goals
  maxScore += 25;
  const goals1 = qualities1.relationship_goals || [];
  const goals2 = qualities2.relationship_goals || [];
  const preferredGoals1 = requirements1.preferred_relationship_goals || [];
  const preferredGoals2 = requirements2.preferred_relationship_goals || [];
  const sharedGoals = goals1.filter((goal) => goals2.includes(goal));
  if (sharedGoals.length > 0) {
    score += 15;
  }
  if (preferredGoals1.length > 0) {
    const goalMatches1 = goals2.filter((goal) => preferredGoals1.includes(goal)).length;
    score += Math.min(goalMatches1 * 5, 5);
  } else {
    score += 3;
  }
  if (preferredGoals2.length > 0) {
    const goalMatches2 = goals1.filter((goal) => preferredGoals2.includes(goal)).length;
    score += Math.min(goalMatches2 * 5, 5);
  } else {
    score += 2;
  }

  return Math.round((score / maxScore) * 100);
}

function findSharedInterests(interests1, interests2) {
  return interests1.filter(interest => interests2.includes(interest));
}

function generateCompatibilityReasons(qualities1, qualities2, requirements1, requirements2, sharedInterests) {
  const reasons = [];

  if (sharedInterests.length > 0) {
    if (sharedInterests.length === 1) {
      reasons.push(`You both love ${sharedInterests[0]}`);
    } else {
      reasons.push(`You share ${sharedInterests.length} common interests including ${sharedInterests.slice(0, 2).join(', ')}`);
    }
  }

  const values1 = qualities1.values || [];
  const values2 = qualities2.values || [];
  const sharedValues = values1.filter((value) => values2.includes(value));
  if (sharedValues.length > 0) {
    reasons.push(`You both value ${sharedValues[0].toLowerCase()}`);
  }

  const goals1 = qualities1.relationship_goals || [];
  const goals2 = qualities2.relationship_goals || [];
  const sharedGoals = goals1.filter((goal) => goals2.includes(goal));
  if (sharedGoals.length > 0) {
    reasons.push(`You're both looking for ${sharedGoals[0].toLowerCase()}`);
  }

  if (qualities1.education_level && qualities2.education_level && qualities1.education_level === qualities2.education_level) {
    reasons.push("You're at similar education levels");
  }

  if (qualities1.communication_style && qualities2.communication_style && qualities1.communication_style === qualities2.communication_style) {
    reasons.push(`You both have ${qualities1.communication_style} communication styles`);
  }

  return reasons.slice(0, 3);
}

function calculateCompatibility(profile1, profile2) {
  const qualities1 = parseJSON(profile1.qualities);
  const requirements1 = parseJSON(profile1.requirements);
  const qualities2 = parseJSON(profile2.qualities);
  const requirements2 = parseJSON(profile2.requirements);

  const physicalScore = calculatePhysicalCompatibility(qualities1, requirements1, qualities2, requirements2, profile1, profile2);
  const mentalScore = calculateMentalCompatibility(qualities1, requirements1, qualities2, requirements2);
  const sharedInterests = findSharedInterests(qualities1.interests || [], qualities2.interests || []);
  const compatibilityReasons = generateCompatibilityReasons(qualities1, qualities2, requirements1, requirements2, sharedInterests);
  const overallScore = Math.round((mentalScore * 0.6) + (physicalScore * 0.4));

  return {
    physical_score: physicalScore,
    mental_score: mentalScore,
    overall_score: overallScore,
    shared_interests: sharedInterests,
    compatibility_reasons: compatibilityReasons
  };
}

// Sample profiles with data for non-zero compatibility
const sampleProfile1 = {
  user_id: 'user1',
  height: 175,
  date_of_birth: '1995-05-15',
  qualities: JSON.stringify({
    body_type: 'athletic',
    interests: ['hiking', 'reading', 'music'],
    personality_traits: ['adventurous', 'kind'],
    values: ['honesty', 'family'],
    relationship_goals: ['long-term'],
    education_level: 'bachelor',
    communication_style: 'direct'
  }),
  requirements: JSON.stringify({
    height_range_min: 160,
    height_range_max: 185,
    preferred_body_types: ['athletic', 'slim'],
    age_range_min: 25,
    age_range_max: 35,
    preferred_personality_traits: ['adventurous'],
    preferred_values: ['honesty'],
    preferred_relationship_goals: ['long-term']
  })
};

const sampleProfile2 = {
  user_id: 'user2',
  height: 168,
  date_of_birth: '1996-08-20',
  qualities: JSON.stringify({
    body_type: 'athletic',
    interests: ['hiking', 'music'],
    personality_traits: ['adventurous', 'creative'],
    values: ['honesty', 'adventure'],
    relationship_goals: ['long-term'],
    education_level: 'bachelor',
    communication_style: 'direct'
  }),
  requirements: JSON.stringify({
    height_range_min: 170,
    height_range_max: 190,
    preferred_body_types: ['athletic'],
    age_range_min: 24,
    age_range_max: 32,
    preferred_personality_traits: ['kind'],
    preferred_values: ['family'],
    preferred_relationship_goals: ['long-term']
  })
};

// Compute and output
const result = calculateCompatibility(sampleProfile1, sampleProfile2);
console.log('Compatibility Analysis Result:');
console.log('Overall Score:', result.overall_score + '%');
console.log('Physical Score:', result.physical_score + '%');
console.log('Mental Score:', result.mental_score + '%');
console.log('Shared Interests:', result.shared_interests.join(', '));
console.log('Reasons:', result.compatibility_reasons.join('; '));
