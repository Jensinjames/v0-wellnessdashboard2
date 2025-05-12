"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

export interface CardGridItem {
  id: string
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  content: React.ReactNode
}

interface CardGridProps {
  items: CardGridItem[]
  className?: string
  gap?: number
  minColWidth?: number
  saveLayout?: boolean
  layoutId?: string
  onLayoutChange?: (layout: { id: string; width: number; height: number }[]) => void
}

export function CardGrid({
  items,
  className,
  gap = 16,
  minColWidth = 300,
  saveLayout = false,
  layoutId = "default-grid",
  onLayoutChange,
}: CardGridProps) {
  const gridRef = React.useRef<HTMLDivElement>(null)
  const [layout, setLayout] = React.useState<Record<string, { width: number; height: number }>>({})
  const [columns, setColumns] = React.useState(3)
  const [isInitialized, setIsInitialized] = React.useState(false)

  // Load saved layout from localStorage if enabled
  React.useEffect(() => {
    if (saveLayout) {
      try {
        const savedLayout = localStorage.getItem(`card-grid-layout-${layoutId}`)
        if (savedLayout) {
          setLayout(JSON.parse(savedLayout))
        }
      } catch (error) {
        console.error("Failed to load saved layout:", error)
      }
    }
    setIsInitialized(true)
  }, [saveLayout, layoutId])

  // Save layout to localStorage when it changes
  React.useEffect(() => {
    if (saveLayout && isInitialized && Object.keys(layout).length > 0) {
      try {
        localStorage.setItem(`card-grid-layout-${layoutId}`, JSON.stringify(layout))
      } catch (error) {
        console.error("Failed to save layout:", error)
      }
    }
  }, [layout, saveLayout, layoutId, isInitialized])

  // Calculate optimal number of columns based on container width
  React.useEffect(() => {
    if (!gridRef.current) return

    const calculateColumns = () => {
      const containerWidth = gridRef.current?.clientWidth || 0
      const optimalColumns = Math.max(1, Math.floor(containerWidth / (minColWidth + gap)))
      setColumns(optimalColumns)
    }

    calculateColumns()
    window.addEventListener("resize", calculateColumns)
    return () => window.removeEventListener("resize", calculateColumns)
  }, [minColWidth, gap])

  // Handle card resize
  const handleCardResize = React.useCallback(
    (id: string, size: { width: number; height: number }) => {
      setLayout((prev) => {
        const newLayout = { ...prev, [id]: size }

        // Notify parent component about layout changes
        if (onLayoutChange) {
          const layoutArray = Object.entries(newLayout).map(([id, size]) => ({
            id,
            ...size,
          }))
          onLayoutChange(layoutArray)
        }

        return newLayout
      })
    },
    [onLayoutChange],
  )

  return (
    <div
      ref={gridRef}
      className={cn("grid auto-rows-auto gap-4 transition-all duration-200 ease-in-out", className)}
      style={{
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gap: `${gap}px`,
      }}
    >
      {items.map((item) => {
        const savedSize = layout[item.id]
        const cardSpan = savedSize?.width
          ? Math.min(columns, Math.max(1, Math.ceil(savedSize.width / (minColWidth + gap))))
          : 1

        return (
          <div
            key={item.id}
            className="transition-all duration-200"
            style={{
              gridColumn: `span ${cardSpan} / span ${cardSpan}`,
              minHeight: item.minHeight ? `${item.minHeight}px` : undefined,
            }}
          >
            <Card
              resizable
              className="h-full w-full"
              minWidth={item.minWidth ? `${item.minWidth}px` : "200px"}
              minHeight={item.minHeight ? `${item.minHeight}px` : "100px"}
              defaultSize={
                savedSize || {
                  width: item.width ? `${item.width}px` : "100%",
                  height: item.height ? `${item.height}px` : "auto",
                }
              }
              onResize={(size) => handleCardResize(item.id, size)}
            >
              {item.content}
            </Card>
          </div>
        )
      })}
    </div>
  )
}
