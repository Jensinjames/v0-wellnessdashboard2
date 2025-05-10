import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/database"
import { cookies } from "next/headers"

export function createServerClient() {
  const cookieStore = cookies()
  const token = cookieStore.get("sb:token")?.value

  return createClient<Database>(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    global: {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    },
  })
}
