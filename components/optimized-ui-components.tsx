"use client"

import { useCallback, memo } from "react"
import { useOptimizedSelector, useOptimizedStore } from "@/context/optimized-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useRenderMonitor } from "@/lib/performance-utils"

// Optimized sidebar component that only re-renders when sidebar state changes
export const OptimizedSidebar = memo(function OptimizedSidebar() {
  useRenderMonitor("OptimizedSidebar")

  // Only subscribe to the sidebar open state
  const isOpen = useOptimizedSelector((store) => store.getSidebarOpen())
  const store = useOptimizedStore()

  const toggleSidebar = useCallback(() => {
    store.toggleSidebar()
  }, [store])

  return (
    <div
      className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} w-64 bg-background border-r transition-transform duration-200 ease-in-out z-30 md:translate-x-0`}
    >
      <div className="p-4">
        <h2 className="text-xl font-bold">Dashboard</h2>
        <Button variant="ghost" size="sm" onClick={toggleSidebar} className="md:hidden absolute top-4 right-4">
          Close
        </Button>
        <nav className="mt-8">
          <ul className="space-y-2">
            <li>
              <Button variant="ghost" className="w-full justify-start">
                Dashboard
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start">
                Analytics
              </Button>
            </li>
            <li>
              <Button variant="ghost" className="w-full justify-start">
                Settings
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  )
})

// Optimized user profile component that only re-renders when user info changes
export const OptimizedUserProfile = memo(function OptimizedUserProfile() {
  useRenderMonitor("OptimizedUserProfile")

  // Only subscribe to user info
  const userInfo = useOptimizedSelector((store) => store.getUserInfo())

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <p>
            <strong>Name:</strong> {userInfo.name}
          </p>
          <p>
            <strong>Email:</strong> {userInfo.email}
          </p>
        </div>
      </CardContent>
    </Card>
  )
})

// Optimized theme toggle that only re-renders when theme changes
export const OptimizedThemeToggle = memo(function OptimizedThemeToggle() {
  useRenderMonitor("OptimizedThemeToggle")

  // Only subscribe to theme preference
  const preferences = useOptimizedSelector((store) => store.getUserPreferences())
  const store = useOptimizedStore()

  const toggleTheme = useCallback(() => {
    store.updatePreferences({
      theme: preferences.theme === "light" ? "dark" : "light",
    })
  }, [preferences.theme, store])

  return (
    <Button variant="outline" size="sm" onClick={toggleTheme}>
      {preferences.theme === "light" ? "Dark Mode" : "Light Mode"}
    </Button>
  )
})

// Optimized item list that only re-renders when items change
export const OptimizedItemList = memo(function OptimizedItemList() {
  useRenderMonitor("OptimizedItemList")

  // Only subscribe to items and loading state
  const items = useOptimizedSelector((store) => store.getItems())
  const isLoading = useOptimizedSelector((store) => store.getLoadingState())
  const store = useOptimizedStore()

  const addItem = useCallback(() => {
    const id = Math.random().toString(36).substring(7)
    store.addItem({ id, name: `Item ${id}` })
  }, [store])

  const removeItem = useCallback(
    (id: string) => {
      store.removeItem(id)
    },
    [store],
  )

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Items</span>
          <Button size="sm" onClick={addItem}>
            Add Item
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground">No items yet</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <span>{item.name}</span>
                <Button variant="ghost" size="sm" onClick={() => removeItem(item.id)}>
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
})
