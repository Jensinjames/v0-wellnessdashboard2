"use client"

import type React from "react"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Edit, Trash2, Settings, Key, Loader2 } from "lucide-react"
import * as LucideIcons from "lucide-react"

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
import { toast } from "@/components/ui/use-toast"
import { useSupabase } from "@/context/supabase-context"
import { createCategory, updateCategory, deleteCategory } from "@/services/categories-service"
import { generateUniqueId } from "@/utils/id-generator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Skeleton } from "@/components/ui/skeleton"

// Schema for category form
const categoryFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  icon: z.string().min(1, "Icon is required"),
  color: z.string().min(1, "Color is required"),
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

export function EnhancedCategoryManagement() {
  const { categories, loading, error, refreshCategories } = useSupabase()
  const [open, setOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedCategoryId, setGeneratedCategoryId] = useState<string>("")

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

  // Watch name field to generate ID
  const nameValue = categoryForm.watch("name")

  // Generate category ID when name changes
  if (nameValue && !editingCategory) {
    const existingIds = categories.map((c) => c.id)
    const newId = generateUniqueId(nameValue, existingIds)
    if (newId !== generatedCategoryId) {
      setGeneratedCategoryId(newId)
    }
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
  const handleEditCategory = (category: any) => {
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
  const onCategorySubmit = async (data: z.infer<typeof categoryFormSchema>) => {
    try {
      setIsSubmitting(true)

      if (editingCategory) {
        // Update existing category
        await updateCategory(editingCategory.id, {
          ...data,
          enabled: true,
        })

        toast({
          title: "Category updated",
          description: `The category "${data.name}" has been updated.`,
        })
      } else {
        // Add new category
        await createCategory({
          id: generatedCategoryId,
          ...data,
          enabled: true,
        })

        toast({
          title: "Category added",
          description: `The category "${data.name}" has been added.`,
        })
      }

      // Refresh categories
      await refreshCategories()
      setOpen(false)
    } catch (error) {
      console.error("Error submitting category:", error)
      toast({
        title: "Error",
        description: `There was an error ${editingCategory ? "updating" : "adding"} the category.`,
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle category deletion
  const handleDeleteCategory = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId)

      toast({
        title: "Category deleted",
        description: "The category has been deleted.",
      })

      // Refresh categories
      await refreshCategories()
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error("Error deleting category:", error)
      toast({
        title: "Error",
        description: "There was an error deleting the category.",
        variant: "destructive",
      })
    }
  }

  // Get icon component by name
  const getIconByName = (name: string) => {
    const Icon = (LucideIcons as Record<string, React.ComponentType<any>>)[name] || Settings
    return <Icon className="h-5 w-5" />
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>There was an error loading categories</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center text-red-500">
            <p>{error.message}</p>
            <Button onClick={() => refreshCategories()} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
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
          {loading ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4 rounded-md border p-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-10 w-10 rounded-md" />
                    <Skeleton className="h-10 w-10 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map((category) => (
                <div key={category.id} className="rounded-md border p-4">
                  <div className="flex items-center">
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

                    <div className="flex gap-2">
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
                </div>
              ))}
            </div>
          ) : (
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
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingCategory ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>{editingCategory ? "Update" : "Create"} Category</>
                  )}
                </Button>
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
