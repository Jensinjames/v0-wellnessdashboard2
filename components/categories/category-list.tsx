"use client"

import { useState } from "react"
import { useAuth } from "@/context/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Info, Plus, Pencil, Trash2, AlertCircle } from "lucide-react"
import type { WellnessCategory } from "@/app/actions/categories"
import { CategoryForm } from "./category-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { deleteCategory } from "@/app/actions/categories"

interface CategoryListProps {
  categories: WellnessCategory[]
}

export function CategoryList({ categories }: CategoryListProps) {
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WellnessCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<WellnessCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [demoMode, setDemoMode] = useState(user?.id.startsWith("mock-") || false)

  // Split categories into system and custom
  const systemCategories = categories.filter((cat) => !cat.user_id)
  const customCategories = categories.filter((cat) => cat.user_id)

  const handleDeleteCategory = async () => {
    if (!user || !deletingCategory) return

    setIsDeleting(true)
    setError(null)

    try {
      if (demoMode) {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 500))
        setDeletingCategory(null)
        setIsDeleting(false)
        return
      }

      const result = await deleteCategory(user.id, deletingCategory.id)

      if (!result.success) {
        setError(result.error)
        return
      }

      setDeletingCategory(null)
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Wellness Categories</CardTitle>
            <CardDescription>Manage your wellness tracking categories</CardDescription>
          </div>
          <Button onClick={() => setIsCreating(true)} className="flex items-center gap-1">
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {demoMode && (
            <Alert className="mb-4">
              <Info className="h-4 w-4" />
              <AlertTitle>Demo Mode</AlertTitle>
              <AlertDescription>
                You're in demo mode. Category changes will not be saved to the database.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* System Categories */}
            <div>
              <h3 className="mb-3 text-lg font-medium">System Categories</h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {systemCategories.map((category) => (
                  <Card key={category.id} className="overflow-hidden">
                    <div className="h-1" style={{ backgroundColor: category.color }}></div>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">System</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Custom Categories */}
            <div>
              <h3 className="mb-3 text-lg font-medium">Custom Categories</h3>
              {customCategories.length === 0 ? (
                <p className="text-sm text-muted-foreground">You haven't created any custom categories yet.</p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {customCategories.map((category) => (
                    <Card key={category.id} className="overflow-hidden">
                      <div className="h-1" style={{ backgroundColor: category.color }}></div>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: category.color }}></div>
                            <span className="font-medium">{category.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => setEditingCategory(category)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => setDeletingCategory(category)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Delete</span>
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Category</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete the "{deletingCategory?.name}" category? This action
                                    cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <Button variant="destructive" onClick={handleDeleteCategory} disabled={isDeleting}>
                                    {isDeleting ? "Deleting..." : "Delete"}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Create Category Dialog */}
      {isCreating && <CategoryForm onClose={() => setIsCreating(false)} mode="create" />}

      {/* Edit Category Dialog */}
      {editingCategory && (
        <CategoryForm onClose={() => setEditingCategory(null)} mode="edit" category={editingCategory} />
      )}
    </div>
  )
}
