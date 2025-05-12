"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    resizable?: boolean
    minWidth?: string
    minHeight?: string
    defaultSize?: { width: string; height: string }
    onResize?: (size: { width: number; height: number }) => void
  }
>(({ className, resizable, minWidth = "200px", minHeight = "100px", defaultSize, onResize, ...props }, ref) => {
  const cardRef = React.useRef<HTMLDivElement>(null)
  const [isResizing, setIsResizing] = React.useState(false)
  const [size, setSize] = React.useState(defaultSize || { width: "auto", height: "auto" })

  // Handle resize functionality
  const handleResizeStart = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault()
      setIsResizing(true)

      const handleResize = (e: MouseEvent) => {
        if (!cardRef.current) return

        const rect = cardRef.current.getBoundingClientRect()
        const width = Math.max(Number.parseInt(minWidth), e.clientX - rect.left)
        const height = Math.max(Number.parseInt(minHeight), e.clientY - rect.top)

        setSize({ width: `${width}px`, height: `${height}px` })
        onResize?.({ width, height })
      }

      const handleResizeEnd = () => {
        setIsResizing(false)
        document.removeEventListener("mousemove", handleResize)
        document.removeEventListener("mouseup", handleResizeEnd)
      }

      document.addEventListener("mousemove", handleResize)
      document.addEventListener("mouseup", handleResizeEnd)
    },
    [minWidth, minHeight, onResize],
  )

  // Merge refs
  const mergedRef = React.useMemo(() => {
    return (node: HTMLDivElement) => {
      cardRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }
  }, [ref])

  return (
    <div
      ref={mergedRef}
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        resizable && "relative overflow-hidden",
        isResizing && "select-none",
        className,
      )}
      style={resizable ? { ...size, transition: isResizing ? "none" : "width 0.2s, height 0.2s" } : undefined}
      {...props}
    >
      {props.children}
      {resizable && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize opacity-0 hover:opacity-100 focus:opacity-100"
          onMouseDown={handleResizeStart}
          tabIndex={0}
          role="button"
          aria-label="Resize card"
          style={{
            backgroundImage: "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.2))",
          }}
        />
      )}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
)
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
)
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
)
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    categoryData?: {
      id: string
      name: string
      color?: string
      subcategories?: Array<{
        id: string
        name: string
        value?: number
        progress?: number
      }>
    }
    showGraph?: boolean
  }
>(({ className, categoryData, showGraph, children, ...props }, ref) => {
  const renderGraph = () => {
    if (!categoryData || !showGraph) return null

    // Extract base color from category
    const baseColor = categoryData.color || "slate"
    const baseColorClass = `text-${baseColor}-600`

    return (
      <div
        className="category-graph mt-4 mb-2 overflow-hidden"
        aria-label={`${categoryData.name} hierarchy visualization`}
      >
        <div className="flex flex-col space-y-1">
          {/* Root node */}
          <div
            className={`p-2 rounded-md text-sm font-medium text-center ${baseColorClass} bg-${baseColor}-50 dark:bg-${baseColor}-900/30 border border-${baseColor}-200 dark:border-${baseColor}-800`}
          >
            {categoryData.name}
          </div>

          {/* Subcategory connections */}
          {categoryData.subcategories && categoryData.subcategories.length > 0 && (
            <>
              <div className={`w-0.5 h-4 mx-auto bg-${baseColor}-200 dark:bg-${baseColor}-800`} aria-hidden="true" />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categoryData.subcategories.map((subcat, index) => (
                  <div key={subcat.id} className="flex flex-col items-center">
                    {/* Connection line */}
                    <div className={`w-0.5 h-4 bg-${baseColor}-200 dark:bg-${baseColor}-800`} aria-hidden="true" />

                    {/* Subcategory node */}
                    <div
                      className={`p-1.5 w-full text-xs text-center rounded-md 
                        ${subcat.progress !== undefined ? `bg-gradient-to-r from-${baseColor}-50 to-${baseColor}-100` : `bg-${baseColor}-50`}
                        dark:bg-${baseColor}-900/20 
                        border border-${baseColor}-100 dark:border-${baseColor}-800/50
                        text-${baseColor}-700 dark:text-${baseColor}-300`}
                      style={{
                        background:
                          subcat.progress !== undefined
                            ? `linear-gradient(to right, rgb(var(--${baseColor}-50)) 0%, rgb(var(--${baseColor}-100)) ${subcat.progress}%, rgb(var(--${baseColor}-50)) ${subcat.progress}%)`
                            : undefined,
                      }}
                    >
                      <div className="font-medium">{subcat.name}</div>
                      {subcat.value !== undefined && <div className="mt-1 text-xs opacity-80">{subcat.value}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div ref={ref} className={cn("p-6 pt-0", className)} {...props}>
      {children}
      {renderGraph()}
    </div>
  )
})
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
)
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
