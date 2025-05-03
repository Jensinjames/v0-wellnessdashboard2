import type React from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MobileNav } from "@/components/mobile-nav"
import { SessionErrorBoundary } from "@/components/auth/session-error-boundary"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard>
      <SessionErrorBoundary>
        <div className="flex min-h-screen flex-col md:flex-row">
          <DashboardSidebar />
          <main className="flex-1 dashboard-component">{children}</main>
          <MobileNav />
        </div>
      </SessionErrorBoundary>
    </AuthGuard>
  )
}
