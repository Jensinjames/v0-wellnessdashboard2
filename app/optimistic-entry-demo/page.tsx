import { OptimisticEntryForm } from "@/components/optimistic-entry-form"
import { OptimisticEntryList } from "@/components/optimistic-entry-list"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function OptimisticEntryDemoPage() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Optimistic Entry Form Demo</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates optimistic UI updates for entry forms. Try adding or editing entries to see the immediate
        UI feedback.
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Add New Entry</CardTitle>
              <CardDescription>Add a new wellness entry with optimistic UI updates</CardDescription>
            </CardHeader>
            <CardContent>
              <OptimisticEntryForm />
            </CardContent>
          </Card>

          <OptimisticEntryList />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
            <CardDescription>Understanding optimistic UI updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Immediate Feedback</h3>
              <p className="text-sm text-muted-foreground">
                The UI updates immediately when you submit the form, without waiting for the server response.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Background Processing</h3>
              <p className="text-sm text-muted-foreground">
                The actual data operation happens in the background while the UI already shows the expected result.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Error Handling</h3>
              <p className="text-sm text-muted-foreground">
                If an error occurs, the UI gracefully reverts to its previous state and shows an error message.
              </p>
            </div>

            <div>
              <h3 className="font-medium">Loading States</h3>
              <p className="text-sm text-muted-foreground">
                Subtle loading indicators show that an operation is in progress without blocking the UI.
              </p>
            </div>

            <div className="pt-4">
              <h3 className="font-medium text-lg">Try It Out</h3>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 mt-2">
                <li>Add a new entry and notice how it appears in the list immediately</li>
                <li>Click on an existing entry to edit it and see the changes reflect instantly</li>
                <li>Try deleting an entry to see it removed from the list right away</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
