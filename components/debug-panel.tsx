"use client"

import { useState } from "react"
import { ClientMonitor } from "@/components/debug/client-monitor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Debug Panel Component
 *
 * This component provides debugging tools for the application.
 * It is only rendered in development mode.
 */
export function DebugPanel() {
  const isDevelopment = process.env.NODE_ENV !== "production"
  const [activeTab, setActiveTab] = useState("client")

  // Only render in development mode
  if (!isDevelopment) {
    return null
  }

  return (
    <Card className="w-full max-w-4xl mx-auto my-8">
      <CardHeader>
        <CardTitle>Debug Panel</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="client">Supabase Client</TabsTrigger>
            <TabsTrigger value="auth">Authentication</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="client">
            <ClientMonitor />
          </TabsContent>

          <TabsContent value="auth">
            <div className="p-4 bg-muted rounded-md">
              <p>Authentication debugging tools will be added here.</p>
            </div>
          </TabsContent>

          <TabsContent value="performance">
            <div className="p-4 bg-muted rounded-md">
              <p>Performance monitoring tools will be added here.</p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
