/**
 * Core authentication types
 * Platform-agnostic interfaces for authentication
 */

// Base user interface
export interface AuthUser {
  id: string
  email?: string | null
  emailVerified?: boolean
  metadata?: Record<string, any>
  createdAt?: string
}

// Session information
export interface AuthSession {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
  user: AuthUser
}

// Authentication credentials
export interface AuthCredentials {
  email: string
  password: string
}

// Authentication result
export interface AuthResult {
  success: boolean
  user?: AuthUser | null
  session?: AuthSession | null
  error?: AuthError | null
}

// Error interface
export interface AuthError {
  code: string
  message: string
  status?: number
  originalError?: any
}

// Password reset request
export interface PasswordResetRequest {
  email: string
}

// Password reset result
export interface PasswordResetResult {
  success: boolean
  error?: AuthError | null
}

// Password update request
export interface PasswordUpdateRequest {
  password: string
}

// Password update result
export interface PasswordUpdateResult {
  success: boolean
  error?: AuthError | null
}

// Auth provider interface
export interface AuthProvider {
  // Session management
  getSession(): Promise<AuthSession | null>
  getUser(): Promise<AuthUser | null>

  // Authentication methods
  signIn(credentials: AuthCredentials): Promise<AuthResult>
  signUp(credentials: AuthCredentials): Promise<AuthResult>
  signOut(): Promise<void>

  // Password management
  resetPassword(email: string): Promise<PasswordResetResult>
  updatePassword(password: string): Promise<PasswordUpdateResult>

  // Verification
  verifyOtp(otp: string): Promise<AuthResult>
  refreshSession(): Promise<AuthSession | null>

  // Event handling
  onAuthStateChange(callback: (event: AuthEvent, session: AuthSession | null) => void): () => void
}

// Auth events
export type AuthEvent =
  | "SIGNED_IN"
  | "SIGNED_OUT"
  | "USER_UPDATED"
  | "PASSWORD_RECOVERY"
  | "TOKEN_REFRESHED"
  | "OTP_EXPIRED"

// Auth error codes
export enum AuthErrorCode {
  // Network errors
  NETWORK_ERROR = "auth/network-error",
  TIMEOUT = "auth/timeout",

  // Credential errors
  INVALID_EMAIL = "auth/invalid-email",
  INVALID_PASSWORD = "auth/invalid-password",
  USER_NOT_FOUND = "auth/user-not-found",
  WRONG_PASSWORD = "auth/wrong-password",
  EMAIL_IN_USE = "auth/email-in-use",

  // Session errors
  EXPIRED_SESSION = "auth/expired-session",
  INVALID_SESSION = "auth/invalid-session",

  // OTP errors
  OTP_EXPIRED = "auth/otp-expired",
  INVALID_OTP = "auth/invalid-otp",

  // Email errors
  EMAIL_SEND_FAILED = "auth/email-send-failed",

  // Server errors
  SERVER_ERROR = "auth/server-error",

  // Unknown
  UNKNOWN_ERROR = "auth/unknown-error",
}
