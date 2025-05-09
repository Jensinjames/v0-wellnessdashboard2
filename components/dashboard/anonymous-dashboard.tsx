"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AnonymousUserBanner } from "@/components/auth/anonymous-user-banner"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function AnonymousDashboard() {
  const [isLoading, setIsLoading] = useState(false)
  const [demoData, setDemoData] = useState<any[]>([])
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    // Load some demo data for anonymous users
    const loadDemoData = async () => {
      try {
        // This is just an example - adjust based on your actual data model
        const { data, error } = await supabase.from("categories").select("*").limit(5)

        if (!error && data) {
          setDemoData(data)
        }
      } catch (error) {
        console.error("Error loading demo data:", error)
      }
    }

    loadDemoData()
  }, [supabase])

  const handleSignOut = async () => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      router.push("/auth/sign-in")
    } catch (error) {
      console.error("Error signing out:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <AnonymousUserBanner />

      <h1 className="text-3xl font-bold">Welcome to Demo Mode</h1>
      <p className="text-gray-600">
        You're using the application with an anonymous account. Explore the features without creating an account.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Demo Features</CardTitle>
            <CardDescription>Explore what the application offers</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Track your wellness goals</li>
              <li>Create and manage categories</li>
              <li>View your progress over time</li>
              <li>Set reminders and notifications</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sample Data</CardTitle>
            <CardDescription>Pre-populated data for exploration</CardDescription>
          </CardHeader>
          <CardContent>
            {demoData.length > 0 ? (
              <ul className="space-y-2">
                {demoData.map((item) => (
                  <li key={item.id} className="p-2 bg-gray-50 rounded">
                    {item.name || item.title || JSON.stringify(item)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No sample data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Create an Account</CardTitle>
            <CardDescription>Save your progress and get more features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Create an account to save your data and access all features, including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Data synchronization across devices</li>
              <li>Personalized recommendations</li>
              <li>Advanced analytics and insights</li>
            </ul>
            <div className="flex space-x-2 pt-2">
              <Button onClick={() => router.push("/auth/sign-up")} className="flex-1">
                Sign Up
              </Button>
              <Button variant="outline" onClick={handleSignOut} disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing Out...
                  </>
                ) : (
                  "Exit Demo"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
