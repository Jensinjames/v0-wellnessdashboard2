"use client"

import type React from "react"

import { createContext, useContext, useRef, useState, useCallback, useEffect } from "react"

// Define the state shape
interface OptimizedState {
  user: {
    name: string
    email: string
    preferences: {
      theme: string
      notifications: boolean
    }
  }
  ui: {
    sidebarOpen: boolean
    currentView: string
    filters: string[]
  }
  data: {
    items: Array<{ id: string; name: string }>
    loading: boolean
    error: string | null
  }
}

// Define the initial state
const initialState: OptimizedState = {
  user: {
    name: "User",
    email: "user@example.com",
    preferences: {
      theme: "light",
      notifications: true,
    },
  },
  ui: {
    sidebarOpen: false,
    currentView: "dashboard",
    filters: [],
  },
  data: {
    items: [],
    loading: false,
    error: null,
  },
}

// Create the context
type OptimizedContextType = ReturnType<typeof createOptimizedStore>
const OptimizedContext = createContext<OptimizedContextType | null>(null)

// Create a store factory
function createOptimizedStore() {
  // Use subscribable state for fine-grained updates
  const [state, setState] = useState(initialState)
  const [subscriptions, setSubscriptions] = useState({})

  const subscribe = useCallback(
    (keys: string[], callback: () => void) => {
      const id = Math.random().toString(36) // Generate a unique ID
      setSubscriptions((prevSubscriptions) => ({
        ...prevSubscriptions,
        [id]: { keys, callback },
      }))

      return () => {
        setSubscriptions((prevSubscriptions) => {
          const newSubscriptions = { ...prevSubscriptions }
          delete newSubscriptions[id]
          return newSubscriptions
        })
      }
    },
    [setSubscriptions],
  )

  const getState = useCallback(() => state, [state])

  const updateState = useCallback(
    (updater: (prevState: OptimizedState) => OptimizedState) => {
      setState((prevState) => {
        const newState = updater(prevState)
        // Notify subscribers
        Object.values(subscriptions).forEach(({ keys, callback }) => {
          const shouldNotify = keys.some((key) => {
            const parts = key.split(".")
            let a: any = prevState
            let b: any = newState

            for (const part of parts) {
              if (!a || !b || typeof a !== "object" || typeof b !== "object") {
                return a !== b // Early exit if path doesn't exist or is not an object
              }
              a = a[part]
              b = b[part]
            }
            return a !== b
          })

          if (shouldNotify) {
            callback()
          }
        })
        return newState
      })
    },
    [setState, subscriptions],
  )

  // Create selectors for different parts of the state
  const selectors = {
    // User selectors
    getUserInfo: () => getState().user,
    getUserPreferences: () => getState().user.preferences,

    // UI selectors
    getUIState: () => getState().ui,
    getSidebarOpen: () => getState().ui.sidebarOpen,
    getCurrentView: () => getState().ui.currentView,
    getFilters: () => getState().ui.filters,

    // Data selectors
    getItems: () => getState().data.items,
    getLoadingState: () => getState().data.loading,
    getError: () => getState().data.error,
  }

  // Create actions for updating state
  const actions = {
    // User actions
    updateUserInfo: (updates: Partial<OptimizedState["user"]>) => {
      updateState((prev) => ({
        ...prev,
        user: { ...prev.user, ...updates },
      }))
    },
    updatePreferences: (updates: Partial<OptimizedState["user"]["preferences"]>) => {
      updateState((prev) => ({
        ...prev,
        user: {
          ...prev.user,
          preferences: { ...prev.user.preferences, ...updates },
        },
      }))
    },

    // UI actions
    toggleSidebar: () => {
      updateState((prev) => ({
        ...prev,
        ui: { ...prev.ui, sidebarOpen: !prev.ui.sidebarOpen },
      }))
    },
    setCurrentView: (view: string) => {
      updateState((prev) => ({
        ...prev,
        ui: { ...prev.ui, currentView: view },
      }))
    },
    addFilter: (filter: string) => {
      updateState((prev) => ({
        ...prev,
        ui: {
          ...prev.ui,
          filters: prev.ui.filters.includes(filter) ? prev.ui.filters : [...prev.ui.filters, filter],
        },
      }))
    },
    removeFilter: (filter: string) => {
      updateState((prev) => ({
        ...prev,
        ui: {
          ...prev.ui,
          filters: prev.ui.filters.filter((f) => f !== filter),
        },
      }))
    },

    // Data actions
    setLoading: (loading: boolean) => {
      updateState((prev) => ({
        ...prev,
        data: { ...prev.data, loading },
      }))
    },
    setError: (error: string | null) => {
      updateState((prev) => ({
        ...prev,
        data: { ...prev.data, error },
      }))
    },
    setItems: (items: Array<{ id: string; name: string }>) => {
      updateState((prev) => ({
        ...prev,
        data: { ...prev.data, items },
      }))
    },
    addItem: (item: { id: string; name: string }) => {
      updateState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          items: [...prev.data.items, item],
        },
      }))
    },
    removeItem: (id: string) => {
      updateState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          items: prev.data.items.filter((item) => item.id !== id),
        },
      }))
    },
  }

  return {
    ...selectors,
    ...actions,
    subscribe,
    getState,
  }
}

// Create the provider component
export function OptimizedProvider({ children }: { children: React.ReactNode }) {
  // Create the store
  const [store] = useState(() => createOptimizedStore())

  return <OptimizedContext.Provider value={store}>{children}</OptimizedContext.Provider>
}

// Create hooks for accessing the store
export function useOptimizedStore() {
  const context = useContext(OptimizedContext)
  if (!context) {
    throw new Error("useOptimizedStore must be used within an OptimizedProvider")
  }
  return context
}

// Create a hook for subscribing to specific parts of the state
export function useOptimizedSelector<T>(
  selector: (store: ReturnType<typeof createOptimizedStore>) => T,
  dependencies: React.DependencyList = [],
) {
  const store = useOptimizedStore()
  const selectorRef = useRef(selector)
  const [, forceUpdate] = useState({}) // Used to force a re-render

  // Memoize the selector
  useEffect(() => {
    selectorRef.current = selector
  }, [selector, ...dependencies])

  useEffect(() => {
    // Initial state
    let currentState = selectorRef.current(store)

    // Subscribe to changes
    const unsubscribe = store.subscribe(
      // This is a simplified approach - in a real implementation,
      // you would determine which keys to subscribe to based on the selector
      ["user", "ui", "data"] as any,
      () => {
        const newState = selectorRef.current(store)
        if (newState !== currentState) {
          currentState = newState
          forceUpdate({}) // Force re-render
        }
      },
    )

    return () => {
      unsubscribe()
    }
  }, [store, ...dependencies])

  return selectorRef.current(store)
}
