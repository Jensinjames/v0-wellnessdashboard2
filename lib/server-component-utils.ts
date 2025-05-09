import { cache } from "react"
import { createServerSupabaseClient } from "@/lib/supabase-server"

// Create a cached version of the Supabase client
export const getServerSupabase = cache(async () => {
  return await createServerSupabaseClient()
})

// Create cached data fetchers
export const getUserProfile = cache(async (userId: string) => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user profile:", error)
    return null
  }

  return data
})

export const getCategories = cache(async (userId: string) => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data
})

export const getDashboardStats = cache(async (userId: string) => {
  const supabase = getServerSupabase()
  const { data, error } = await supabase.from("dashboard_stats").select("*").eq("user_id", userId).single()

  if (error) {
    console.error("Error fetching dashboard stats:", error)
    return null
  }

  return data
})
