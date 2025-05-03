"use client"

import type React from "react"

import { useContext, useRef, useState, useEffect } from "react"
import { useStableDependencyCallback } from "./performance-utils"

/**
 * A hook that selects a slice of context state and only re-renders when that slice changes
 * @param context The React context to select from
 * @param selector A function that selects a slice of the context value
 * @returns The selected slice of context
 */
export function useContextSelector<T, S>(context: React.Context<T>, selector: (state: T) => S): S {
  const contextValue = useContext(context)

  // Memoize the selector function
  const stableSelector = useStableDependencyCallback(selector, [selector])

  // Get the current selected value
  const currentSelectedValue = stableSelector(contextValue)

  // Store the selected value in state
  const [selectedValue, setSelectedValue] = useState<S>(currentSelectedValue)

  // Store the previous context value and selected value for comparison
  const previousContextValueRef = useRef<T>(contextValue)
  const previousSelectedValueRef = useRef<S>(currentSelectedValue)

  // Update the selected value if it has changed
  useEffect(() => {
    // Skip if the context value hasn't changed (reference equality)
    if (previousContextValueRef.current === contextValue) {
      return
    }

    // Update the previous context value
    previousContextValueRef.current = contextValue

    // Get the new selected value
    const newSelectedValue = stableSelector(contextValue)

    // Skip if the selected value hasn't changed (reference equality)
    if (Object.is(previousSelectedValueRef.current, newSelectedValue)) {
      return
    }

    // Update the previous selected value
    previousSelectedValueRef.current = newSelectedValue

    // Update the state to trigger a re-render
    setSelectedValue(newSelectedValue)
  }, [contextValue, stableSelector])

  return selectedValue
}
