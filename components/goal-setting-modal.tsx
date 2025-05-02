"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Target } from "lucide-react"

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
  categories: Array<{
    id: string
    name: string
    subcategories: Array<{
      id: string
      name: string
      parameters: Array<{
        id: string
        name: string
        goal?: number
      }>
    }>
  }>
  onSaveGoals: (goals: GoalFormValues["goals"]) => void
}

export function GoalSettingModal({ categories, onSaveGoals }: GoalSettingModalProps) {
  const [open, setOpen] = useState(false)

  // Initialize form with current goals
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      goals: categories.flatMap((category) =>
        category.subcategories.flatMap((subcategory) =>
          subcategory.parameters.map((parameter) => ({
            categoryId: category.id,
            subcategoryId: subcategory.id,
            parameterId: parameter.id,
            value: parameter.goal || 0,
          })),
        ),
      ),
    },
  })

  // Form submission handler
  const onSubmit = (data: GoalFormValues) => {
    onSaveGoals(data.goals)
    setOpen(false)
  }

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

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <Tabs defaultValue={categories[0]?.id}>
              <TabsList className="grid grid-cols-4 mb-4">
                {categories.map((category) => (
                  <TabsTrigger key={category.id} value={category.id}>
                    {category.name}
                  </TabsTrigger>
                ))}
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category.id} value={category.id} className="space-y-6">
                  {category.subcategories.map((subcategory) => (
                    <div key={subcategory.id} className="space-y-4">
                      <h3 className="font-medium text-lg">{subcategory.name}</h3>
                      <div className="space-y-4">
                        {subcategory.parameters.map((parameter, index) => {
                          // Find the corresponding goal in the form data
                          const goalIndex = form
                            .getValues()
                            .goals.findIndex(
                              (g) =>
                                g.categoryId === category.id &&
                                g.subcategoryId === subcategory.id &&
                                g.parameterId === parameter.id,
                            )

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
      </DialogContent>
    </Dialog>
  )
}
