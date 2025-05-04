# Auth Context Documentation

## Overview

The Auth Context provides authentication and user profile management functionality throughout the application. It handles user sign-up, sign-in, sign-out, password management, and profile data.

## Usage

### Provider Setup

The `AuthProvider` should be placed high in the component tree, typically in the root layout:

\`\`\`tsx
import { AuthProvider } from "@/context/auth-context"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
\`\`\`

### Using the Auth Hook

Import and use the `useAuth` hook in any component that needs access to authentication state or functions:

\`\`\`tsx
import { useAuth } from "@/context/auth-context"

export function ProfileButton() {
  const { user, signOut } = useAuth()
  
  if (!user) {
    return <SignInButton />
  }
  
  return (
    <div>
      <span>Welcome, {user.email}</span>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
\`\`\`

## Available Properties and Methods

### State

- `user`: The current authenticated user or null
- `profile`: The user's profile data or null
- `session`: The current Supabase session or null
- `isLoading`: Boolean indicating if auth state is still loading

### Methods

- `signUp(credentials)`: Register a new user
- `signIn(credentials)`: Sign in an existing user
- `signOut()`: Sign out the current user
- `updatePassword(data)`: Update the user's password
- `resetPassword(email)`: Send a password reset email
- `refreshProfile()`: Manually refresh the user's profile data

## Types

\`\`\`tsx
interface SignUpCredentials {
  email: string
  password: string
  full_name?: string
}

interface SignInCredentials {
  email: string
  password: string
}

interface PasswordUpdateData {
  current_password: string
  new_password: string
}

interface UserProfile {
  id: string
  email: string
  full_name?: string | null
  avatar_url?: string | null
  created_at?: string
  updated_at?: string
}
\`\`\`

## Error Handling

All authentication methods return objects with the following structure:

\`\`\`tsx
{
  error: any | null;
  data?: any | null;
}
\`\`\`

You can check for errors like this:

\`\`\`tsx
const handleSignIn = async () => {
  const { error } = await signIn(credentials)
  if (error) {
    // Handle error
  } else {
    // Success
  }
}
\`\`\`

## Profile Management

The auth context automatically creates a profile for new users and keeps it in sync with the authentication state. You can access the profile data through the `profile` property.

If you need to refresh the profile data (e.g., after updating it), you can call the `refreshProfile()` method.

## Best Practices

1. Always check for `isLoading` before using auth state to avoid rendering issues
2. Use the `useAuth` hook only in components that are descendants of `AuthProvider`
3. Handle authentication errors appropriately in your UI
4. Use the `refreshProfile` method after updating profile data to ensure the UI reflects the changes
