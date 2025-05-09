/**
 * Auth Validation Utilities
 *
 * Provides validation functions for authentication-related data.
 */

/**
 * Validates an email address format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false

  // Simple email validation regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}

/**
 * Sanitizes an email address by trimming and converting to lowercase
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ""
  return email.trim().toLowerCase()
}

/**
 * Validates a password meets minimum requirements (at least 8 characters)
 */
export function validatePassword(password: string): boolean {
  if (!password) return false
  return password.length >= 8
}

/**
 * Checks password strength and returns a score
 */
export function validatePasswordStrength(password: string): {
  score: number
  isStrongEnough: boolean
} {
  if (!password) {
    return { score: 0, isStrongEnough: false }
  }

  let score = 0

  // Length check
  if (password.length >= 8) score++
  if (password.length >= 12) score++

  // Character type checks
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  const isStrongEnough = score >= 4

  return {
    score,
    isStrongEnough,
  }
}

/**
 * Validates both email and password
 */
export function validateAuthCredentials(
  email: string,
  password: string,
): {
  valid: boolean
  errors: { email?: string; password?: string }
} {
  const errors: { email?: string; password?: string } = {}

  if (!email) {
    errors.email = "Email is required"
  } else if (!validateEmail(email)) {
    errors.email = "Please enter a valid email address"
  }

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
 * Validates a username format
 */
export function validateUsername(username: string): boolean {
  if (!username) return false

  // Username should be 3-20 characters and only contain letters, numbers, underscores, and hyphens
  const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * Validates a phone number format
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return false

  // Basic phone validation - allows various formats
  const phoneRegex = /^\+?[0-9]{10,15}$/
  return phoneRegex.test(phone.replace(/[\s()-]/g, ""))
}

/**
 * Validates a password reset request
 */
export function validatePasswordResetRequest(email: string): {
  valid: boolean
  errors: { email?: string }
} {
  const errors: { email?: string } = {}

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
 * Validates a password update request
 */
export function validatePasswordUpdateRequest(
  password: string,
  confirmPassword: string,
): {
  valid: boolean
  errors: { password?: string; confirmPassword?: string }
} {
  const errors: { password?: string; confirmPassword?: string } = {}

  if (!password) {
    errors.password = "Password is required"
  } else if (!validatePassword(password)) {
    errors.password = "Password must be at least 8 characters"
  }

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
