"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { useGoalHierarchy } from "@/hooks/use-goal-hierarchy"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Plus, Check, Trash, AlertCircle } from "lucide-react"
import { motion } from "framer-motion"
import { HexColorPicker } from "react-colorful"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface SimpleCategory {
  name: string
  color: string
  daily_time_allocation: number
}

interface GoalsSetupStepProps {
  onError?: (error: string) => void
}

const SAMPLE_CATEGORIES = [
  { name: "Health", color: "#10b981", daily_time_allocation: 2 },
  { name: "Work", color: "#3b82f6", daily_time_allocation: 8 },
  { name: "Learning", color: "#8b5cf6", daily_time_allocation: 1 },
  { name: "Family", color: "#ec4899", daily_time_allocation: 3 },
  { name: "Hobbies", color: "#f59e0b", daily_time_allocation: 1.5 },
]

export function GoalsSetupStep({ onError }: GoalsSetupStepProps) {
  const { user } = useAuth()
  const { createCategory, categories, isLoading, error: hierarchyError } = useGoalHierarchy()
  const { toast } = useToast()
  const [customCategories, setCustomCategories] = useState<SimpleCategory[]>([])
  const [newCategory, setNewCategory] = useState<SimpleCategory>({
    name: "",
    color: "#4f46e5",
    daily_time_allocation: 1,
  })
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const [selectedCategoryIndices, setSelectedCategoryIndices] = useState<number[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Handle hierarchy error
  if (hierarchyError && onError) {
    onError(hierarchyError)
  }

  const toggleSampleCategory = (index: number) => {
    setSelectedCategoryIndices((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }

  const addCustomCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      })
      return
    }

    setCustomCategories([...customCategories, { ...newCategory }])
    setNewCategory({ name: "", color: "#4f46e5", daily_time_allocation: 1 })
    setColorPickerOpen(false)
  }

  const removeCustomCategory = (index: number) => {
    setCustomCategories(customCategories.filter((_, i) => i !== index))
  }

  const continueSetup = async () => {
    if (!user) {
      setError("User not authenticated. Please sign in again.")
      if (onError) onError("User not authenticated. Please sign in again.")
      return
    }

    if (selectedCategoryIndices.length === 0 && customCategories.length === 0) {
      toast({
        title: "Please select at least one category",
        description: "Choose from sample categories or create your own",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      // Create sample categories
      for (const index of selectedCategoryIndices) {
        await createCategory(SAMPLE_CATEGORIES[index])
      }

      // Create custom categories
      for (const category of customCategories) {
        await createCategory(category)
      }

      toast({
        title: "Categories created successfully",
        description: "Your goal structure has been set up",
      })
    } catch (error: any) {
      console.error("Error creating categories:", error)
      const errorMessage = error?.message || "Failed to create categories. Please try again."
      setError(errorMessage)
      if (onError) onError(errorMessage)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-md mx-auto">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <motion.div
      className="max-w-2xl mx-auto py-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="text-center mb-8"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">Set Up Your Goal Structure</h1>
        <p className="text-muted-foreground">
          Choose or create categories to organize your goals. You can add subcategories and goals later.
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Sample Categories</CardTitle>
            <CardDescription>Select from these common categories to get started quickly</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SAMPLE_CATEGORIES.map((category, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCategoryIndices.includes(index)
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => toggleSampleCategory(index)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-5 w-5 rounded-full" style={{ backgroundColor: category.color }}></div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div>
                      {selectedCategoryIndices.includes(index) ? (
                        <Check className="h-5 w-5 text-primary" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground"></div>
                      )}
                    </div>
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">{category.daily_time_allocation} hours/day</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Custom Categories</CardTitle>
            <CardDescription>Create your own categories to match your specific needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full" style={{ backgroundColor: category.color }}></div>
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-muted-foreground">({category.daily_time_allocation} hours/day)</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeCustomCategory(index)}>
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="space-y-4 pt-2">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-5 w-5 rounded-full cursor-pointer border"
                      style={{ backgroundColor: newCategory.color }}
                      onClick={() => setColorPickerOpen(!colorPickerOpen)}
                    ></div>
                    <Input
                      placeholder="Category name"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="max-w-xs"
                    />
                    <Input
                      type="number"
                      placeholder="Hours/day"
                      min="0"
                      max="24"
                      step="0.5"
                      value={newCategory.daily_time_allocation}
                      onChange={(e) =>
                        setNewCategory({
                          ...newCategory,
                          daily_time_allocation: Number.parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-24"
                    />
                    <Button onClick={addCustomCategory} size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  {colorPickerOpen && (
                    <div className="mt-2">
                      <HexColorPicker
                        color={newCategory.color}
                        onChange={(color) => setNewCategory({ ...newCategory, color })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={continueSetup}
            disabled={isSubmitting || (selectedCategoryIndices.length === 0 && customCategories.length === 0)}
            className="min-w-32"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
