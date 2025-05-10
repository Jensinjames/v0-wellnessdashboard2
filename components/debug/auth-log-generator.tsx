"use client"

import { useState } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { generateSampleAuthLogs } from "@/utils/auth-event-logger"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

export function AuthLogGenerator() {
  const [userId, setUserId] = useState("")
  const [count, setCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const handleGenerate = async () => {
    if (!userId) {
      toast({
        title: "User ID Required",
        description: "Please enter a user ID to generate logs",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      const success = await generateSampleAuthLogs(userId, count)

      if (success) {
        toast({
          title: "Logs Generated",
          description: `Successfully generated ${count} sample auth logs`,
        })
      } else {
        toast({
          title: "Failed to Generate Logs",
          description: "There was an error generating the sample logs",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generate Sample Auth Logs</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="userId">User ID</Label>
          <Input id="userId" value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="Enter user ID" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="count">Number of Logs</Label>
          <Input
            id="count"
            type="number"
            min={1}
            max={20}
            value={count}
            onChange={(e) => setCount(Number.parseInt(e.target.value) || 5)}
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Sample Logs"
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
