import { useSupabase } from "@/hooks/use-supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"

// Type for query options
export interface QueryOptions<T> {
  retries?: number
  retryDelay?: number
  requiresAuth?: boolean
  offlineAction?: (...args: any[]) => Promise<T>
  offlineArgs?: any
}

// Helper function to create a reusable query
export function createQuery<T>(
  queryFn: (client: SupabaseClient<Database>) => Promise<T>,
  options: QueryOptions<T> = {},
) {
  const { query } = useSupabase()

  return async () => {
    try {
      return await query(queryFn, options)
    } catch (error) {
      console.error("Query error:", error)
      throw error
    }
  }
}

// Common queries for profiles
export const profileQueries = {
  getProfile: (userId: string) => {
    const { query } = useSupabase()

    return async () => {
      return query((client) => client.from("profiles").select("*").eq("user_id", userId).single(), {
        requiresAuth: true,
      })
    }
  },

  updateProfile: (userId: string, data: any) => {
    const { query } = useSupabase()

    return async () => {
      return query((client) => client.from("profiles").update(data).eq("user_id", userId), { requiresAuth: true })
    }
  },
}

// Common queries for goals
export const goalQueries = {
  getGoals: (userId: string) => {
    const { query } = useSupabase()

    return async () => {
      return query(
        (client) =>
          client
            .from("goals")
            .select(`
              id, 
              title, 
              description,
              target_hours,
              created_at,
              category_id,
              categories(id, name, color)
            `)
            .eq("user_id", userId)
            .order("created_at", { ascending: false }),
        { requiresAuth: true },
      )
    }
  },

  getGoalById: (goalId: string) => {
    const { query } = useSupabase()

    return async () => {
      return query(
        (client) =>
          client
            .from("goals")
            .select(`
              id, 
              title, 
              description,
              target_hours,
              created_at,
              category_id,
              user_id,
              categories(id, name, color)
            `)
            .eq("id", goalId)
            .single(),
        { requiresAuth: true },
      )
    }
  },

  createGoal: (data: any) => {
    const { query } = useSupabase()

    return async () => {
      return query((client) => client.from("goals").insert(data).select().single(), { requiresAuth: true })
    }
  },

  updateGoal: (goalId: string, data: any) => {
    const { query } = useSupabase()

    return async () => {
      return query((client) => client.from("goals").update(data).eq("id", goalId).select().single(), {
        requiresAuth: true,
      })
    }
  },

  deleteGoal: (goalId: string) => {
    const { query } = useSupabase()

    return async () => {
      return query((client) => client.from("goals").delete().eq("id", goalId), { requiresAuth: true })
    }
  },
}

// Common queries for time entries
export const timeEntryQueries = {
  getTimeEntries: (userId: string, limit = 10) => {
    const { query } = useSupabase()

    return async () => {
      return query(
        (client) =>
          client
            .from("time_entries")
            .select(`
              id, 
              start_time, 
              end_time,
              duration,
              notes,
              goal_id,
              goals(id, title, category_id, categories(id, name, color))
            `)
            .eq("user_id", userId)
            .order("start_time", { ascending: false })
            .limit(limit),
        { requiresAuth: true },
      )
    }
  },

  getTimeEntriesForGoal: (goalId: string) => {
    const { query } = useSupabase()

    return async () => {
      return query(
        (client) =>
          client
            .from("time_entries")
            .select(`
              id, 
              start_time, 
              end_time,
              duration,
              notes
            `)
            .eq("goal_id", goalId)
            .order("start_time", { ascending: false }),
        { requiresAuth: true },
      )
    }
  },

  createTimeEntry: (data: any) => {
    const { query } = useSupabase()

    return async () => {
      return query((client) => client.from("time_entries").insert(data).select().single(), { requiresAuth: true })
    }
  },
}

// Common queries for categories
export const categoryQueries = {
  getCategories: (userId: string) => {
    const { query } = useSupabase()

    return async () => {
      return query(
        (client) =>
          client
            .from("categories")
            .select(`
              id, 
              name, 
              color,
              description,
              created_at
            `)
            .eq("user_id", userId)
            .order("name"),
        { requiresAuth: true },
      )
    }
  },

  createCategory: (data: any) => {
    const { query } = useSupabase()

    return async () => {
      return query((client) => client.from("categories").insert(data).select().single(), { requiresAuth: true })
    }
  },
}
