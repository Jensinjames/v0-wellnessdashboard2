"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/hooks/use-supabase"
import type { GoalCategory } from "@/types/goals-hierarchy"

export default function GoalsPage() {
  const { user } = useAuth()
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [categories, setCategories] = useState<GoalCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const pageSize = 5 // Number of categories per page

  useEffect(() => {
    let isMounted = true
    let retryTimeout: NodeJS.Timeout

    const fetchCategories = async () => {
      if (!user) {
        if (isMounted) setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)

        // First, get the count of categories for pagination
        const { count, error: countError } = await supabase
          .from("goal_categories")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (countError) throw countError

        // Calculate total pages
        const calculatedTotalPages = Math.ceil((count || 0) / pageSize)
        if (isMounted) setTotalPages(calculatedTotalPages || 1)

        // Fetch paginated categories
        const from = (currentPage - 1) * pageSize
        const to = from + pageSize - 1

        const { data, error: fetchError } = await supabase
          .from("goal_categories")
          .select(`
            *,
            subcategories:goal_subcategories(
              *,
              goals:goals(*)
            )
          `)
          .eq("user_id", user.id)
          .order("created_at")
          .range(from, to)

        if (fetchError) throw fetchError

        if (isMounted) {
          setCategories(data || [])
          setRetryCount(0) // Reset retry count on success
        }
      } catch (err: any) {
        console.error("Error fetching categories:", err)

        if (isMounted) {
          setError(err.message || "Failed to load goal data")

          // Implement exponential backoff for retries
          if (retryCount < 3) {
            const delay = Math.pow(2, retryCount) * 1000 // Exponential backoff
            setRetryCount((prev) => prev + 1)

            retryTimeout = setTimeout(() => {
              if (isMounted) fetchCategories()
            }, delay)
          } else {
            toast({
              title: "Error",
              description: "Failed to load your goals after multiple attempts. Please refresh the page.",
              variant: "destructive",
            })
          }
        }
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchCategories()

    return () => {
      isMounted = false
      if (retryTimeout) clearTimeout(retryTimeout)
    }
  }, [user, supabase, toast, currentPage, retryCount])

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
  }

  // Loading state with skeleton UI
  if (isLoading && categories.length === 0) {
    return (
      <div className="container px-4 py-6 max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <Tabs defaultValue="categories">
          <TabsList className="mb-4">
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="categories">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="mb-4">
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    )
  }

  // Error state
  if (error && categories.length === 0) {
    return (
      <div className="container px-4 py-6 max-w-6xl">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>

        <Button onClick={() => setRetryCount(0)}>Retry Loading</Button>
      </div>
    )
  }

  return (
    <div className="container px-4 py-6 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">Manage your goals, categories, and track your progress</p>
        </div>
        <Button onClick={() => (window.location.href = "/goals-hierarchy")}>
          <Plus className="mr-1 h-4 w-4" />
          Manage Goals
        </Button>
      </div>

      <Tabs defaultValue="categories">
        <TabsList className="mb-4">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          {categories.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="mb-4 text-muted-foreground">
                  No categories found. Get started by creating your first category.
                </div>
                <Button onClick={() => (window.location.href = "/goals-hierarchy")}>
                  <Plus className="mr-1 h-4 w-4" />
                  Create Category
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              {categories.map((category) => (
                <Card key={category.id} className="mb-4">
                  <CardHeader>
                    <div className="flex items-center">
                      <div className="h-4 w-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                      <CardTitle>{category.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {category.description && <p className="text-muted-foreground mb-4">{category.description}</p>}
                    <div className="text-sm">
                      <p>Daily time allocation: {category.daily_time_allocation} hours</p>
                      <p>Subcategories: {(category.subcategories || []).length}</p>
                      <p>
                        Goals:{" "}
                        {(category.subcategories || []).reduce((total, sub) => total + (sub.goals || []).length, 0)}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="goals">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center mb-4">
                View and manage your goals in the hierarchy view for better organization.
              </p>
              <div className="flex justify-center">
                <Button onClick={() => (window.location.href = "/goals-hierarchy")}>Go to Goal Hierarchy</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
