/**
 * Authentication Validation Utilities
 * Functions for validating authentication credentials
 */

// Validate email and password
export function validateAuthCredentials(
  email: string,
  password: string,
): { valid: boolean; errors: { email?: string; password?: string } } {
  const errors: { email?: string; password?: string } = {}
  let valid = true

  // Validate email
  if (!email || typeof email !== "string") {
    errors.email = "Email is required"
    valid = false
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address"
    valid = false
  }

  // Validate password
  if (!password || typeof password !== "string") {
    errors.password = "Password is required"
    valid = false
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters"
    valid = false
  }

  return { valid, errors }
}

// Sanitize email
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== "string") {
    return null
  }

  // Trim whitespace
  const trimmed = email.trim().toLowerCase()

  // Basic email validation
  if (!isValidEmail(trimmed)) {
    return null
  }

  return trimmed
}

// Check if email is valid
export function isValidEmail(email: string): boolean {
  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Validate password strength
export function validatePasswordStrength(password: string): { valid: boolean; score: number; feedback: string } {
  if (!password || typeof password !== "string") {
    return { valid: false, score: 0, feedback: "Password is required" }
  }

  let score = 0
  let feedback = ""

  // Length check
  if (password.length < 8) {
    feedback = "Password must be at least 8 characters"
    return { valid: false, score, feedback }
  } else {
    score += 1
  }

  // Complexity checks
  if (/[A-Z]/.test(password)) score += 1
  if (/[a-z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  // Determine feedback based on score
  if (score < 3) {
    feedback = "Weak password. Consider adding uppercase letters, numbers, or special characters."
    return { valid: true, score, feedback }
  } else if (score < 5) {
    feedback = "Good password strength."
    return { valid: true, score, feedback }
  } else {
    feedback = "Strong password!"
    return { valid: true, score, feedback }
  }
}

// Validate password confirmation
export function validatePasswordConfirmation(
  password: string,
  confirmPassword: string,
): { valid: boolean; error: string | null } {
  if (password !== confirmPassword) {
    return { valid: false, error: "Passwords do not match" }
  }
  return { valid: true, error: null }
}
