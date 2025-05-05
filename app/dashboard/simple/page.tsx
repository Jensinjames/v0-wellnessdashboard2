"use client"

import { useState, useEffect } from "react"

export default function SimpleDashboardPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white rounded-lg shadow p-6">
        {loading ? (
          <div className="h-40 flex items-center justify-center">
            <div className="animate-pulse text-gray-500">Loading dashboard data...</div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Welcome to your Wellness Dashboard</h2>
            <p>This is a simplified version of your dashboard.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-blue-50 p-4 rounded-md">
                <h3 className="font-medium">Physical Activity</h3>
                <p className="text-2xl font-bold mt-2">75%</p>
              </div>
              <div className="bg-green-50 p-4 rounded-md">
                <h3 className="font-medium">Nutrition</h3>
                <p className="text-2xl font-bold mt-2">82%</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-md">
                <h3 className="font-medium">Mental Wellbeing</h3>
                <p className="text-2xl font-bold mt-2">68%</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
