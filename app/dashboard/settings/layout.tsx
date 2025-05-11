import type React from "react"
import { Suspense } from "react"
import { SettingsNav } from "@/components/settings/settings-nav"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col space-y-6">
        <div className="border-b pb-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your account and application settings</p>
        </div>
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="md:w-64 shrink-0">
            <Suspense fallback={<div className="h-6 w-32 bg-gray-200 animate-pulse rounded"></div>}>
              <SettingsNav />
            </Suspense>
          </aside>
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </div>
  )
}
