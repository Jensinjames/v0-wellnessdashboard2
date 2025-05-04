# Export Pattern Migration Examples

This document provides examples of how to migrate components from named exports to default exports and vice versa.

## Migrating from Named Export to Default Export

### Before: Named Export

\`\`\`tsx
// components/profile/user-preferences.tsx
"use client"

import { useEffect } from "react"
// Other imports...

export function UserPreferences() {
  // Component implementation
  
  return (
    <Card>
      {/* Component content */}
    </Card>
  )
}
\`\`\`

### After: Default Export

\`\`\`tsx
// components/profile/user-preferences.tsx
"use client"

import { useEffect } from "react"
// Other imports...

export default function UserPreferences() {
  // Component implementation
  
  return (
    <Card>
      {/* Component content */}
    </Card>
  )
}
\`\`\`

### Updating Imports

\`\`\`tsx
// Before
import { UserPreferences } from '@/components/profile/user-preferences'

// After
import UserPreferences from '@/components/profile/user-preferences'
\`\`\`

## Migrating from Default Export to Named Export

### Before: Default Export

\`\`\`tsx
// components/ui/custom-button.tsx
import React from 'react'

export default function CustomButton({ children, ...props }) {
  return (
    <button className="custom-button" {...props}>
      {children}
    </button>
  )
}
\`\`\`

### After: Named Export

\`\`\`tsx
// components/ui/custom-button.tsx
import React from 'react'

export function CustomButton({ children, ...props }) {
  return (
    <button className="custom-button" {...props}>
      {children}
    </button>
  )
}
\`\`\`

### Updating Imports

\`\`\`tsx
// Before
import CustomButton from '@/components/ui/custom-button'

// After
import { CustomButton } from '@/components/ui/custom-button'
\`\`\`

## Migrating a Component with Types

### Before: Named Export with Types

\`\`\`tsx
// components/data-table.tsx
import React from 'react'

export interface DataTableProps {
  data: any[]
  columns: { key: string; label: string }[]
}

export function DataTable({ data, columns }: DataTableProps) {
  return (
    <table>
      {/* Table implementation */}
    </table>
  )
}
\`\`\`

### After: Default Export with Types

\`\`\`tsx
// components/data-table.tsx
import React from 'react'

export interface DataTableProps {
  data: any[]
  columns: { key: string; label: string }[]
}

export default function DataTable({ data, columns }: DataTableProps) {
  return (
    <table>
      {/* Table implementation */}
    </table>
  )
}
\`\`\`

### Updating Imports

\`\`\`tsx
// Before
import { DataTable, type DataTableProps } from '@/components/data-table'

// After
import DataTable, { type DataTableProps } from '@/components/data-table'
\`\`\`

## Migrating Index Files

### Before: Re-exporting Named Exports

\`\`\`tsx
// components/profile/index.ts
export { ProfileSettings } from './profile-settings' from './user-preferences'
export { PasswordUpdate } from './password-update'
\`\`\`

### After: Re-exporting Default Exports

\`\`\`tsx
// components/profile/index.ts
export { default as ProfileSettings } from './profile-settings' from './user-preferences'
export { default as PasswordUpdate } from './password-update'
\`\`\`

## Migrating a Component with Multiple Exports

### Before: Default Export with Additional Named Exports

\`\`\`tsx
// components/form/input.tsx
import React from 'react'

export function InputLabel({ children }) {
  return <label>{children}</label>
}

export function InputError({ message }) {
  return <p className="text-red-500">{message}</p>
}

export default function Input(props) {
  return <input {...props} />
}
\`\`\`

### After: All Named Exports

\`\`\`tsx
// components/form/input.tsx
import React from 'react'

export function Input(props) {
  return <input {...props} />
}

export function InputLabel({ children }) {
  return <label>{children}</label>
}

export function InputError({ message }) {
  return <p className="text-red-500">{message}</p>
}
\`\`\`

### Updating Imports

\`\`\`tsx
// Before
import Input, { InputLabel, InputError } from '@/components/form/input'

// After
import { Input, InputLabel, InputError } from '@/components/form/input'
