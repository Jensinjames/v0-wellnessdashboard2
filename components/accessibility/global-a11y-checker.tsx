"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { checkAriaHiddenFocusable, checkListStructure, checkAriaLabels } from "@/utils/accessibility-utils"
import { AlertCircle } from "lucide-react"

interface Issue {
  type: string
  message: string
}

export function GlobalAccessibilityChecker() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const runChecks = () => {
    setIsChecking(true)
    setShowResults(false)

    // Wait a tick to allow the UI to update
    setTimeout(() => {
      const newIssues: Issue[] = []

      // Run our accessibility checks
      const ariaHiddenIssues = checkAriaHiddenFocusable()
      ariaHiddenIssues.forEach((message) => {
        newIssues.push({ type: "aria-hidden", message })
      })

      const listStructureIssues = checkListStructure()
      listStructureIssues.forEach((message) => {
        newIssues.push({ type: "list-structure", message })
      })

      const ariaLabelIssues = checkAriaLabels()
      ariaLabelIssues.forEach((message) => {
        newIssues.push({ type: "aria-label", message })
      })

      setIssues(newIssues)
      setIsChecking(false)
      setShowResults(true)
    }, 100)
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Accessibility Checker</CardTitle>
        <CardDescription>Check your application for common accessibility issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button onClick={runChecks} disabled={isChecking} aria-busy={isChecking}>
            {isChecking ? "Checking..." : "Run Accessibility Checks"}
          </Button>
        </div>

        {showResults && (
          <div aria-live="polite" className="mt-4">
            <h3 className="text-lg font-medium mb-2">Results</h3>

            {issues.length === 0 ? (
              <p className="text-green-600">No accessibility issues found!</p>
            ) : (
              <div>
                <p className="mb-2">Found {issues.length} issues:</p>
                <ul className="space-y-2 list-none p-0">
                  {issues.map((issue, index) => (
                    <li key={index} className="border-l-4 border-amber-500 pl-4 py-2">
                      <div className="flex items-start">
                        <AlertCircle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="font-medium">{issue.type}</p>
                          <p className="text-sm text-muted-foreground">{issue.message}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
