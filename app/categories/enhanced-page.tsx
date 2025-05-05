"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EnhancedCategoryManagement } from "@/components/enhanced-category-management"
import { SupabaseProvider } from "@/context/supabase-context"

export default function EnhancedCategoriesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Category Management</h1>
        <p className="text-muted-foreground">Manage your wellness categories and metrics to track your progress.</p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>
        <TabsContent value="categories" className="mt-6">
          <SupabaseProvider>
            <EnhancedCategoryManagement />
          </SupabaseProvider>
        </TabsContent>
        <TabsContent value="metrics" className="mt-6">
          <div className="rounded-lg border bg-card p-8 text-center">
            <h3 className="text-lg font-medium">Metrics Management</h3>
            <p className="mt-2 text-sm text-muted-foreground">This feature will be implemented in the next phase.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
