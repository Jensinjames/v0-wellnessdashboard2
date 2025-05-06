import { Navigation } from "@/components/navigation"
import { GoalForm } from "@/components/goals/goal-form"
import { getGoals } from "@/app/actions/goals"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { defaultGoals } from "@/types/wellness"
import { CACHE_KEYS } from "@/lib/cache-utils"

export default async function GoalsPage() {
  // Get the current user
  const supabase = createServerSupabaseClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id

  // Fetch goals if we have a user
  let goals = undefined
  if (userId) {
    try {
      goals = await getGoals(userId)

      // If no goals were returned, use defaults
      if (goals.length === 0) {
        goals = defaultGoals
      }
    } catch (error) {
      console.error("Error fetching goals:", error)
      // Use defaults if there's an error
      goals = defaultGoals
    }
  }

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8">
        <GoalForm initialGoals={goals} cacheKey={userId ? CACHE_KEYS.GOALS(userId) : undefined} />
      </div>
    </>
  )
}
