import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { InfoIcon } from "lucide-react"

export default function PerformancePage() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Performance Settings</CardTitle>
          <CardDescription>Configure application performance settings</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <InfoIcon className="h-4 w-4" />
            <AlertTitle>Performance Tools</AlertTitle>
            <AlertDescription>
              Use the RLS Optimizer tool to improve database query performance by optimizing Row Level Security
              policies.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <p>
              Performance settings help you optimize the application for your specific needs. Visit the RLS Optimizer
              page to improve database query performance.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
