import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  LabelList,
  Cell,
  ReferenceLine,
  ComposedChart,
  Line,
  Tooltip as RechartsTooltip,
} from "recharts"
import type { ComparisonData, ComparisonMetric } from "./types"
import { getComparisonMetricLabel } from "./utils"
import { useMobileDetection } from "@/hooks/use-mobile-detection"

interface ComparisonChartProps {
  data: ComparisonData[]
  metric: ComparisonMetric
}

export function ComparisonChart({ data, metric }: ComparisonChartProps) {
  const { isMobile, isSmallMobile, isPortrait } = useMobileDetection()

  // Safely handle empty data
  if (data.length === 0) {
    return <div className="h-[300px] w-full flex items-center justify-center">No data available</div>
  }

  const averageValue = data[0]?.average || 0
  const metricLabel = getComparisonMetricLabel(metric)

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

  // Determine if we should use the composed chart for goal achievement
  if (metric === "goalAchievement") {
    return (
      <div className={`h-[${chartHeight}px] w-full`}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <ComposedChart data={data} margin={margins}>
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
                      value: metricLabel,
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle" },
                    }
              }
              tick={{ fontSize: isMobile ? 10 : 12 }}
            />
            <RechartsTooltip
              formatter={(value: number, name: string, props: any) => {
                if (name === "Goal") return ["100%", "Target"]
                return [`${value}%`, props?.payload?.name || ""]
              }}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
            {averageValue > 0 && <ReferenceLine y={averageValue} label="Average" stroke="#666" strokeDasharray="3 3" />}
            <Bar dataKey="value" name="Achievement">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color ? `var(--${entry.color})` : "#888"} />
              ))}
              <LabelList
                dataKey="value"
                position="top"
                formatter={(value: number) => `${value}%`}
                style={{ fontSize: isMobile ? 10 : 12 }}
              />
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
    )
  }

  // Use bar chart for other metrics
  return (
    <div className={`h-[${chartHeight}px] w-full`}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={margins}>
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
                    value: metricLabel,
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle" },
                  }
            }
            tick={{ fontSize: isMobile ? 10 : 12 }}
          />
          <RechartsTooltip
            formatter={(value: number, name: string, props: any) => {
              const unit =
                metric === "time" ? " hours" : metric === "progress" || metric === "goalAchievement" ? "%" : ""
              return [`${value}${unit}`, props?.payload?.name || ""]
            }}
          />
          <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
          {averageValue > 0 && <ReferenceLine y={averageValue} label="Average" stroke="#666" strokeDasharray="3 3" />}
          <Bar dataKey="value" name={metricLabel}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color ? `var(--${entry.color})` : "#888"} />
            ))}
            <LabelList dataKey="value" position="top" style={{ fontSize: isMobile ? 10 : 12 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
