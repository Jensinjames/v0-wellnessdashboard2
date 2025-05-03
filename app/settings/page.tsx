"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { OptimizedCategoryManagement } from "@/components/optimized-category-management"
import { SettingsForm } from "@/components/settings/settings-form"
import { WellnessProvider } from "@/context/wellness-context"

export default function SettingsPage() {
  return (
    <WellnessProvider>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and preferences</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <SettingsForm />
          </TabsContent>

          <TabsContent value="categories" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Category Management</CardTitle>
                <CardDescription>Manage your wellness categories and metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <OptimizedCategoryManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="account" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Settings</CardTitle>
                <CardDescription>Manage your account preferences and details</CardDescription>
              </CardHeader>
              <CardContent>
                <p>Account settings content will go here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </WellnessProvider>
  )
}
