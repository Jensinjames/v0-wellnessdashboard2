import { Suspense } from "react"
import { GoalHierarchyVisualization } from "@/components/goals/goal-hierarchy-visualization"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata = {
  title: "Goal Visualization | Rollen Wellness",
  description: "Visualize your wellness goals and their relationships",
}

export default function GoalVisualizationPage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Goal Visualization</h1>
        <p className="text-muted-foreground">Visualize your wellness goals and track your progress across categories</p>
      </div>

      <Suspense
        fallback={
          <Card>
            <CardHeader>
              <CardTitle>Goal Hierarchy</CardTitle>
              <CardDescription>Loading your wellness goals...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              </div>
            </CardContent>
          </Card>
        }
      >
        <GoalHierarchyVisualization />
      </Suspense>

      <Card>
        <CardHeader>
          <CardTitle>Understanding Your Goal Hierarchy</CardTitle>
          <CardDescription>How to interpret and use the visualization</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Categories</h3>
            <p className="text-sm text-muted-foreground">
              The top level represents your main wellness categories (Faith, Life, Work, Health). Each category has an
              overall progress indicator showing how you're doing across all goals in that category.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Subcategories</h3>
            <p className="text-sm text-muted-foreground">
              Within each category, you'll find subcategories that help organize your goals into more specific areas.
              Click on a subcategory to see the individual goals within it.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Goals</h3>
            <p className="text-sm text-muted-foreground">
              Individual goals show their progress, priority level, and time allocation. The status icons indicate
              whether a goal is not started, in progress, completed, or on hold.
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Time Allocations</h3>
            <p className="text-sm text-muted-foreground">
              Time allocations show how much time you've committed to spending on each category, subcategory, or goal
              daily. This helps ensure your time investments align with your wellness priorities.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
