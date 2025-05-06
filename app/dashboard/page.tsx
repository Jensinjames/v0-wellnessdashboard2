"use client"

import { useAuth } from "@/context/auth-context"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function Dashboard() {
  const { user, isLoading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/signin")
    }
  }, [user, isLoading, router])

  const handleSignOut = async () => {
    await signOut()
    router.push("/auth/signin")
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return null // Will redirect in the useEffect
  }

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Welcome to your Dashboard</CardTitle>
          <CardDescription>You are signed in as {user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Your user ID: {user.id}</p>
          <p>Email: {user.email}</p>
        </CardContent>
        <CardFooter>
          <Button onClick={handleSignOut}>Sign Out</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
