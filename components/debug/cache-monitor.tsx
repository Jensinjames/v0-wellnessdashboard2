"use client"

import { useState, useEffect } from "react"
import { getEnhancedQueryCache } from "@/lib/enhanced-query-cache"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function CacheMonitor() {
  const cache = getEnhancedQueryCache()
  const [stats, setStats] = useState(cache.getStats())
  const [entries, setEntries] = useState<Array<[string, any]>>(cache.getEntries())
  const [tags, setTags] = useState<string[]>(cache.getTags())
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  // Update stats and entries periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(cache.getStats())
      setEntries(cache.getEntries())
      setTags(cache.getTags())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Filter entries by tag
  const filteredEntries = selectedTag ? entries.filter(([_, entry]) => entry.tags.includes(selectedTag)) : entries

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cache Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Size</h3>
              <p className="text-2xl font-bold">{stats.size}</p>
              <p className="text-xs text-muted-foreground">entries</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Hit Rate</h3>
              <p className="text-2xl font-bold">{(stats.hitRate * 100).toFixed(1)}%</p>
              <p className="text-xs text-muted-foreground">
                {stats.hits} hits / {stats.misses} misses
              </p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Memory</h3>
              <p className="text-2xl font-bold">{(stats.bytesUsed / 1024).toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">KB estimated</p>
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium">Evictions</h3>
              <p className="text-2xl font-bold">{stats.evictions}</p>
              <p className="text-xs text-muted-foreground">{stats.expired} expired</p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => {
              setStats(cache.getStats())
              setEntries(cache.getEntries())
              setTags(cache.getTags())
            }}
          >
            Refresh
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              cache.clear()
              setStats(cache.getStats())
              setEntries(cache.getEntries())
              setTags(cache.getTags())
            }}
          >
            Clear Cache
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache Entries</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="entries">
            <TabsList className="mb-4">
              <TabsTrigger value="entries">Entries ({entries.length})</TabsTrigger>
              <TabsTrigger value="tags">Tags ({tags.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="entries">
              <div className="mb-4 flex flex-wrap gap-2">
                {selectedTag && (
                  <div className="flex items-center">
                    <Badge className="mr-2">{selectedTag}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedTag(null)}>
                      Clear Filter
                    </Button>
                  </div>
                )}
              </div>

              <ScrollArea className="h-[400px]">
                {filteredEntries.length === 0 ? (
                  <p className="text-muted-foreground">No cache entries found</p>
                ) : (
                  <div className="space-y-4">
                    {filteredEntries.map(([key, entry]) => {
                      const now = Date.now()
                      const isExpired = entry.expiresAt < now
                      const isStale = now - entry.timestamp > 60000 && !isExpired
                      const timeLeft = Math.max(0, Math.floor((entry.expiresAt - now) / 1000))

                      return (
                        <div key={key} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium truncate max-w-[70%]" title={key}>
                              {key}
                            </h3>
                            <div className="flex gap-2">
                              {isExpired ? (
                                <Badge variant="destructive">Expired</Badge>
                              ) : isStale ? (
                                <Badge variant="outline">Stale</Badge>
                              ) : (
                                <Badge variant="default">Fresh</Badge>
                              )}
                              <Badge variant="outline">{timeLeft}s left</Badge>
                            </div>
                          </div>

                          <div className="text-sm text-muted-foreground mb-2">
                            <div className="flex justify-between">
                              <span>Created: {new Date(entry.timestamp).toLocaleTimeString()}</span>
                              <span>Access count: {entry.accessCount}</span>
                            </div>
                          </div>

                          {entry.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {entry.tags.map((tag: string) => (
                                <Badge
                                  key={tag}
                                  variant="secondary"
                                  className="cursor-pointer"
                                  onClick={() => setSelectedTag(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}

                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                cache.delete(key)
                                setEntries(cache.getEntries())
                                setStats(cache.getStats())
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="tags">
              <ScrollArea className="h-[400px]">
                {tags.length === 0 ? (
                  <p className="text-muted-foreground">No cache tags found</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tags.map((tag) => {
                      const tagEntries = entries.filter(([_, entry]) => entry.tags.includes(tag))

                      return (
                        <div key={tag} className="border rounded-md p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{tag}</h3>
                            <Badge>{tagEntries.length} entries</Badge>
                          </div>

                          <div className="flex justify-between mt-4">
                            <Button variant="outline" size="sm" onClick={() => setSelectedTag(tag)}>
                              View Entries
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                cache.invalidateByTag(tag)
                                setEntries(cache.getEntries())
                                setTags(cache.getTags())
                                setStats(cache.getStats())
                              }}
                            >
                              Invalidate
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
