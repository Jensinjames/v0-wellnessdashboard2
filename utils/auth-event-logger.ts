import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/types/database"
import { createLogger } from "@/utils/logger"

const logger = createLogger("AuthEventLogger")

type AuthAction = "login" | "logout" | "signup" | "failed_login" | "password_reset" | "email_verification"

/**
 * Log an authentication event to the user_changes_log table
 */
export async function logAuthEvent(
  userId: string,
  action: AuthAction,
  oldValues?: Record<string, any>,
  newValues?: Record<string, any>,
): Promise<boolean> {
  try {
    const supabase = createClientComponentClient<Database>()

    const { error } = await supabase.from("user_changes_log").insert({
      user_id: userId,
      action,
      old_values: oldValues || null,
      new_values: newValues || null,
      ip_address: "127.0.0.1", // In a real app, you'd get the actual IP
    })

    if (error) {
      logger.error(`Failed to log auth event (${action}):`, error)
      return false
    }

    logger.info(`Auth event logged: ${action}`, { userId })
    return true
  } catch (error) {
    logger.error(`Unexpected error logging auth event (${action}):`, error)
    return false
  }
}

/**
 * Test function to generate sample auth logs
 */
export async function generateSampleAuthLogs(userId: string, count = 5): Promise<boolean> {
  try {
    const actions: AuthAction[] = ["login", "logout", "failed_login", "signup", "password_reset"]
    const promises = []

    for (let i = 0; i < count; i++) {
      const randomAction = actions[Math.floor(Math.random() * actions.length)]
      promises.push(logAuthEvent(userId, randomAction, { previous: "value" }, { new: "value" }))
    }

    await Promise.all(promises)
    return true
  } catch (error) {
    logger.error("Failed to generate sample auth logs:", error)
    return false
  }
}
