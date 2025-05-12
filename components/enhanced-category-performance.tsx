"use client"

import * as React from "react"
import { useWellness } from "@/context/wellness-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { getCategoryColorKey } from "@/utils/category-color-utils"
import { useIconContext } from "@/context/icon-context"
import { Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, type ChartData, LinearScale, CategoryScale } from "chart.js"
import { useMemo, useEffect, useState, useCallback, useRef } from "react"
import { formatDistanceToNow } from "date-fns"

// Register required Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend, LinearScale, CategoryScale)

interface CategoryPerformanceProps {
  className?: string
}

// Helper function to format time in hours and minutes
function formatTime(hours: number): string {
  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)

  if (wholeHours === 0) {
    return `${minutes} min`
  } else if (minutes === 0) {
    return `${wholeHours} hr`
  } else {
    return `${wholeHours} hr ${minutes} min`
  }
}

// Helper function to get trend indicator
function getTrend(current: number, previous: number): { direction: "up" | "down" | "stable"; percentage: number } {
  if (previous === 0) return { direction: "stable", percentage: 0 }

  const difference = current - previous
  const percentChange = previous > 0 ? (difference / previous) * 100 : 0

  if (Math.abs(percentChange) < 5) {
    return { direction: "stable", percentage: 0 }
  } else if (difference > 0) {
    return { direction: "up", percentage: Math.abs(Math.round(percentChange)) }
  } else {
    return { direction: "down", percentage: Math.abs(Math.round(percentChange)) }
  }
}

// Helper function to interpolate between two colors
function interpolateColor(color1: string, color2: string, factor: number): string {
  // Parse RGBA values from strings
  const parseColor = (color: string) => {
    const match = color.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?$$/)
    if (!match) return { r: 0, g: 0, b: 0, a: 1 }

    return {
      r: Number.parseInt(match[1], 10),
      g: Number.parseInt(match[2], 10),
      b: Number.parseInt(match[3], 10),
      a: match[4] ? Number.parseFloat(match[4]) : 1,
    }
  }

  const c1 = parseColor(color1)
  const c2 = parseColor(color2)

  // Interpolate between the colors
  const r = Math.round(c1.r + factor * (c2.r - c1.r))
  const g = Math.round(c1.g + factor * (c2.g - c1.g))
  const b = Math.round(c1.b + factor * (c2.b - c1.b))
  const a = c1.a + factor * (c2.a - c1.a)

  return `rgba(${r}, ${g}, ${b}, ${a})`
}

// Color mapping for categories
const categoryColorMap = {
  blue: {
    100: "rgba(219, 234, 254, 0.5)", // blue-100
    200: "rgba(191, 219, 254, 0.5)", // blue-200
    300: "rgba(147, 197, 253, 0.5)", // blue-300
    400: "rgba(96, 165, 250, 0.9)", // blue-400
    500: "rgba(59, 130, 246, 0.9)", // blue-500
    600: "rgba(37, 99, 235, 0.9)", // blue-600
    900: "rgba(30, 58, 138, 0.8)", // blue-900
  },
  green: {
    100: "rgba(220, 252, 231, 0.5)", // green-100
    200: "rgba(187, 247, 208, 0.5)", // green-200
    300: "rgba(134, 239, 172, 0.5)", // green-300
    400: "rgba(74, 222, 128, 0.9)", // green-400
    500: "rgba(34, 197, 94, 0.9)", // green-500
    600: "rgba(22, 163, 74, 0.9)", // green-600
    900: "rgba(20, 83, 45, 0.8)", // green-900
  },
  red: {
    100: "rgba(254, 226, 226, 0.5)", // red-100
    200: "rgba(254, 202, 202, 0.5)", // red-200
    300: "rgba(252, 165, 165, 0.5)", // red-300
    400: "rgba(248, 113, 113, 0.9)", // red-400
    500: "rgba(239, 68, 68, 0.9)", // red-500
    600: "rgba(220, 38, 38, 0.9)", // red-600
    900: "rgba(127, 29, 29, 0.8)", // red-900
  },
  yellow: {
    100: "rgba(254, 249, 195, 0.5)", // yellow-100
    200: "rgba(254, 240, 138, 0.5)", // yellow-200
    300: "rgba(253, 224, 71, 0.5)", // yellow-300
    400: "rgba(250, 204, 21, 0.9)", // yellow-400
    500: "rgba(234, 179, 8, 0.9)", // yellow-500
    600: "rgba(202, 138, 4, 0.9)", // yellow-600
    900: "rgba(113, 63, 18, 0.8)", // yellow-900
  },
  pink: {
    100: "rgba(252, 231, 243, 0.5)", // pink-100
    200: "rgba(251, 207, 232, 0.5)", // pink-200
    300: "rgba(249, 168, 212, 0.5)", // pink-300
    400: "rgba(244, 114, 182, 0.9)", // pink-400
    500: "rgba(236, 72, 153, 0.9)", // pink-500
    600: "rgba(219, 39, 119, 0.9)", // pink-600
    900: "rgba(131, 24, 67, 0.8)", // pink-900
  },
  purple: {
    100: "rgba(243, 232, 255, 0.5)", // purple-100
    200: "rgba(233, 213, 255, 0.5)", // purple-200
    300: "rgba(216, 180, 254, 0.5)", // purple-300
    400: "rgba(192, 132, 252, 0.9)", // purple-400
    500: "rgba(168, 85, 247, 0.9)", // purple-500
    600: "rgba(147, 51, 234, 0.9)", // purple-600
    900: "rgba(88, 28, 135, 0.8)", // purple-900
  },
  indigo: {
    100: "rgba(224, 231, 255, 0.5)", // indigo-100
    200: "rgba(199, 210, 254, 0.5)", // indigo-200
    300: "rgba(165, 180, 252, 0.5)", // indigo-300
    400: "rgba(129, 140, 248, 0.9)", // indigo-400
    500: "rgba(99, 102, 241, 0.9)", // indigo-500
    600: "rgba(79, 70, 229, 0.9)", // indigo-600
    900: "rgba(49, 46, 129, 0.8)", // indigo-900
  },
  slate: {
    100: "rgba(241, 245, 249, 0.5)", // slate-100
    200: "rgba(226, 232, 240, 0.5)", // slate-200
    300: "rgba(203, 213, 225, 0.5)", // slate-300
    400: "rgba(148, 163, 184, 0.9)", // slate-400
    500: "rgba(100, 116, 139, 0.9)", // slate-500
    600: "rgba(71, 85, 105, 0.9)", // slate-600
    900: "rgba(15, 23, 42, 0.8)", // slate-900
  },
}

// Helper function to get color from the map
function getColorFromMap(colorKey: string, shade: number | string): string {
  const baseColor = colorKey.toLowerCase()
  const shadeKey = shade.toString()

  // Default to slate if color not found
  const colorObj = categoryColorMap[baseColor as keyof typeof categoryColorMap] || categoryColorMap.slate

  // Default to 500 if shade not found
  return colorObj[shadeKey as keyof typeof colorObj] || colorObj["500"]
}

// Helper function to create a pulsing color effect
function createPulsingColor(baseColor: string, intensity = 0.2): string {
  const color = parseColor(baseColor)

  // Increase brightness for pulsing effect
  const r = Math.min(255, Math.round(color.r * (1 + intensity)))
  const g = Math.min(255, Math.round(color.g * (1 + intensity)))
  const b = Math.min(255, Math.round(color.b * (1 + intensity)))

  return `rgba(${r}, ${g}, ${b}, ${color.a})`
}

// Parse RGBA values from strings
function parseColor(color: string) {
  const match = color.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?$$/)
  if (!match) return { r: 0, g: 0, b: 0, a: 1 }

  return {
    r: Number.parseInt(match[1], 10),
    g: Number.parseInt(match[2], 10),
    b: Number.parseInt(match[3], 10),
    a: match[4] ? Number.parseFloat(match[4]) : 1,
  }
}

export function EnhancedCategoryPerformance({ className }: CategoryPerformanceProps) {
  const { categories, goals, entries } = useWellness()
  const { getIconComponent } = useIconContext()
  const [resizableCards, setResizableCards] = React.useState<Record<string, boolean>>({})
  const [cardSizes, setCardSizes] = React.useState<Record<string, { width: string; height: string }>>({})
  const canvasRefs = React.useRef<Record<string, HTMLCanvasElement>>({})
  const chartRefs = React.useRef<Record<string, any>>({})
  const [animatedPercentages, setAnimatedPercentages] = useState<Record<string, number>>({})
  const [isInitialRender, setIsInitialRender] = useState(true)
  const [chartDataCache, setChartDataCache] = useState<Record<string, any>>({})
  const previousDataRef = useRef<Record<string, any>>({})
  const [transitionColors, setTransitionColors] = useState<Record<string, any>>({})
  const [isTransitioning, setIsTransitioning] = useState<Record<string, boolean>>({})
  const animationFrameRef = useRef<Record<string, number>>({})

  // Load saved card sizes from localStorage
  React.useEffect(() => {
    try {
      const savedSizes = localStorage.getItem("category-card-sizes")
      if (savedSizes) {
        setCardSizes(JSON.parse(savedSizes))
      }
    } catch (error) {
      console.error("Failed to load saved card sizes:", error)
    }

    // Set initial render flag to false after first render
    setIsInitialRender(false)
  }, [])

  // Save card sizes to localStorage when they change
  React.useEffect(() => {
    if (Object.keys(cardSizes).length > 0) {
      try {
        localStorage.setItem("category-card-sizes", JSON.stringify(cardSizes))
      } catch (error) {
        console.error("Failed to save card sizes:", error)
      }
    }
  }, [cardSizes])

  // Toggle card resizability
  const toggleResizable = (categoryId: string) => {
    setResizableCards((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }))
  }

  // Handle card resize
  const handleCardResize = (categoryId: string, size: { width: number; height: number }) => {
    setCardSizes((prev) => ({
      ...prev,
      [categoryId]: {
        width: `${size.width}px`,
        height: `${size.height}px`,
      },
    }))
  }

  // Calculate actual time spent for each category for a specific date
  const calculateActualTime = useCallback(
    (categoryId: string, date: Date = new Date()) => {
      // Set the date to midnight
      const targetDate = new Date(date)
      targetDate.setHours(0, 0, 0, 0)

      // Filter entries for the target date
      const targetEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.date)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === targetDate.getTime()
      })

      // Sum up time spent on this category for the target date
      let totalTime = 0
      targetEntries.forEach((entry) => {
        entry.metrics.forEach((metric) => {
          if (metric.categoryId === categoryId) {
            totalTime += metric.value
          }
        })
      })

      return totalTime
    },
    [entries],
  )

  // Calculate time spent in previous period (yesterday)
  const calculatePreviousPeriodTime = useCallback(
    (categoryId: string) => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      return calculateActualTime(categoryId, yesterday)
    },
    [calculateActualTime],
  )

  // Calculate weekly average
  const calculateWeeklyAverage = useCallback(
    (categoryId: string) => {
      let totalTime = 0
      let daysWithData = 0

      // Get data for the last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date()
        date.setDate(date.getDate() - i)

        const dailyTime = calculateActualTime(categoryId, date)
        if (dailyTime > 0) {
          totalTime += dailyTime
          daysWithData++
        }
      }

      return daysWithData > 0 ? totalTime / daysWithData : 0
    },
    [calculateActualTime],
  )

  // Calculate total goal time for a category
  const calculateGoalTime = useCallback(
    (categoryId: string) => {
      let totalGoal = 0
      const categoryGoals = goals.filter((goal) => goal.categoryId === categoryId)
      categoryGoals.forEach((goal) => {
        totalGoal += goal.value
      })
      return totalGoal
    },
    [goals],
  )

  // Get the most recent entry date for a category
  const getLastActivityDate = useCallback(
    (categoryId: string) => {
      const categoryEntries = entries
        .filter((entry) => entry.metrics.some((metric) => metric.categoryId === categoryId))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      return categoryEntries.length > 0 ? new Date(categoryEntries[0].date) : null
    },
    [entries],
  )

  // Get subcategory data for a category
  const getSubcategoryData = useCallback(
    (categoryId: string) => {
      const category = categories.find((cat) => cat.id === categoryId)
      if (!category || !category.metrics || category.metrics.length === 0) {
        return []
      }

      // Get today's entries for this category
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const todayEntries = entries.filter((entry) => {
        const entryDate = new Date(entry.date)
        entryDate.setHours(0, 0, 0, 0)
        return entryDate.getTime() === today.getTime()
      })

      // Calculate time spent on each subcategory
      return category.metrics.map((metric) => {
        let timeSpent = 0

        todayEntries.forEach((entry) => {
          entry.metrics.forEach((m) => {
            if (m.categoryId === categoryId && m.metricId === metric.id) {
              timeSpent += m.value
            }
          })
        })

        return {
          id: metric.id,
          name: metric.name,
          value: timeSpent,
        }
      })
    },
    [categories, entries],
  )

  // Create gradient for chart using direct color values instead of CSS variables
  const createGradient = (ctx: CanvasRenderingContext2D, colorKey: string, index = 0, total = 1): CanvasGradient => {
    // Create a radial gradient for more depth
    const gradient = ctx.createRadialGradient(150, 150, 50, 150, 150, 150)

    // Use direct color values from our color map
    gradient.addColorStop(0, getColorFromMap(colorKey, 400))
    gradient.addColorStop(0.5, getColorFromMap(colorKey, 500))
    gradient.addColorStop(1, getColorFromMap(colorKey, 600))

    return gradient
  }

  // Generate chart data for a category with subcategories
  const generateCategoryData = useCallback(
    (categoryId: string, canvasRef: React.RefObject<HTMLCanvasElement>) => {
      const category = categories.find((cat) => cat.id === categoryId)
      if (!category) return null

      const actualTime = calculateActualTime(categoryId)
      const previousTime = calculatePreviousPeriodTime(categoryId)
      const weeklyAverage = calculateWeeklyAverage(categoryId)
      const goalTime = calculateGoalTime(categoryId)
      const percentage = goalTime > 0 ? Math.round((actualTime / goalTime) * 100) : 0
      const lastActivityDate = getLastActivityDate(categoryId)
      const trend = getTrend(actualTime, previousTime)

      // Get subcategory data
      const subcategories = getSubcategoryData(categoryId)

      // Get the color key for this category
      const colorKey = category.color || getCategoryColorKey(category.id)

      // Create gradients if canvas context is available
      const backgroundColors: (string | CanvasGradient)[] = []
      const borderColors: string[] = []

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          // Create gradients for each subcategory
          subcategories.forEach((subcategory, index) => {
            backgroundColors.push(createGradient(ctx, colorKey, index, subcategories.length))
            borderColors.push(getColorFromMap(colorKey, 600))
          })

          // If no subcategories have time, add a placeholder
          if (subcategories.length === 0 || subcategories.every((s) => s.value === 0)) {
            backgroundColors.push(createGradient(ctx, colorKey))
            borderColors.push(getColorFromMap(colorKey, 600))
          }

          // Add remaining time segment with lighter gradient
          const lightGradient = ctx.createRadialGradient(150, 150, 50, 150, 150, 150)
          lightGradient.addColorStop(0, getColorFromMap(colorKey, 100))
          lightGradient.addColorStop(0.5, getColorFromMap(colorKey, 200))
          lightGradient.addColorStop(1, getColorFromMap(colorKey, 300))

          backgroundColors.push(lightGradient)
          borderColors.push(getColorFromMap(colorKey, 300))
        }
      }

      // If no canvas context, use fallback colors
      if (backgroundColors.length === 0) {
        subcategories.forEach((subcategory, index) => {
          backgroundColors.push(getColorFromMap(colorKey, 500))
          borderColors.push(getColorFromMap(colorKey, 600))
        })

        // Add remaining time segment
        backgroundColors.push(getColorFromMap(colorKey, 200))
        borderColors.push(getColorFromMap(colorKey, 300))
      }

      // Calculate remaining time (if any)
      const remainingTime = Math.max(0, goalTime - actualTime)

      // Prepare labels and data
      const labels = [...subcategories.map((s) => s.name), "Remaining"]

      // Prepare data values - if no subcategories have time, use a placeholder
      let dataValues: number[]

      if (subcategories.length === 0 || subcategories.every((s) => s.value === 0)) {
        dataValues = [actualTime > 0 ? actualTime : 1, remainingTime > 0 ? remainingTime : 0]
      } else {
        dataValues = [...subcategories.map((s) => (s.value > 0 ? s.value : 0)), remainingTime > 0 ? remainingTime : 0]

        // If all values are 0, add a placeholder
        if (dataValues.every((v) => v === 0)) {
          dataValues = [1, 0]
        }
      }

      // Prepare data for the chart
      const data: ChartData<"doughnut"> = {
        labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: 1,
            cutout: "70%",
            hoverOffset: 5,
          },
        ],
      }

      return {
        chartData: data,
        percentage,
        actualTime,
        goalTime,
        previousTime,
        weeklyAverage,
        lastActivityDate,
        trend,
        metrics: category.metrics || [],
        colorKey,
        subcategories,
        backgroundColors,
        borderColors,
        dataValues,
      }
    },
    [
      categories,
      calculateActualTime,
      calculateGoalTime,
      calculatePreviousPeriodTime,
      getSubcategoryData,
      getLastActivityDate,
      calculateWeeklyAverage,
    ],
  )

  // Check for data changes and trigger transitions
  useEffect(() => {
    if (isInitialRender) return

    // For each category, check if data has changed
    categories.forEach((category) => {
      // Generate new chart data
      const newChartData = generateCategoryData(category.id, {
        current: canvasRefs.current[category.id],
      } as React.RefObject<HTMLCanvasElement>)

      if (!newChartData) return

      // Get previous chart data
      const prevChartData = previousDataRef.current[category.id]

      // If we have previous data, check for changes
      if (prevChartData) {
        const hasDataChanged =
          prevChartData.actualTime !== newChartData.actualTime ||
          prevChartData.goalTime !== newChartData.goalTime ||
          JSON.stringify(prevChartData.dataValues) !== JSON.stringify(newChartData.dataValues)

        // If data has changed, trigger a transition
        if (hasDataChanged) {
          // Cancel any ongoing transition for this category
          if (animationFrameRef.current[category.id]) {
            cancelAnimationFrame(animationFrameRef.current[category.id])
          }

          // Set transition flag
          setIsTransitioning((prev) => ({ ...prev, [category.id]: true }))

          // Create transition colors
          const transitionBackgroundColors = newChartData.backgroundColors.map((color, index) => {
            // Get the corresponding previous color or use the new color as fallback
            const prevColor = prevChartData.backgroundColors[index] || color

            // If the color is a gradient, use a solid color for transition
            const newColorStr =
              typeof color === "string" ? color : getColorFromMap(newChartData.colorKey, 500 + ((index * 100) % 300))
            const prevColorStr =
              typeof prevColor === "string"
                ? prevColor
                : getColorFromMap(prevChartData.colorKey, 500 + ((index * 100) % 300))

            // Create a pulsing effect by brightening the color slightly
            return createPulsingColor(newColorStr, 0.15)
          })

          // Set transition colors
          setTransitionColors((prev) => ({
            ...prev,
            [category.id]: {
              backgroundColors: transitionBackgroundColors,
              borderColors: newChartData.borderColors.map((color) => {
                // Create a slightly brighter border color
                return typeof color === "string" ? createPulsingColor(color, 0.2) : color
              }),
            },
          }))

          // Start transition animation
          const startTime = Date.now()
          const duration = 1500 // ms

          const animateTransition = () => {
            const elapsed = Date.now() - startTime
            const progress = Math.min(elapsed / duration, 1)

            // If animation is complete, end transition
            if (progress >= 1) {
              setIsTransitioning((prev) => ({ ...prev, [category.id]: false }))
              return
            }

            // Continue animation
            animationFrameRef.current[category.id] = requestAnimationFrame(animateTransition)
          }

          // Start animation
          animationFrameRef.current[category.id] = requestAnimationFrame(animateTransition)
        }
      }

      // Update previous data reference
      previousDataRef.current[category.id] = newChartData

      // Update chart data cache
      setChartDataCache((prev) => ({ ...prev, [category.id]: newChartData }))
    })

    // Cleanup animation frames on unmount
    return () => {
      Object.values(animationFrameRef.current).forEach((frameId) => {
        cancelAnimationFrame(frameId)
      })
    }
  }, [categories, entries, goals, isInitialRender, generateCategoryData])

  // Animate percentage counter
  useEffect(() => {
    if (isInitialRender) return

    // For each category, animate the percentage
    categories.forEach((category) => {
      // Retrieve chart data from cache or generate it
      let chartData = chartDataCache[category.id]

      if (!chartData) {
        chartData = generateCategoryData(category.id, {
          current: canvasRefs.current[category.id],
        } as React.RefObject<HTMLCanvasElement>)

        if (chartData) {
          setChartDataCache((prev) => ({ ...prev, [category.id]: chartData }))
        }
      }

      if (!chartData) return

      const targetPercentage = chartData.percentage
      const startPercentage = 0
      const duration = 1500 // ms
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function for smooth animation
        const easeOutQuart = (x: number): number => 1 - Math.pow(1 - x, 4)
        const easedProgress = easeOutQuart(progress)

        const currentPercentage = Math.round(startPercentage + (targetPercentage - startPercentage) * easedProgress)

        setAnimatedPercentages((prev) => ({
          ...prev,
          [category.id]: currentPercentage,
        }))

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      animate()
    })
  }, [categories, isInitialRender, chartDataCache, generateCategoryData])

  // Chart options factory - creates options with category-specific data
  const createChartOptions = useCallback(
    (categoryData: any) => {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            enabled: true,
            backgroundColor: getColorFromMap(categoryData.colorKey, 900),
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 12,
            },
            padding: 12,
            cornerRadius: 6,
            callbacks: {
              // Custom title
              title: (tooltipItems: any) => {
                const item = tooltipItems[0]
                const label = item.label || "Unknown"

                if (label === "Remaining") {
                  return "🎯 Remaining Goal Time"
                } else {
                  return `📊 ${label}`
                }
              },
              // Custom label
              label: (context: any) => {
                const value = context.raw || 0
                const formattedTime = formatTime(value)
                const label = context.label || "Unknown"

                if (label === "Remaining") {
                  return [
                    `Time remaining: ${formattedTime}`,
                    `To reach your goal of ${formatTime(categoryData.goalTime)}`,
                  ]
                } else {
                  const percentage = categoryData.goalTime > 0 ? Math.round((value / categoryData.goalTime) * 100) : 0

                  return [`Time spent: ${formattedTime}`, `${percentage}% of your total goal`]
                }
              },
              // Custom footer
              footer: (tooltipItems: any) => {
                const item = tooltipItems[0]
                const label = item.label || "Unknown"

                if (label !== "Remaining") {
                  const lines = []

                  // Add weekly average for this subcategory if available
                  const subcategory = categoryData.subcategories.find((s: any) => s.name === label)
                  if (subcategory) {
                    // Add last activity date
                    if (categoryData.lastActivityDate) {
                      lines.push(
                        `⏱️ Last activity: ${formatDistanceToNow(categoryData.lastActivityDate, { addSuffix: true })}`,
                      )
                    }
                  }

                  return lines
                }

                return []
              },
            },
          },
        },
        animation: {
          animateRotate: true,
          animateScale: true,
          duration: 1200,
          easing: "easeOutQuart",
          delay: (context: any) => {
            // Stagger the animation of segments
            return context.dataIndex * 100
          },
        },
        // Enable hover effects
        events: ["mousemove", "mouseout", "touchstart", "touchmove"],
        // Add hover effects
        elements: {
          arc: {
            hoverBorderWidth: 2,
            borderWidth: 1,
            hoverBorderColor: (context: any) => {
              const colorKey = categoryData.colorKey
              return getColorFromMap(colorKey, 900)
            },
          },
        },
      }
    },
    [categories],
  )

  // Get chart instance reference
  const getChartRef = (categoryId: string, ref: any) => {
    if (ref) {
      chartRefs.current[categoryId] = ref
    }
  }

  return (
    <div className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Category Performance</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map((category) => {
          const colorKey = category.color || getCategoryColorKey(category.id)
          const headerColorClass = `bg-${colorKey}-600 text-white`

          // Generate chart data with canvas reference for gradients
          const chartData = useMemo(() => {
            // Retrieve chart data from cache or generate it
            let cachedData = chartDataCache[category.id]

            if (!cachedData) {
              cachedData = generateCategoryData(category.id, {
                current: canvasRefs.current[category.id],
              } as React.RefObject<HTMLCanvasElement>)

              if (cachedData) {
                setChartDataCache((prev) => ({ ...prev, [category.id]: cachedData }))
              }
            }

            return cachedData
          }, [category.id, entries, goals, generateCategoryData, chartDataCache])

          if (!chartData) return null

          // Create chart options with category-specific data
          const chartOptions = useMemo(() => createChartOptions(chartData), [chartData, createChartOptions])

          const CategoryIcon = getIconComponent(category.icon)

          // Get animated percentage or fall back to actual percentage
          const displayPercentage =
            animatedPercentages[category.id] !== undefined ? animatedPercentages[category.id] : chartData.percentage

          // Check if this category is transitioning
          const isInTransition = isTransitioning[category.id] || false

          // Apply transition colors if in transition
          const chartDataWithTransition = { ...chartData }
          if (isInTransition && transitionColors[category.id]) {
            chartDataWithTransition.chartData = {
              ...chartData.chartData,
              datasets: [
                {
                  ...chartData.chartData.datasets[0],
                  backgroundColor: transitionColors[category.id].backgroundColors,
                  borderColor: transitionColors[category.id].borderColors,
                  borderWidth: 2, // Slightly thicker border during transition
                },
              ],
            }
          }

          return (
            <Card
              key={category.id}
              className={cn(
                "overflow-hidden transition-all duration-300",
                resizableCards[category.id] ? "ring-2 ring-primary" : "",
                isInTransition ? "shadow-lg" : "",
              )}
              style={cardSizes[category.id] || {}}
            >
              <CardHeader className={cn("p-4", headerColorClass)}>
                <CardTitle className="flex items-center gap-2 text-xl">
                  {CategoryIcon && <CategoryIcon className="h-5 w-5" />}
                  {category.name.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">Current Reality</h3>
                      <p
                        className={cn(
                          "text-2xl font-bold transition-all duration-500",
                          isInTransition ? "text-primary" : "",
                        )}
                      >
                        Actual: {formatTime(chartData.actualTime)}
                        {chartData.trend && chartData.trend.direction !== "stable" && (
                          <span
                            className={cn(
                              "ml-2 text-sm",
                              chartData.trend.direction === "up" ? "text-green-500" : "text-red-500",
                            )}
                          >
                            {chartData.trend.direction === "up" ? "↗" : "↘"}
                            {chartData.trend.percentage}%
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Time spent on {category.name.toLowerCase()}-related activities
                      </p>
                    </div>

                    <div>
                      <h3 className="font-medium text-lg">Goal</h3>
                      <p
                        className={cn(
                          "text-2xl font-bold transition-all duration-500",
                          isInTransition ? "text-primary" : "",
                        )}
                      >
                        Goal: {formatTime(chartData.goalTime)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {chartData.metrics && chartData.metrics.length > 0
                          ? chartData.metrics
                              .slice(0, 2)
                              .map((m) => m.name)
                              .join(" and ")
                          : "No metrics defined"}
                      </p>
                    </div>
                  </div>

                  <div className="relative h-[180px] flex items-center justify-center">
                    <canvas
                      ref={(el) => el && (canvasRefs.current[category.id] = el)}
                      className="absolute opacity-0 pointer-events-none"
                    />
                    <div
                      className={cn(
                        "w-full h-full transition-all duration-300",
                        isInTransition ? "scale-105" : "scale-100",
                      )}
                    >
                      <Doughnut
                        ref={(ref) => getChartRef(category.id, ref)}
                        key={`chart-${category.id}`}
                        data={chartDataWithTransition.chartData}
                        options={chartOptions}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <div className="relative">
                          <svg className="w-16 h-16" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={getColorFromMap(colorKey, 100)}
                              strokeWidth="8"
                              className="opacity-25"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="45"
                              fill="none"
                              stroke={
                                isInTransition
                                  ? createPulsingColor(getColorFromMap(colorKey, 500), 0.2)
                                  : getColorFromMap(colorKey, 500)
                              }
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${displayPercentage * 2.83}, 283`}
                              className="transition-all duration-1000 ease-out"
                              transform="rotate(-90 50 50)"
                            />
                          </svg>
                          <span
                            className={cn(
                              "absolute inset-0 flex items-center justify-center text-3xl font-bold transition-all duration-300",
                              isInTransition ? "text-primary scale-110" : "",
                            )}
                          >
                            {displayPercentage}%
                          </span>
                        </div>
                        <span className="block text-sm font-medium text-muted-foreground mt-1">
                          {formatTime(chartData.actualTime)} / {formatTime(chartData.goalTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {chartData.subcategories.length > 0 ? (
                    chartData.subcategories.map((subcategory: any, index: number) => (
                      <div key={subcategory.id} className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full transition-all duration-500",
                            isInTransition ? "animate-pulse" : "",
                          )}
                          style={{
                            backgroundColor: isInTransition
                              ? createPulsingColor(getColorFromMap(colorKey, 400 + ((index * 100) % 300)), 0.2)
                              : getColorFromMap(colorKey, 400 + ((index * 100) % 300)),
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-sm">{subcategory.name}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full transition-all duration-500",
                            isInTransition ? "animate-pulse" : "",
                          )}
                          style={{
                            backgroundColor: isInTransition
                              ? createPulsingColor(getColorFromMap(colorKey, 500), 0.2)
                              : getColorFromMap(colorKey, 500),
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-sm">Actual Time</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div
                          className={cn(
                            "w-3 h-3 rounded-full transition-all duration-500",
                            isInTransition ? "animate-pulse" : "",
                          )}
                          style={{
                            backgroundColor: isInTransition
                              ? createPulsingColor(getColorFromMap(colorKey, 200), 0.2)
                              : getColorFromMap(colorKey, 200),
                          }}
                          aria-hidden="true"
                        />
                        <span className="text-sm">Remaining Time</span>
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={() => toggleResizable(category.id)}
                  className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {resizableCards[category.id] ? "Lock size" : "Resize"}
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
