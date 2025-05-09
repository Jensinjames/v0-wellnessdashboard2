"use client"

import type React from "react"

import { AuthProvider } from "@/context/auth-context"
import { ProfileCompletionProvider } from "@/context/profile-completion-context"
import { NavigationProvider } from "@/context/navigation-context"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ProfileCompletionProvider>
        <NavigationProvider>{children}</NavigationProvider>
      </ProfileCompletionProvider>
    </AuthProvider>
  )
}
