/**
 * Age validation utilities for the dating app
 * Ensures users are 18+ years old
 */

export const MINIMUM_AGE = 18;

/**
 * Calculate age from date of birth
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Age in years
 */
export const calculateAge = (dateOfBirth: string): number => {
  if (!dateOfBirth) return 0;
  
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

/**
 * Validate if user meets minimum age requirement
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns True if user is 18 or older
 */
export const validateMinimumAge = (dateOfBirth: string): boolean => {
  if (!dateOfBirth) return false;
  
  const age = calculateAge(dateOfBirth);
  return age >= MINIMUM_AGE;
};

/**
 * Get maximum allowed date for date picker (18 years ago from today)
 * @returns Date string in YYYY-MM-DD format
 */
export const getMaxAllowedDate = (): string => {
  const today = new Date();
  const maxDate = new Date(today.getFullYear() - MINIMUM_AGE, today.getMonth(), today.getDate());
  return maxDate.toISOString().split('T')[0];
};

/**
 * Get age validation error message
 * @param dateOfBirth - Date string in YYYY-MM-DD format
 * @returns Error message or null if valid
 */
export const getAgeValidationError = (dateOfBirth: string): string | null => {
  if (!dateOfBirth) return null;
  
  const age = calculateAge(dateOfBirth);
  if (age < MINIMUM_AGE) {
    return `You must be at least ${MINIMUM_AGE} years old to use this app. You are currently ${age} years old.`;
  }
  
  return null;
};