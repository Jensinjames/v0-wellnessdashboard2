"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Edit, Trash2, Settings, GripVertical, Key } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { useWellness } from "@/context/wellness-context"
import type { WellnessCategory, WellnessMetric } from "@/types/wellness"
import { generateUniqueId } from "@/utils/id-generator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

export function CategoryManagement() {
  const { categories, addCategory, updateCategory, removeCategory, reorderCategories } = useWellness()
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
      const result = addCategory(categoryData)
      if (result.success) {
        toast({
          title: "Category added",
          description: `The category "${data.name}" has been added with ID "${finalId}".`,
        })
        setOpen(false)
      } else {
        toast({
          title: "Addition failed",
          description: result.message,
          variant: "destructive",
        })
      }
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
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Wellness Categories</CardTitle>
            <CardDescription>Manage your wellness tracking categories</CardDescription>
          </div>
          <Button onClick={handleAddCategory}>
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="mb-2 text-sm text-muted-foreground">
              <p>Drag and drop categories to reorder them. Your most important categories should be at the top.</p>
            </div>
          ) : null}

          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="categories">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 ${snapshot.isDraggingOver ? "bg-muted/50 rounded-md p-2" : ""}`}
                >
                  {categories.map((category, index) => (
                    <Draggable key={category.id} draggableId={category.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`rounded-md border ${
                            snapshot.isDragging ? "border-primary shadow-md" : "border-border"
                          }`}
                        >
                          <div className="flex items-center p-4">
                            <div
                              {...provided.dragHandleProps}
                              className="mr-2 cursor-grab active:cursor-grabbing"
                              aria-label={`Drag to reorder ${category.name}`}
                            >
                              <GripVertical className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                            </div>

                            <div
                              className={`mr-3 flex h-8 w-8 items-center justify-center rounded-md bg-${category.color}-600`}
                            >
                              {getIconByName(category.icon)}
                            </div>

                            <div className="flex-1">
                              <h3 className="font-medium">{category.name}</h3>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Key className="h-3 w-3" />
                                <span>{category.id}</span>
                              </div>
                            </div>

                            <Badge variant="outline" className="mr-4">
                              {category.metrics.length} metrics
                            </Badge>

                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAccordionItem(category.id)}
                                aria-expanded={expandedItems.includes(category.id)}
                                aria-controls={`category-metrics-${category.id}`}
                              >
                                {expandedItems.includes(category.id) ? "Collapse" : "Expand"}
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleEditCategory(category)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setShowDeleteConfirm(category.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </Button>
                            </div>
                          </div>

                          {/* Metrics section - only shown when expanded */}
                          {expandedItems.includes(category.id) && (
                            <div className="border-t p-4" id={`category-metrics-${category.id}`}>
                              <div className="mb-3 flex items-center justify-between">
                                <h4 className="font-medium">Metrics</h4>
                                <Button variant="outline" size="sm" onClick={() => handleAddMetric(category.id)}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Add Metric
                                </Button>
                              </div>

                              <div className="space-y-3">
                                {category.metrics.length > 0 ? (
                                  category.metrics.map((metric) => (
                                    <div
                                      key={metric.id}
                                      className="rounded-md border p-3 flex items-center justify-between"
                                    >
                                      <div>
                                        <div className="font-medium">{metric.name}</div>
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                          <Key className="h-3 w-3" />
                                          <span>{metric.id}</span>
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">{metric.description}</div>
                                        <div className="flex gap-2 mt-1">
                                          <Badge variant="outline">{metric.unit}</Badge>
                                          <Badge variant="outline">
                                            Range: {metric.min} - {metric.max}
                                          </Badge>
                                          <Badge variant="outline">Default Goal: {metric.defaultGoal}</Badge>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => handleEditMetric(category.id, metric)}
                                        >
                                          <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="text-red-500 hover:text-red-700"
                                          onClick={() => handleDeleteMetric(category.id, metric.id)}
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))
                                ) : (
                                  <div className="p-4 text-center text-muted-foreground">
                                    No metrics defined for this category
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {categories.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Settings className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No categories</h3>
              <p className="mt-2 text-sm text-muted-foreground">You haven't created any wellness categories yet.</p>
              <Button className="mt-4" onClick={handleAddCategory}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Category
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            <DialogDescription>
              {editingCategory
                ? "Update the details of your wellness category."
                : "Create a new category to track in your wellness dashboard."}
            </DialogDescription>
          </DialogHeader>

          <Form {...categoryForm}>
            <form onSubmit={categoryForm.handleSubmit(onCategorySubmit)} className="space-y-6">
              <FormField
                control={categoryForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fitness" {...field} />
                    </FormControl>
                    <FormDescription>The display name for this category.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display the generated ID (read-only) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">ID</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-xs text-muted-foreground cursor-help">
                          <Key className="h-3 w-3 mr-1" />
                          <span>Auto-generated</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>IDs are automatically generated based on the name to ensure uniqueness</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {editingCategory ? editingCategory.id : generatedCategoryId}
                </div>
                <div className="text-xs text-muted-foreground">Unique identifier used in the system</div>
              </div>

              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what this category is used for..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={categoryForm.control}
                  name="icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Icon</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {availableIcons.map((icon) => (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                {getIconByName(icon)}
                                <span>{icon}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="max-h-[300px]">
                          {availableColors.map((color) => (
                            <SelectItem key={color.value} value={color.value}>
                              <div className="flex items-center gap-2">
                                <div className={`w-4 h-4 rounded-full bg-${color.value}-500`}></div>
                                <span>{color.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingCategory ? "Update" : "Create"} Category</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Metric Form Dialog */}
      <Dialog open={!!showAddMetric} onOpenChange={(open) => !open && setShowAddMetric("")}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingMetric ? "Edit Metric" : "Add New Metric"}</DialogTitle>
            <DialogDescription>
              {editingMetric
                ? "Update the details of your wellness metric."
                : "Create a new metric to track in this category."}
            </DialogDescription>
          </DialogHeader>

          <Form {...metricForm}>
            <form onSubmit={metricForm.handleSubmit(onMetricSubmit)} className="space-y-6">
              <FormField
                control={metricForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Daily Steps" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Display the generated ID (read-only) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">ID</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-xs text-muted-foreground cursor-help">
                          <Key className="h-3 w-3 mr-1" />
                          <span>Auto-generated</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>IDs are automatically generated based on the name to ensure uniqueness</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                  {editingMetric ? editingMetric.metric.id : generatedMetricId}
                </div>
                <div className="text-xs text-muted-foreground">Unique identifier used in the system</div>
              </div>

              <FormField
                control={metricForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe what this metric measures..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={metricForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableUnits.map((unit) => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={metricForm.control}
                  name="min"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={metricForm.control}
                  name="max"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximum Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={metricForm.control}
                  name="step"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Step</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Increment amount</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={metricForm.control}
                  name="defaultValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Value</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Starting value for new entries</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={metricForm.control}
                  name="defaultGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Goal</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number.parseFloat(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>Default target value</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowAddMetric("")}>
                  Cancel
                </Button>
                <Button type="submit">{editingMetric ? "Update" : "Add"} Metric</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This will remove all metrics associated with it and cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => showDeleteConfirm && handleDeleteCategory(showDeleteConfirm)}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
