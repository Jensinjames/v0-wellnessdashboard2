# Component Export Examples

This document provides concrete examples of the export patterns used in the Wellness Dashboard project.

## Page Component Example

\`\`\`tsx
// app/profile/page.tsx
import ProfileDashboard from '@/components/profile/profile-dashboard'

export const metadata = {
  title: 'Profile Dashboard',
  description: 'Manage your profile settings',
}

export default function ProfilePage() {
  return <ProfileDashboard />
}
\`\`\`

## Feature Component Example

\`\`\`tsx
// components/profile/profile-settings.tsx
"use client"

import { useEffect } from "react"
import { useProfile } from "@/hooks/use-profile"
// Other imports...

export default function ProfileSettings() {
  // Component implementation
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Settings</CardTitle>
        {/* Component content */}
      </CardHeader>
    </Card>
  )
}
\`\`\`

## Hook Example

\`\`\`tsx
// hooks/use-profile.ts
import { useState, useEffect, useCallback } from 'react'
import { useSupabase } from './use-supabase'
import type { Profile } from '@/types/profile'

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = useSupabase()
  
  // Hook implementation
  
  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateProfile,
    // Other functions
  }
}
\`\`\`

## UI Component Example

\`\`\`tsx
// components/ui/button.tsx
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// Button variants definition
const buttonVariants = cva(
  // Class definitions
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  // Implementation
}

Button.displayName = "Button"

export { buttonVariants }
\`\`\`

## Mixed Export Example

\`\`\`tsx
// components/data-display.tsx
import React from 'react'

// Named export for a utility component
export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between py-2">
      <span className="font-medium">{label}</span>
      <span>{value}</span>
    </div>
  )
}

// Default export for the main component
export default function DataDisplay({ data }: { data: Record<string, string> }) {
  return (
    <div className="border rounded p-4">
      {Object.entries(data).map(([key, value]) => (
        <DataRow key={key} label={key} value={value} />
      ))}
    </div>
  )
}
\`\`\`

## Type Definitions Example

\`\`\`tsx
// types/profile.ts
export interface Profile {
  id: string
  user_id: string
  full_name?: string | null
  username?: string | null
  email: string
  avatar_url?: string | null
  bio?: string | null
  location?: string | null
  website?: string | null
  created_at: string
  updated_at: string
  theme_preference?: 'light' | 'dark' | 'system' | null
  email_notifications?: boolean
  notification_preferences?: {
    activity_updates?: boolean
    new_features?: boolean
    marketing?: boolean
  }
  timezone?: string
  language?: string
  isComplete?: boolean
}

export type ProfileUpdateInput = Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
