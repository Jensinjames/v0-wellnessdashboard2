"use client"

import type React from "react"

import { useRef, useEffect } from "react"

/**
 * Custom hook to log component render counts and render times
 * @param componentName The name of the component to monitor
 * @param enabled Whether monitoring is enabled
 */
export function useRenderMonitor(componentName: string, enabled = true) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(performance.now())

  useEffect(() => {
    if (!enabled) return

    renderCount.current += 1
    const now = performance.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now

    console.log(
      `%c[${componentName}] render #${renderCount.current} (${timeSinceLastRender.toFixed(2)}ms since last render)`,
      "color: #8b5cf6;",
    )

    return () => {
      if (renderCount.current === 1) {
        console.log(`%c[${componentName}] unmounted after ${renderCount.current} render`, "color: #ef4444;")
      }
    }
  })

  return renderCount.current
}

/**
 * Higher-order component that wraps a component with render monitoring
 * @param Component The component to monitor
 * @param componentName Optional name for the component
 */
export function withRenderMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
): React.FC<P> {
  const displayName = componentName || Component.displayName || Component.name || "Component"

  const MonitoredComponent: React.FC<P> = (props) => {
    useRenderMonitor(displayName)
    return <Component {...props} />
  }

  MonitoredComponent.displayName = `Monitored(${displayName})`
  return MonitoredComponent
}

/**
 * Custom hook to detect prop changes that cause re-renders
 * @param props The props object to monitor
 * @param componentName The name of the component
 */
export function usePropChangeDetector<T extends object>(props: T, componentName: string) {
  const prevPropsRef = useRef<T | null>(null)

  useEffect(() => {
    if (prevPropsRef.current) {
      const changedProps: Record<string, { from: any; to: any }> = {}
      let hasChanges = false

      Object.entries(props).forEach(([key, value]) => {
        if (prevPropsRef.current && prevPropsRef.current[key as keyof T] !== value) {
          hasChanges = true
          changedProps[key] = {
            from: prevPropsRef.current[key as keyof T],
            to: value,
          }
        }
      })

      if (hasChanges) {
        console.log(`%c[${componentName}] re-rendered due to prop changes:`, "color: #3b82f6;")
        console.table(changedProps)
      }
    }

    prevPropsRef.current = { ...props }
  })
}

/**
 * Creates a stable callback that only changes when its dependencies change
 * This is an enhanced version of useCallback with better dependency tracking
 */
export function useStableDependencyCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList,
  debugName?: string,
): T {
  const callbackRef = useRef<T>(callback)
  const dependenciesRef = useRef<React.DependencyList>(dependencies)

  // Check if dependencies have changed
  let dependenciesChanged = dependencies.length !== dependenciesRef.current.length

  if (!dependenciesChanged) {
    for (let i = 0; i < dependencies.length; i++) {
      if (dependencies[i] !== dependenciesRef.current[i]) {
        dependenciesChanged = true
        break
      }
    }
  }

  // Log dependency changes if in debug mode
  if (dependenciesChanged && debugName) {
    const changes: Record<number, { from: any; to: any }> = {}

    for (let i = 0; i < Math.max(dependencies.length, dependenciesRef.current.length); i++) {
      if (dependencies[i] !== dependenciesRef.current[i]) {
        changes[i] = {
          from: dependenciesRef.current[i],
          to: dependencies[i],
        }
      }
    }

    console.log(`%c[${debugName}] dependencies changed:`, "color: #10b981;")
    console.table(changes)
  }

  // Update refs if dependencies changed
  if (dependenciesChanged) {
    callbackRef.current = callback
    dependenciesRef.current = dependencies
  }

  return useRef<T>((...args: Parameters<T>): ReturnType<T> => {
    return callbackRef.current(...args)
  }).current as T
}
