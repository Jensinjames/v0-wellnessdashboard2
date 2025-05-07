"use client"

import { useState, useEffect, Suspense } from "react"
import { useAuth } from "@/context/auth-context"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { BackButton } from "@/components/ui/back-button"
import { CategoryList } from "@/components/categories/category-list"
import { CategoryForm } from "@/components/categories/category-form"

// Loading fallback component
function LoadingFallback() {
  return (
    <div className="w-full p-4 flex justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  )
}

export default function CategoriesPage() {
  const { user, isLoading } = useAuth()
  const [isClient, setIsClient] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return null
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Loading...</h1>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Categories</h1>
          </div>
          <p>Please sign in to view your categories.</p>
        </main>
      </div>
    )
  }

  const handleCategoryAdded = () => {
    setIsDialogOpen(false)
    setRefreshKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Categories</h1>
          <div className="flex gap-2">
            <Suspense
              fallback={
                <Button variant="outline" disabled>
                  Back
                </Button>
              }
            >
              <BackButton />
            </Suspense>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Category
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Category</DialogTitle>
                </DialogHeader>
                <CategoryForm onSuccess={handleCategoryAdded} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Suspense fallback={<LoadingFallback />}>
          <CategoryList key={refreshKey} />
        </Suspense>
      </main>
    </div>
  )
}
