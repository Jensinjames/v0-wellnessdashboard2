import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, BarChart2, Calendar, Activity } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/wellness">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="mr-2 h-5 w-5" />
                Wellness
              </CardTitle>
              <CardDescription>Track your wellness metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Monitor your health, faith, work, and life balance</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/goals">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart2 className="mr-2 h-5 w-5" />
                Goals
              </CardTitle>
              <CardDescription>Set and track your goals</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Create and monitor progress on your personal goals</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/calendar">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Calendar
              </CardTitle>
              <CardDescription>View your schedule</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Manage your time and schedule activities</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/activity">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Activity
              </CardTitle>
              <CardDescription>Track your activities</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Monitor your daily activities and progress</p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
