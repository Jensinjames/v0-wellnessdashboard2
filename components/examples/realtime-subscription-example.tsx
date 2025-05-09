"use client"

import { useState } from "react"
import { useRealtimeSubscription } from "@/hooks/use-realtime-subscription"
import { useRealtimeItem } from "@/hooks/use-realtime-item"
import { SubscriptionStatus } from "@/lib/subscription-manager"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface Todo {
  id: string
  title: string
  completed: boolean
  user_id: string
  created_at: string
}

export function RealtimeSubscriptionExample() {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Subscribe to all todos
  const {
    data: todos,
    error: todosError,
    isLoading: todosLoading,
    status: todosStatus,
    refresh: refreshTodos,
  } = useRealtimeSubscription<Todo>("todos", {
    filter: "user_id=current_user", // Example filter
  })

  // Subscribe to a single todo
  const {
    item: selectedTodo,
    error: todoError,
    isLoading: todoLoading,
    status: todoStatus,
    refresh: refreshTodo,
  } = useRealtimeItem<Todo>("todos", selectedId)

  // Status badge color
  const getStatusColor = (status: SubscriptionStatus | "DISABLED") => {
    switch (status) {
      case SubscriptionStatus.CONNECTED:
        return "bg-green-500"
      case SubscriptionStatus.CONNECTING:
        return "bg-yellow-500"
      case SubscriptionStatus.ERROR:
        return "bg-red-500"
      case SubscriptionStatus.CLOSED:
        return "bg-gray-500"
      case SubscriptionStatus.INACTIVE:
      case "DISABLED":
        return "bg-gray-300"
      default:
        return "bg-gray-300"
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Todos List
            <Badge className={getStatusColor(todosStatus)}>{todosStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todosLoading ? (
            <p>Loading todos...</p>
          ) : todosError ? (
            <p className="text-red-500">Error: {todosError.message}</p>
          ) : todos && todos.length > 0 ? (
            <ul className="space-y-2">
              {todos.map((todo) => (
                <li
                  key={todo.id}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedId === todo.id ? "bg-blue-100 border-blue-300" : ""
                  }`}
                  onClick={() => setSelectedId(todo.id)}
                >
                  <div className="flex items-center justify-between">
                    <span>{todo.title}</span>
                    <Badge variant={todo.completed ? "default" : "outline"}>
                      {todo.completed ? "Completed" : "Pending"}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p>No todos found</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={refreshTodos}>Refresh</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Selected Todo
            <Badge className={getStatusColor(todoStatus)}>{todoStatus}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {todoLoading ? (
            <p>Loading todo...</p>
          ) : todoError ? (
            <p className="text-red-500">Error: {todoError.message}</p>
          ) : selectedTodo ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium">Title</h3>
                <p>{selectedTodo.title}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Status</h3>
                <p>{selectedTodo.completed ? "Completed" : "Pending"}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium">Created At</h3>
                <p>{new Date(selectedTodo.created_at).toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p>No todo selected</p>
          )}
        </CardContent>
        <CardFooter>
          <Button onClick={refreshTodo} disabled={!selectedId}>
            Refresh
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
