"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"

const goalFormSchema = z.object({
  name: z.string().min(2, {
    message: "Goal name must be at least 2 characters.",
  }),
  category: z.string({
    required_error: "Please select a category.",
  }),
  targetValue: z.number().min(1, {
    message: "Target value must be at least 1.",
  }),
  deadline: z.string().optional(),
  reminder: z.boolean().default(false),
  priority: z.number().min(1).max(5),
})

type GoalFormValues = z.infer<typeof goalFormSchema>

const defaultValues: Partial<GoalFormValues> = {
  name: "",
  targetValue: 1,
  reminder: false,
  priority: 3,
}

export function GoalSettingForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues,
  })

  function onSubmit(data: GoalFormValues) {
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Goal created",
        description: `Your goal "${data.name}" has been created successfully.`,
      })
      setIsSubmitting(false)
      form.reset(defaultValues)
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Set a New Goal</CardTitle>
        <CardDescription>Create a new wellness goal to track your progress.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Daily meditation" {...field} />
                  </FormControl>
                  <FormDescription>Give your goal a clear, specific name.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="mindfulness">Mindfulness</SelectItem>
                      <SelectItem value="fitness">Fitness</SelectItem>
                      <SelectItem value="nutrition">Nutrition</SelectItem>
                      <SelectItem value="sleep">Sleep</SelectItem>
                      <SelectItem value="productivity">Productivity</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>Select the wellness category this goal belongs to.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Value</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormDescription>Set a specific target value for your goal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Deadline (Optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormDescription>Set an optional deadline for achieving this goal.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority (1-5)</FormLabel>
                  <FormControl>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      defaultValue={[field.value]}
                      onValueChange={(vals) => field.onChange(vals[0])}
                      className="py-4"
                    />
                  </FormControl>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reminder"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Set Reminder</FormLabel>
                    <FormDescription>Receive reminders about this goal.</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter>
        <Button onClick={form.handleSubmit(onSubmit)} disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating..." : "Create Goal"}
        </Button>
      </CardFooter>
    </Card>
  )
}
