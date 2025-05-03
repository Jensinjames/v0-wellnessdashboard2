import { SettingsForm } from "@/components/settings/settings-form"

export default function SettingsPage() {
  return (
    <div className="container py-8 dashboard-component">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <p className="mb-8 text-muted-foreground">Manage your account settings and preferences.</p>
      <SettingsForm />
    </div>
  )
}
