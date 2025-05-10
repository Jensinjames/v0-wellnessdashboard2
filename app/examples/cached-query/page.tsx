import CachedQueryExample from "@/components/examples/cached-query-example"

export const metadata = {
  title: "Cached Query Example",
  description: "Example of using query caching with Supabase",
}

export default function CachedQueryPage() {
  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-6">Cached Query Example</h1>
      <p className="text-muted-foreground mb-8">
        This example demonstrates how to use query caching with Supabase to improve performance and reduce database
        load.
      </p>

      <CachedQueryExample />
    </div>
  )
}
