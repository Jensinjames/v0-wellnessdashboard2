import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface DailyMetricsProps {
  score: number
  motivation: number
  sleep: number
}

export function DailyMetrics({ score, motivation, sleep }: DailyMetricsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Daily Metrics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Daily Score</span>
            <span className="font-medium">{score}%</span>
          </div>
          <Progress value={score} className="h-2" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Motivation Level</span>
            <span className="font-medium">{motivation}%</span>
          </div>
          <Progress value={motivation} className="h-2" indicatorColor="#f59e0b" />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span>Sleep Duration</span>
            <span className="font-medium">{sleep} hours</span>
          </div>
          <Progress value={(sleep / 9) * 100} className="h-2" indicatorColor="#8b5cf6" />
        </div>
      </CardContent>
    </Card>
  )
}
