import type { Database } from "./database"

export type UserProfile = Database["public"]["Tables"]["profiles"]["Row"]

export interface ProfileFormData {
  first_name: string
  last_name: string
  avatar_url?: string | null
}
