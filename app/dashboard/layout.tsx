import { createServerClient } from "@/utils/supabase-server"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"
import { DashboardHeader } from "@/components/dashboard/header"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = createServerClient()

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If not authenticated, redirect to login
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Dashboard header with user info from session */}
      <DashboardHeader user={session.user} />

      {/* Main content */}
      <main className="flex-1 container mx-auto px-4 py-6">{children}</main>
    </div>
  )
}
