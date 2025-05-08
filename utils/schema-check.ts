/**
 * Schema Check Utility
 * Provides functions to check and fix database schema issues
 */
import { createLogger } from "@/utils/logger"
import { getSupabaseClient } from "@/lib/supabase-client-core"

const logger = createLogger("SchemaCheck")

// Flag to prevent concurrent schema checks
let isCheckingSchema = false

// Define all required tables in the database schema
export const REQUIRED_TABLES = ["profiles", "categories", "goals", "entries", "user_changes_log"] as const

export type RequiredTable = (typeof REQUIRED_TABLES)[number]

// Define table schemas for creation if needed
const TABLE_SCHEMAS: Record<RequiredTable, string> = {
  profiles: `
    id uuid PRIMARY KEY,
    email text NOT NULL,
    first_name text,
    last_name text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    email_verified boolean DEFAULT false,
    phone text,
    phone_verified boolean DEFAULT false,
    verification_token text,
    verification_token_expires_at timestamp with time zone
  `,
  categories: `
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    description text,
    color text,
    icon text,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
  `,
  goals: `
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    title text NOT NULL,
    description text,
    target_value numeric,
    current_value numeric,
    category_id uuid,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deadline timestamp with time zone,
    status text
  `,
  entries: `
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    value numeric NOT NULL,
    notes text,
    category_id uuid,
    goal_id uuid,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    entry_date timestamp with time zone DEFAULT now()
  `,
  user_changes_log: `
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,
    action text NOT NULL,
    details jsonb,
    created_at timestamp with time zone DEFAULT now()
  `,
}

/**
 * Check if the database schema is properly set up
 */
export async function checkSchema(): Promise<{
  valid: boolean
  issues: string[]
  tableStatus: Record<RequiredTable, boolean>
}> {
  try {
    // First check if the database is accessible
    const dbAccessible = await isDatabaseAccessible()

    if (!dbAccessible) {
      return {
        valid: false,
        issues: ["Database is not accessible"],
        tableStatus: REQUIRED_TABLES.reduce(
          (acc, table) => {
            acc[table] = false
            return acc
          },
          {} as Record<RequiredTable, boolean>,
        ),
      }
    }

    // Check all required tables
    const tableStatus: Record<RequiredTable, boolean> = {} as Record<RequiredTable, boolean>
    const issues: string[] = []

    for (const table of REQUIRED_TABLES) {
      const exists = await doesTableExist(table)
      tableStatus[table] = exists

      if (!exists) {
        issues.push(`Table "${table}" does not exist`)
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      tableStatus,
    }
  } catch (error) {
    logger.error("Error checking schema:", error)
    return {
      valid: false,
      issues: [error instanceof Error ? error.message : "Unknown error checking schema"],
      tableStatus: REQUIRED_TABLES.reduce(
        (acc, table) => {
          acc[table] = false
          return acc
        },
        {} as Record<RequiredTable, boolean>,
      ),
    }
  }
}

/**
 * Check if the database is accessible
 */
async function isDatabaseAccessible(): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Try a simple query that doesn't depend on specific tables
    const { data, error } = await supabase.rpc("get_service_status").select("*")

    if (error) {
      // If RPC fails, try a different approach
      try {
        // Try to get the current timestamp from the database
        const { data: timestamp, error: timestampError } = await supabase.from("_dummy_query").select("*").limit(1)

        // If the error is just that the table doesn't exist, the database is accessible
        return timestampError && timestampError.message.includes("does not exist")
      } catch (fallbackError) {
        logger.error("Error in fallback database check:", fallbackError)
        return false
      }
    }

    return true
  } catch (error) {
    logger.error("Error checking database accessibility:", error)
    return false
  }
}

/**
 * Check if a specific table exists
 */
async function doesTableExist(tableName: string): Promise<boolean> {
  try {
    const supabase = getSupabaseClient()

    // Try to query the table
    const { error } = await supabase.from(tableName).select("*").limit(1)

    // If there's an error about the table not existing, return false
    if (error && error.message && error.message.includes("relation") && error.message.includes("does not exist")) {
      return false
    }

    // If there's no error or a different error, assume the table exists
    return true
  } catch (error) {
    logger.error(`Error checking if ${tableName} exists:`, error)
    return false
  }
}

/**
 * Check and fix schema issues
 */
export async function checkAndFixSchema(): Promise<{
  fixed: boolean
  issues: string[]
  fixedTables: string[]
  failedTables: string[]
}> {
  // Prevent concurrent schema checks
  if (isCheckingSchema) {
    logger.info("Schema check already in progress, skipping")
    return {
      fixed: false,
      issues: ["Schema check already in progress"],
      fixedTables: [],
      failedTables: [],
    }
  }

  isCheckingSchema = true

  try {
    // First check if the schema is valid
    const { valid, issues, tableStatus } = await checkSchema()

    if (valid) {
      return {
        fixed: true,
        issues: [],
        fixedTables: [],
        failedTables: [],
      }
    }

    // Try to fix the issues
    const fixedTables: string[] = []
    const failedTables: string[] = []
    const remainingIssues: string[] = []

    // Get missing tables
    const missingTables = REQUIRED_TABLES.filter((table) => !tableStatus[table])

    if (missingTables.length > 0) {
      try {
        // Call the fix-schema API to create missing tables
        const response = await fetch("/api/fix-schema", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "fix_schema",
            tables: missingTables,
          }),
        })

        if (response.ok) {
          const result = await response.json()

          if (result.success) {
            // Check which tables were actually fixed
            for (const table of missingTables) {
              const nowExists = await doesTableExist(table)

              if (nowExists) {
                fixedTables.push(table)
              } else {
                failedTables.push(table)
                remainingIssues.push(`Failed to create table "${table}"`)
              }
            }
          } else {
            // API reported failure
            failedTables.push(...missingTables)
            remainingIssues.push(`API failed to fix schema: ${result.message || "Unknown error"}`)
          }
        } else {
          // API request failed
          failedTables.push(...missingTables)
          remainingIssues.push(`API request failed with status ${response.status}`)
        }
      } catch (error) {
        logger.error("Error fixing schema:", error)
        failedTables.push(...missingTables)
        remainingIssues.push(error instanceof Error ? error.message : "Unknown error fixing schema")
      }
    }

    return {
      fixed: remainingIssues.length === 0,
      issues: remainingIssues,
      fixedTables,
      failedTables,
    }
  } catch (error) {
    logger.error("Error fixing schema:", error)
    return {
      fixed: false,
      issues: [error instanceof Error ? error.message : "Unknown error fixing schema"],
      fixedTables: [],
      failedTables: REQUIRED_TABLES as unknown as string[],
    }
  } finally {
    // Reset the flag
    isCheckingSchema = false
  }
}

/**
 * Initialize schema check
 * This function checks and fixes schema issues on app startup
 */
export function initSchemaCheck() {
  // Only run in browser
  if (typeof window === "undefined") {
    return
  }

  // Run the schema check after a short delay
  setTimeout(() => {
    checkAndFixSchema()
      .then((result) => {
        if (result.fixed) {
          logger.info("Schema check completed successfully")
          if (result.fixedTables.length > 0) {
            logger.info(`Fixed tables: ${result.fixedTables.join(", ")}`)
          }
        } else {
          logger.warn("Schema check completed with issues:", result.issues)
          if (result.failedTables.length > 0) {
            logger.warn(`Failed to fix tables: ${result.failedTables.join(", ")}`)
          }
          if (result.fixedTables.length > 0) {
            logger.info(`Fixed tables: ${result.fixedTables.join(", ")}`)
          }
        }
      })
      .catch((error) => {
        logger.error("Unhandled error in schema check:", error)
      })
  }, 2000)
}

/**
 * Get the SQL to create a table
 */
export function getTableCreationSQL(tableName: RequiredTable): string | null {
  return TABLE_SCHEMAS[tableName] || null
}

/**
 * Get a minimal schema for a table (for REST API creation)
 */
export function getMinimalTableSchema(tableName: RequiredTable): Record<string, any> {
  switch (tableName) {
    case "profiles":
      return {
        id: "00000000-0000-0000-0000-000000000000",
        email: "system@example.com",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email_verified: false,
        phone_verified: false,
      }
    case "categories":
      return {
        id: "00000000-0000-0000-0000-000000000000",
        name: "System Category",
        user_id: "00000000-0000-0000-0000-000000000000",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    case "goals":
      return {
        id: "00000000-0000-0000-0000-000000000000",
        title: "System Goal",
        user_id: "00000000-0000-0000-0000-000000000000",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    case "entries":
      return {
        id: "00000000-0000-0000-0000-000000000000",
        value: 0,
        user_id: "00000000-0000-0000-0000-000000000000",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        entry_date: new Date().toISOString(),
      }
    case "user_changes_log":
      return {
        id: "00000000-0000-0000-0000-000000000000",
        user_id: "00000000-0000-0000-0000-000000000000",
        action: "system_init",
        created_at: new Date().toISOString(),
      }
    default:
      return {}
  }
}
