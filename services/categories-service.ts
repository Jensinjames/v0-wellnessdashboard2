import { getSupabaseClient, getServerSupabaseClient } from "@/lib/supabase-client"

// Client-side fetch categories
export async function fetchCategories(userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId).order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    throw error
  }

  return data || []
}

// Server-side fetch categories
export async function fetchCategoriesServer(userId: string) {
  const supabase = await getServerSupabaseClient()

  const { data, error } = await supabase.from("categories").select("*").eq("user_id", userId).order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    throw error
  }

  return data || []
}

// Create a new category
export async function createCategory(categoryData: any, userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("categories")
    .insert([{ ...categoryData, user_id: userId }])
    .select()

  if (error) {
    console.error("Error creating category:", error)
    throw error
  }

  return data?.[0]
}

// Update a category
export async function updateCategory(id: string, categoryData: any, userId: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from("categories")
    .update(categoryData)
    .eq("id", id)
    .eq("user_id", userId) // Ensure user can only update their own categories
    .select()

  if (error) {
    console.error("Error updating category:", error)
    throw error
  }

  return data?.[0]
}

// Delete a category
export async function deleteCategory(id: string, userId: string) {
  const supabase = getSupabaseClient()

  const { error } = await supabase.from("categories").delete().eq("id", id).eq("user_id", userId) // Ensure user can only delete their own categories

  if (error) {
    console.error("Error deleting category:", error)
    throw error
  }

  return true
}
