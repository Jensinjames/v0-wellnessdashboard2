import { FormAnalyticsDashboard } from "@/components/form-analytics-dashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Form Analytics</h1>
      <p className="text-muted-foreground mb-8">
        Track form submission rates and validation errors to improve user experience
      </p>

      <FormAnalyticsDashboard />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Understanding Form Analytics</CardTitle>
            <CardDescription>How to interpret the data</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Success Rate:</strong> Percentage of form submissions that succeeded without errors
              </li>
              <li>
                <strong>Field Errors:</strong> Which form fields are causing the most validation errors
              </li>
              <li>
                <strong>Completion Time:</strong> Average time users spend completing the form
              </li>
              <li>
                <strong>Attempts:</strong> Total number of form submission attempts
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Improving Form Usability</CardTitle>
            <CardDescription>Tips for better form design</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              <li>Fields with high error rates may need clearer instructions or validation</li>
              <li>Long completion times might indicate overly complex forms</li>
              <li>Low success rates could suggest usability issues</li>
              <li>Consider progressive disclosure for complex forms</li>
              <li>Use inline validation to catch errors early</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
