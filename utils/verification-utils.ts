import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import type { VerificationType, VerificationStatus } from "@/types/auth"

/**
 * Generate a random verification code
 */
export function generateVerificationCode(length = 6): string {
  return Math.floor(Math.random() * Math.pow(10, length))
    .toString()
    .padStart(length, "0")
}

/**
 * Calculate expiration time for verification tokens
 */
export function getVerificationExpiry(minutes = 15): string {
  const expiryDate = new Date()
  expiryDate.setMinutes(expiryDate.getMinutes() + minutes)
  return expiryDate.toISOString()
}

/**
 * Check if a verification token is expired
 */
export function isVerificationExpired(expiryDateString: string | null): boolean {
  if (!expiryDateString) return true

  const expiryDate = new Date(expiryDateString)
  const now = new Date()

  return now > expiryDate
}

/**
 * Format a phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Basic formatting for US numbers
  if (phone.length === 10) {
    return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`
  }

  // International format
  if (phone.startsWith("+")) {
    return phone
  }

  // Default format
  return phone
}

/**
 * Normalize a phone number for storage
 */
export function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  return phone.replace(/\D/g, "")
}

/**
 * Validate a phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  // Basic validation - can be expanded for international numbers
  const normalized = normalizePhoneNumber(phone)
  return normalized.length >= 10 && normalized.length <= 15
}

/**
 * Get verification status for a user
 */
export async function getVerificationStatus(userId: string): Promise<VerificationStatus> {
  const supabase = createClientComponentClient<Database>()

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, email_verified, phone, phone_verified")
      .eq("id", userId)
      .single()

    if (error) {
      console.error("Error fetching verification status:", error)
      return {
        emailVerified: false,
        phoneVerified: false,
        hasEmail: false,
        hasPhone: false,
      }
    }

    return {
      emailVerified: data.email_verified || false,
      phoneVerified: data.phone_verified || false,
      hasEmail: !!data.email,
      hasPhone: !!data.phone,
    }
  } catch (error) {
    console.error("Unexpected error fetching verification status:", error)
    return {
      emailVerified: false,
      phoneVerified: false,
      hasEmail: false,
      hasPhone: false,
    }
  }
}

/**
 * Mask an email address for display
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes("@")) return email

  const [username, domain] = email.split("@")
  const maskedUsername = username.length > 2 ? `${username.slice(0, 2)}${"*".repeat(username.length - 2)}` : username

  return `${maskedUsername}@${domain}`
}

/**
 * Mask a phone number for display
 */
export function maskPhone(phone: string): string {
  if (!phone) return phone

  const normalized = normalizePhoneNumber(phone)
  if (normalized.length < 4) return phone

  return `${"*".repeat(normalized.length - 4)}${normalized.slice(-4)}`
}

/**
 * Get the appropriate verification value based on type
 */
export function getVerificationValue(
  type: VerificationType,
  email: string | null,
  phone: string | null,
): string | null {
  if (type === "email") return email
  if (type === "phone") return phone
  return null
}
