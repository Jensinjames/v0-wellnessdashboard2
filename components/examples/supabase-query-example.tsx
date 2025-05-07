"use client"

import { useState, useEffect } from "react"
import { useSupabase } from "@/hooks/use-supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, RefreshCw, WifiOff, User, Target, Clock, ListIcon as Category } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/context/auth-context"

export function SupabaseQueryExample() {
  const { user } = useAuth()
  const { supabase, isInitialized, isOnline, query } = useSupabase()
  const [activeTab, setActiveTab] = useState("profiles")
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Function to fetch profiles data
  const fetchProfiles = async () => {
    if (!isInitialized || !user) return

    setLoading(true)
    setError(null)

    try {
      const result = await query((client) => client.from("profiles").select("*").eq("user_id", user.id).single(), {
        retries: 2,
        requiresAuth: true,
      })

      setData(result.data ? [result.data] : [])
    } catch (err: any) {
      console.error("Error fetching profile:", err)
      setError(err.message || "Failed to fetch profile data")
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch goals with categories
  const fetchGoals = async () => {
    if (!isInitialized || !user) return

    setLoading(true)
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
            .order("created_at", { ascending: false }),
        {
          retries: 2,
          requiresAuth: true,
        },
      )

      setData(result.data || [])
    } catch (err: any) {
      console.error("Error fetching goals:", err)
      setError(err.message || "Failed to fetch goals data")
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch categories
  const fetchCategories = async () => {
    if (!isInitialized || !user) return

    setLoading(true)
    setError(null)

    try {
      const result = await query(
        (client) =>
          client
            .from("categories")
            .select(`
              id, 
              name, 
              color,
              description,
              created_at
            `)
            .eq("user_id", user.id)
            .order("name"),
        {
          retries: 2,
          requiresAuth: true,
        },
      )

      setData(result.data || [])
    } catch (err: any) {
      console.error("Error fetching categories:", err)
      setError(err.message || "Failed to fetch categories data")
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch time entries with goal information
  const fetchTimeEntries = async () => {
    if (!isInitialized || !user) return

    setLoading(true)
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
        {
          retries: 2,
          requiresAuth: true,
        },
      )

      setData(result.data || [])
    } catch (err: any) {
      console.error("Error fetching time entries:", err)
      setError(err.message || "Failed to fetch time entries data")
    } finally {
      setLoading(false)
    }
  }

  // Function to fetch data based on active tab
  const fetchData = async () => {
    switch (activeTab) {
      case "profiles":
        await fetchProfiles()
        break
      case "goals":
        await fetchGoals()
        break
      case "categories":
        await fetchCategories()
        break
      case "time_entries":
        await fetchTimeEntries()
        break
      default:
        break
    }
  }

  // Fetch data when tab changes or component mounts
  useEffect(() => {
    if (isInitialized && user) {
      fetchData()
    }
  }, [isInitialized, activeTab, user])

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Supabase Query Examples</CardTitle>
          <Badge variant={isOnline ? "default" : "destructive"} className="flex items-center gap-1">
            {isOnline ? (
              "Online"
            ) : (
              <>
                <WifiOff className="h-3 w-3" /> Offline
              </>
            )}
          </Badge>
        </div>
        <CardDescription>Examples of querying your actual database tables</CardDescription>
      </CardHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="w-full">
            <TabsTrigger value="profiles" className="flex items-center gap-1">
              <User className="h-4 w-4" />
              Profiles
            </TabsTrigger>
            <TabsTrigger value="goals" className="flex items-center gap-1">
              <Target className="h-4 w-4" />
              Goals
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex items-center gap-1">
              <Category className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="time_entries" className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Time Entries
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-md bg-destructive/10 p-4 text-destructive">
              <p className="font-medium">Error</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : data ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Found {data.length} {activeTab === "profiles" ? "profile" : activeTab}
              </p>

              <div className="rounded-md border p-4">
                <pre className="text-xs overflow-auto max-h-60">{JSON.stringify(data, null, 2)}</pre>
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">No data available</p>
          )}
        </CardContent>
      </Tabs>

      <CardFooter>
        <Button
          onClick={fetchData}
          disabled={loading || !isInitialized || !isOnline || !user}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Refresh Data
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
