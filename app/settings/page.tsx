export default function SettingsPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <p className="mb-8">Manage your account settings and preferences.</p>

      <div className="space-y-6">
        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Appearance</h2>
          <p>Theme settings and display preferences.</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <p>Configure how and when you receive notifications.</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Data & Privacy</h2>
          <p>Manage your data and privacy preferences.</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Account</h2>
          <p>Update your account information and password.</p>
        </div>
      </div>
    </div>
  )
}
