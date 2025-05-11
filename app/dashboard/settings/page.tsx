import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Manage your general application settings</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Configure your application preferences and settings here.</p>
        </CardContent>
      </Card>
    </div>
  )
}
