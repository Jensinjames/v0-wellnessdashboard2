"use client"

import { useEffect, useRef } from "react"

interface CategoryData {
  name: string
  value: number
  goal: number
  color: string
}

interface RadialChartProps {
  data: CategoryData[]
  size?: number
}

export function RadialChart({ data, size = 300 }: RadialChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.scale(dpr, dpr)

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    // Calculate total value for percentage
    const totalValue = data.reduce((sum, item) => sum + item.value, 0)
    const totalGoal = data.reduce((sum, item) => sum + item.goal, 0)
    const centerX = size / 2
    const centerY = size / 2
    const outerRadius = size * 0.4
    const innerRadius = size * 0.25

    // Draw background circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2)
    ctx.fillStyle = "#f3f4f6"
    ctx.fill()

    // Draw segments
    let startAngle = -Math.PI / 2 // Start from top

    data.forEach((item) => {
      const segmentAngle = (item.value / totalValue) * (Math.PI * 2)

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, outerRadius, startAngle, startAngle + segmentAngle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      // Update start angle for next segment
      startAngle += segmentAngle
    })

    // Draw inner circle (hole)
    ctx.beginPath()
    ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2)
    ctx.fillStyle = "white"
    ctx.fill()

    // Draw center text
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillStyle = "#111827"
    ctx.font = "bold 16px Inter, system-ui, sans-serif"
    ctx.fillText(`${Math.round((totalValue / totalGoal) * 100)}%`, centerX, centerY - 10)

    ctx.font = "12px Inter, system-ui, sans-serif"
    ctx.fillStyle = "#6b7280"
    ctx.fillText("Goal Completion", centerX, centerY + 10)
  }, [data, size])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} style={{ width: size, height: size }} className="max-w-full" />
    </div>
  )
}
