import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("AuthLogs")

export interface AuthLogEntry {
  id: string
  userId: string
  action: string
  timestamp: string
  ipAddress?: string
  details?: Record<string, any>
}

/**
 * Fetch recent authentication logs from the user_changes_log table
 */
export async function fetchAuthLogs(limit = 20): Promise<AuthLogEntry[]> {
  try {
    const supabase = createClientComponentClient<Database>()

    const { data, error } = await supabase
      .from("user_changes_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) {
      logger.error("Error fetching auth logs:", error)
      return []
    }

    return (data || []).map((entry) => ({
      id: entry.id,
      userId: entry.user_id,
      action: entry.action,
      timestamp: entry.created_at,
      ipAddress: entry.ip_address,
      details: {
        oldValues: entry.old_values,
        newValues: entry.new_values,
      },
    }))
  } catch (error) {
    logger.error("Unexpected error fetching auth logs:", error)
    return []
  }
}

/**
 * Get authentication statistics
 */
export async function getAuthStats(): Promise<{
  totalLogins: number
  uniqueUsers: number
  failedAttempts: number
  lastActivity: string | null
}> {
  try {
    const supabase = createClientComponentClient<Database>()

    // Get total successful logins
    const { count: totalLogins, error: loginError } = await supabase
      .from("user_changes_log")
      .select("*", { count: "exact", head: true })
      .eq("action", "login")

    // Get unique users
    const { data: uniqueUsersData, error: uniqueError } = await supabase
      .from("user_changes_log")
      .select("user_id")
      .order("created_at", { ascending: false })

    // Get failed attempts
    const { count: failedAttempts, error: failedError } = await supabase
      .from("user_changes_log")
      .select("*", { count: "exact", head: true })
      .eq("action", "failed_login")

    // Get last activity
    const { data: lastActivityData, error: lastActivityError } = await supabase
      .from("user_changes_log")
      .select("created_at")
      .order("created_at", { ascending: false })
      .limit(1)

    if (loginError || uniqueError || failedError || lastActivityError) {
      logger.error("Error fetching auth stats:", {
        loginError,
        uniqueError,
        failedError,
        lastActivityError,
      })
    }

    // Get unique user count by filtering unique IDs
    const uniqueUserIds = new Set((uniqueUsersData || []).map((entry) => entry.user_id))

    return {
      totalLogins: totalLogins || 0,
      uniqueUsers: uniqueUserIds.size,
      failedAttempts: failedAttempts || 0,
      lastActivity: lastActivityData?.[0]?.created_at || null,
    }
  } catch (error) {
    logger.error("Unexpected error fetching auth stats:", error)
    return {
      totalLogins: 0,
      uniqueUsers: 0,
      failedAttempts: 0,
      lastActivity: null,
    }
  }
}
