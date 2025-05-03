"use client"

import type React from "react"

import { memo, useRef } from "react"
import { usePropChangeDetector } from "./performance-utils"

/**
 * Enhanced version of React.memo with deep comparison
 * @param Component The component to memoize
 * @param propsAreEqual Optional custom comparison function
 */
export function deepMemo<P extends object>(
  Component: React.ComponentType<P>,
  propsAreEqual?: (prevProps: Readonly<P>, nextProps: Readonly<P>) => boolean,
): React.MemoExoticComponent<React.ComponentType<P>> {
  // Default deep comparison function
  const defaultPropsAreEqual = (prevProps: Readonly<P>, nextProps: Readonly<P>): boolean => {
    const prevKeys = Object.keys(prevProps)
    const nextKeys = Object.keys(nextProps)

    if (prevKeys.length !== nextKeys.length) {
      return false
    }

    return prevKeys.every((key) => {
      const prevValue = prevProps[key as keyof P]
      const nextValue = nextProps[key as keyof P]

      if (typeof prevValue === "function" && typeof nextValue === "function") {
        // Functions are compared by reference
        return prevValue === nextValue
      }

      if (typeof prevValue === "object" && prevValue !== null && typeof nextValue === "object" && nextValue !== null) {
        // Deep compare objects
        return JSON.stringify(prevValue) === JSON.stringify(nextValue)
      }

      // Primitive values are compared by value
      return Object.is(prevValue, nextValue)
    })
  }

  return memo(Component, propsAreEqual || defaultPropsAreEqual)
}

/**
 * HOC that adds debug information to a component to track re-renders
 * @param Component The component to debug
 * @param componentName Optional name for the component
 */
export function withReRenderDebugging<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string,
): React.FC<P> {
  const displayName = componentName || Component.displayName || Component.name || "Component"

  const DebuggingComponent: React.FC<P> = (props) => {
    usePropChangeDetector(props, displayName)
    return <Component {...props} />
  }

  DebuggingComponent.displayName = `Debug(${displayName})`
  return DebuggingComponent
}

/**
 * Custom hook for memoizing expensive objects with deep equality check
 * @param value The value to memoize
 * @param dependencies The dependencies array
 * @returns The memoized value
 */
export function useDeepMemo<T>(value: T, dependencies: React.DependencyList): T {
  const previousDepsRef = useRef<React.DependencyList>([])
  const previousValueRef = useRef<T>(value)

  // Check if dependencies have changed with deep comparison
  const depsChanged =
    dependencies.length !== previousDepsRef.current.length ||
    dependencies.some((dep, i) => {
      const prevDep = previousDepsRef.current[i]

      if (typeof dep === "function" && typeof prevDep === "function") {
        return false // Assume functions are stable
      }

      if (typeof dep === "object" && dep !== null && typeof prevDep === "object" && prevDep !== null) {
        return JSON.stringify(dep) !== JSON.stringify(prevDep)
      }

      return !Object.is(dep, prevDep)
    })

  if (depsChanged) {
    previousDepsRef.current = dependencies
    previousValueRef.current = value
  }

  return previousValueRef.current
}
