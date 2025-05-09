"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useSupabase } from "@/hooks/use-supabase"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle } from "lucide-react"

const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  activity: z.string().min(1, "Activity is required"),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  notes: z.string().optional(),
  mood_rating: z.number().min(1).max(10).optional(),
  energy_level: z.number().min(1).max(10).optional(),
})

interface AddEntryButtonProps {
  userId: string
  onSuccess: () => void
}

export function AddEntryButton({ userId, onSuccess }: AddEntryButtonProps) {
  const { supabase } = useSupabase()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: "",
      activity: "",
      duration: 30,
      notes: "",
      mood_rating: 5,
      energy_level: 5,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)

    try {
      const { error } = await supabase.from("wellness_entries").insert({
        user_id: userId,
        category: values.category,
        activity: values.activity,
        duration: values.duration,
        notes: values.notes,
        mood_rating: values.mood_rating,
        energy_level: values.energy_level,
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString(),
      })

      if (error) {
        throw error
      }

      toast({
        title: "Entry added",
        description: "Your wellness entry has been recorded",
      })

      form.reset()
      setOpen(false)
      onSuccess()
    } catch (error: any) {
      console.error("Error adding entry:", error)
      toast({
        title: "Error adding entry",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Entry
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Wellness Entry</DialogTitle>
          <DialogDescription>Record your wellness activity to track your progress</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Exercise">Exercise</SelectItem>
                        <SelectItem value="Meditation">Meditation</SelectItem>
                        <SelectItem value="Reading">Reading</SelectItem>
                        <SelectItem value="Learning">Learning</SelectItem>
                        <SelectItem value="Social">Social</SelectItem>
                        <SelectItem value="Self-care">Self-care</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number.parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="activity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Activity</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="What did you do?" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Add any additional notes" className="resize-none" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="mood_rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mood Rating (1-10)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          defaultValue={[field.value || 5]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>{field.value || 5}</span>
                          <span>10</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="energy_level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Energy Level (1-10)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <Slider
                          min={1}
                          max={10}
                          step={1}
                          defaultValue={[field.value || 5]}
                          onValueChange={(value) => field.onChange(value[0])}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>1</span>
                          <span>{field.value || 5}</span>
                          <span>10</span>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Entry"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
