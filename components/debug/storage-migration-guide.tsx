import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Code } from "@/components/ui/code"

export function StorageMigrationGuide() {
  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle>Storage Migration Guide</CardTitle>
        <CardDescription>Migrating from Vercel Blob to Supabase Storage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <AlertTitle>Migration Complete</AlertTitle>
          <AlertDescription>
            Vercel Blob integration has been removed. Use Supabase Storage for all file storage needs.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Environment Variables</h3>
          <p>
            The <Code>BLOB_READ_WRITE_TOKEN</Code> environment variable is no longer needed and can be removed from your
            project settings.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">New Storage Utilities</h3>
          <p>
            A new utility file has been created at <Code>lib/supabase-storage-utils.ts</Code> with the following
            functions:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <Code>uploadFileToSupabase</Code> - Upload files to Supabase Storage
            </li>
            <li>
              <Code>deleteFileFromSupabase</Code> - Delete files from Supabase Storage
            </li>
            <li>
              <Code>listFilesInSupabase</Code> - List files in a Supabase Storage bucket
            </li>
          </ul>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Supabase Storage Setup</h3>
          <p>Before using these utilities, you need to:</p>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Create storage buckets in the Supabase dashboard</li>
            <li>Configure appropriate RLS (Row Level Security) policies</li>
            <li>Update your application code to use the new utilities</li>
          </ol>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Example Usage</h3>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto">
            <code>{`// Example: Upload a profile picture
import { uploadFileToSupabase } from '@/lib/supabase-storage-utils';

async function handleProfilePictureUpload(file: File, userId: string) {
  try {
    const path = \`profiles/\${userId}/avatar\`;
    const url = await uploadFileToSupabase(file, 'user-content', path);
    // Update user profile with the new avatar URL
    return url;
  } catch (error) {
    console.error('Failed to upload profile picture:', error);
  }
}`}</code>
          </pre>
        </div>
      </CardContent>
    </Card>
  )
}
