/**
 * Utility functions for data validation
 */

import type { UserProfile } from "@/types/profile"

interface ValidationResult {
  isValid: boolean
  errors: string[]
}

/**
 * Validates user data before saving to the database
 */
export function validateUserData(userData: Partial<UserProfile>): ValidationResult {
  const errors: string[] = []

  // Check required fields
  if (!userData.id) {
    errors.push("User ID is required")
  }

  if (!userData.email) {
    errors.push("Email is required")
  } else if (!isValidEmail(userData.email)) {
    errors.push("Email format is invalid")
  }

  // Validate email format if present
  if (userData.email && !isValidEmail(userData.email)) {
    errors.push("Email format is invalid")
  }

  // Validate URL formats if present
  if (userData.avatar_url && !isValidUrl(userData.avatar_url)) {
    errors.push("Avatar URL format is invalid")
  }

  if (userData.website && !isValidUrl(userData.website)) {
    errors.push("Website URL format is invalid")
  }

  // Check data types
  if (userData.email_notifications !== undefined && typeof userData.email_notifications !== "boolean") {
    errors.push("Email notifications must be a boolean value")
  }

  // Check date formats
  if (userData.created_at && !isValidISODate(userData.created_at)) {
    errors.push("Created at date format is invalid")
  }

  if (userData.updated_at && !isValidISODate(userData.updated_at)) {
    errors.push("Updated at date format is invalid")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validates URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch (error) {
    return false
  }
}

/**
 * Validates ISO date format
 */
export function isValidISODate(dateString: string): boolean {
  try {
    const date = new Date(dateString)
    return !isNaN(date.getTime()) && date.toISOString() === dateString
  } catch (error) {
    return false
  }
}

/**
 * Validates password strength
 */
export function validatePasswordStrength(password: string): ValidationResult {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long")
  }

  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter")
  }

  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter")
  }

  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number")
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}
