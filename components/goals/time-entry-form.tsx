"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useGoalHierarchy } from "@/hooks/use-goal-hierarchy"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Clock, Plus } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Goal } from "@/types/goals-hierarchy"

const formSchema = z.object({
  goal_id: z.string().uuid("Please select a valid goal"),
  duration: z.coerce
    .number()
    .min(0.25, "Duration must be at least 15 minutes (0.25 hours)")
    .max(24, "Duration cannot exceed 24 hours"),
  date: z.date(),
  notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
})

type FormValues = z.infer<typeof formSchema>

interface TimeEntryFormProps {
  open: boolean
  onClose: () => void
  initialGoalId?: string
}

export function TimeEntryForm({ open, onClose, initialGoalId }: TimeEntryFormProps) {
  const { addTimeEntry, categories } = useGoalHierarchy()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      goal_id: initialGoalId || "",
      duration: 1,
      date: new Date(),
      notes: "",
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      const submissionValues = {
        ...values,
        date: values.date ? values.date.toISOString().split("T")[0] : undefined,
      }

      await addTimeEntry(submissionValues)
      form.reset()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create a flat array of all goals with their category and subcategory info
  const allGoals: Array<Goal & { categoryName: string; subcategoryName: string; color: string }> = []

  categories.forEach((category) => {
    const subcategories = category.subcategories || []
    subcategories.forEach((subcategory) => {
      const goals = subcategory.goals || []
      goals.forEach((goal) => {
        allGoals.push({
          ...goal,
          categoryName: category.name,
          subcategoryName: subcategory.name,
          color: category.color,
        })
      })
    })
  })

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Time Entry</DialogTitle>
          <DialogDescription>Record time spent on your goals to track your progress</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="goal_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => [
                        <SelectItem key={category.id} value={category.id} disabled>
                          <div className="flex items-center gap-2 font-bold">
                            <div className="h-3 w-3 rounded-full" style={{ backgroundColor: category.color }} />
                            <span>{category.name}</span>
                          </div>
                        </SelectItem>,
                        ...(category.subcategories || []).flatMap((subcategory) => [
                          <SelectItem key={subcategory.id} value={subcategory.id} disabled className="pl-4">
                            <div className="font-semibold">{subcategory.name}</div>
                          </SelectItem>,
                          ...(subcategory.goals || []).map((goal) => (
                            <SelectItem key={goal.id} value={goal.id} className="pl-8">
                              {goal.name}
                            </SelectItem>
                          )),
                        ]),
                      ])}
                    </SelectContent>
                  </Select>
                  <FormDescription>Select which goal you worked on</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (hours)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.25" min="0.25" max="24" className="pl-9" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>How much time did you spend?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                          >
                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>When did you work on this goal?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What did you accomplish during this time?" {...field} />
                  </FormControl>
                  <FormDescription>Add any notes about what you accomplished</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <div className="flex items-center">
                    <span className="mr-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                    </span>
                    Adding...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Plus className="mr-1 h-4 w-4" />
                    Add Time Entry
                  </div>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
