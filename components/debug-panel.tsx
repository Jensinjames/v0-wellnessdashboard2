"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

// Simplified debug panel that only shows in development
export function DebugPanel() {
  const [isOpen, setIsOpen] = useState(false)

  // Only show in development mode
  if (process.env.NODE_ENV === "production") {
    return null
  }

  if (!isOpen) {
    return (
      <Button className="fixed bottom-4 right-4 z-50 bg-gray-800 text-white" onClick={() => setIsOpen(true)}>
        Debug
      </Button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 bg-white shadow-lg rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium">Debug Panel</h3>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Close
        </Button>
      </div>
      <p className="text-sm text-gray-500">Debug tools are disabled in production.</p>
    </div>
  )
}
