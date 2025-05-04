"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { ColoredTab } from "@/components/ui/colored-tab"
import { CategoryIcon } from "@/components/ui/category-icon"
import { useScreenReaderAnnouncer } from "@/components/accessibility/screen-reader-announcer"
import { useIconContext } from "@/context/icon-context"
import { getCategoryColorKey } from "@/utils/category-color-utils"

// Define the form schema
const formSchema = z.object({
  category: z.string().min(1, "Category is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  duration: z.string().min(1, "Duration is required"),
  date: z.string().min(1, "Date is required"),
})

type FormValues = z.infer<typeof formSchema>

const categories = [
  { id: "faith", name: "Faith", icon: "Heart" },
  { id: "life", name: "Life", icon: "Coffee" },
  { id: "work", name: "Work", icon: "Briefcase" },
  { id: "health", name: "Health", icon: "Activity" },
  { id: "mindfulness", name: "Mindfulness", icon: "Brain" },
  { id: "learning", name: "Learning", icon: "BookOpen" },
  { id: "relationships", name: "Relationships", icon: "Users" },
]

export function AddEntryForm() {
  const [activeTab, setActiveTab] = useState("faith")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { announce } = useScreenReaderAnnouncer()
  const { iconPreferences } = useIconContext()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      category: activeTab,
      title: "",
      description: "",
      duration: "",
      date: new Date().toISOString().split("T")[0],
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      console.log("Form submitted:", data)
      announce(`Entry added successfully: ${data.title} in ${data.category} category`)

      // Reset form
      form.reset({
        category: activeTab,
        title: "",
        description: "",
        duration: "",
        date: new Date().toISOString().split("T")[0],
      })
    } catch (error) {
      console.error("Error submitting form:", error)
      announce("Error adding entry. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTabChange = (categoryId: string) => {
    setActiveTab(categoryId)
    form.setValue("category", categoryId)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-center">Add New Entry</CardTitle>
      </CardHeader>

      {/* Color-coded tabs */}
      <div
        className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800"
        role="tablist"
        aria-label="Category selection"
      >
        {categories.map((category) => {
          const iconPref = iconPreferences[category.id]
          const categoryColor = iconPref?.color || getCategoryColorKey(category.id)

          return (
            <ColoredTab
              key={category.id}
              categoryId={category.id}
              isActive={activeTab === category.id}
              label={category.name}
              color={categoryColor}
              onClick={() => handleTabChange(category.id)}
              id={`tab-${category.id}`}
              aria-controls={`panel-${category.id}`}
            />
          )
        })}
      </div>

      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <CategoryIcon
                categoryId={activeTab}
                icon={
                  (iconPreferences[activeTab]?.name ||
                    categories.find((c) => c.id === activeTab)?.icon ||
                    "Activity") as any
                }
                size={iconPreferences[activeTab]?.size || "md"}
                color={iconPreferences[activeTab]?.color || getCategoryColorKey(activeTab)}
                background={iconPreferences[activeTab]?.background}
              />
              <h3 className="text-lg font-medium">{categories.find((c) => c.id === activeTab)?.name || "Category"}</h3>
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="Enter duration" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex justify-end">
        <EnhancedButton
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isSubmitting}
          isLoading={isSubmitting}
          icon="Plus"
          color={getCategoryColorKey(activeTab)}
        >
          Add Entry
        </EnhancedButton>
      </CardFooter>
    </Card>
  )
}
