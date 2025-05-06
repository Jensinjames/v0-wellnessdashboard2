import { Navigation } from "@/components/navigation"
import { CategoryList } from "@/components/categories/category-list"
import { getCategories } from "@/app/actions/categories"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export default async function CategoriesPage() {
  // Get the current user
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  // Fetch categories if we have a user
  let categories = []
  if (userId) {
    try {
      categories = await getCategories(userId)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  // If no categories were returned, use defaults
  if (categories.length === 0) {
    categories = [
      { id: "faith", name: "Faith", color: "#8b5cf6" },
      { id: "life", name: "Life", color: "#ec4899" },
      { id: "work", name: "Work", color: "#f59e0b" },
      { id: "health", name: "Health", color: "#10b981" },
    ]
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8">
        <CategoryList categories={categories} />
      </div>
    </>
  )
}
