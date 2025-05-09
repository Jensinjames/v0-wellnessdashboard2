"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/hooks/use-supabase"
import { useProfileVerification } from "@/hooks/use-profile-verification"
import { WellnessInsightsChart } from "@/components/dashboard/wellness-insights-chart"
import { GoalProgressGrid } from "@/components/dashboard/goal-progress-grid"
import { ActivityFeed } from "@/components/dashboard/activity-feed"
import { CategoryBreakdown } from "@/components/dashboard/category-breakdown"
import { AddEntryButton } from "@/components/dashboard/add-entry-button"
import { Button } from "@/components/ui/button"
import { CalendarIcon, BarChart3Icon, ListIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

export default function EnhancedDashboardContent({ userId }: { userId: string }) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const { verifyProfile } = useProfileVerification()
  const [insights, setInsights] = useState<any>(null)
  const [goals, setGoals] = useState<any[]>([])
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [timeframe, setTimeframe] = useState("week")

  // Verify profile on component mount
  useEffect(() => {
    verifyProfile(userId)
  }, [userId, verifyProfile])

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true)
      try {
        // Fetch latest insights using the new index
        const { data: insightsData, error: insightsError } = await supabase
          .from("wellness_insights")
          .select("*")
          .eq("user_id", userId)
          .order("date", { ascending: false })
          .limit(1)
          .single()

        if (insightsError && insightsError.code !== "PGRST116") {
          console.error("Error fetching insights:", insightsError)
          toast({
            title: "Error fetching insights",
            description: "Please try refreshing the page",
            variant: "destructive",
          })
        }

        // Fetch goals using the new index
        const { data: goalsData, error: goalsError } = await supabase
          .from("wellness_goals")
          .select("*")
          .eq("user_id", userId)

        if (goalsError) {
          console.error("Error fetching goals:", goalsError)
        }

        // Fetch recent entries using the new index
        const { data: entriesData, error: entriesError } = await supabase
          .from("wellness_entries")
          .select("*")
          .eq("user_id", userId)
          .order("timestamp", { ascending: false })
          .limit(10)

        if (entriesError) {
          console.error("Error fetching entries:", entriesError)
        }

        setInsights(insightsData || null)
        setGoals(goalsData || [])
        setRecentEntries(entriesData || [])
      } catch (error) {
        console.error("Error in fetchDashboardData:", error)
        toast({
          title: "Error loading dashboard",
          description: "Please try refreshing the page",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardData()

    // Set up realtime subscription for entries
    const entriesSubscription = supabase
      .channel("wellness_entries_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wellness_entries",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          // Refresh data when entries change
          fetchDashboardData()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(entriesSubscription)
    }
  }, [userId, supabase, toast, timeframe])

  const handleTimeframeChange = (newTimeframe: string) => {
    setTimeframe(newTimeframe)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Your Wellness Journey</h2>
          <p className="text-muted-foreground">
            {insights
              ? `Last updated ${formatDistanceToNow(new Date(insights.updated_at), { addSuffix: true })}`
              : "Start tracking your wellness activities"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-md p-1">
            <Button
              variant={timeframe === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleTimeframeChange("day")}
            >
              Day
            </Button>
            <Button
              variant={timeframe === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleTimeframeChange("week")}
            >
              Week
            </Button>
            <Button
              variant={timeframe === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => handleTimeframeChange("month")}
            >
              Month
            </Button>
          </div>

          <AddEntryButton userId={userId} onSuccess={() => {}} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="overview">
            <BarChart3Icon className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="activities">
            <ListIcon className="h-4 w-4 mr-2" />
            Activities
          </TabsTrigger>
          <TabsTrigger value="goals">
            <CalendarIcon className="h-4 w-4 mr-2" />
            Goals
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Wellness Insights</CardTitle>
              </CardHeader>
              <CardContent>
                {insights ? (
                  <WellnessInsightsChart insights={insights} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-64">
                    <p className="text-muted-foreground">No insights available yet</p>
                    <Button variant="outline" className="mt-4">
                      Add Your First Entry
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryBreakdown data={insights?.category_breakdown || {}} isLoading={isLoading} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed entries={recentEntries} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Goal Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <GoalProgressGrid goals={goals} insights={insights} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
