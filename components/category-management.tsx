"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Settings, X } from "lucide-react"
import * as LucideIcons from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import type { WellnessCategory, WellnessMetric } from "@/types/wellness"
import { generateUniqueId } from "@/utils/id-generator"

// Schema for category form
const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
})

// Schema for metric form
const metricFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  unit: z.string().min(1, "Unit is required"),
  min: z.number().min(0, "Minimum value must be at least 0"),
  max: z.number().min(1, "Maximum value must be at least 1"),
  step: z.number().min(0.1, "Step must be at least 0.1"),
  defaultValue: z.number(),
  defaultGoal: z.number(),
})

// Available colors for categories
const availableColors = [
  { name: "Slate", value: "slate" },
  { name: "Gray", value: "gray" },
  { name: "Zinc", value: "zinc" },
  { name: "Neutral", value: "neutral" },
  { name: "Stone", value: "stone" },
  { name: "Red", value: "red" },
  { name: "Orange", value: "orange" },
  { name: "Amber", value: "amber" },
  { name: "Yellow", value: "yellow" },
  { name: "Lime", value: "lime" },
  { name: "Green", value: "green" },
  { name: "Emerald", value: "emerald" },
  { name: "Teal", value: "teal" },
  { name: "Cyan", value: "cyan" },
  { name: "Sky", value: "sky" },
  { name: "Blue", value: "blue" },
  { name: "Indigo", value: "indigo" },
  { name: "Violet", value: "violet" },
  { name: "Purple", value: "purple" },
  { name: "Fuchsia", value: "fuchsia" },
  { name: "Pink", value: "pink" },
  { name: "Rose", value: "rose" },
]

// Available units for metrics
const availableUnits = [
  { name: "Minutes", value: "minutes" },
  { name: "Hours", value: "hours" },
  { name: "Percent", value: "percent" },
  { name: "Count", value: "count" },
  { name: "Level", value: "level" },
  { name: "Custom", value: "custom" },
]

// Color class mapping functions
const getCategoryBgClass = (color: string) => {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-600",
    gray: "bg-gray-600",
    zinc: "bg-zinc-600",
    neutral: "bg-neutral-600",
    stone: "bg-stone-600",
    red: "bg-red-600",
    orange: "bg-orange-600",
    amber: "bg-amber-600",
    yellow: "bg-yellow-600",
    lime: "bg-lime-600",
    green: "bg-green-600",
    emerald: "bg-emerald-600",
    teal: "bg-teal-600",
    cyan: "bg-cyan-600",
    sky: "bg-sky-600",
    blue: "bg-blue-600",
    indigo: "bg-indigo-600",
    violet: "bg-violet-600",
    purple: "bg-purple-600",
    fuchsia: "bg-fuchsia-600",
    pink: "bg-pink-600",
    rose: "bg-rose-600",
  }
  return colorMap[color] || "bg-blue-600" // Default to blue if color not found
}

const getColorSwatch = (color: string) => {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-500",
    gray: "bg-gray-500",
    zinc: "bg-zinc-500",
    neutral: "bg-neutral-500",
    stone: "bg-stone-500",
    red: "bg-red-500",
    orange: "bg-orange-500",
    amber: "bg-amber-500",
    yellow: "bg-yellow-500",
    lime: "bg-lime-500",
    green: "bg-green-500",
    emerald: "bg-emerald-500",
    teal: "bg-teal-500",
    cyan: "bg-cyan-500",
    sky: "bg-sky-500",
    blue: "bg-blue-500",
    indigo: "bg-indigo-500",
    violet: "bg-violet-500",
    purple: "bg-purple-500",
    fuchsia: "bg-fuchsia-500",
    pink: "bg-pink-500",
    rose: "bg-rose-500",
  }
  return colorMap[color] || "bg-blue-500" // Default to blue if color not found
}

type Category = {
  id: string
  name: string
  color: string
}

export function CategoryManagement() {
  // const { categories, addCategory, updateCategory, removeCategory, reorderCategories } = useWellness()
  const [categories, setCategories] = useState<Category[]>([
    { id: "1", name: "Exercise", color: "#4CAF50" },
    { id: "2", name: "Meditation", color: "#2196F3" },
    { id: "3", name: "Reading", color: "#FF9800" },
  ])
  const [newCategory, setNewCategory] = useState("")
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WellnessCategory | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showAddMetric, setShowAddMetric] = useState(false)
  const [editingMetric, setEditingMetric] = useState<{ categoryId: string; metric: WellnessMetric } | null>(null)
  const [expandedItems, setExpandedItems] = useState<string[]>([])

  // New state for generated IDs
  const [generatedCategoryId, setGeneratedCategoryId] = useState<string>("")
  const [generatedMetricId, setGeneratedMetricId] = useState<string>("")

  // Get all available Lucide icons
  const availableIcons = Object.keys(LucideIcons)
    .filter((key) => typeof LucideIcons[key as keyof typeof LucideIcons] === "function" && key !== "createLucideIcon")
    .sort()

  // Form for adding/editing categories
  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "Activity",
      color: "blue",
    },
  })

  // Form for adding/editing metrics
  const metricForm = useForm<z.infer<typeof metricFormSchema>>({
    resolver: zodResolver(metricFormSchema),
    defaultValues: {
      name: "",
      description: "",
      unit: "minutes",
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      defaultGoal: 50,
    },
  })

  // Generate category ID when name changes
  useEffect(() => {
    const subscription = categoryForm.watch((value) => {
      if (value.name && !editingCategory) {
        const existingIds = categories.map((c) => c.id)
        const newId = generateUniqueId(value.name, existingIds)
        setGeneratedCategoryId(newId)
      }
    })

    return () => subscription.unsubscribe()
  }, [categoryForm, categories, editingCategory])

  // Generate metric ID when name changes
  useEffect(() => {
    const subscription = metricForm.watch((value) => {
      if (value.name && !editingMetric && showAddMetric) {
        const category = categories.find((c) => c.id === showAddMetric)
        const existingIds = category ? category.metrics.map((m) => m.id) : []
        const newId = generateUniqueId(value.name, existingIds)
        setGeneratedMetricId(newId)
      }
    })

    return () => subscription.unsubscribe()
  }, [metricForm, categories, editingMetric, showAddMetric])

  const addCategory = () => {
    if (newCategory.trim() === "") return

    const newId = Math.random().toString(36).substring(2, 9)
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`

    setCategories([
      ...categories,
      {
        id: newId,
        name: newCategory.trim(),
        color: randomColor,
      },
    ])
    setNewCategory("")
  }

  const removeCategory = (id: string) => {
    setCategories(categories.filter((category) => category.id !== id))
  }

  // Reset and initialize category form for adding a new category
  const handleAddCategory = () => {
    setEditingCategory(null)
    categoryForm.reset({
      name: "",
      description: "",
      icon: "Activity",
      color: "blue",
    })
    setGeneratedCategoryId("")
    setOpen(true)
  }

  // Initialize category form for editing an existing category
  const handleEditCategory = (category: WellnessCategory) => {
    setEditingCategory(category)
    categoryForm.reset({
      name: category.name,
      description: category.description,
      icon: category.icon,
      color: category.color,
    })
    setGeneratedCategoryId(category.id)
    setOpen(true)
  }

  // Handle category form submission
  const onCategorySubmit = (data: z.infer<typeof categoryFormSchema>) => {
    // For new categories, use the generated ID
    const categoryId = editingCategory ? editingCategory.id : generatedCategoryId

    // If no ID was generated (should not happen with our implementation), generate one now
    const finalId =
      categoryId ||
      generateUniqueId(
        data.name,
        categories.map((c) => c.id),
      )

    const categoryData: WellnessCategory = {
      id: finalId,
      name: data.name,
      description: data.description,
      icon: data.icon,
      color: data.color,
      enabled: true,
      metrics: editingCategory?.metrics || [],
    }

    const updateCategory = (id: string, data: any) => {
      setCategories(categories.map((c) => (c.id === id ? { ...c, ...data } : c)))
      return { success: true }
    }

    if (editingCategory) {
      // Update existing category
      const result = updateCategory(editingCategory.id, categoryData)
      if (result.success) {
        toast({
          title: "Category updated",
          description: `The category "${data.name}" has been updated.`,
        })
        setOpen(false)
      } else {
        toast({
          title: "Update failed",
          description: result.message,
          variant: "destructive",
        })
      }
    } else {
      // Add new category
      // const result = addCategory(categoryData)
      // if (result.success) {
      //   toast({
      //     title: "Category added",
      //     description: `The category "${data.name}" has been added with ID "${finalId}".`,
      //   })
      //   setOpen(false)
      // } else {
      //   toast({
      //     title: "Addition failed",
      //     description: result.message,
      //     variant: "destructive",
      //   })
      // }
    }
  }

  // Initialize metric form for adding a new metric
  const handleAddMetric = (categoryId: string) => {
    setEditingMetric(null)
    metricForm.reset({
      name: "",
      description: "",
      unit: "minutes",
      min: 0,
      max: 100,
      step: 1,
      defaultValue: 0,
      defaultGoal: 50,
    })
    setGeneratedMetricId("")
    setShowAddMetric(categoryId)
  }

  // Initialize metric form for editing an existing metric
  const handleEditMetric = (categoryId: string, metric: WellnessMetric) => {
    setEditingMetric({ categoryId, metric })
    metricForm.reset({
      name: metric.name,
      description: metric.description || "",
      unit: metric.unit,
      min: metric.min,
      max: metric.max,
      step: metric.step,
      defaultValue: metric.defaultValue,
      defaultGoal: metric.defaultGoal,
    })
    setGeneratedMetricId(metric.id)
    setShowAddMetric(categoryId)
  }

  // Handle metric form submission
  const onMetricSubmit = (data: z.infer<typeof metricFormSchema>) => {
    const categoryId = showAddMetric
    if (!categoryId) return

    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    // For new metrics, use the generated ID
    const metricId = editingMetric ? editingMetric.metric.id : generatedMetricId

    // If no ID was generated (should not happen with our implementation), generate one now
    const existingIds = category.metrics.map((m) => m.id)
    const finalId = metricId || generateUniqueId(data.name, existingIds)

    const metricData: WellnessMetric = {
      id: finalId,
      name: data.name,
      description: data.description,
      unit: data.unit,
      min: data.min,
      max: data.max,
      step: data.step,
      defaultValue: data.defaultValue,
      defaultGoal: data.defaultGoal,
    }

    let updatedMetrics: WellnessMetric[]

    if (editingMetric) {
      // Update existing metric
      updatedMetrics = category.metrics.map((m) => (m.id === editingMetric.metric.id ? metricData : m))
    } else {
      // Add new metric
      updatedMetrics = [...category.metrics, metricData]
    }

    const updateCategory = (id: string, data: any) => {
      setCategories(categories.map((c) => (c.id === id ? { ...c, ...data } : c)))
      return { success: true }
    }

    const result = updateCategory(categoryId, { metrics: updatedMetrics })

    if (result.success) {
      if (editingMetric) {
        toast({
          title: "Metric updated",
          description: `The metric "${data.name}" has been updated.`,
        })
      } else {
        toast({
          title: "Metric added",
          description: `The metric "${data.name}" has been added to the "${category.name}" category with ID "${finalId}".`,
        })
      }
      setShowAddMetric("")
      setEditingMetric(null)
    } else {
      toast({
        title: "Operation failed",
        description: result.message,
        variant: "destructive",
      })
    }
  }

  // Handle metric deletion
  const handleDeleteMetric = (categoryId: string, metricId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    const updatedMetrics = category.metrics.filter((m) => m.id !== metricId)
    const updateCategory = (id: string, data: any) => {
      setCategories(categories.map((c) => (c.id === id ? { ...c, ...data } : c)))
      return { success: true }
    }
    updateCategory(categoryId, { metrics: updatedMetrics })

    toast({
      title: "Metric deleted",
      description: "The metric has been deleted.",
    })
  }

  // Handle category deletion
  const handleDeleteCategory = (categoryId: string) => {
    removeCategory(categoryId)
    setShowDeleteConfirm(null)

    toast({
      title: "Category deleted",
      description: "The category has been deleted.",
    })
  }

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return
    }

    const reorderCategories = (startIndex: number, endIndex: number) => {
      const result = Array.from(categories)
      const [removed] = result.splice(startIndex, 1)
      result.splice(endIndex, 0, removed)

      setCategories(result)
    }

    // Reorder the categories
    reorderCategories(result.source.index, result.destination.index)

    toast({
      title: "Categories reordered",
      description: "The order of your categories has been updated.",
    })
  }

  // Toggle accordion item
  const toggleAccordionItem = (itemId: string) => {
    setExpandedItems((prev) => {
      if (prev.includes(itemId)) {
        return prev.filter((id) => id !== itemId)
      } else {
        return [...prev, itemId]
      }
    })
  }

  // Get icon component by name
  const getIconByName = (name: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<any>>)[name] || Settings
    return <Icon className="h-5 w-5" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Category Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addCategory()
            }}
          />
          <Button onClick={addCategory} size="icon">
            <Plus className="h-4 w-4" />
            <span className="sr-only">Add category</span>
          </Button>
        </div>

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 rounded-md border">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
                <span>{category.name}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={() => removeCategory(category.id)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Remove {category.name}</span>
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
