"use client"

import { useState, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Target, AlertCircle } from "lucide-react"

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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Define the schema for goal setting
const goalSchema = z.object({
  goals: z.array(
    z.object({
      categoryId: z.string(),
      subcategoryId: z.string(),
      parameterId: z.string(),
      value: z.number().min(0).max(10),
    }),
  ),
})

type GoalFormValues = z.infer<typeof goalSchema>

interface GoalSettingModalProps {
  categories?: Array<{
    id: string
    name: string
    subcategories?: Array<{
      id: string
      name: string
      parameters?: Array<{
        id: string
        name: string
        goal?: number
      }>
    }>
  }>
  onSaveGoals: (goals: GoalFormValues["goals"]) => void
}

export function GoalSettingModal({ categories = [], onSaveGoals }: GoalSettingModalProps) {
  const [open, setOpen] = useState(false)

  // Safely generate initial goals from categories
  const initialGoals = useMemo(() => {
    if (!categories || categories.length === 0) {
      return []
    }

    return categories.flatMap((category) => {
      if (!category.subcategories || category.subcategories.length === 0) {
        return []
      }

      return category.subcategories.flatMap((subcategory) => {
        if (!subcategory.parameters || subcategory.parameters.length === 0) {
          return []
        }

        return subcategory.parameters.map((parameter) => ({
          categoryId: category.id,
          subcategoryId: subcategory.id,
          parameterId: parameter.id,
          value: parameter.goal || 0,
        }))
      })
    })
  }, [categories])

  // Initialize form with current goals
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goals: initialGoals,
    },
  })

  // Form submission handler
  const onSubmit = (data: GoalFormValues) => {
    onSaveGoals(data.goals)
    setOpen(false)
  }

  // Check if we have valid categories to display
  const hasValidCategories = useMemo(() => {
    return (
      categories &&
      categories.length > 0 &&
      categories.some(
        (category) =>
          category.subcategories &&
          category.subcategories.length > 0 &&
          category.subcategories.some((subcategory) => subcategory.parameters && subcategory.parameters.length > 0),
      )
    )
  }, [categories])

  // Get the first valid category ID for default tab
  const defaultCategoryId = useMemo(() => {
    if (!hasValidCategories) return ""

    for (const category of categories) {
      if (
        category.subcategories &&
        category.subcategories.length > 0 &&
        category.subcategories.some((subcategory) => subcategory.parameters && subcategory.parameters.length > 0)
      ) {
        return category.id
      }
    }
    return categories[0]?.id || ""
  }, [categories, hasValidCategories])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Target className="h-4 w-4 mr-2" />
          Set Goals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Set Wellness Goals</DialogTitle>
          <DialogDescription>
            Define your wellness goals for each category and parameter. These goals will help you track your progress.
          </DialogDescription>
        </DialogHeader>

        {!hasValidCategories ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No categories available</AlertTitle>
            <AlertDescription>Please create categories with parameters before setting goals.</AlertDescription>
          </Alert>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
              <Tabs defaultValue={defaultCategoryId}>
                <TabsList className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 mb-4">
                  {categories
                    .filter(
                      (category) =>
                        category.subcategories &&
                        category.subcategories.length > 0 &&
                        category.subcategories.some(
                          (subcategory) => subcategory.parameters && subcategory.parameters.length > 0,
                        ),
                    )
                    .map((category) => (
                      <TabsTrigger key={category.id} value={category.id}>
                        {category.name}
                      </TabsTrigger>
                    ))}
                </TabsList>

                {categories
                  .filter(
                    (category) =>
                      category.subcategories &&
                      category.subcategories.length > 0 &&
                      category.subcategories.some(
                        (subcategory) => subcategory.parameters && subcategory.parameters.length > 0,
                      ),
                  )
                  .map((category) => (
                    <TabsContent key={category.id} value={category.id} className="space-y-6">
                      {category.subcategories
                        ?.filter((subcategory) => subcategory.parameters && subcategory.parameters.length > 0)
                        .map((subcategory) => (
                          <div key={subcategory.id} className="space-y-4">
                            <h3 className="font-medium text-lg">{subcategory.name}</h3>
                            <div className="space-y-4">
                              {subcategory.parameters?.map((parameter) => {
                                // Find the corresponding goal in the form data
                                const goalIndex = form
                                  .getValues()
                                  .goals.findIndex(
                                    (g) =>
                                      g.categoryId === category.id &&
                                      g.subcategoryId === subcategory.id &&
                                      g.parameterId === parameter.id,
                                  )

                                // Skip if we couldn't find the goal
                                if (goalIndex === -1) return null

                                return (
                                  <FormField
                                    key={parameter.id}
                                    control={form.control}
                                    name={`goals.${goalIndex}.value`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="flex items-center justify-between">
                                          <FormLabel>{parameter.name}</FormLabel>
                                          <span className="text-sm font-medium">{field.value}/10</span>
                                        </div>
                                        <FormControl>
                                          <Slider
                                            min={0}
                                            max={10}
                                            step={1}
                                            value={[field.value]}
                                            onValueChange={(values) => field.onChange(values[0])}
                                          />
                                        </FormControl>
                                        <FormDescription className="text-xs">
                                          Set your target goal for {parameter.name.toLowerCase()}
                                        </FormDescription>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                )
                              })}
                            </div>
                          </div>
                        ))}
                    </TabsContent>
                  ))}
              </Tabs>

              <DialogFooter>
                <Button type="submit">Save Goals</Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
