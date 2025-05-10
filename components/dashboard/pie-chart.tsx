"use client"

import { useEffect, useRef } from "react"

interface CategoryData {
  name: string
  value: number
  goal: number
  color: string
}

interface PieChartProps {
  data: CategoryData[]
  size?: number
}

export function PieChart({ data, size = 300 }: PieChartProps) {
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
    const centerX = size / 2
    const centerY = size / 2
    const radius = size * 0.4

    // Draw segments
    let startAngle = -Math.PI / 2 // Start from top

    data.forEach((item) => {
      const segmentAngle = (item.value / totalValue) * (Math.PI * 2)

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, startAngle + segmentAngle)
      ctx.closePath()
      ctx.fillStyle = item.color
      ctx.fill()

      // Draw segment label if segment is large enough
      if (segmentAngle > 0.2) {
        const labelRadius = radius * 0.7
        const labelAngle = startAngle + segmentAngle / 2
        const labelX = centerX + Math.cos(labelAngle) * labelRadius
        const labelY = centerY + Math.sin(labelAngle) * labelRadius

        ctx.font = "bold 14px Inter, system-ui, sans-serif"
        ctx.fillStyle = "white"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(item.name, labelX, labelY)
      }

      // Update start angle for next segment
      startAngle += segmentAngle
    })
  }, [data, size])

  return (
    <div className="flex justify-center">
      <canvas ref={canvasRef} style={{ width: size, height: size }} className="max-w-full" />
    </div>
  )
}
