import type { ReactNode } from "react"
import { ProfileCompletionBanner } from "@/components/profile/completion-banner"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <ProfileCompletionBanner />
      <div className="flex-1">{children}</div>
    </div>
  )
}
