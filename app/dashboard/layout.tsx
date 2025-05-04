import type React from "react"
import { Header } from "@/components/nav/header"
import { Sidebar } from "@/components/nav/sidebar"
import { ProfileCompletionBanner } from "@/components/profile/completion-banner"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <ProfileCompletionBanner />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  )
}
