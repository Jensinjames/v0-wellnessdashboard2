/**
 * Utility to debug Supabase environment variables and configuration
 */
export function debugSupabaseConfig() {
  // Only run in development
  if (process.env.NODE_ENV !== "development") {
    console.log("Supabase debug only available in development mode")
    return
  }

  console.group("Supabase Configuration Debug")

  // Check environment variables
  console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing")
  console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing")

  // Check URL format
  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      new URL(process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log("Supabase URL format: ✅ Valid")
    } catch (e) {
      console.log("Supabase URL format: ❌ Invalid")
    }
  }

  // Check for common issues
  if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.includes("eyJ")) {
    console.log("Anon key format: ✅ Looks valid (starts with eyJ)")
  } else {
    console.log("Anon key format: ⚠️ May be invalid (should start with eyJ)")
  }

  console.groupEnd()
}

/**
 * Add this to _app.tsx or a component that loads early to debug Supabase config
 */
export function SupabaseDebugger() {
  if (process.env.NODE_ENV !== "development") {
    return null
  }

  // Run debug on mount
  if (typeof window !== "undefined") {
    setTimeout(() => {
      debugSupabaseConfig()
    }, 0)
  }

  return null
}
