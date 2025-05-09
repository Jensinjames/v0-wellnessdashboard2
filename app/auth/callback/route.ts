import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Exchange the code for a session
    await supabase.auth.exchangeCodeForSession(code)

    // Update the last_sign_in_at field in the profiles table
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        // Update the last_sign_in_at field
        await supabase
          .from("profiles")
          .update({
            last_sign_in_at: new Date().toISOString(),
            login_count: supabase.rpc("increment_login_count", { user_id: user.id }),
          })
          .eq("id", user.id)
      }
    } catch (error) {
      console.error("Error updating last_sign_in_at:", error)
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(requestUrl.origin + "/dashboard")
}
