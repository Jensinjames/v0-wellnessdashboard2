import { Card, CardContent } from "@/components/ui/card"

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
}

export function StatsCard({ title, value, description }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
          {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardStatsProps {
  stats: {
    totalEntries: number
    totalHours: number
    categoriesCount: number
    completionRate: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <StatsCard title="Total Entries" value={stats.totalEntries} />
      <StatsCard title="Total Hours" value={stats.totalHours.toFixed(1)} />
      <StatsCard title="Categories Tracked" value={stats.categoriesCount} />
      <StatsCard title="Goal Completion" value={`${stats.completionRate.toFixed(0)}%`} />
    </div>
  )
}
