"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

import { Button } from "@/components/ui/button"
import { EnhancedButton } from "@/components/ui/enhanced-button"
import { CategoryIcon } from "@/components/ui/category-icon"
import { IconPicker } from "@/components/ui/icon-picker"
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
import { useIconContext } from "@/context/icon-context"
import type { WellnessCategory, WellnessMetric } from "@/types/wellness"
import { generateUniqueId } from "@/utils/id-generator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { AccessibleIcon } from "@/components/ui/accessible-icon"
import { CategoryColorPicker } from "@/components/ui/category-color-picker"
import { ColorPreview } from "@/components/ui/color-preview"

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
  { name: "Faith", value: "faith" }, // Added faith color
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
  const { iconPreferences, setIconPreference } = useIconContext()
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WellnessCategory | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [showAddMetric, setShowAddMetric] = useState<string>("")
  const [editingMetric, setEditingMetric] = useState<{ categoryId: string; metric: WellnessMetric } | null>(null)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const statusRef = useRef<HTMLDivElement>(null)
  const dragAnnouncerRef = useRef<HTMLDivElement>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [iconColor, setIconColor] = useState("blue")
  const [iconSize, setIconSize] = useState("md")
  const [iconBackground, setIconBackground] = useState<string | undefined>(undefined)

  // New state for generated IDs
  const [generatedCategoryId, setGeneratedCategoryId] = useState<string>("")
  const [generatedMetricId, setGeneratedMetricId] = useState<string>("")

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
    setIconColor("blue")
    setIconSize("md")
    setIconBackground(undefined)
    setGeneratedCategoryId("")
    setOpen(true)

    // Announce to screen readers
    if (statusRef.current) {
      statusRef.current.textContent = "Adding a new category"
    }
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

    // Set icon customization options
    const iconPref = iconPreferences[category.id]
    if (iconPref) {
      setIconColor(iconPref.color)
      setIconSize(iconPref.size)
      setIconBackground(iconPref.background)
    } else {
      setIconColor(category.color)
      setIconSize("md")
      setIconBackground(undefined)
    }

    setGeneratedCategoryId(category.id)
    setOpen(true)

    // Announce to screen readers
    if (statusRef.current) {
      statusRef.current.textContent = `Editing category: ${category.name}`
    }
  }

  // Handle category form submission
  const onCategorySubmit = async (data: z.infer<typeof categoryFormSchema>) => {
    setIsSubmitting(true)

    try {
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

      // Save icon preferences
      setIconPreference(finalId, {
        name: data.icon,
        color: iconColor,
        size: iconSize,
        background: iconBackground,
      })

      if (editingCategory) {
        // Update existing category
        const result = updateCategory(editingCategory.id, categoryData)
        if (result.success) {
          toast({
            title: "Category updated",
            description: `The category "${data.name}" has been updated.`,
          })

          // Announce to screen readers
          if (statusRef.current) {
            statusRef.current.textContent = `Category ${data.name} has been updated successfully`
          }

          setOpen(false)
        } else {
          toast({
            title: "Update failed",
            description: result.message,
            variant: "destructive",
          })

          // Announce error to screen readers
          if (statusRef.current) {
            statusRef.current.textContent = `Failed to update category: ${result.message}`
          }
        }
      } else {
        // Add new category
        const result = addCategory(categoryData)
        if (result.success) {
          toast({
            title: "Category added",
            description: `The category "\${data.name}" has been added with ID "\${finalId}".`,
          })

          // Announce to screen readers
          if (statusRef.current) {
            statusRef.current.textContent = `New category \${data.name} has been added successfully`
          }

          setOpen(false)
        } else {
          toast({
            title: "Addition failed",
            description: result.message,
            variant: "destructive",
          })

          // Announce error to screen readers
          if (statusRef.current) {
            statusRef.current.textContent = `Failed to add category: \${result.message}`
          }
        }
      }
    } finally {
      setIsSubmitting(false)
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

    // Announce to screen readers
    const category = categories.find((c) => c.id === categoryId)
    if (statusRef.current && category) {
      statusRef.current.textContent = `Adding a new metric to ${category.name} category`
    }
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

    // Announce to screen readers
    const category = categories.find((c) => c.id === categoryId)
    if (statusRef.current && category) {
      statusRef.current.textContent = `Editing metric: ${metric.name} in ${category.name} category`
    }
  }

  // Handle metric form submission
  const onMetricSubmit = async (data: z.infer<typeof metricFormSchema>) => {
    setIsSubmitting(true)

    try {
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

          // Announce to screen readers
          if (statusRef.current) {
            statusRef.current.textContent = `Metric ${data.name} has been updated successfully`
          }
        } else {
          toast({
            title: "Metric added",
            description: `The metric "${data.name}" has been added to the "${category.name}" category with ID "${finalId}".`,
          })

          // Announce to screen readers
          if (statusRef.current) {
            statusRef.current.textContent = `New metric ${data.name} has been added to ${category.name} category`
          }
        }
        setShowAddMetric("")
        setEditingMetric(null)
      } else {
        toast({
          title: "Operation failed",
          description: result.message,
          variant: "destructive",
        })

        // Announce error to screen readers
        if (statusRef.current) {
          statusRef.current.textContent = `Failed to ${editingMetric ? "update" : "add"} metric: ${result.message}`
        }
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle metric deletion
  const handleDeleteMetric = (categoryId: string, metricId: string) => {
    const category = categories.find((c) => c.id === categoryId)
    if (!category) return

    const metricToDelete = category.metrics.find((m) => m.id === metricId)
    const metricName = metricToDelete?.name || "metric"

    const updatedMetrics = category.metrics.filter((m) => m.id !== metricId)
    updateCategory(categoryId, { metrics: updatedMetrics })

    toast({
      title: "Metric deleted",
      description: "The metric has been deleted.",
    })

    // Announce to screen readers
    if (statusRef.current) {
      statusRef.current.textContent = `Metric ${metricName} has been deleted from ${category.name} category`
    }
  }

  // Handle category deletion
  const handleDeleteCategory = (categoryId: string) => {
    const categoryToDelete = categories.find((c) => c.id === categoryId)
    const categoryName = categoryToDelete?.name || "category"

    removeCategory(categoryId)
    setShowDeleteConfirm(null)

    toast({
      title: "Category deleted",
      description: "The category has been deleted.",
    })

    // Announce to screen readers
    if (statusRef.current) {
      statusRef.current.textContent = `Category ${categoryName} has been deleted`
    }
  }

  // Handle drag end event
  const handleDragEnd = (result: any) => {
    // Dropped outside the list
    if (!result.destination) {
      return
    }

    const sourceIndex = result.source.index
    const destinationIndex = result.destination.index

    // Get the category being moved
    const movedCategory = categories[sourceIndex]

    // Reorder the categories
    reorderCategories(sourceIndex, destinationIndex)

    toast({
      title: "Categories reordered",
      description: "The order of your categories has been updated.",
    })

    // Announce the reordering to screen readers
    if (dragAnnouncerRef.current && movedCategory) {
      const direction = destinationIndex > sourceIndex ? "down" : "up"
      const positions = Math.abs(destinationIndex - sourceIndex)
      dragAnnouncerRef.current.textContent = `${movedCategory.name} moved ${direction} ${positions} position${positions !== 1 ? "s" : ""}`
    }
  }

  // Handle drag start event
  const handleDragStart = (result: any) => {
    const sourceIndex = result.source.index
    const category = categories[sourceIndex]

    // Announce the drag start to screen readers
    if (dragAnnouncerRef.current && category) {
      dragAnnouncerRef.current.textContent = `Dragging ${category.name} category. Use arrow keys to reposition.`
    }
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

    // Announce the accordion state change to screen readers
    const category = categories.find((c) => c.id === itemId)
    if (statusRef.current && category) {
      const isExpanding = !expandedItems.includes(itemId)
      statusRef.current.textContent = `${category.name} metrics ${isExpanding ? "expanded" : "collapsed"}`
    }
  }

  return (
    <>
      {/* Hidden status announcer for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true" ref={statusRef}></div>

      {/* Hidden drag announcer for screen readers */}
      <div className="sr-only" aria-live="assertive" aria-atomic="true" ref={dragAnnouncerRef}></div>

      <Card className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle>Wellness Categories</CardTitle>
            <CardDescription>Manage your wellness tracking categories</CardDescription>
          </div>
          <EnhancedButton onClick={handleAddCategory} aria-label="Add new wellness category" icon="Plus">
            Add Category
          </EnhancedButton>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <div className="mb-2 text-sm text-slate-500 dark:text-slate-400">
              <p>Drag and drop categories to reorder them. Your most important categories should be at the top.</p>
            </div>
          ) : null}

          <DragDropContext onDragEnd={handleDragEnd} onDragStart={handleDragStart}>
            <Droppable droppableId="categories">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`space-y-2 ${snapshot.isDraggingOver ? "bg-slate-50 dark:bg-slate-800/50 rounded-md p-2" : ""}`}
                >
                  <div
                    className="categories-container"
                    aria-live="polite"
                    aria-atomic="false"
                    aria-relevant="additions removals"
                  >
                    {categories.map((category, index) => (
                      <Draggable key={category.id} draggableId={category.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`rounded-md border ${
                              snapshot.isDragging
                                ? "border-sky-500 shadow-md"
                                : "border-slate-200 dark:border-slate-700"
                            } bg-white dark:bg-slate-900`}
                            data-rbd-draggable-id={category.id}
                          >
                            <div className="flex items-center p-4">
                              <div
                                {...provided.dragHandleProps}
                                className="mr-2 cursor-grab active:cursor-grabbing"
                                aria-label={`Drag to reorder ${category.name} category`}
                              >
                                <AccessibleIcon
                                  name="GripVertical"
                                  label={`Drag ${category.name}`}
                                  className="text-slate-400 dark:text-slate-500"
                                />
                              </div>

                              <CategoryIcon
                                categoryId={category.id}
                                icon={category.icon as any}
                                label={category.name}
                              />

                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium text-slate-900 dark:text-slate-100">{category.name}</h3>
                                  <ColorPreview color={category.color} size="xs" />
                                </div>
                                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                  <AccessibleIcon name="Key" size="xs" aria-hidden="true" />
                                  <span>{category.id}</span>
                                </div>
                              </div>

                              <Badge variant="outline" className="mr-4">
                                {category.metrics.length} metrics
                              </Badge>

                              <div className="flex gap-2">
                                <EnhancedButton
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleAccordionItem(category.id)}
                                  aria-expanded={expandedItems.includes(category.id)}
                                  aria-controls={`category-metrics-${category.id}`}
                                  icon={expandedItems.includes(category.id) ? "ChevronUp" : "ChevronDown"}
                                  iconPosition="right"
                                >
                                  {expandedItems.includes(category.id) ? "Collapse" : "Expand"}
                                </EnhancedButton>
                                <EnhancedButton
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditCategory(category)}
                                  aria-label={`Edit ${category.name} category details`}
                                  icon="Edit"
                                >
                                  Edit
                                </EnhancedButton>
                                <EnhancedButton
                                  variant="outline"
                                  size="sm"
                                  className="text-red-700 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                                  onClick={() => setShowDeleteConfirm(category.id)}
                                  aria-label={`Delete ${category.name} category and all its metrics`}
                                  icon="Trash2"
                                >
                                  Delete
                                </EnhancedButton>
                              </div>
                            </div>

                            {/* Metrics section - only shown when expanded */}
                            {expandedItems.includes(category.id) && (
                              <div
                                className="border-t border-slate-200 dark:border-slate-700 p-4"
                                id={`category-metrics-${category.id}`}
                              >
                                <div className="mb-3 flex items-center justify-between">
                                  <h4 className="font-medium text-slate-900 dark:text-slate-100">Metrics</h4>
                                  <EnhancedButton
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleAddMetric(category.id)}
                                    aria-label={`Add new metric to ${category.name} category`}
                                    icon="Plus"
                                  >
                                    Add Metric
                                  </EnhancedButton>
                                </div>

                                <div className="space-y-3">
                                  {category.metrics.length > 0 ? (
                                    category.metrics.map((metric) => (
                                      <div
                                        key={metric.id}
                                        className="rounded-md border border-slate-200 dark:border-slate-700 p-3 flex items-center justify-between bg-white dark:bg-slate-900"
                                      >
                                        <div>
                                          <div className="font-medium text-slate-900 dark:text-slate-100">
                                            {metric.name}
                                          </div>
                                          <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                            <AccessibleIcon name="Key" size="xs" aria-hidden="true" />
                                            <span>{metric.id}</span>
                                          </div>
                                          <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                            {metric.description}
                                          </div>
                                          <div className="flex gap-2 mt-1">
                                            <Badge variant="outline">{metric.unit}</Badge>
                                            <Badge variant="outline">
                                              Range: {metric.min} - {metric.max}
                                            </Badge>
                                            <Badge variant="outline">Default Goal: {metric.defaultGoal}</Badge>
                                          </div>
                                        </div>
                                        <div className="flex gap-2">
                                          <EnhancedButton
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEditMetric(category.id, metric)}
                                            aria-label={`Edit ${metric.name} metric in ${category.name} category`}
                                            icon="Edit"
                                          >
                                            <span className="sr-only">Edit {metric.name}</span>
                                          </EnhancedButton>
                                          <EnhancedButton
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-700 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                                            onClick={() => handleDeleteMetric(category.id, metric.id)}
                                            aria-label={`Delete ${metric.name} metric from ${category.name} category`}
                                            icon="Trash2"
                                          >
                                            <span className="sr-only">Delete {metric.name}</span>
                                          </EnhancedButton>
                                        </div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="p-4 text-center text-slate-500 dark:text-slate-400" role="status">
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
                  </div>
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>

          {categories.length === 0 && (
            <div className="text-center py-12" role="status">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <AccessibleIcon
                  name="Settings"
                  size="lg"
                  className="text-slate-500 dark:text-slate-400"
                  aria-hidden="true"
                />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No categories</h3>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                You haven't created any wellness categories yet.
              </p>
              <EnhancedButton className="mt-4" onClick={handleAddCategory} icon="Plus">
                Add Your First Category
              </EnhancedButton>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Form Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900">
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
                    <FormLabel htmlFor="category-name">Name</FormLabel>
                    <FormControl>
                      <Input id="category-name" placeholder="e.g., Fitness" {...field} />
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
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 cursor-help">
                          <AccessibleIcon name="Key" size="xs" className="mr-1" aria-hidden="true" />
                          <span>Auto-generated</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>IDs are automatically generated based on the name to ensure uniqueness</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  aria-label="Category ID"
                  role="status"
                >
                  {editingCategory ? editingCategory.id : generatedCategoryId}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Unique identifier used in the system</div>
              </div>

              <FormField
                control={categoryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="category-description">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        id="category-description"
                        placeholder="Describe what this category is used for..."
                        {...field}
                      />
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
                      <FormLabel htmlFor="category-icon">Icon</FormLabel>
                      <FormControl>
                        <IconPicker
                          id="category-icon"
                          value={field.value}
                          onChange={field.onChange}
                          color={iconColor}
                          onColorChange={setIconColor}
                          size={iconSize}
                          onSizeChange={setIconSize}
                          background={iconBackground}
                          onBackgroundChange={setIconBackground}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={categoryForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="category-color">Color</FormLabel>
                      <FormControl>
                        <CategoryColorPicker
                          id="category-color"
                          value={field.value.includes("-") ? field.value : `${field.value}-500`}
                          onChange={field.onChange}
                          className="pt-2"
                        />
                      </FormControl>
                      <FormDescription>
                        Choose a color for this category. This will be used for visual identification throughout the
                        app.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  aria-label="Cancel category creation and close dialog"
                >
                  Cancel
                </Button>
                <EnhancedButton
                  type="submit"
                  aria-label={
                    editingCategory ? `Update ${editingCategory.name} category` : "Create new wellness category"
                  }
                  loading={isSubmitting}
                  loadingText={editingCategory ? "Updating..." : "Creating..."}
                  icon={editingCategory ? "Save" : "Plus"}
                >
                  {editingCategory ? "Update" : "Create"} Category
                </EnhancedButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Metric Form Dialog */}
      <Dialog open={!!showAddMetric} onOpenChange={(open) => !open && setShowAddMetric("")}>
        <DialogContent className="sm:max-w-[600px] bg-white dark:bg-slate-900">
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
                    <FormLabel htmlFor="metric-name">Name</FormLabel>
                    <FormControl>
                      <Input id="metric-name" placeholder="e.g., Daily Steps" {...field} />
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
                        <div className="flex items-center text-xs text-slate-500 dark:text-slate-400 cursor-help">
                          <AccessibleIcon name="Key" size="xs" className="mr-1" aria-hidden="true" />
                          <span>Auto-generated</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>IDs are automatically generated based on the name to ensure uniqueness</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div
                  className="flex h-10 w-full rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
                  aria-label="Metric ID"
                  role="status"
                >
                  {editingMetric ? editingMetric.metric.id : generatedMetricId}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Unique identifier used in the system</div>
              </div>

              <FormField
                control={metricForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="metric-description">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        id="metric-description"
                        placeholder="Describe what this metric measures..."
                        {...field}
                      />
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
                    <FormLabel htmlFor="metric-unit">Unit</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger id="metric-unit">
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
                      <FormLabel htmlFor="metric-min">Minimum Value</FormLabel>
                      <FormControl>
                        <Input
                          id="metric-min"
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
                      <FormLabel htmlFor="metric-max">Maximum Value</FormLabel>
                      <FormControl>
                        <Input
                          id="metric-max"
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
                      <FormLabel htmlFor="metric-step">Step</FormLabel>
                      <FormControl>
                        <Input
                          id="metric-step"
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
                      <FormLabel htmlFor="metric-default-value">Default Value</FormLabel>
                      <FormControl>
                        <Input
                          id="metric-default-value"
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
                      <FormLabel htmlFor="metric-default-goal">Default Goal</FormLabel>
                      <FormControl>
                        <Input
                          id="metric-default-goal"
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMetric("")}
                  aria-label="Cancel metric form"
                >
                  Cancel
                </Button>
                <EnhancedButton
                  type="submit"
                  aria-label={editingMetric ? "Update metric" : "Add metric"}
                  loading={isSubmitting}
                  loadingText={editingMetric ? "Updating..." : "Adding..."}
                  icon={editingMetric ? "Save" : "Plus"}
                >
                  {editingMetric ? "Update" : "Add"} Metric
                </EnhancedButton>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this category? This will remove all metrics associated with it and cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(null)} aria-label="Cancel deletion">
              Cancel
            </Button>
            <EnhancedButton
              variant="destructive"
              onClick={() => showDeleteConfirm && handleDeleteCategory(showDeleteConfirm)}
              aria-label="Confirm category deletion"
              icon="Trash2"
            >
              Delete
            </EnhancedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
