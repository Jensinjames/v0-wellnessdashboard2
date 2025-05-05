import { ActivityFormWithServerValidation } from "@/components/activity-form-with-server-validation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function ValidationDemoPage() {
  // Sample categories
  const categories = [
    { id: "exercise", name: "Exercise" },
    { id: "meditation", name: "Meditation" },
    { id: "reading", name: "Reading" },
    { id: "nutrition", name: "Nutrition" },
    { id: "sleep", name: "Sleep" },
    { id: "social", name: "Social" },
    { id: "learning", name: "Learning" },
    { id: "creative", name: "Creative" },
    { id: "work", name: "Work" },
    { id: "leisure", name: "Leisure" },
  ]

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Server-Side Validation Demo</h1>
      <p className="text-muted-foreground mb-8">This page demonstrates server-side validation using Zod schemas</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Activity Form</CardTitle>
            <CardDescription>Add a new activity with server-side validation</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityFormWithServerValidation categories={categories} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Understanding server-side validation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">Client-Side Validation</h3>
              <p className="text-muted-foreground">
                The form uses Zod with React Hook Form to validate inputs before submission.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg">Server-Side Validation</h3>
              <p className="text-muted-foreground">
                The same Zod schema validates data on the server using Next.js Server Actions.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg">Error Handling</h3>
              <p className="text-muted-foreground">
                Validation errors from the server are displayed in the form and logged to the database.
              </p>
            </div>

            <div>
              <h3 className="font-medium text-lg">Try It Out</h3>
              <p className="text-muted-foreground">
                Try submitting invalid data or bypassing client validation to see server validation in action.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
