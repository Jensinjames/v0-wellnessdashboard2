"use client"

import { useEffect } from "react"

export default function SupabaseDebug() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") {
      return
    }

    console.group("Supabase Auth Debug")

    // Check environment variables
    console.log("NEXT_PUBLIC_SUPABASE_URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ Set" : "❌ Missing")
    console.log("NEXT_PUBLIC_SUPABASE_ANON_KEY:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✅ Set" : "❌ Missing")

    // Log URL for verification
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    }

    console.groupEnd()
  }, [])

  return null
}
