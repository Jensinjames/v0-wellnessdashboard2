/**
 * Validates that a value is a non-empty string
 */
export function isValidString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0
}

/**
 * Validates email format
 */
export function isValidEmail(email: unknown): boolean {
  if (!isValidString(email)) return false

  // RFC 5322 compliant email regex
  const emailRegex =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  return emailRegex.test(email.trim())
}

/**
 * Validates password strength
 */
export function isValidPassword(password: unknown): boolean {
  if (!isValidString(password)) return false

  // Minimum 8 characters
  return password.length >= 8
}

/**
 * Validates authentication credentials
 */
export function validateAuthCredentials(
  email: unknown,
  password: unknown,
): {
  valid: boolean
  errors: { email?: string; password?: string }
} {
  const errors: { email?: string; password?: string } = {}

  // Validate email
  if (!isValidString(email)) {
    errors.email = "Email must be a non-empty string"
  } else if (!isValidEmail(email)) {
    errors.email = "Invalid email format"
  }

  // Validate password
  if (!isValidString(password)) {
    errors.password = "Password must be a non-empty string"
  } else if (!isValidPassword(password)) {
    errors.password = "Password must be at least 8 characters"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Sanitizes email input
 */
export function sanitizeEmail(email: unknown): string {
  if (!isValidString(email)) return ""
  return email.trim().toLowerCase()
}
