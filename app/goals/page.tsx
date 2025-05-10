"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/auth-context"
import { Navigation } from "@/components/navigation"
import { GoalForm } from "@/components/goals/goal-form"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BackButton } from "@/components/ui/back-button"
import { useNavigation } from "@/hooks/use-navigation"

export default function GoalsPage() {
  const { user, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const { navigateTo } = useNavigation()

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Goals</h1>
          </div>
          <p>Please sign in to view your goals.</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Goals</h1>
          <div className="flex gap-2">
            <BackButton />
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Goal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Goal</DialogTitle>
                </DialogHeader>
                <GoalForm onSuccess={() => setIsDialogOpen(false)} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid gap-6">
          {/* Goals content will go here */}
          <p>Your goals will be displayed here.</p>
          <Button variant="outline" onClick={() => navigateTo("/goals-hierarchy", { state: { returnTo: "/goals" } })}>
            View Goal Hierarchy
          </Button>
        </div>
      </main>
    </div>
  )
}
