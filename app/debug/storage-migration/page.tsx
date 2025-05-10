import { StorageMigrationGuide } from "@/components/debug/storage-migration-guide"

export const metadata = {
  title: "Storage Migration Guide | Rollen Wellness",
  description: "Guide for migrating from Vercel Blob to Supabase Storage",
}

export default function StorageMigrationPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Storage Migration Guide</h1>
      <StorageMigrationGuide />
    </div>
  )
}
