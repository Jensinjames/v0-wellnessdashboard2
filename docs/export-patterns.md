# Export Patterns Guide

This document outlines the export patterns used in the Wellness Dashboard project, providing guidelines for consistent component exports across the codebase.

## Table of Contents

1. [Export Pattern Overview](#export-pattern-overview)
2. [Next.js App Router Conventions](#nextjs-app-router-conventions)
3. [Component Export Guidelines](#component-export-guidelines)
4. [Migration Guide](#migration-guide)
5. [Import Best Practices](#import-best-practices)
6. [TypeScript Considerations](#typescript-considerations)

## Export Pattern Overview

The Wellness Dashboard project uses two primary export patterns:

### Default Exports

\`\`\`tsx
// Default export
export default function ComponentName() {
  return <div>Component content</div>
}
\`\`\`

### Named Exports

\`\`\`tsx
// Named export
export function ComponentName() {
  return <div>Component content</div>
}
\`\`\`

## Next.js App Router Conventions

Next.js App Router has specific conventions for exports:

### Page Components

All page components in the `app` directory **must use default exports**:

\`\`\`tsx
// app/profile/page.tsx
export default function ProfilePage() {
  return <div>Profile page content</div>
}
\`\`\`

### Layout Components

Layout components in the `app` directory **must use default exports**:

\`\`\`tsx
// app/profile/layout.tsx
export default function ProfileLayout({ children }) {
  return <div>{children}</div>
}
\`\`\`

### Route Handlers

API route handlers in the `app/api` directory **must use named exports** for HTTP methods:

\`\`\`tsx
// app/api/profile/route.ts
export async function GET(request) {
  // Handle GET request
}

export async function POST(request) {
  // Handle POST request
}
\`\`\`

## Component Export Guidelines

### When to Use Default Exports

Use default exports for:

1. **Page components** in the `app` directory
2. **Layout components** in the `app` directory
3. **Major feature components** that are the primary export of a file
4. **Components imported by page components** directly

Examples of components that should use default exports:

- `ProfileSettings`
- `UserPreferences`
- `PasswordUpdate`
- `ProfileDashboard`

\`\`\`tsx
// components/profile/profile-settings.tsx
export default function ProfileSettings() {
  // Component implementation
}
\`\`\`

### When to Use Named Exports

Use named exports for:

1. **Utility components** that are often imported alongside other components
2. **Hook functions** that provide reusable logic
3. **Multiple related components** in a single file
4. **Type definitions** and interfaces

Examples of components that should use named exports:

- `useProfile` (hook)
- `Button`, `Card`, etc. (UI components)
- Helper components that are part of a larger feature

\`\`\`tsx
// hooks/use-profile.ts
export function useProfile() {
  // Hook implementation
}
\`\`\`

## Migration Guide

When migrating from named exports to default exports:

1. Change the export statement in the component file:

   \`\`\`tsx
   // Before
   export function ComponentName() {
     // Implementation
   }

   // After
   export default function ComponentName() {
     // Implementation
   }
   \`\`\`

2. Update all import statements in files that use the component:

   \`\`\`tsx
   // Before
   import { ComponentName } from '@/components/component-name'

   // After
   import ComponentName from '@/components/component-name'
   \`\`\`

3. If the component was previously exported from an index file, update the re-export:

   \`\`\`tsx
   // Before
   export { ComponentName } from './component-name'

   // After
   export { default as ComponentName } from './component-name'
   // Or
   import ComponentName from './component-name'
   export default ComponentName
   \`\`\`

## Import Best Practices

### Importing Default Exports

\`\`\`tsx
import ComponentName from '@/components/component-name'
\`\`\`

### Importing Named Exports

\`\`\`tsx
import { FunctionName, TypeName } from '@/utils/helpers'
\`\`\`

### Importing Both Default and Named Exports

\`\`\`tsx
import DefaultComponent, { NamedComponent } from '@/components/mixed-exports'
\`\`\`

### Aliasing Imports

\`\`\`tsx
import DefaultComponent as AliasName from '@/components/component'
import { NamedExport as AliasName } from '@/utils/helpers'
\`\`\`

## TypeScript Considerations

### Exporting Types with Components

When exporting a component with its prop types:

\`\`\`tsx
// With default export
export interface ComponentProps {
  // Props definition
}

export default function Component(props: ComponentProps) {
  // Implementation
}

// With named export
export interface ComponentProps {
  // Props definition
}

export function Component(props: ComponentProps) {
  // Implementation
}
\`\`\`

### Type-Only Imports

For better performance, use type-only imports when importing types:

\`\`\`tsx
import type { ComponentProps } from '@/components/component'
\`\`\`

### Re-exporting Types

\`\`\`tsx
// Re-export types from a module
export type { ComponentProps } from './component'
