"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase-client"
import type { AuthError, Session, User } from "@supabase/supabase-js"

// ===== TYPES =====

type SignInCredentials = {
  email: string
  password: string
  rememberMe?: boolean
}

type SignInResult = {
  success: boolean
  error: AuthError | null
  redirectTo: string | null
  emailVerificationRequired?: boolean
}

type SignUpCredentials = {
  email: string
  password: string
  name?: string
}

type SignUpResult = {
  success: boolean
  error: AuthError | null
  emailVerificationSent: boolean
}

type PasswordResetResult = {
  success: boolean
  error: AuthError | null
}

type AuthState = {
  user: User | null
  session: Session | null
  isLoading: boolean
  isAuthenticated: boolean
}

// ===== SIGN IN HOOK =====

export function useSignIn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)
  const [isEmailVerificationError, setIsEmailVerificationError] = useState(false)

  const signIn = async (credentials: SignInCredentials, redirectTo = "/dashboard"): Promise<SignInResult> => {
    setLoading(true)
    setError(null)
    setIsEmailVerificationError(false)

    try {
      const supabase = createClient()

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      })

      if (signInError) {
        setError(signInError)

        // Check if this is an email verification error
        if (signInError.message.includes("Email not confirmed") || signInError.message.includes("Email not verified")) {
          setIsEmailVerificationError(true)
          return {
            success: false,
            error: signInError,
            redirectTo: null,
            emailVerificationRequired: true,
          }
        }

        return {
          success: false,
          error: signInError,
          redirectTo: null,
        }
      }

      return {
        success: true,
        error: null,
        redirectTo,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
        redirectTo: null,
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    signIn,
    loading,
    error,
    isEmailVerificationError,
  }
}

// ===== SIGN UP HOOK =====

export function useSignUp() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signUp = async (credentials: SignUpCredentials): Promise<SignUpResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            name: credentials.name || "",
          },
        },
      })

      if (signUpError) {
        setError(signUpError)
        return {
          success: false,
          error: signUpError,
          emailVerificationSent: false,
        }
      }

      // If identityData exists but no user, it means email confirmation is required
      const emailVerificationSent = !data.user || data.user.identities?.length === 0

      return {
        success: true,
        error: null,
        emailVerificationSent,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
        emailVerificationSent: false,
      }
    } finally {
      setLoading(false)
    }
  }

  const resendVerificationEmail = async (email: string) => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      })

      if (error) {
        setError(error)
        return { error }
      }

      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    signUp,
    resendVerificationEmail,
    loading,
    error,
  }
}

// ===== SIGN OUT HOOK =====

export function useSignOut() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const signOut = async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: signOutError } = await supabase.auth.signOut()

      if (signOutError) {
        setError(signOutError)
        return { error: signOutError }
      }

      return { error: null }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return { error: authError }
    } finally {
      setLoading(false)
    }
  }

  return {
    signOut,
    loading,
    error,
  }
}

// ===== PASSWORD RESET HOOK =====

export function usePasswordReset() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<AuthError | null>(null)

  const requestPasswordReset = async (email: string): Promise<PasswordResetResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password/confirm`,
      })

      if (resetError) {
        setError(resetError)
        return {
          success: false,
          error: resetError,
        }
      }

      return {
        success: true,
        error: null,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
      }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword: string): Promise<PasswordResetResult> => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (updateError) {
        setError(updateError)
        return {
          success: false,
          error: updateError,
        }
      }

      return {
        success: true,
        error: null,
      }
    } catch (err) {
      const authError = err as AuthError
      setError(authError)
      return {
        success: false,
        error: authError,
      }
    } finally {
      setLoading(false)
    }
  }

  return {
    requestPasswordReset,
    updatePassword,
    loading,
    error,
  }
}

// ===== AUTH STATE HOOK =====

export function useAuthState(): AuthState {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
    })

    // Cleanup subscription
    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return {
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
  }
}
