"use client"

import { useState } from "react"

export type AuthStatus = "idle" | "loading" | "success" | "error"

export interface AuthState<T = any> {
  status: AuthStatus
  data: T | null
  error: string | null
  isLoading: boolean
  isSuccess: boolean
  isError: boolean
}

export function useAuthState<T = any>(
  initialData: T | null = null,
): [
  AuthState<T>,
  {
    setLoading: () => void
    setSuccess: (data: T) => void
    setError: (error: string) => void
    reset: () => void
  },
] {
  const [state, setState] = useState<AuthState<T>>({
    status: "idle",
    data: initialData,
    error: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
  })

  const setLoading = () => {
    setState({
      status: "loading",
      data: null,
      error: null,
      isLoading: true,
      isSuccess: false,
      isError: false,
    })
  }

  const setSuccess = (data: T) => {
    setState({
      status: "success",
      data,
      error: null,
      isLoading: false,
      isSuccess: true,
      isError: false,
    })
  }

  const setError = (error: string) => {
    setState({
      status: "error",
      data: null,
      error,
      isLoading: false,
      isSuccess: false,
      isError: true,
    })
  }

  const reset = () => {
    setState({
      status: "idle",
      data: initialData,
      error: null,
      isLoading: false,
      isSuccess: false,
      isError: false,
    })
  }

  return [state, { setLoading, setSuccess, setError, reset }]
}
