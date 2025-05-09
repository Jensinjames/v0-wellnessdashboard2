import type { Database } from "./database"

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"]

export interface ProfileFormData {
  first_name: string
  last_name: string
  avatar_url?: string | null
  phone?: string | null
  is_anonymous?: boolean
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

export interface VerificationStatus {
  emailVerified: boolean
  phoneVerified: boolean
  hasPhone: boolean
  hasEmail: boolean
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

export interface AuthState {
  user: any | null
  profile: UserProfile | null
  session: any | null
  isLoading: boolean
  isAnonymous: boolean
}
