import type React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/server-auth"

interface ProtectedRouteProps {
  children: React.ReactNode
  redirectTo?: string
}

export default async function ProtectedRoute({ children, redirectTo = "/auth/sign-in" }: ProtectedRouteProps) {
  try {
    const session = await getServerSession()

    if (!session) {
      // Instead of directly calling redirect, we'll return null and handle the redirect
      redirect(redirectTo)
    }

    return <>{children}</>
  } catch (error) {
    // If the error is a redirect, we'll just return null
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      return null
    }

    // For other errors, we'll log them and show an error message
    console.error("Protected route error:", error)
    return (
      <div className="p-4 text-red-500">
        <h2 className="text-lg font-bold">Authentication Error</h2>
        <p>There was a problem verifying your authentication status.</p>
      </div>
    )
  }
}
