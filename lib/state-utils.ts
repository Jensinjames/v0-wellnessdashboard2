"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"

/**
 * Custom hook for managing state with localStorage persistence
 * @param key The localStorage key
 * @param initialValue The initial state value
 * @returns [state, setState, isPending]
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  // Use a ref to track if the state has been initialized from localStorage
  const initialized = useRef(false)
  const [isPending, setIsPending] = useState(false)

  // Use state with initialization function to avoid unnecessary localStorage reads
  const [state, setState] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue

    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : initialValue
    } catch (error) {
      console.error("Error reading from localStorage:", error)
      return initialValue
    }
  })

  // Persist to localStorage whenever state changes
  useEffect(() => {
    // Skip the first render if we just initialized from localStorage
    if (!initialized.current) {
      initialized.current = true
      return
    }

    const saveState = async () => {
      setIsPending(true)
      try {
        window.localStorage.setItem(key, JSON.stringify(state))
      } catch (error) {
        console.error("Error writing to localStorage:", error)
      } finally {
        setIsPending(false)
      }
    }

    saveState()
  }, [key, state])

  return [state, setState, isPending]
}

/**
 * Creates a stable reference to a function that depends on state
 * @param callback The function to memoize
 * @param dependencies The dependencies array
 * @returns A memoized function
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList,
): T {
  const callbackRef = useRef<T>(callback)

  useEffect(() => {
    callbackRef.current = callback
  }, [callback, ...dependencies])

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    return callbackRef.current(...args)
  }, []) as T
}

/**
 * Debounces a value change
 * @param value The value to debounce
 * @param delay The debounce delay in ms
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * Creates a stable object reference that only changes when its properties change
 * @param obj The object to memoize
 * @returns A memoized object
 */
export function useStableObject<T extends object>(obj: T): T {
  const ref = useRef<T>(obj)

  // Only update the ref if any properties have changed
  useEffect(() => {
    const hasChanged = Object.entries(obj).some(([key, value]) => ref.current[key as keyof T] !== value)

    if (hasChanged) {
      ref.current = { ...obj }
    }
  }, [obj])

  return ref.current
}

/**
 * Safely handles async state updates to prevent race conditions
 * @param asyncFunction The async function to execute
 * @returns [execute, isLoading, error]
 */
export function useAsyncState<T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
): [(...args: Args) => Promise<T | undefined>, boolean, Error | null] {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const isMounted = useRef(true)
  const latestCall = useRef<number>(0)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  const execute = useCallback(
    async (...args: Args) => {
      const callId = Date.now()
      latestCall.current = callId

      setIsLoading(true)
      setError(null)

      try {
        const result = await asyncFunction(...args)

        // Only update state if this is the latest call and component is mounted
        if (isMounted.current && latestCall.current === callId) {
          setIsLoading(false)
          return result
        }
      } catch (err) {
        // Only update state if this is the latest call and component is mounted
        if (isMounted.current && latestCall.current === callId) {
          setIsLoading(false)
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      }

      return undefined
    },
    [asyncFunction],
  )

  return [execute, isLoading, error]
}
