"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { WellnessCategory } from "@/types/supabase"
import { logWellnessEntry } from "@/actions/wellness-actions"
import { Loader2 } from "lucide-react"

interface ActivityLogFormProps {
  userId: string
  categories: WellnessCategory[]
}

export function ActivityLogForm({ userId, categories }: ActivityLogFormProps) {
  const [categoryId, setCategoryId] = useState<string>("")
  const [minutes, setMinutes] = useState<number>(0)
  const [notes, setNotes] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryId || minutes <= 0) return

    setIsSubmitting(true)
    setSuccess(false)

    try {
      const result = await logWellnessEntry(userId, categoryId, null, minutes, notes || null)

      if (result.success) {
        setSuccess(true)
        setMinutes(0)
        setNotes("")
        // Don't reset category for better UX
      }
    } catch (error) {
      console.error("Error logging activity:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Log Activity</CardTitle>
        <CardDescription>Track time spent on wellness activities</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium">
              Category
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label htmlFor="minutes" className="text-sm font-medium">
              Minutes Spent
            </label>
            <Input
              id="minutes"
              type="number"
              min={1}
              value={minutes || ""}
              onChange={(e) => setMinutes(Number.parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="notes" className="text-sm font-medium">
              Notes (Optional)
            </label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this activity"
              rows={3}
            />
          </div>
          {success && (
            <div className="rounded-md bg-green-50 p-2 text-sm text-green-800 dark:bg-green-900 dark:text-green-50">
              Activity logged successfully!
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting || !categoryId || minutes <= 0} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Logging...
              </>
            ) : (
              "Log Activity"
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
