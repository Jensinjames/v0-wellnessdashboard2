import { createServerSupabaseClient } from "@/lib/supabase-server"
import type { WellnessCategory } from "@/types/wellness"

export async function CategoriesServer() {
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
    <div>
      <h1>Categories</h1>
      <ul>
        {categories.map((category: WellnessCategory) => (
          <li key={category.id}>
            <div className="flex items-center">
              <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
              {category.name}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
