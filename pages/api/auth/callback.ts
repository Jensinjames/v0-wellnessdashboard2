import type { NextApiRequest, NextApiResponse } from "next"
import { createClient } from "@supabase/supabase-js"
import { serialize } from "cookie"
import type { Database } from "@/types/database"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { code, error, error_description } = req.query
  const next = (req.query.next as string) || "/dashboard"

  // If there's an error, redirect to the sign-in page with the error
  if (error) {
    console.error("Auth callback error:", error, error_description)
    return res.redirect(
      `/auth/sign-in?error=${encodeURIComponent((error_description as string) || "Authentication error")}`,
    )
  }

  // If there's no code, redirect to the sign-in page
  if (!code) {
    console.warn("No code provided in auth callback")
    return res.redirect("/auth/sign-in")
  }

  try {
    // Create a Supabase client
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
      },
    )

    // Exchange the code for a session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code as string)

    if (exchangeError) {
      console.error("Error exchanging code for session:", exchangeError)
      return res.redirect(`/auth/sign-in?error=${encodeURIComponent(exchangeError.message)}`)
    }

    if (!data.session) {
      console.warn("No session created after code exchange")
      return res.redirect("/auth/sign-in?error=Failed to create session")
    }

    // Set the session cookies
    const { access_token, refresh_token } = data.session

    // Set cookies with appropriate settings
    res.setHeader("Set-Cookie", [
      serialize("sb-access-token", access_token, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60, // 1 hour
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      }),
      serialize("sb-refresh-token", refresh_token, {
        path: "/",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7, // 7 days
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      }),
    ])

    // Check if the user's email is confirmed
    if (data.session.user?.email_confirmed_at) {
      // Check if the user has a profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.session.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error checking user profile:", profileError)
      }

      // If the user doesn't have a profile, create one
      if (!profile) {
        try {
          // Create a basic profile
          await supabase.from("profiles").insert({
            id: data.session.user.id,
            email: data.session.user.email,
            updated_at: new Date().toISOString(),
          })

          // Redirect to profile completion page
          return res.redirect("/profile/complete")
        } catch (error) {
          console.error("Error creating user profile:", error)
          // Continue to dashboard even if profile creation fails
          return res.redirect(next)
        }
      }

      // Check if the profile is complete
      const isProfileComplete = Boolean(profile.first_name && profile.last_name && profile.email)

      // If profile is incomplete, redirect to profile completion
      if (!isProfileComplete) {
        return res.redirect("/profile/complete")
      }

      // User has a complete profile, redirect to the next URL or dashboard
      return res.redirect(next)
    }

    // If the user is not confirmed, redirect to the verify email page
    return res.redirect("/auth/verify-email")
  } catch (error) {
    console.error("Unexpected error in auth callback:", error)
    return res.redirect("/auth/sign-in?error=An unexpected error occurred")
  }
}
