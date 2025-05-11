import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUniqueId } from "@/utils/unique-id"

export function AccessibilityDocumentation() {
  const tabsId = useUniqueId("a11y-docs-tabs")

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Accessibility Documentation</CardTitle>
        <CardDescription>Guidelines and best practices for maintaining accessibility</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" id={tabsId}>
          <TabsList>
            <TabsTrigger value="overview" id={`${tabsId}-overview`}>
              Overview
            </TabsTrigger>
            <TabsTrigger value="color" id={`${tabsId}-color`}>
              Color Contrast
            </TabsTrigger>
            <TabsTrigger value="aria" id={`${tabsId}-aria`}>
              ARIA Usage
            </TabsTrigger>
            <TabsTrigger value="keyboard" id={`${tabsId}-keyboard`}>
              Keyboard Navigation
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <h3 className="text-lg font-medium">Accessibility Overview</h3>
            <p>
              This application follows WCAG 2.1 AA guidelines to ensure accessibility for all users. Key accessibility
              features include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Semantic HTML structure with proper landmarks</li>
              <li>Keyboard navigation support</li>
              <li>Screen reader compatibility</li>
              <li>Sufficient color contrast</li>
              <li>Text resizing support</li>
              <li>Focus management</li>
              <li>ARIA attributes where appropriate</li>
            </ul>
            <p>
              All developers should follow these guidelines when making changes to ensure the application remains
              accessible to all users.
            </p>
          </TabsContent>

          <TabsContent value="color" className="mt-4 space-y-4">
            <h3 className="text-lg font-medium">Color Contrast Guidelines</h3>
            <p>All text must meet the following contrast ratios:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Normal text (less than 18pt): 4.5:1 minimum contrast ratio</li>
              <li>Large text (18pt or 14pt bold and larger): 3:1 minimum contrast ratio</li>
              <li>UI components and graphical objects: 3:1 minimum contrast ratio</li>
            </ul>
            <p>
              Our color palette has been designed to meet these requirements. When creating custom components, use the
              color utilities provided in the design system.
            </p>
            <h4 className="text-md font-medium mt-4">Testing Color Contrast</h4>
            <p>
              Use tools like the WebAIM Contrast Checker or the built-in accessibility tools in your browser&apos;s
              developer tools to verify contrast ratios.
            </p>
          </TabsContent>

          <TabsContent value="aria" className="mt-4 space-y-4">
            <h3 className="text-lg font-medium">ARIA Usage Guidelines</h3>
            <p>
              ARIA (Accessible Rich Internet Applications) attributes should be used judiciously and only when
              necessary. Follow these principles:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use semantic HTML elements whenever possible</li>
              <li>Only use ARIA when native HTML semantics are insufficient</li>
              <li>Never change native semantics unless absolutely necessary</li>
              <li>All interactive elements must have an accessible name</li>
              <li>All ARIA controls must be keyboard accessible</li>
              <li>
                Don&apos;t use role=&quot;presentation&quot; or aria-hidden=&quot;true&quot; on focusable elements
              </li>
            </ul>
            <h4 className="text-md font-medium mt-4">Common ARIA Patterns</h4>
            <p>Our application uses these common ARIA patterns:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Live regions for dynamic content updates</li>
              <li>Dialog roles for modal windows</li>
              <li>Tab panels for tabbed interfaces</li>
              <li>Expanded/collapsed states for accordions</li>
            </ul>
          </TabsContent>

          <TabsContent value="keyboard" className="mt-4 space-y-4">
            <h3 className="text-lg font-medium">Keyboard Navigation</h3>
            <p>All interactive elements must be accessible via keyboard. Common keyboard interactions:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <strong>Tab:</strong> Move focus to the next focusable element
              </li>
              <li>
                <strong>Enter/Space:</strong> Activate buttons, links, and other interactive elements
              </li>
              <li>
                <strong>Arrow keys:</strong> Navigate within components like tab lists, menus, and grids
              </li>
            </ul>

            <h4 className="text-md font-medium mt-4">Focus Management</h4>
            <p>
              Ensure focus is always visible and managed correctly. Use CSS outlines or other visual indicators to
              highlight the currently focused element.
            </p>

            <h4 className="text-md font-medium mt-4">Skip Navigation</h4>
            <p>
              Provide a &quot;skip to content&quot; link at the top of the page to allow users to bypass the main
              navigation.
            </p>

            <h4 className="text-md font-medium mt-4">Keyboard Traps</h4>
            <p>
              Avoid keyboard traps where focus gets stuck within a component. Ensure users can always exit a component
              using the keyboard.
            </p>

            <h4 className="text-md font-medium mt-4">Testing Keyboard Navigation</h4>
            <p>Test all interactive elements using the keyboard to ensure they are focusable and operable.</p>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
