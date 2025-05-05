"use client"

import { useState } from "react"
import { ActivityFormWithAnalytics } from "@/components/activity-form-with-analytics"
import { FormAnalyticsDashboard } from "@/components/form-analytics-dashboard"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Sample categories
const categories = [
  { id: "exercise", name: "Exercise" },
  { id: "meditation", name: "Meditation" },
  { id: "nutrition", name: "Nutrition" },
  { id: "sleep", name: "Sleep" },
  { id: "work", name: "Work" },
  { id: "leisure", name: "Leisure" },
]

export default function DemoPage() {
  const [submissions, setSubmissions] = useState<any[]>([])

  const handleSubmit = (data: any) => {
    setSubmissions([...submissions, { ...data, id: Date.now(), date: new Date().toISOString() }])
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Form Analytics Demo</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how form analytics work. Try submitting the form with valid and invalid data to see how
        the analytics are tracked.
      </p>

      <Tabs defaultValue="form">
        <TabsList className="mb-4">
          <TabsTrigger value="form">Form</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="submissions">Submissions</TabsTrigger>
        </TabsList>

        <TabsContent value="form">
          <Card>
            <CardHeader>
              <CardTitle>Activity Form</CardTitle>
              <CardDescription>Add a new activity to track your wellness journey</CardDescription>
            </CardHeader>
            <CardContent>
              <ActivityFormWithAnalytics onSubmit={handleSubmit} categories={categories} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <FormAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="submissions">
          <Card>
            <CardHeader>
              <CardTitle>Form Submissions</CardTitle>
              <CardDescription>View all successful form submissions</CardDescription>
            </CardHeader>
            <CardContent>
              {submissions.length === 0 ? (
                <p className="text-muted-foreground">No submissions yet. Try submitting the form!</p>
              ) : (
                <div className="space-y-4">
                  {submissions.map((submission) => (
                    <Card key={submission.id}>
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">Title</p>
                            <p className="text-sm text-muted-foreground">{submission.title}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Category</p>
                            <p className="text-sm text-muted-foreground">
                              {categories.find((c) => c.id === submission.category)?.name || submission.category}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Duration</p>
                            <p className="text-sm text-muted-foreground">{submission.duration} minutes</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Date</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(submission.date).toLocaleString()}
                            </p>
                          </div>
                          {submission.notes && (
                            <div className="col-span-2">
                              <p className="text-sm font-medium">Notes</p>
                              <p className="text-sm text-muted-foreground">{submission.notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
