"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Check, AlertCircle } from "lucide-react"
import { type CategoryGoal, defaultGoals, type CategoryType } from "@/types/wellness"
import { updateGoal } from "@/app/actions/goals"
import { categoryColors } from "@/utils/chart-utils"
import { setCacheItem, getCacheItem, CACHE_EXPIRY } from "@/lib/cache-utils"

interface GoalFormProps {
  initialGoals?: CategoryGoal[]
  cacheKey?: string
}

export function GoalForm({ initialGoals, cacheKey }: GoalFormProps) {
  const { user, profile } = useAuth()
  const [goals, setGoals] = useState<CategoryGoal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(false)
  const [isCached, setIsCached] = useState(false)

  // Initialize goals from props or defaults
  useEffect(() => {
    // Check cache first if we have a cache key
    if (cacheKey) {
      const cachedGoals = getCacheItem<CategoryGoal[]>(cacheKey)
      if (cachedGoals) {
        setGoals(cachedGoals)
        setIsCached(true)
        return
      }
    }

    // If no cached data, use initialGoals or defaults
    if (initialGoals && initialGoals.length > 0) {
      setGoals(initialGoals)

      // Cache the initial data if we have a cache key
      if (cacheKey) {
        setCacheItem(cacheKey, initialGoals, CACHE_EXPIRY.GOALS)
      }
    } else {
      // If no goals provided, use defaults
      setGoals(defaultGoals)
    }
  }, [initialGoals, cacheKey])

  // Check if we're in demo mode
  useEffect(() => {
    if (user && user.id.startsWith("mock-")) {
      setDemoMode(true)
    }
  }, [user])

  // Handle goal update
  const handleGoalUpdate = async (updatedGoal: CategoryGoal) => {
    if (!user) return

    setIsLoading(true)
    setError(null)
    setSuccess(null)

    try {
      // If in demo mode, just update the state
      if (demoMode) {
        const updatedGoals = goals.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal))
        setGoals(updatedGoals)

        // Update cache if we have a cache key
        if (cacheKey) {
          setCacheItem(cacheKey, updatedGoals, CACHE_EXPIRY.GOALS)
        }

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))

        setSuccess(`${updatedGoal.name} goal updated successfully (Demo Mode)`)
        setIsLoading(false)
        return
      }

      // Otherwise, update in the database
      const result = await updateGoal(user.id, updatedGoal)

      if (!result.success) {
        setError(result.error || "Failed to update goal")
        return
      }

      // Update local state
      const updatedGoals = goals.map((goal) => (goal.id === updatedGoal.id ? updatedGoal : goal))
      setGoals(updatedGoals)

      // Update cache if we have a cache key
      if (cacheKey) {
        setCacheItem(cacheKey, updatedGoals, CACHE_EXPIRY.GOALS)
      }

      setSuccess(`${updatedGoal.name} goal updated successfully`)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change
  const handleGoalHoursChange = (category: CategoryType, value: string) => {
    const numValue = Number.parseFloat(value)
    if (isNaN(numValue) || numValue < 0) return

    const updatedGoals = goals.map((goal) => {
      if (goal.category === category) {
        return { ...goal, goal_hours: numValue }
      }
      return goal
    })

    setGoals(updatedGoals)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Wellness Goals</CardTitle>
          <CardDescription>Set your goals for each wellness category</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
              <Check className="h-4 w-4" />
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {demoMode && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>You're in demo mode. Goal changes will not be saved to the database.</AlertDescription>
            </Alert>
          )}

          {isCached && (
            <Alert className="mb-4 bg-blue-50 text-blue-800 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Cached Data</AlertTitle>
              <AlertDescription>You're viewing cached data for better performance.</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {goals.map((goal) => (
              <Card key={goal.id} className="overflow-hidden">
                <div
                  className="h-1"
                  style={{ backgroundColor: goal.color || categoryColors[goal.category as CategoryType].primary }}
                ></div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-medium">{goal.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${goal.id}-hours`}>Goal Hours</Label>
                    <Input
                      id={`${goal.id}-hours`}
                      type="number"
                      min="0"
                      step="0.5"
                      value={goal.goal_hours}
                      onChange={(e) => handleGoalHoursChange(goal.category as CategoryType, e.target.value)}
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Set your target hours for {goal.name.toLowerCase()} activities
                    </p>
                  </div>
                  <Button
                    onClick={() => handleGoalUpdate(goal)}
                    disabled={isLoading}
                    className="w-full"
                    style={
                      {
                        backgroundColor: goal.color || categoryColors[goal.category as CategoryType].primary,
                        color: "white",
                        "--hover-color": `${goal.color || categoryColors[goal.category as CategoryType].primary}cc`,
                      } as React.CSSProperties
                    }
                    onMouseOver={(e) =>
                      (e.currentTarget.style.backgroundColor = `${goal.color || categoryColors[goal.category as CategoryType].primary}cc`)
                    }
                    onMouseOut={(e) =>
                      (e.currentTarget.style.backgroundColor =
                        goal.color || categoryColors[goal.category as CategoryType].primary)
                    }
                  >
                    {isLoading ? "Updating..." : "Update Goal"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
