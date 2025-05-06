"use client"

import { Navigation } from "@/components/navigation"
import { WellnessDashboard } from "@/components/dashboard/wellness-dashboard"
import { ProfileReminderBanner } from "@/components/profile/profile-reminder-banner"
import { isOnline } from "@/utils/network-utils"

// Add a network error fallback component
function NetworkErrorFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <div className="mb-6 text-red-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-16 h-16 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h1 className="mb-4 text-2xl font-bold">Network Connection Issue</h1>
      <p className="mb-6 text-gray-600">
        We're having trouble connecting to the server. Your dashboard data is being displayed in offline mode.
      </p>
      <p className="mb-8 text-sm text-gray-500">Some features may be limited until your connection is restored.</p>
      <button
        onClick={() => window.location.reload()}
        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
      >
        Try Again
      </button>
    </div>
  )
}

// Update the Dashboard component to check for network errors
export default function DashboardPage() {
  // Check if we're online
  const online = isOnline()

  return (
    <>
      <Navigation />
      <div className="container mx-auto py-8">
        {!online && (
          <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-yellow-700 text-sm">You are currently offline. Some features may be limited.</p>
          </div>
        )}
        <ProfileReminderBanner />
        <WellnessDashboard />
      </div>
    </>
  )
}
