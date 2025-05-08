/**
 * Authentication Validation Utilities
 * Provides validation functions for authentication-related data
 */

/**
 * Validate an email address
 * @param email Email address to validate
 * @returns True if the email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email) return false

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate a password
 * @param password Password to validate
 * @returns True if the password is valid, false otherwise
 */
export function validatePassword(password: string): boolean {
  if (!password) return false

  // Basic password validation - at least 8 characters
  return password.length >= 8
}

/**
 * Validate password strength
 * @param password Password to validate
 * @returns An object containing the password strength score and a boolean indicating if it's strong enough
 */
export function validatePasswordStrength(password: string): { score: number; isStrongEnough: boolean } {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const isStrongEnough = score >= 4

  return { score, isStrongEnough }
}

/**
 * Sanitize an email address
 * @param email Email address to sanitize
 * @returns Sanitized email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ""

  // Trim whitespace and convert to lowercase
  return email.trim().toLowerCase()
}

/**
 * Validate authentication credentials
 * @param email Email address
 * @param password Password
 * @returns Validation result
 */
export function validateAuthCredentials(
  email: string,
  password: string,
): { valid: boolean; errors: { email?: string; password?: string } } {
  const errors: { email?: string; password?: string } = {}

  // Validate email
  if (!email) {
    errors.email = "Email is required"
  } else if (!validateEmail(email)) {
    errors.email = "Please enter a valid email address"
  }

  // Validate password
  if (!password) {
    errors.password = "Password is required"
  } else if (!validatePassword(password)) {
    errors.password = "Password must be at least 8 characters"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate a password reset request
 * @param email Email address
 * @returns Validation result
 */
export function validatePasswordResetRequest(email: string): { valid: boolean; errors: { email?: string } } {
  const errors: { email?: string } = {}

  // Validate email
  if (!email) {
    errors.email = "Email is required"
  } else if (!validateEmail(email)) {
    errors.email = "Please enter a valid email address"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Validate a password update request
 * @param password New password
 * @param confirmPassword Confirm password
 * @returns Validation result
 */
export function validatePasswordUpdateRequest(
  password: string,
  confirmPassword: string,
): { valid: boolean; errors: { password?: string; confirmPassword?: string } } {
  const errors: { password?: string; confirmPassword?: string } = {}

  // Validate password
  if (!password) {
    errors.password = "Password is required"
  } else if (!validatePassword(password)) {
    errors.password = "Password must be at least 8 characters"
  }

  // Validate confirm password
  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password"
  } else if (password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}
