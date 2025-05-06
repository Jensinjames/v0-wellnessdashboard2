import type { Database } from "./database"

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"]

export interface ProfileFormData {
  first_name: string
  last_name: string
  avatar_url?: string | null
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
