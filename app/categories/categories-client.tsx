"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { WellnessCategory } from "@/types/wellness"
import { CategoryFormWithServerAction } from "@/components/categories/category-form-with-server-action"
import { deleteCategory } from "@/app/actions/category-actions"
import { useToast } from "@/hooks/use-toast"

interface CategoriesClientProps {
  initialCategories: WellnessCategory[]
}

export function CategoriesClient({ initialCategories }: CategoriesClientProps) {
  const [categories, setCategories] = useState<WellnessCategory[]>(initialCategories)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<WellnessCategory | null>(null)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const { toast } = useToast()

  const handleCreateSuccess = (newCategory: WellnessCategory) => {
    setCategories((prev) => [...prev, newCategory])
  }

  const handleUpdateSuccess = (updatedCategory: WellnessCategory) => {
    setCategories((prev) => prev.map((cat) => (cat.id === updatedCategory.id ? updatedCategory : cat)))
  }

  const handleDelete = async (categoryId: string) => {
    setIsDeleting(categoryId)

    try {
      const result = await deleteCategory(categoryId)

      if (result.success) {
        setCategories((prev) => prev.filter((cat) => cat.id !== categoryId))
        toast({
          title: "Category deleted",
          description: "The category has been deleted successfully",
        })
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(null)
    }
  }

  // Filter system categories (no user_id) and user categories
  const systemCategories = categories.filter((cat) => !cat.user_id)
  const userCategories = categories.filter((cat) => cat.user_id)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your Categories</h2>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {userCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                  <Edit className="h-4 w-4" />
                  <span className="sr-only">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category.id)}
                  disabled={isDeleting === category.id}
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-8">System Categories</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {systemCategories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium flex items-center">
                <div className="w-4 h-4 rounded-full mr-2" style={{ backgroundColor: category.color }}></div>
                {category.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">System category (cannot be modified)</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isCreateModalOpen && (
        <CategoryFormWithServerAction
          mode="create"
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {editingCategory && (
        <CategoryFormWithServerAction
          mode="edit"
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  )
}
