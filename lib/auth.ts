import { createServerClient } from "@/utils/supabase-server"

export const authOptions = {
  // Add any NextAuth options here if needed
}

export async function getCurrentUser() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user || null
}

export async function getServerSession() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}
