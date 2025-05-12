"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUniqueId } from "@/utils/unique-id"
import { AlertCircle, AlertTriangle, Info } from "lucide-react"

interface A11yIssue {
  type: "error" | "warning" | "info"
  message: string
  element: string
  impact: "critical" | "serious" | "moderate" | "minor"
}

export function AccessibilityTester() {
  const [issues, setIssues] = useState<A11yIssue[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState("errors")

  const testerId = useUniqueId("a11y-tester")
  const tabsId = useUniqueId("a11y-tabs")
  const resultsId = useUniqueId("a11y-results")

  // This is a simplified version - in a real app, you'd use a library like axe-core
  const runTests = () => {
    setIsRunning(true)

    // Simulate running tests
    setTimeout(() => {
      const newIssues: A11yIssue[] = []

      // Check for missing alt attributes on images
      document.querySelectorAll("img").forEach((img) => {
        if (!img.hasAttribute("alt")) {
          newIssues.push({
            type: "error",
            message: "Image missing alt attribute",
            element: getElementPath(img),
            impact: "serious",
          })
        }
      })

      // Check for buttons without accessible names
      document.querySelectorAll("button").forEach((button) => {
        if (!button.textContent?.trim() && !button.getAttribute("aria-label")) {
          newIssues.push({
            type: "error",
            message: "Button has no accessible name",
            element: getElementPath(button),
            impact: "critical",
          })
        }
      })

      // Check for color contrast (simplified)
      document.querySelectorAll("*").forEach((el) => {
        const style = window.getComputedStyle(el)
        const color = style.color
        const bgColor = style.backgroundColor

        // This is a very simplified check - real contrast checking is more complex
        if (color === "rgb(156, 163, 175)" && bgColor === "rgb(255, 255, 255)") {
          newIssues.push({
            type: "warning",
            message: "Potential low contrast text",
            element: getElementPath(el),
            impact: "moderate",
          })
        }
      })

      // Check for duplicate IDs
      const ids = new Map<string, HTMLElement[]>()
      document.querySelectorAll("[id]").forEach((el) => {
        const id = el.getAttribute("id")
        if (id) {
          if (!ids.has(id)) {
            ids.set(id, [el as HTMLElement])
          } else {
            ids.get(id)?.push(el as HTMLElement)
          }
        }
      })

      ids.forEach((elements, id) => {
        if (elements.length > 1) {
          elements.forEach((el) => {
            newIssues.push({
              type: "error",
              message: `Duplicate ID: ${id}`,
              element: getElementPath(el),
              impact: "serious",
            })
          })
        }
      })

      setIssues(newIssues)
      setIsRunning(false)
    }, 1500)
  }

  // Helper function to get a readable path to an element
  const getElementPath = (el: Element): string => {
    let path = el.tagName.toLowerCase()
    if (el.id) path += `#${el.id}`
    if (el.className && typeof el.className === "string") {
      path += `.${el.className.replace(/\s+/g, ".")}`
    }
    return path
  }

  // Filter issues based on active tab
  const filteredIssues = issues.filter((issue) => {
    if (activeTab === "errors") return issue.type === "error"
    if (activeTab === "warnings") return issue.type === "warning"
    return issue.type === "info"
  })

  // Determine counts for the tabs
  const errorCount = issues.filter((i) => i.type === "error").length
  const warningCount = issues.filter((i) => i.type === "warning").length
  const infoCount = issues.filter((i) => i.type === "info").length

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Accessibility Tester</CardTitle>
        <CardDescription>Test your application for common accessibility issues</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Button
            onClick={runTests}
            disabled={isRunning}
            aria-controls={resultsId}
            id={`${testerId}-run-button`}
            aria-busy={isRunning}
          >
            {isRunning ? "Running Tests..." : "Run Accessibility Tests"}
          </Button>
        </div>

        {issues.length > 0 && (
          <div id={resultsId} aria-live="polite" aria-atomic="true" aria-relevant="additions text">
            <Tabs value={activeTab} onValueChange={setActiveTab} id={tabsId}>
              <TabsList aria-label="Accessibility test results">
                <TabsTrigger value="errors" id={`${tabsId}-errors`} aria-controls={`${tabsId}-errors-content`}>
                  Errors ({errorCount})
                </TabsTrigger>
                <TabsTrigger value="warnings" id={`${tabsId}-warnings`} aria-controls={`${tabsId}-warnings-content`}>
                  Warnings ({warningCount})
                </TabsTrigger>
                <TabsTrigger value="info" id={`${tabsId}-info`} aria-controls={`${tabsId}-info-content`}>
                  Info ({infoCount})
                </TabsTrigger>
              </TabsList>

              <TabsContent
                value="errors"
                className="mt-4"
                id={`${tabsId}-errors-content`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-errors`}
              >
                {filteredIssues.length > 0 ? (
                  <ul className="space-y-2 list-none p-0">
                    {filteredIssues.map((issue, index) => (
                      <li key={index} className="border-l-4 border-red-600 pl-4 py-2">
                        <div className="flex items-start">
                          <AlertCircle className="h-5 w-5 text-red-600 mr-2 mt-0.5 shrink-0" aria-hidden="true" />
                          <div>
                            <p className="font-medium">{issue.message}</p>
                            <p className="text-sm text-muted-foreground">Element: {issue.element}</p>
                            <p className="text-sm text-muted-foreground">Impact: {issue.impact}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No errors found.</p>
                )}
              </TabsContent>

              <TabsContent
                value="warnings"
                className="mt-4"
                id={`${tabsId}-warnings-content`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-warnings`}
              >
                {filteredIssues.length > 0 ? (
                  <ul className="space-y-2 list-none p-0">
                    {filteredIssues.map((issue, index) => (
                      <li key={index} className="border-l-4 border-yellow-600 pl-4 py-2">
                        <div className="flex items-start">
                          <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5 shrink-0" aria-hidden="true" />
                          <div>
                            <p className="font-medium">{issue.message}</p>
                            <p className="text-sm text-muted-foreground">Element: {issue.element}</p>
                            <p className="text-sm text-muted-foreground">Impact: {issue.impact}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No warnings found.</p>
                )}
              </TabsContent>

              <TabsContent
                value="info"
                className="mt-4"
                id={`${tabsId}-info-content`}
                role="tabpanel"
                aria-labelledby={`${tabsId}-info`}
              >
                {filteredIssues.length > 0 ? (
                  <ul className="space-y-2 list-none p-0">
                    {filteredIssues.map((issue, index) => (
                      <li key={index} className="border-l-4 border-blue-600 pl-4 py-2">
                        <div className="flex items-start">
                          <Info className="h-5 w-5 text-blue-600 mr-2 mt-0.5 shrink-0" aria-hidden="true" />
                          <div>
                            <p className="font-medium">{issue.message}</p>
                            <p className="text-sm text-muted-foreground">Element: {issue.element}</p>
                            <p className="text-sm text-muted-foreground">Impact: {issue.impact}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No info items found.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {issues.length === 0 && !isRunning && <p>Run the test to check for accessibility issues.</p>}
      </CardContent>
    </Card>
  )
}
