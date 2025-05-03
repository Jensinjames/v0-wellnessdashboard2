"use client"

import { useState, useCallback, useMemo } from "react"

/**
 * Creates a state object with individual setters for each property
 * This allows updating individual properties without re-rendering components
 * that depend on other properties
 *
 * @param initialState The initial state object
 * @returns [state, setters, resetState]
 */
export function useSplitState<T extends Record<string, any>>(initialState: T) {
  // Create the main state
  const [state, setState] = useState<T>(initialState)

  // Create individual setters for each property
  const setters = useMemo(() => {
    const result: Record<string, (value: any) => void> = {}

    Object.keys(initialState).forEach((key) => {
      result[key] = (value: any) => {
        setState((prev) => ({
          ...prev,
          [key]: typeof value === "function" ? value(prev[key]) : value,
        }))
      }
    })

    return result as { [K in keyof T]: (value: T[K] | ((prev: T[K]) => T[K])) => void }
  }, []) // Empty dependency array because setters never need to change

  // Create a reset function
  const resetState = useCallback(() => {
    setState(initialState)
  }, [initialState])

  return [state, setters, resetState] as const
}

/**
 * Creates a state object that only re-renders when the selected properties change
 * @param initialState The initial state object
 * @returns [getState, setState, subscribe]
 */
export function useSubscribableState<T extends Record<string, any>>(initialState: T) {
  // Internal state
  const [state, setState] = useState<T>(initialState)

  // Subscribers map
  const subscribers = useMemo(() => new Map<string, Set<() => void>>(), [])

  // Get state (always returns current value)
  const getState = useCallback(() => state, [state])

  // Set state with selective notifications
  const updateState = useCallback(
    (update: Partial<T> | ((prev: T) => Partial<T>)) => {
      setState((prev) => {
        const updates = typeof update === "function" ? update(prev) : update
        const newState = { ...prev, ...updates }

        // Notify subscribers of changed properties
        Object.keys(updates).forEach((key) => {
          const keySubscribers = subscribers.get(key)
          if (keySubscribers) {
            keySubscribers.forEach((callback) => callback())
          }
        })

        return newState
      })
    },
    [subscribers],
  )

  // Subscribe to state changes
  const subscribe = useCallback(
    (keys: (keyof T)[], callback: () => void) => {
      // Add callback to subscribers for each key
      keys.forEach((key) => {
        if (!subscribers.has(key as string)) {
          subscribers.set(key as string, new Set())
        }
        subscribers.get(key as string)!.add(callback)
      })

      // Return unsubscribe function
      return () => {
        keys.forEach((key) => {
          const keySubscribers = subscribers.get(key as string)
          if (keySubscribers) {
            keySubscribers.delete(callback)
            if (keySubscribers.size === 0) {
              subscribers.delete(key as string)
            }
          }
        })
      }
    },
    [subscribers],
  )

  return [getState, updateState, subscribe] as const
}
