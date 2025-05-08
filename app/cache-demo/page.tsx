import { SSRCacheExample } from "@/components/examples/ssr-cache-example"
import { ClientCacheExample } from "@/components/examples/client-cache-example"

export default function CacheDemoPage() {
  return (
    <div className="container py-8 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">Isomorphic Cache Demo</h1>

      <SSRCacheExample />
      <ClientCacheExample />
    </div>
  )
}
