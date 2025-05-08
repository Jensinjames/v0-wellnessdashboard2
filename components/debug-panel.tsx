"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Database,
  Server,
  Shield,
  Settings,
  BarChart,
  Terminal,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Table,
  FileCode,
} from "lucide-react"
import { checkSchema } from "@/utils/schema-check"
import { createLogger } from "@/utils/logger"

const logger = createLogger("DebugPanel")

export function DebugPanel() {
  const [expanded, setExpanded] = useState(false)
  const [schemaStatus, setSchemaStatus] = useState<{
    valid: boolean
    issues: string[]
  } | null>(null)
  const [checking, setChecking] = useState(false)

  // Function to check schema status
  const checkSchemaStatus = async () => {
    setChecking(true)

    try {
      const result = await checkSchema()
      setSchemaStatus({
        valid: result.valid,
        issues: result.issues,
      })
    } catch (error) {
      logger.error("Error checking schema:", error)
      setSchemaStatus({
        valid: false,
        issues: [error instanceof Error ? error.message : "Unknown error checking schema"],
      })
    } finally {
      setChecking(false)
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <CardTitle className="flex items-center justify-between">
          Developer Debug Panel
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </CardTitle>
        <CardDescription>Tools and utilities for debugging and development</CardDescription>
      </CardHeader>

      {expanded && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DebugLink
              href="/debug/schema"
              icon={<Database className="h-5 w-5" />}
              title="Schema Debug"
              description="Check and fix database schema issues"
            />

            <DebugLink
              href="/debug/sql"
              icon={<Table className="h-5 w-5" />}
              title="SQL Executor"
              description="Execute SQL statements directly"
            />

            <DebugLink
              href="/debug/auth"
              icon={<Shield className="h-5 w-5" />}
              title="Auth Debug"
              description="Debug authentication issues"
            />

            <DebugLink
              href="/debug/supabase-client"
              icon={<Server className="h-5 w-5" />}
              title="Supabase Client"
              description="Monitor Supabase client instances"
            />

            <DebugLink
              href="/debug/performance"
              icon={<BarChart className="h-5 w-5" />}
              title="Performance"
              description="Monitor application performance"
            />

            <DebugLink
              href="/debug/logs"
              icon={<Terminal className="h-5 w-5" />}
              title="Logs"
              description="View application logs"
            />

            <DebugLink
              href="/debug/environment"
              icon={<Settings className="h-5 w-5" />}
              title="Environment"
              description="Check environment variables"
            />

            <DebugLink
              href="/debug/edge-function"
              icon={<FileCode className="h-5 w-5" />}
              title="Edge Functions"
              description="Test and monitor edge functions"
            />
          </div>

          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium">Database Schema Status</h3>
              <Button variant="outline" size="sm" onClick={checkSchemaStatus} disabled={checking}>
                <RefreshCw className={`h-4 w-4 mr-1 ${checking ? "animate-spin" : ""}`} />
                Check
              </Button>
            </div>

            {schemaStatus ? (
              <div className={`p-3 rounded-md ${schemaStatus.valid ? "bg-green-50" : "bg-red-50"}`}>
                {schemaStatus.valid ? (
                  <p className="text-green-700 text-sm flex items-center">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Schema is valid
                  </p>
                ) : (
                  <div>
                    <p className="text-red-700 text-sm flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1" />
                      Schema has issues
                    </p>
                    {schemaStatus.issues.length > 0 && (
                      <ul className="list-disc pl-5 mt-1 text-xs text-red-600">
                        {schemaStatus.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    )}
                    <Link href="/debug/schema">
                      <Button variant="link" size="sm" className="p-0 h-auto text-xs text-red-700 mt-1">
                        Fix Schema Issues
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Click "Check" to verify database schema status</p>
            )}
          </div>
        </CardContent>
      )}

      <CardFooter className={expanded ? "" : "hidden"}>
        <p className="text-xs text-gray-500">These tools are intended for development and debugging purposes only.</p>
      </CardFooter>
    </Card>
  )
}

function DebugLink({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link href={href} className="block">
      <div className="border rounded-md p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center mb-2">
          <div className="mr-2 text-primary">{icon}</div>
          <h3 className="font-medium">{title}</h3>
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  )
}

function CheckCircle({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
