"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getLogEntries, clearLogs, LogLevel, setLogLevel, type LogEntry, LOG_LEVEL_NAMES } from "@/utils/logger"

export function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [filter, setFilter] = useState("")
  const [moduleFilter, setModuleFilter] = useState<string>("")
  const [levelFilter, setLevelFilter] = useState<string>("0")
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState("all")

  // Get unique modules from logs
  const modules = useMemo(() => {
    const moduleSet = new Set<string>()
    logs.forEach((log) => moduleSet.add(log.module))
    return Array.from(moduleSet).sort()
  }, [logs])

  // Filter logs based on current filters
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Filter by level
      if (Number(levelFilter) > 0 && log.level > Number(levelFilter)) {
        return false
      }

      // Filter by module
      if (moduleFilter && log.module !== moduleFilter) {
        return false
      }

      // Filter by text
      if (filter) {
        const searchText = filter.toLowerCase()
        return (
          log.message.toLowerCase().includes(searchText) ||
          log.module.toLowerCase().includes(searchText) ||
          (log.data && JSON.stringify(log.data).toLowerCase().includes(searchText))
        )
      }

      // Filter by tab
      if (activeTab === "errors" && log.level !== LogLevel.ERROR) {
        return false
      }

      if (activeTab === "warnings" && log.level !== LogLevel.WARN) {
        return false
      }

      return true
    })
  }, [logs, filter, moduleFilter, levelFilter, activeTab])

  // Refresh logs
  const refreshLogs = () => {
    setLogs(getLogEntries())
  }

  // Handle clear logs
  const handleClearLogs = () => {
    clearLogs()
    refreshLogs()
  }

  // Set up auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshLogs()
    }, 2000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Initial load
  useEffect(() => {
    refreshLogs()
  }, [])

  // Get badge color based on log level
  const getLevelBadgeVariant = (level: LogLevel) => {
    switch (level) {
      case LogLevel.ERROR:
        return "destructive"
      case LogLevel.WARN:
        return "warning"
      case LogLevel.INFO:
        return "info"
      case LogLevel.DEBUG:
        return "secondary"
      case LogLevel.TRACE:
        return "outline"
      default:
        return "secondary"
    }
  }

  // Format timestamp
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString() + "." + date.getMilliseconds().toString().padStart(3, "0")
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Application Logs</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refreshLogs}>
              Refresh
            </Button>
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              {autoRefresh ? "Auto-refresh: On" : "Auto-refresh: Off"}
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearLogs}>
              Clear Logs
            </Button>
          </div>
        </CardTitle>
        <CardDescription>View and filter application logs for debugging</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="flex-1"
            />
            <Select value={moduleFilter} onValueChange={setModuleFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All modules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All modules</SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={levelFilter} onValueChange={setLevelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Log level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">All levels</SelectItem>
                <SelectItem value="1">Error</SelectItem>
                <SelectItem value="2">Warning</SelectItem>
                <SelectItem value="3">Info</SelectItem>
                <SelectItem value="4">Debug</SelectItem>
                <SelectItem value="5">Trace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="all">All Logs ({logs.length})</TabsTrigger>
              <TabsTrigger value="errors">Errors ({logs.filter((l) => l.level === LogLevel.ERROR).length})</TabsTrigger>
              <TabsTrigger value="warnings">
                Warnings ({logs.filter((l) => l.level === LogLevel.WARN).length})
              </TabsTrigger>
              <TabsTrigger value="info">Info ({logs.filter((l) => l.level <= LogLevel.INFO).length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-0">
              <LogList
                logs={filteredLogs}
                getLevelBadgeVariant={getLevelBadgeVariant}
                formatTimestamp={formatTimestamp}
              />
            </TabsContent>

            <TabsContent value="errors" className="mt-0">
              <LogList
                logs={logs.filter((l) => l.level === LogLevel.ERROR)}
                getLevelBadgeVariant={getLevelBadgeVariant}
                formatTimestamp={formatTimestamp}
              />
            </TabsContent>

            <TabsContent value="warnings" className="mt-0">
              <LogList
                logs={logs.filter((l) => l.level === LogLevel.WARN)}
                getLevelBadgeVariant={getLevelBadgeVariant}
                formatTimestamp={formatTimestamp}
              />
            </TabsContent>

            <TabsContent value="info" className="mt-0">
              <LogList
                logs={logs.filter((l) => l.level <= LogLevel.INFO)}
                getLevelBadgeVariant={getLevelBadgeVariant}
                formatTimestamp={formatTimestamp}
              />
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} logs
        </div>
        <Select
          value={localStorage.getItem("log_level") || "4"}
          onValueChange={(value) => setLogLevel(Number(value) as LogLevel)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Default log level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Error</SelectItem>
            <SelectItem value="2">Warning</SelectItem>
            <SelectItem value="3">Info</SelectItem>
            <SelectItem value="4">Debug</SelectItem>
            <SelectItem value="5">Trace</SelectItem>
          </SelectContent>
        </Select>
      </CardFooter>
    </Card>
  )
}

interface LogListProps {
  logs: LogEntry[]
  getLevelBadgeVariant: (level: LogLevel) => string
  formatTimestamp: (timestamp: number) => string
}

function LogList({ logs, getLevelBadgeVariant, formatTimestamp }: LogListProps) {
  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No logs to display</div>
  }

  return (
    <ScrollArea className="h-[500px] rounded-md border">
      <div className="p-4 space-y-4">
        {logs.map((log, index) => (
          <div key={index} className="border-b pb-2 last:border-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant={getLevelBadgeVariant(log.level) as any}>{LOG_LEVEL_NAMES[log.level]}</Badge>
              <span className="text-sm font-mono text-muted-foreground">{formatTimestamp(log.timestamp)}</span>
              <Badge variant="outline" className="font-mono">
                {log.module}
              </Badge>
            </div>
            <div className="ml-2">
              <p className="text-sm">{log.message}</p>

              {log.data && (
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                  {typeof log.data === "object" ? JSON.stringify(log.data, null, 2) : String(log.data)}
                </pre>
              )}

              {log.error && (
                <div className="mt-1 text-xs text-destructive">
                  <p className="font-semibold">
                    Error: {log.error instanceof Error ? log.error.message : String(log.error)}
                  </p>
                  {log.error instanceof Error && log.error.stack && (
                    <pre className="bg-muted p-2 rounded mt-1 overflow-x-auto text-[10px] text-destructive">
                      {log.error.stack}
                    </pre>
                  )}
                </div>
              )}

              {log.context && Object.keys(log.context).length > 0 && (
                <div className="mt-1">
                  <p className="text-xs font-semibold">Context:</p>
                  <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                    {JSON.stringify(log.context, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
