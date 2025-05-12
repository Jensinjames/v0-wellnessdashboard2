"use client"

import { useAuth } from "@/providers/auth-provider"

export function AuthStatus() {
  const { isAuthenticated, isLoading, user } = useAuth()

  if (isLoading) {
    return <div>Loading authentication status...</div>
  }

  if (isAuthenticated) {
    return <div>Logged in as: {user?.email}</div>
  }

  return <div>Not authenticated</div>
}
