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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, Plus, Tag, Clock, CheckCircle, AlertTriangle } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import type { Goal, GoalSubcategory } from "@/types/goals-hierarchy"

const STATUSES = [
  { value: "not_started", label: "Not Started", icon: <Tag className="h-4 w-4 text-slate-500" /> },
  { value: "in_progress", label: "In Progress", icon: <Clock className="h-4 w-4 text-blue-500" /> },
  { value: "completed", label: "Completed", icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { value: "on_hold", label: "On Hold", icon: <AlertTriangle className="h-4 w-4 text-amber-500" /> },
]

const PRIORITIES = [
  { value: "low", label: "Low", color: "bg-blue-100 text-blue-800" },
  { value: "medium", label: "Medium", color: "bg-yellow-100 text-yellow-800" },
  { value: "high", label: "High", color: "bg-red-100 text-red-800" },
]

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name cannot exceed 50 characters"),
  description: z.string().max(200, "Description cannot exceed 200 characters").optional(),
  notes: z.string().max(1000, "Notes cannot exceed 1000 characters").optional(),
  subcategory_id: z.string().uuid("Please select a valid subcategory"),
  daily_time_allocation: z.coerce.number().min(0, "Time cannot be negative").max(24, "Time cannot exceed 24 hours"),
  progress: z.coerce.number().min(0, "Progress cannot be negative").max(100, "Progress cannot exceed 100%"),
  status: z.enum(["not_started", "in_progress", "completed", "on_hold"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.date().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface GoalFormProps {
  open: boolean
  onClose: () => void
  initialData?: Goal
  parentSubcategoryId?: string
  mode: "create" | "edit"
}

export function GoalFormImproved({ open, onClose, initialData, parentSubcategoryId, mode }: GoalFormProps) {
  const { createGoal, updateGoal, categories } = useGoalHierarchy()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultDueDate = initialData?.due_date ? new Date(initialData.due_date) : undefined

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
      notes: initialData?.notes || "",
      subcategory_id: initialData?.subcategory_id || parentSubcategoryId || "",
      daily_time_allocation: initialData?.daily_time_allocation || 0,
      progress: initialData?.progress || 0,
      status: initialData?.status || "not_started",
      priority: initialData?.priority || "medium",
      due_date: defaultDueDate,
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSubmitting(true)

    try {
      const submissionValues = {
        ...values,
        due_date: values.due_date ? values.due_date.toISOString().split("T")[0] : undefined,
      }

      if (mode === "create") {
        await createGoal(submissionValues)
      } else if (initialData) {
        await updateGoal(initialData.id, submissionValues)
      }

      form.reset()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  // Get all subcategories from all categories
  const allSubcategories: GoalSubcategory[] = categories.flatMap((category) => category.subcategories || [])

  // Find the current subcategory and its parent category
  const selectedSubcategoryId = form.watch("subcategory_id")
  const selectedSubcategory = allSubcategories.find((sub) => sub.id === selectedSubcategoryId)
  const parentCategory = selectedSubcategory
    ? categories.find((cat) => cat.id === selectedSubcategory.category_id)
    : undefined

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Create a New Goal" : "Edit Goal"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Create a new goal to track your progress" : "Update this goal's information"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Goal name" {...field} />
                  </FormControl>
                  <FormDescription>A clear, actionable name for your goal</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="subcategory_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subcategory</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a subcategory" />
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
                          ...(category.subcategories || []).map((subcategory) => (
                            <SelectItem key={subcategory.id} value={subcategory.id} className="pl-6">
                              {subcategory.name}
                            </SelectItem>
                          )),
                        ])}
                      </SelectContent>
                    </Select>
                    <FormDescription>Select which subcategory this goal belongs to</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
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
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>When do you aim to complete this goal?</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="daily_time_allocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Time (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.25" min="0" max="24" {...field} />
                    </FormControl>
                    <FormDescription>Daily time allocation</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            <div className="flex items-center gap-2">
                              {status.icon}
                              <span>{status.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Current status</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRIORITIES.map((priority) => (
                          <SelectItem key={priority.value} value={priority.value}>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${priority.color}`}>
                                {priority.label}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Goal priority</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="progress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Progress: {field.value}%</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <Input type="range" min="0" max="100" step="5" {...field} />
                      <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${field.value}%` }}></div>
                      </div>
                    </div>
                  </FormControl>
                  <FormDescription>How much progress have you made?</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Brief description..." {...field} />
                  </FormControl>
                  <FormDescription>A brief description of what this goal entails</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Private Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Private notes..." {...field} />
                  </FormControl>
                  <FormDescription>Private notes not shown in reports or graphs</FormDescription>
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
                    {mode === "create" ? "Creating..." : "Updating..."}
                  </div>
                ) : mode === "create" ? (
                  <div className="flex items-center">
                    <Plus className="mr-1 h-4 w-4" />
                    Create Goal
                  </div>
                ) : (
                  "Update Goal"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
