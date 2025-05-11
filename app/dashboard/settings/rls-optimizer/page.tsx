"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, RefreshCw, Shield, Zap } from 'lucide-react'
import { createLogger } from "@/utils/logger"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSupabaseClient } from "@/lib/supabase-client"

const logger = createLogger("RLSOptimizerPage")

interface RLSPolicy {
  schemaname: string
  tablename: string
  policyname: string
  cmd: string
  roles: string[]
  qual: string
  with_check: string | null
  needs_optimization: boolean
}

interface RLSAnalysisResult {
  success: boolean
  policies: RLSPolicy[]
  totalPolicies: number
  policiesToOptimize: number
  error?: string
}

export default function RLSOptimizerPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<RLSAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [optimizeResult, setOptimizeResult] = useState<{ success: boolean; message: string } | null>(null)

  const analyzeRLS = async () => {
    try {
      setIsLoading(true)
      setError(null)
      setOptimizeResult(null)

      const supabase = getSupabaseClient()

      // Get all RLS policies
      const { data, error } = await supabase.from("pg_policies").select("*").eq("schemaname", "public")

      if (error) {
        logger.error("Error fetching RLS policies:", error)
        setError(error.message)
        setIsLoading(false)
        return
      }

      // Analyze each policy
      const policies: RLSPolicy[] = data.map((policy) => {
        const needsOptimization =
          (policy.qual?.includes("auth.uid()") && !policy.qual?.includes("(SELECT auth.uid())")) ||
          (policy.with_check?.includes("auth.uid()") && !policy.with_check?.includes("(SELECT auth.uid())")) ||
          (policy.qual?.includes("current_setting(") && !policy.qual?.includes("(SELECT current_setting(")) ||
          (policy.with_check?.includes("current_setting(") && !policy.with_check?.includes("(SELECT current_setting("))

        return {
          ...policy,
          needs_optimization: needsOptimization,
        }
      })

      const policiesToOptimize = policies.filter((policy) => policy.needs_optimization).length

      setAnalysisResult({
        success: true,
        policies,
        totalPolicies: policies.length,
        policiesToOptimize,
      })
    } catch (err) {
      logger.error("Error analyzing RLS policies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const optimizeRLS = async () => {
    try {
      setIsOptimizing(true)
      setError(null)
      setOptimizeResult(null)

      const response = await fetch("/api/database/optimize-rls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const data = await response.json()
        setOptimizeResult({
          success: false,
          message: data.error || "Failed to optimize RLS policies",
        })
        setIsOptimizing(false)
        return
      }

      setOptimizeResult({
        success: true,
        message: "Successfully optimized RLS policies",
      })

      // Re-analyze after optimizing
      await analyzeRLS()
    } catch (err) {
      logger.error("Error optimizing RLS policies:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsOptimizing(false)
    }
  }

  useEffect(() => {
    analyzeRLS()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          RLS Policy Optimizer
        </CardTitle>
        <CardDescription>Analyze and optimize Row Level Security (RLS) policies for better performance</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Analyzing RLS policies...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : analysisResult ? (
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="mr-2">
                {analysisResult.policiesToOptimize === 0 ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-amber-500" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-medium">
                  {analysisResult.policiesToOptimize === 0
                    ? "All RLS policies are optimized"
                    : `${analysisResult.policiesToOptimize} RLS ${
                        analysisResult.policiesToOptimize === 1 ? "policy needs" : "policies need"
                      } optimization`}
                </h3>
              </div>
            </div>

            {optimizeResult && (
              <Alert variant={optimizeResult.success ? "default" : "destructive"}>
                <AlertTitle>{optimizeResult.success ? "Success" : "Error"}</AlertTitle>
                <AlertDescription>{optimizeResult.message}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="summary">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="policies">Policies</TabsTrigger>
              </TabsList>
              <TabsContent value="summary">
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">Total Policies</div>
                      <div className="text-2xl font-bold">{analysisResult.totalPolicies}</div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">Policies to Optimize</div>
                      <div className="text-2xl font-bold">{analysisResult.policiesToOptimize}</div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">Optimized Policies</div>
                      <div className="text-2xl font-bold">
                        {analysisResult.totalPolicies - analysisResult.policiesToOptimize}
                      </div>
                    </div>
                    <div className="rounded-md bg-muted p-2">
                      <div className="text-sm font-medium">Optimization Status</div>
                      <div className="flex items-center">
                        {analysisResult.policiesToOptimize === 0 ? (
                          <CheckCircle className="mr-1 h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="mr-1 h-4 w-4 text-amber-500" />
                        )}
                        <span>
                          {analysisResult.policiesToOptimize === 0 ? "Fully Optimized" : "Optimization Needed"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="policies">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Table</TableHead>
                        <TableHead>Policy</TableHead>
                        <TableHead>Command</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysisResult.policies.map((policy: RLSPolicy) => (
                        <TableRow key={`${policy.tablename}-${policy.policyname}`}>
                          <TableCell className="font-medium">{policy.tablename}</TableCell>
                          <TableCell>{policy.policyname}</TableCell>
                          <TableCell>{policy.cmd}</TableCell>
                          <TableCell>
                            {policy.needs_optimization ? (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
                                Needs Optimization
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Optimized
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>

            {analysisResult.policiesToOptimize > 0 && (
              <Alert>
                <AlertTitle>Performance Optimization Available</AlertTitle>
                <AlertDescription>
                  Some RLS policies are using direct function calls like <code>auth.uid()</code> instead of subqueries
                  like <code>(SELECT auth.uid())</code>. This can cause performance issues as the function is
                  re-evaluated for each row. Click the "Optimize Policies" button to fix this.
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={analyzeRLS} disabled={isLoading || isOptimizing}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </>
          )}
        </Button>
        <Button
          onClick={optimizeRLS}
          disabled={isLoading || isOptimizing || (analysisResult && analysisResult.policiesToOptimize === 0)}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            <>
              <Zap className="mr-2 h-4 w-4" />
              Optimize Policies
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
