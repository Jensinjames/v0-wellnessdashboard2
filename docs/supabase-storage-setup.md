# Supabase Storage Setup Guide

## Bucket Structure for Rollen Wellness Dashboard

For our wellness application, we'll create the following buckets:

1. `avatars` - For user profile pictures
2. `journal-attachments` - For files attached to wellness journal entries
3. `wellness-exports` - For exported wellness data reports

## Step-by-Step Setup Instructions

### 1. Navigate to Storage in Supabase Dashboard

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click on "Storage" in the left sidebar

### 2. Create Buckets

For each bucket we need:

1. Click "Create Bucket"
2. Enter the bucket name (e.g., `avatars`)
3. Choose public or private access:
   - `avatars`: public (with RLS policies)
   - `journal-attachments`: private
   - `wellness-exports`: private
4. Click "Create"

### 3. Configure RLS Policies

For each bucket, we need to set up proper Row Level Security policies:

#### Avatars Bucket Policies

1. Go to the `avatars` bucket
2. Click on "Policies"
3. Add these policies:

**Select (Download/View) Policy:**
\`\`\`sql
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');
\`\`\`

**Insert (Upload) Policy:**
\`\`\`sql
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

**Update Policy:**
\`\`\`sql
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name)::uuid)
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

**Delete Policy:**
\`\`\`sql
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

#### Journal Attachments Bucket Policies

1. Go to the `journal-attachments` bucket
2. Click on "Policies"
3. Add these policies:

**Select (Download/View) Policy:**
\`\`\`sql
CREATE POLICY "Users can view their own journal attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

**Insert (Upload) Policy:**
\`\`\`sql
CREATE POLICY "Users can upload their own journal attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-attachments' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

**Update Policy:**
\`\`\`sql
CREATE POLICY "Users can update their own journal attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid() = (storage.foldername(name)::uuid)
)
WITH CHECK (
  bucket_id = 'journal-attachments' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

**Delete Policy:**
\`\`\`sql
CREATE POLICY "Users can delete their own journal attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

#### Wellness Exports Bucket Policies

1. Go to the `wellness-exports` bucket
2. Click on "Policies"
3. Add these policies:

**Select (Download/View) Policy:**
\`\`\`sql
CREATE POLICY "Users can view their own wellness exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wellness-exports' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

**Insert (Upload) Policy:**
\`\`\`sql
CREATE POLICY "Users can create their own wellness exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wellness-exports' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

**Delete Policy:**
\`\`\`sql
CREATE POLICY "Users can delete their own wellness exports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wellness-exports' AND
  auth.uid() = (storage.foldername(name)::uuid)
);
\`\`\`

### 4. Folder Structure Best Practices

Organize files within buckets using a consistent folder structure:

1. **Avatars**: `/{user_id}/avatar.{ext}`
2. **Journal Attachments**: `/{user_id}/{journal_entry_id}/{filename}`
3. **Wellness Exports**: `/{user_id}/{export_date}/{export_type}.{ext}`

This structure ensures:
- Files are organized by user
- Files are easily queryable
- RLS policies can effectively secure content

## Testing Storage Setup

After configuring buckets and policies, test the setup:

1. Try uploading a file using the Supabase dashboard
2. Test the same upload using the `supabase-storage-utils.ts` helper functions
3. Verify RLS policies by attempting to access files belonging to other users

## Storage Usage Examples

See the `lib/supabase-storage-utils.ts` file for implementation examples.
