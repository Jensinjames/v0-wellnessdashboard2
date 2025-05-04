"use client"

import { AppearanceSettings } from "@/components/settings/appearance-settings"
import { SettingsLayout } from "@/components/settings/settings-layout"

export default function AppearancePage() {
  return (
    <SettingsLayout>
      <AppearanceSettings />
    </SettingsLayout>
  )
}
