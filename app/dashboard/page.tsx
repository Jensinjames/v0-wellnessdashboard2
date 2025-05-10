import { createClient } from "@/utils/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default async function DashboardPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Welcome to Your Wellness Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Faith</CardTitle>
            <CardDescription>Daily spiritual practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming soon</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Life</CardTitle>
            <CardDescription>Personal development</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming soon</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Work</CardTitle>
            <CardDescription>Professional growth</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming soon</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Health</CardTitle>
            <CardDescription>Physical wellbeing</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Coming soon</div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500">Welcome, {user?.email}! Your wellness journey is just beginning.</p>
      </div>
    </div>
  )
}
