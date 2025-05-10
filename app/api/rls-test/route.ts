import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function GET() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

  // Get the current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Test RLS policies by trying to access different profiles
  const { data: ownProfile, error: ownProfileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  // Try to access another profile (this should fail with RLS)
  const { data: otherProfiles, error: otherProfilesError } = await supabase
    .from("profiles")
    .select("*")
    .neq("id", user.id)
    .limit(1)

  return NextResponse.json({
    user: user.id,
    ownProfile: {
      success: !!ownProfile,
      error: ownProfileError?.message,
    },
    otherProfiles: {
      success: !!otherProfiles?.length,
      error: otherProfilesError?.message,
      data: otherProfiles?.length ? "Data leaked!" : "No data (correct)",
    },
  })
}
