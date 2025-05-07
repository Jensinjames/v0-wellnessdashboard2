import { SupabaseQueryExample } from "@/components/examples/supabase-query-example"

export default function SupabaseQueryPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Supabase Query Examples</h1>
      <p className="text-muted-foreground mb-8">
        This page demonstrates how to use the useSupabase hook with your actual database tables.
      </p>

      <SupabaseQueryExample />

      <div className="mt-10 p-6 border rounded-lg bg-muted/20">
        <h2 className="text-xl font-semibold mb-4">Code Examples</h2>

        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Profiles Query</h3>
            <pre className="p-4 rounded bg-muted overflow-auto text-xs">
              {`const fetchProfile = async (userId) => {
  const result = await query(
    (client) => 
      client
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single(),
    { requiresAuth: true }
  )
  
  return result.data
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Goals with Categories Query</h3>
            <pre className="p-4 rounded bg-muted overflow-auto text-xs">
              {`const fetchGoals = async (userId) => {
  const result = await query(
    (client) => 
      client
        .from("goals")
        .select(\`
          id, 
          title, 
          description,
          target_hours,
          created_at,
          category_id,
          categories(id, name, color)
        \`)
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    { requiresAuth: true }
  )
  
  return result.data
}`}
            </pre>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Time Entries with Related Data Query</h3>
            <pre className="p-4 rounded bg-muted overflow-auto text-xs">
              {`const fetchTimeEntries = async (userId) => {
  const result = await query(
    (client) => 
      client
        .from("time_entries")
        .select(\`
          id, 
          start_time, 
          end_time,
          duration,
          notes,
          goal_id,
          goals(id, title, category_id, categories(id, name, color))
        \`)
        .eq("user_id", userId)
        .order("start_time", { ascending: false })
        .limit(10),
    { requiresAuth: true }
  )
  
  return result.data
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  )
}
