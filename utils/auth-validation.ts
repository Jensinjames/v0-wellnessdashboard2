import { createLogger } from "@/utils/logger"

// Create a dedicated logger
const logger = createLogger("AuthValidation")

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

// Password validation regex
const PASSWORD_REGEX = {
  UPPERCASE: /[A-Z]/,
  LOWERCASE: /[a-z]/,
  NUMBER: /[0-9]/,
  SPECIAL: /[^A-Za-z0-9]/,
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  if (!email) return false
  return EMAIL_REGEX.test(email)
}

/**
 * Validate password strength
 */
export function validatePasswordStrength(password: string): {
  score: number
  isStrongEnough: boolean
  feedback: string[]
} {
  if (!password) {
    return { score: 0, isStrongEnough: false, feedback: ["Password is required"] }
  }

  let score = 0
  const feedback: string[] = []

  // Length check
  if (password.length < 8) {
    feedback.push("Password should be at least 8 characters long")
  } else {
    score += 1
  }

  // Uppercase check
  if (!PASSWORD_REGEX.UPPERCASE.test(password)) {
    feedback.push("Add uppercase letters")
  } else {
    score += 1
  }

  // Lowercase check
  if (!PASSWORD_REGEX.LOWERCASE.test(password)) {
    feedback.push("Add lowercase letters")
  } else {
    score += 1
  }

  // Number check
  if (!PASSWORD_REGEX.NUMBER.test(password)) {
    feedback.push("Add numbers")
  } else {
    score += 1
  }

  // Special character check
  if (!PASSWORD_REGEX.SPECIAL.test(password)) {
    feedback.push("Add special characters")
  } else {
    score += 1
  }

  // Length bonus
  if (password.length >= 12) {
    score += 1
  }

  // Variety bonus
  const variety =
    (PASSWORD_REGEX.UPPERCASE.test(password) ? 1 : 0) +
    (PASSWORD_REGEX.LOWERCASE.test(password) ? 1 : 0) +
    (PASSWORD_REGEX.NUMBER.test(password) ? 1 : 0) +
    (PASSWORD_REGEX.SPECIAL.test(password) ? 1 : 0)

  if (variety >= 3 && password.length >= 10) {
    score += 1
  }

  // Final feedback
  if (score >= 6) {
    feedback.length = 0
    feedback.push("Password is strong")
  }

  return {
    score,
    isStrongEnough: score >= 4,
    feedback,
  }
}

/**
 * Validate password
 */
export function validatePassword(password: string): boolean {
  if (!password) return false
  if (password.length < 8) return false
  return true
}

/**
 * Sanitize email
 */
export function sanitizeEmail(email: string): string {
  if (!email) return ""

  // Trim whitespace
  const trimmed = email.trim().toLowerCase()

  // Basic validation
  if (!validateEmail(trimmed)) {
    return ""
  }

  return trimmed
}

/**
 * Validate auth credentials
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
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters"
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  }
}

/**
 * Check if a password has been compromised in data breaches
 * Uses the k-anonymity model with the Pwned Passwords API
 */
export async function checkPasswordCompromised(
  password: string,
): Promise<{ compromised: boolean; occurrences: number; error: string | null }> {
  try {
    if (!password || password.length < 8) {
      return { compromised: false, occurrences: 0, error: "Password too short" }
    }

    // Generate SHA-1 hash of the password
    const encoder = new TextEncoder()
    const data = encoder.encode(password)
    const hashBuffer = await crypto.subtle.digest("SHA-1", data)

    // Convert hash to hex string
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")

    // Split the hash for k-anonymity
    const prefix = hashHex.substring(0, 5).toUpperCase()
    const suffix = hashHex.substring(5).toUpperCase()

    // Query the Pwned Passwords API
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        "Add-Padding": "true", // Adds padding to prevent leaking information
        "User-Agent": "WellnessDashboard-PasswordCheck/1.0",
      },
    })

    if (!response.ok) {
      return { compromised: false, occurrences: 0, error: `API error: ${response.status}` }
    }

    // Parse the response
    const text = await response.text()
    const lines = text.split("\n")

    // Look for our hash suffix
    for (const line of lines) {
      const [hashSuffix, count] = line.split(":")

      if (hashSuffix.trim() === suffix) {
        const occurrences = Number.parseInt(count.trim(), 10)
        return { compromised: true, occurrences, error: null }
      }
    }

    // Password not found in breaches
    return { compromised: false, occurrences: 0, error: null }
  } catch (error) {
    logger.error("Error checking password security:", error)
    return { compromised: false, occurrences: 0, error: "Failed to check password security" }
  }
}
