"use client"

import { ActivityForm } from "@/components/activity-form"

export default function ActivityPage() {
  return (
    <div className="container py-6 space-y-6">
      <h1 className="text-3xl font-bold">Activity Tracker</h1>
      <ActivityForm />
    </div>
  )
}
