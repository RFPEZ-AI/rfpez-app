// Copyright Mark Skiba, 2025 All rights reserved

/**
 * Beta Test Configuration
 * 
 * Controls beta test features and access levels during development.
 */

/**
 * Check if beta test mode is enabled.
 * When enabled, all authenticated users are assumed to have billing setup.
 * 
 * @returns {boolean} True if beta test mode is enabled
 */
export const isBetaTestMode = (): boolean => {
  return process.env.REACT_APP_BETA_TEST === 'true';
};

/**
 * Determine if a user should have full account access.
 * During beta testing, all authenticated users get premium access.
 * 
 * @param isAuthenticated - Whether the user is authenticated
 * @param hasBillingSetup - Whether the user has actual billing configured (when implemented)
 * @returns {boolean} True if user should have full access
 */
export const hasFullAccess = (
  isAuthenticated: boolean,
  hasBillingSetup: boolean = false
): boolean => {
  if (!isAuthenticated) {
    return false; // Anonymous users never have full access
  }
  
  if (isBetaTestMode()) {
    return true; // Beta test: all authenticated users have full access
  }
  
  // TODO: When billing system is implemented, check actual billing status
  return hasBillingSetup;
};

/**
 * Get user access level string for logging/display.
 * 
 * @param isAuthenticated - Whether the user is authenticated
 * @param hasBillingSetup - Whether the user has billing configured
 * @returns {string} Access level: 'anonymous', 'basic', or 'premium'
 */
export const getUserAccessLevel = (
  isAuthenticated: boolean,
  hasBillingSetup: boolean = false
): 'anonymous' | 'basic' | 'premium' => {
  if (!isAuthenticated) {
    return 'anonymous';
  }
  
  if (hasFullAccess(isAuthenticated, hasBillingSetup)) {
    return 'premium';
  }
  
  return 'basic';
};
