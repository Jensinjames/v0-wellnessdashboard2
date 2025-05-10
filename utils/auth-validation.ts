export function validateEmail(email: string): string | undefined {
  if (!email) {
    return "Email is required"
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address"
  }

  return undefined
}

export function validatePassword(password: string): string | undefined {
  if (!password) {
    return "Password is required"
  }

  if (password.length < 6) {
    return "Password must be at least 6 characters"
  }

  return undefined
}

// Add the missing sanitizeEmail function
export function sanitizeEmail(email: string): string {
  // Trim whitespace and convert to lowercase
  return email.trim().toLowerCase()
}

// Add the missing validateAuthCredentials function
export function validateAuthCredentials(
  email: string,
  password: string,
): {
  isValid: boolean
  fieldErrors: { email?: string; password?: string }
} {
  const fieldErrors: { email?: string; password?: string } = {}

  const emailError = validateEmail(email)
  if (emailError) {
    fieldErrors.email = emailError
  }

  const passwordError = validatePassword(password)
  if (passwordError) {
    fieldErrors.password = passwordError
  }

  return {
    isValid: Object.keys(fieldErrors).length === 0,
    fieldErrors,
  }
}
