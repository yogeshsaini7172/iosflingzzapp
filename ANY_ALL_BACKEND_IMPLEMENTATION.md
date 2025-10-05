# "Any"/"All" Backend Implementation Guide

## Overview
Updated backend edge functions to properly handle "Any" and "All" preference selections, ensuring users see all profiles when they have no specific preference for an attribute.

---

## How "Any"/"All" Works

### Frontend Behavior
When users select "Any" or "All":
- It's the **only** value stored in that preference array
- Example: `preferredGender: ["All"]` or `preferredSkinTone: ["Any"]`
- Cannot coexist with specific values (enforced by frontend logic)

### Backend Logic
When backend encounters "Any" or "All":
- **Skips filtering entirely** for that attribute
- Treats it as "no preference" = accept all values
- Ensures maximum profile visibility

---

## Updated Edge Functions

### 1. `swipe-feed` (Profile Fetching)
**File:** `supabase/functions/swipe-feed/index.ts`

**Changes:**
```typescript
// OLD: Always applied gender filter if present
if (preferredGenders && preferredGenders.length > 0) {
  query = query.in('gender', normalizedGenders)
}

// NEW: Check for "Any"/"All" first
const hasAllOrAny = preferredGenders.some(g => {
  const normalized = typeof g === 'string' ? g.toLowerCase().trim() : '';
  return normalized === 'all' || normalized === 'any';
});

if (!hasAllOrAny) {
  // Only filter if specific genders selected
  query = query.in('gender', normalizedGenders)
} else {
  console.log('🚻 "All"/"Any" selected - showing all genders');
}
```

**Impact:**
- Users selecting "All" genders now see **all profiles** regardless of gender
- More matches, better user experience
- Logs help debug filtering behavior

---

### 2. `compatibility-scoring` (Score Calculation)
**File:** `supabase/functions/compatibility-scoring/index.ts`

**Changes:**
```typescript
function matchScore(req: any, qual: any): number {
  if (Array.isArray(req)) {
    // NEW: Check for "Any"/"All"
    const hasAllOrAny = req.some(r => {
      const normalized = typeof r === 'string' ? r.toLowerCase().trim() : '';
      return normalized === 'any' || normalized === 'all';
    });
    
    if (hasAllOrAny) {
      return 1.0; // Perfect match - no filter
    }
    
    // Continue with normal matching logic...
  }
}
```

**Impact:**
- "Any"/"All" preferences score as **1.0 (perfect match)**
- Prevents compatibility penalties for having no preference
- Users with "Any" preferences get fair compatibility scores

---

### 3. `enhanced-pairing` (Pairing Algorithm)
**File:** `supabase/functions/enhanced-pairing/index.ts`

**Changes:**
```typescript
// Gender filtering with "Any"/"All" support
const hasAllOrAny = userPreferences.preferred_gender.some((g: string) => {
  const normalized = typeof g === 'string' ? g.toLowerCase().trim() : '';
  return normalized === 'all' || normalized === 'any';
});

if (!hasAllOrAny) {
  query = query.in('gender', normalizedGenders);
} else {
  console.log('"All"/"Any" selected - showing all genders');
}

// Added helper function
function hasAnyOrAll(arr: any[]): boolean {
  if (!Array.isArray(arr)) return false;
  return arr.some(item => {
    const normalized = typeof item === 'string' ? item.toLowerCase().trim() : '';
    return normalized === 'any' || normalized === 'all';
  });
}
```

**Impact:**
- Pairing algorithm respects "no preference" selections
- Better match quality by not artificially limiting options
- Reusable helper function for future enhancements

---

## Database Storage

### Stored Format
Preferences stored in `partner_preferences` table:

```json
{
  "preferredGender": ["All"],
  "preferredSkinTone": ["Fair", "Light"],
  "preferredBodyTypes": ["Any"],
  "preferredFaceType": ["Oval"],
  "preferredProfessions": ["Student", "Engineer"]
}
```

### Interpretation Rules

| Preference Value | Meaning | Filter Applied? |
|-----------------|---------|-----------------|
| `["All"]` or `["Any"]` | No preference | ❌ No filter |
| `["Male", "Female"]` | Specific preferences | ✅ Yes - filter by these |
| `[]` (empty array) | Not set | ❌ No filter |
| `null` or `undefined` | Not set | ❌ No filter |

---

## Supported Preferences

The "Any"/"All" logic applies to these preferences:

### Physical Preferences
- ✅ `preferredGender` (uses "All")
- ✅ `preferredSkinTone` (uses "Any")
- ✅ `preferredFaceType` (uses "Any")
- ✅ `preferredBodyTypes` (uses "Any")

### Mental Preferences
- ✅ `preferredValues`
- ✅ `preferredMindset`
- ✅ `preferredPersonality`
- ✅ `preferredLoveLanguage`
- ✅ `preferredLifestyle`
- ✅ `preferredRelationshipGoals`

### Professional Preferences
- ✅ `preferredProfessions`

---

## Testing Scenarios

### Scenario 1: "All" Genders
**User Preference:** `["All"]`
**Expected Result:** Shows male, female, and non-binary profiles

### Scenario 2: "Any" Skin Tone
**User Preference:** `["Any"]`
**Expected Result:** Shows profiles with any skin tone

### Scenario 3: Specific Preferences
**User Preference:** `["Fair", "Light"]`
**Expected Result:** Only shows Fair and Light skin tones

### Scenario 4: Mixed Profile
**User Preferences:**
```json
{
  "preferredGender": ["All"],
  "preferredBodyTypes": ["Athletic", "Slim"],
  "preferredSkinTone": ["Any"]
}
```
**Expected Result:** 
- ✅ Shows all genders
- ✅ Shows all skin tones
- 🔍 Filters by Athletic/Slim body types only

---

## Debugging Tips

### Check Edge Function Logs
```bash
# View swipe-feed logs
console.log('🚻 "All"/"Any" selected - showing all genders');

# View pairing logs
console.log('"All"/"Any" selected - showing all genders');
```

### Verify Database Query
Check if gender filter is applied:
```sql
-- Should NOT have gender filter when "All" is selected
SELECT * FROM profiles 
WHERE is_active = true 
  AND show_profile = true
  -- No "AND gender IN (...)" when "All" selected
```

### Test Compatibility Scores
Users with "Any"/"All" preferences should get:
- **Physical Score:** 1.0 (100%) for unfiltered attributes
- **Mental Score:** 1.0 (100%) for unfiltered attributes
- **Overall Score:** Fair compatibility based on actual matches, not penalized for missing filters

---

## Future Enhancements

### 1. Add "Any"/"All" to More Preferences
Consider adding to:
- Education level
- Communication style
- Humor type

### 2. Smart Defaults
When user doesn't set a preference:
- Currently: No filter
- Future: Could default to "Any" explicitly

### 3. Analytics
Track usage patterns:
- How many users select "Any"/"All"?
- Do they get better match rates?
- Does it improve engagement?

---

## Summary

✅ **Frontend:** "Any"/"All" is exclusive - clears other selections  
✅ **Backend:** "Any"/"All" = skip filter entirely  
✅ **Compatibility:** "Any"/"All" = perfect match (1.0 score)  
✅ **Impact:** More profiles shown, better match rates, fairer scoring  

All matching and pairing algorithms now respect "no preference" semantics correctly!
