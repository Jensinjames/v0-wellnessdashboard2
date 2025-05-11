import type React from "react"
import { Suspense } from "react"
import { DashboardNav } from "@/components/dashboard/dashboard-nav"
import { UserNav } from "@/components/dashboard/user-nav"
import { EmergencyAccessBanner } from "@/components/dashboard/emergency-access-banner"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <EmergencyAccessBanner />
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Suspense fallback={<div className="h-6 w-32 bg-gray-200 animate-pulse rounded" aria-hidden="true"></div>}>
            <DashboardNav />
          </Suspense>
          <UserNav />
        </div>
      </header>
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  )
}
