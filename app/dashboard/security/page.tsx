"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { redirect } from "next/navigation"
import RLSTest from "@/components/rls-test"
import { Button } from "@/components/ui/button"

export default function SecurityPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()

      if (!currentUser) {
        redirect("/")
        return
      }

      setUser(currentUser)
      setLoading(false)
    }

    getUser()
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    redirect("/")
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Security Tests</h1>
          <div className="space-x-4">
            <Button variant="outline" onClick={() => (window.location.href = "/dashboard")}>
              Dashboard
            </Button>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 gap-6">
          <RLSTest />

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-medium mb-4">Security Information</h2>
            <p className="mb-2">
              This page demonstrates how Row Level Security (RLS) policies protect your data in Supabase.
            </p>
            <p className="mb-2">
              The RLS test above attempts to access your own profile (which should succeed) and other users' profiles
              (which should fail).
            </p>
            <p>If the test shows "Correctly Blocked" for other profiles, your RLS policies are working correctly.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
