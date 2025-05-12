import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft } from "lucide-react"
import { ActivityPatternsWrapper } from "@/components/activity-patterns-wrapper"

export default function ActivityPatternsPage() {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Activity Patterns</h1>
        <p className="mt-1 text-muted-foreground">Analyze your wellness activity patterns and identify trends</p>
      </div>

      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          <ActivityPatternsWrapper />
        </div>
      </div>
    </div>
  )
}
