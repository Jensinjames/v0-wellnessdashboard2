/**
 * Authentication Types
 * TypeScript definitions for authentication-related data
 */
import type { Profile } from "./database"

// User profile type
export type UserProfile = Profile

// Profile form data for updates
export interface ProfileFormData {
  first_name?: string | null
  last_name?: string | null
  avatar_url?: string | null
  phone?: string | null
  email_verified?: boolean
  phone_verified?: boolean
}

// Authentication credentials
export interface AuthCredentials {
  email: string
  password: string
}

// Authentication result
export interface AuthResult {
  error: Error | null
  user?: any
  session?: any
  fieldErrors?: Record<string, string>
}

// Sign-up result
export interface SignUpResult extends AuthResult {
  emailVerificationSent?: boolean
}

// Password reset request
export interface PasswordResetRequest {
  email: string
}

// Password reset result
export interface PasswordResetResult {
  success: boolean
  error: string | null
}

// Password update request
export interface PasswordUpdateRequest {
  password: string
}

// Password update result
export interface PasswordUpdateResult {
  success: boolean
  error: string | null
}

// Verification status
export interface VerificationStatus {
  email_verified: boolean
  phone_verified: boolean
}

// Verification token
export interface VerificationToken {
  token: string
  expires_at: string
}

export interface ProfileCompletionStatus {
  isComplete: boolean
  missingFields: string[]
  completionPercentage: number
}

export interface AuthError {
  code: string
  message: string
  status?: number
}

export type VerificationType = "email" | "phone"

export interface VerificationRequest {
  userId: string
  type: VerificationType
  value: string
}

export interface VerificationResponse {
  success: boolean
  message: string
  expiresAt?: string
}

export interface VerificationSubmission {
  userId: string
  type: VerificationType
  code: string
}
