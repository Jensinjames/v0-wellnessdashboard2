import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LabelList,
  Cell,
  Line,
  Tooltip as RechartsTooltip,
} from "recharts"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { GoalComparisonData, BadgeVariantType } from "./types"
import { getTrendIndicator } from "./utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

interface GoalComparisonProps {
  data: GoalComparisonData[]
}

export function GoalComparison({ data }: GoalComparisonProps) {
  const { isMobile, isSmallMobile, isPortrait } = useMobileDetection()

  // Safely handle empty data
  if (data.length === 0) {
    return <div className="p-4 text-center">No categories selected for comparison</div>
  }

  // Adjust chart height based on device and orientation
  const chartHeight = isMobile ? (isPortrait ? 300 : 250) : 400

  // Adjust margins based on device
  const margins = {
    top: 20,
    right: isMobile ? 10 : 30,
    left: isMobile ? 10 : 20,
    bottom: isMobile ? 100 : 70,
  }

  // Adjust label angle for better readability on mobile
  const xAxisAngle = isMobile ? -65 : -45
  const xAxisHeight = isMobile ? 90 : 70

  // For small mobile devices, limit the number of displayed labels
  const tickFormatter = isSmallMobile
    ? (value: string) => (value.length > 8 ? `${value.substring(0, 8)}...` : value)
    : undefined

  return (
    <div className="space-y-6">
      <div className={`h-[${chartHeight}px] w-full`}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={data} margin={margins} barGap={0}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              angle={xAxisAngle}
              textAnchor="end"
              height={xAxisHeight}
              tick={{ fontSize: isMobile ? 10 : 12 }}
              tickFormatter={tickFormatter}
              interval={isSmallMobile ? 0 : "preserveStartEnd"}
            />
            <YAxis
              label={
                isMobile
                  ? undefined
                  : {
                      value: "Value vs Goal",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }
              }
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <RechartsTooltip
              formatter={(value: number, name: string) => {
                if (name === "Goal") return [value, "Target Goal"]
                if (name === "Current") return [value, "Current Value"]
                if (name === "Gap") return [value, "Remaining to Goal"]
                return [value, name]
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            <Bar dataKey="current" name="Current" stackId="a">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color ? `var(--${entry.color})` : "#888"} />
              ))}
              <LabelList dataKey="current" position="inside" fill="#fff" style={{ fontSize: isMobile ? 10 : 12 }} />
            </Bar>
            <Bar dataKey="gap" name="Gap" stackId="a" fill="#d9d9d9">
              <LabelList dataKey="gap" position="inside" style={{ fontSize: isMobile ? 10 : 12 }} />
            </Bar>
            <Line
              type="monotone"
              dataKey="goal"
              stroke="#ff7300"
              name="Goal"
              strokeWidth={2}
              dot={{ r: isMobile ? 4 : 6 }}
              activeDot={{ r: isMobile ? 6 : 8 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((category) => {
          const bgColorClass = category.color ? `bg-${category.color}` : "bg-gray-400"
          const textColorClass = category.color ? `text-${category.color}` : "text-gray-600"
          const trendIndicator = getTrendIndicator(category.current, category.goal)

          // Type-safe badge variant
          const badgeVariant: BadgeVariantType = category.achievement >= 100 ? "success" : "outline"

          return (
            <Card key={category.name} className="overflow-hidden">
              <CardContent className={cn("p-4", isMobile && "p-3")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-3 h-3 rounded-sm", bgColorClass)}></div>
                    <span className={cn(textColorClass, isMobile && "text-sm")}>{category.name}</span>
                  </div>
                  <Badge variant={badgeVariant} className={cn("gap-1", isMobile && "text-xs py-0 px-2")}>
                    {trendIndicator.icon}
                    {category.achievement}%
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Current: {category.current}</span>
                    <span>Goal: {category.goal}</span>
                  </div>
                  <Progress value={category.achievement} className="h-2" indicatorClassName={bgColorClass} />
                  <div className={cn("text-xs text-center mt-1", isMobile && "text-[10px]")}>
                    {category.gap > 0 ? (
                      <span>Need {category.gap} more to reach goal</span>
                    ) : (
                      <span className="text-green-500">Goal achieved!</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
