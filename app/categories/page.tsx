import { Suspense } from "react"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { CategoriesClient } from "./categories-client"
import type { WellnessCategory } from "@/types/wellness"

export const dynamic = "force-dynamic"

export default async function CategoriesPage() {
  const supabase = createServerSupabaseClient()

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please sign in to view categories</div>
  }

  // Get system categories (no user_id) and user's custom categories
  const { data: categories, error } = await supabase
    .from("wellness_categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${user.id}`)
    .order("name")

  if (error) {
    console.error("Error fetching categories:", error)
    return <div>Error loading categories</div>
  }

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Wellness Categories</h1>

      <Suspense fallback={<div>Loading categories...</div>}>
        <CategoriesClient initialCategories={categories as WellnessCategory[]} />
      </Suspense>
    </div>
  )
}
