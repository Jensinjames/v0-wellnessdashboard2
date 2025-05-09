/**
 * Auth Validation Utilities
 *
 * Provides validation functions for authentication-related data.
 */

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Password validation regex - at least 8 chars, with uppercase, lowercase, number, and special char
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/

/**
 * Validates an email address format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false
  return EMAIL_REGEX.test(email.trim())
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
 * Checks password strength and returns a score and feedback
 */
export function validatePasswordStrength(password: string): {
  score: number
  feedback: string
  isStrong: boolean
} {
  if (!password) {
    return { score: 0, feedback: "Password is required", isStrong: false }
  }

  let score = 0
  let feedback = ""

  // Length check
  if (password.length < 8) {
    feedback = "Password should be at least 8 characters long"
  } else {
    score += 1
  }

  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1
  }

  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1
  }

  // Number check
  if (/\d/.test(password)) {
    score += 1
  }

  // Special character check
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    score += 1
  }

  // Determine feedback based on score
  if (score < 3) {
    feedback = "Password is weak. Add uppercase, lowercase, numbers, and special characters."
  } else if (score < 5) {
    feedback = "Password is medium strength. Add more character types for better security."
  } else {
    feedback = "Password is strong."
  }

  return {
    score,
    feedback,
    isStrong: score >= 3,
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
  const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/
  return phoneRegex.test(phone.trim())
}
