"use client"

import { NotificationSettings } from "@/components/settings/notification-settings"
import { SettingsLayout } from "@/components/settings/settings-layout"

export default function NotificationsPage() {
  return (
    <SettingsLayout>
      <NotificationSettings />
    </SettingsLayout>
  )
}
