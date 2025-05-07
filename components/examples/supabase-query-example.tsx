"use client"

import { useState } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { useAuth } from "@/context/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export function SupabaseQueryExample() {
  const { user } = useAuth()
  const { query, isInitialized, isOnline } = useSupabase()
  const [activeTab, setActiveTab] = useState("profiles")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any[] | null>(null)

  const fetchProfiles = async () => {
    if (!user || !isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await query((client) => client.from("profiles").select("*").eq("user_id", user.id).limit(10), {
        requiresAuth: true,
      })

      setData(result.data || [])
    } catch (err: any) {
      console.error("Error fetching profiles:", err)
      setError(err.message || "Failed to fetch profiles")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchGoals = async () => {
    if (!user || !isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await query(
        (client) =>
          client
            .from("goals")
            .select(`
              id, 
              title, 
              description,
              target_hours,
              created_at,
              category_id,
              categories(id, name, color)
            `)
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(10),
        { requiresAuth: true },
      )

      setData(result.data || [])
    } catch (err: any) {
      console.error("Error fetching goals:", err)
      setError(err.message || "Failed to fetch goals")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    if (!user || !isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await query(
        (client) => client.from("categories").select("*").eq("user_id", user.id).order("name", { ascending: true }),
        { requiresAuth: true },
      )

      setData(result.data || [])
    } catch (err: any) {
      console.error("Error fetching categories:", err)
      setError(err.message || "Failed to fetch categories")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTimeEntries = async () => {
    if (!user || !isInitialized) return

    setIsLoading(true)
    setError(null)

    try {
      const result = await query(
        (client) =>
          client
            .from("time_entries")
            .select(`
              id, 
              start_time, 
              end_time,
              duration,
              notes,
              goal_id,
              goals(id, title, category_id, categories(id, name, color))
            `)
            .eq("user_id", user.id)
            .order("start_time", { ascending: false })
            .limit(10),
        { requiresAuth: true },
      )

      setData(result.data || [])
    } catch (err: any) {
      console.error("Error fetching time entries:", err)
      setError(err.message || "Failed to fetch time entries")
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetch = () => {
    switch (activeTab) {
      case "profiles":
        fetchProfiles()
        break
      case "goals":
        fetchGoals()
        break
      case "categories":
        fetchCategories()
        break
      case "timeEntries":
        fetchTimeEntries()
        break
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    setData(null)
    setError(null)
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Query Example</CardTitle>
        <div className="text-sm text-muted-foreground">
          Status: {isInitialized ? (isOnline ? "Online" : "Offline") : "Initializing..."}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-4">
            <TabsTrigger value="profiles">Profiles</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="timeEntries">Time Entries</TabsTrigger>
          </TabsList>

          <div className="mb-4">
            <Button onClick={handleFetch} disabled={isLoading || !isInitialized || !user}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                `Fetch ${activeTab}`
              )}
            </Button>
          </div>

          {error && <div className="p-4 mb-4 bg-red-50 text-red-600 rounded-md">{error}</div>}

          <TabsContent value="profiles" className="mt-0">
            <h3 className="text-lg font-medium mb-2">User Profiles</h3>
            {data && data.length > 0 ? (
              <pre className="p-4 bg-slate-100 rounded-md overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
            ) : data && data.length === 0 ? (
              <p>No profiles found.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="goals" className="mt-0">
            <h3 className="text-lg font-medium mb-2">User Goals</h3>
            {data && data.length > 0 ? (
              <pre className="p-4 bg-slate-100 rounded-md overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
            ) : data && data.length === 0 ? (
              <p>No goals found.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="categories" className="mt-0">
            <h3 className="text-lg font-medium mb-2">Categories</h3>
            {data && data.length > 0 ? (
              <pre className="p-4 bg-slate-100 rounded-md overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
            ) : data && data.length === 0 ? (
              <p>No categories found.</p>
            ) : null}
          </TabsContent>

          <TabsContent value="timeEntries" className="mt-0">
            <h3 className="text-lg font-medium mb-2">Time Entries</h3>
            {data && data.length > 0 ? (
              <pre className="p-4 bg-slate-100 rounded-md overflow-auto max-h-96">{JSON.stringify(data, null, 2)}</pre>
            ) : data && data.length === 0 ? (
              <p>No time entries found.</p>
            ) : null}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
