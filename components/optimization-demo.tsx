"use client"

import type React from "react"

import { useCallback, memo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { OptimizedProvider } from "@/context/optimized-context"
import { OptimizedUserProfile, OptimizedThemeToggle, OptimizedItemList } from "@/components/optimized-ui-components"
import { useRenderMonitor } from "@/lib/performance-utils"
import { useSplitState } from "@/lib/state-splitting"

export function OptimizationDemo() {
  useRenderMonitor("OptimizationDemo")

  // Use split state
  const [demoState, setters, resetState] = useSplitState({
    counter1: 0,
    counter2: 0,
    text: "",
    showDetails: false,
  })

  // Increment counter 1 (only components that use counter1 will re-render)
  const incrementCounter1 = useCallback(() => {
    setters.counter1((prev) => prev + 1)
  }, [setters])

  // Increment counter 2 (only components that use counter2 will re-render)
  const incrementCounter2 = useCallback(() => {
    setters.counter2((prev) => prev + 1)
  }, [setters])

  // Update text (only components that use text will re-render)
  const updateText = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setters.text(e.target.value)
    },
    [setters],
  )

  // Toggle details (only components that use showDetails will re-render)
  const toggleDetails = useCallback(() => {
    setters.showDetails((prev) => !prev)
  }, [setters])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>State Optimization Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Counter1 value={demoState.counter1} onIncrement={incrementCounter1} />
            <Counter2 value={demoState.counter2} onIncrement={incrementCounter2} />
            <TextInput value={demoState.text} onChange={updateText} />
            <DetailsToggle showDetails={demoState.showDetails} onToggle={toggleDetails} />
          </div>

          {demoState.showDetails && (
            <div className="mt-4 p-4 border rounded-md">
              <h3 className="font-medium">State Details</h3>
              <pre className="mt-2 p-2 bg-muted rounded-md text-xs">{JSON.stringify(demoState, null, 2)}</pre>
            </div>
          )}

          <div className="mt-4">
            <Button variant="outline" onClick={resetState}>
              Reset All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Optimized Context Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <OptimizedProvider>
            <div className="grid gap-4 md:grid-cols-2">
              <OptimizedUserProfile />
              <div className="space-y-4">
                <OptimizedThemeToggle />
                <OptimizedItemList />
              </div>
            </div>
          </OptimizedProvider>
        </CardContent>
      </Card>
    </div>
  )
}

// Counter components that only re-render when their specific counter changes
const Counter1 = memo(function Counter1({
  value,
  onIncrement,
}: {
  value: number
  onIncrement: () => void
}) {
  useRenderMonitor("Counter1")

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium">Counter 1</h3>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-2xl font-bold">{value}</span>
        <Button size="sm" onClick={onIncrement}>
          Increment
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">This component only re-renders when Counter 1 changes</p>
    </div>
  )
})

const Counter2 = memo(function Counter2({
  value,
  onIncrement,
}: {
  value: number
  onIncrement: () => void
}) {
  useRenderMonitor("Counter2")

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium">Counter 2</h3>
      <div className="flex items-center gap-2 mt-2">
        <span className="text-2xl font-bold">{value}</span>
        <Button size="sm" onClick={onIncrement}>
          Increment
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">This component only re-renders when Counter 2 changes</p>
    </div>
  )
})

const TextInput = memo(function TextInput({
  value,
  onChange,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) {
  useRenderMonitor("TextInput")

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium">Text Input</h3>
      <div className="mt-2">
        <input
          type="text"
          value={value}
          onChange={onChange}
          className="w-full p-2 border rounded-md"
          placeholder="Type something..."
        />
      </div>
      <p className="text-xs text-muted-foreground mt-2">This component only re-renders when the text changes</p>
    </div>
  )
})

const DetailsToggle = memo(function DetailsToggle({
  showDetails,
  onToggle,
}: {
  showDetails: boolean
  onToggle: () => void
}) {
  useRenderMonitor("DetailsToggle")

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-medium">Details Toggle</h3>
      <div className="mt-2">
        <Button variant="outline" size="sm" onClick={onToggle}>
          {showDetails ? "Hide Details" : "Show Details"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2">This component only re-renders when the toggle state changes</p>
    </div>
  )
})
