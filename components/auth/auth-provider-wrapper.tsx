import { AuthProvider } from "@/context/auth-context-fixed"
import type { ReactNode } from "react"
import { ClientBoundary } from "@/components/client-boundary"

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  // This is a server component that safely wraps the client-side AuthProvider
  return (
    <ClientBoundary>
      <AuthProvider>{children}</AuthProvider>
    </ClientBoundary>
  )
}
