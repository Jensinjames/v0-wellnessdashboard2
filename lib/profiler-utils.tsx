"use client"

import type React from "react"

import { Profiler, type ProfilerOnRenderCallback, useRef, useEffect } from "react"

interface RenderMetrics {
  id: string
  phase: "mount" | "update"
  actualDuration: number
  baseDuration: number
  startTime: number
  commitTime: number
  interactions: Set<any>
}

/**
 * Component that wraps children with React Profiler to measure render performance
 */
export function PerformanceProfiler({
  id,
  children,
  onRender,
}: {
  id: string
  children: React.ReactNode
  onRender?: ProfilerOnRenderCallback
}) {
  const metricsRef = useRef<RenderMetrics[]>([])

  // Default onRender callback that logs performance metrics
  const defaultOnRender: ProfilerOnRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime,
    interactions,
  ) => {
    // Store metrics
    metricsRef.current.push({
      id,
      phase,
      actualDuration,
      baseDuration,
      startTime,
      commitTime,
      interactions,
    })

    // Keep only the last 10 renders
    if (metricsRef.current.length > 10) {
      metricsRef.current.shift()
    }

    // Log to console
    console.log(`%c[Profiler: ${id}] ${phase} render:`, "color: #0ea5e9;", {
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
      renderTime: `${(commitTime - startTime).toFixed(2)}ms`,
    })
  }

  // Expose metrics via window for debugging
  useEffect(() => {
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.__PERFORMANCE_METRICS = window.__PERFORMANCE_METRICS || {}
      // @ts-ignore
      window.__PERFORMANCE_METRICS[id] = metricsRef
    }

    return () => {
      if (typeof window !== "undefined") {
        // @ts-ignore
        if (window.__PERFORMANCE_METRICS && window.__PERFORMANCE_METRICS[id]) {
          // @ts-ignore
          delete window.__PERFORMANCE_METRICS[id]
        }
      }
    }
  }, [id])

  return (
    <Profiler id={id} onRender={onRender || defaultOnRender}>
      {children}
    </Profiler>
  )
}

/**
 * Hook to measure component render frequency and duration
 */
export function useRenderMetrics(componentName: string) {
  const renderCountRef = useRef(0)
  const lastRenderTimeRef = useRef(performance.now())
  const renderDurationsRef = useRef<number[]>([])

  // Increment render count and measure render duration
  renderCountRef.current += 1
  const startTime = performance.now()

  // Use layout effect to measure render duration
  useEffect(() => {
    const endTime = performance.now()
    const renderDuration = endTime - startTime

    renderDurationsRef.current.push(renderDuration)

    // Keep only the last 10 render durations
    if (renderDurationsRef.current.length > 10) {
      renderDurationsRef.current.shift()
    }

    // Calculate average render duration
    const averageRenderDuration =
      renderDurationsRef.current.reduce((sum, duration) => sum + duration, 0) / renderDurationsRef.current.length

    // Calculate time since last render
    const timeSinceLastRender = startTime - lastRenderTimeRef.current
    lastRenderTimeRef.current = startTime

    // Log render metrics
    console.log(`%c[${componentName}] render #${renderCountRef.current}:`, "color: #8b5cf6;", {
      renderDuration: `${renderDuration.toFixed(2)}ms`,
      averageRenderDuration: `${averageRenderDuration.toFixed(2)}ms`,
      timeSinceLastRender: `${timeSinceLastRender.toFixed(2)}ms`,
    })

    return () => {
      console.log(`%c[${componentName}] unmounted after ${renderCountRef.current} renders`, "color: #ef4444;")
    }
  })

  return {
    renderCount: renderCountRef.current,
    renderDurations: renderDurationsRef.current,
  }
}
