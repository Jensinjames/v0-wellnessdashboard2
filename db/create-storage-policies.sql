-- Create storage policies for Rollen Wellness Dashboard
-- This SQL creates all the necessary policies for our buckets

-- Make sure the buckets exist 
-- (though ideally you should create these via the UI first)
SELECT storage.create_bucket('avatars', 'public');
SELECT storage.create_bucket('journal-attachments', 'private');
SELECT storage.create_bucket('wellness-exports', 'private');

-- Avatars Bucket Policies
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
CREATE POLICY "Avatars are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))
);

DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))
)
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))
);

-- Journal Attachments Bucket Policies
DROP POLICY IF EXISTS "Users can view their own journal attachments" ON storage.objects;
CREATE POLICY "Users can view their own journal attachments"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))
);

DROP POLICY IF EXISTS "Users can upload their own journal attachments" ON storage.objects;
CREATE POLICY "Users can upload their own journal attachments"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))
);

DROP POLICY IF EXISTS "Users can update their own journal attachments" ON storage.objects;
CREATE POLICY "Users can update their own journal attachments"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))
)
WITH CHECK (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))
);

DROP POLICY IF EXISTS "Users can delete their own journal attachments" ON storage.objects;
CREATE POLICY "Users can delete their own journal attachments"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'journal-attachments' AND
  auth.uid()::text = (storage.foldername(name))
);

-- Wellness Exports Bucket Policies
DROP POLICY IF EXISTS "Users can view their own wellness exports" ON storage.objects;
CREATE POLICY "Users can view their own wellness exports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'wellness-exports' AND
  auth.uid()::text = (storage.foldername(name))
);

DROP POLICY IF EXISTS "Users can create their own wellness exports" ON storage.objects;
CREATE POLICY "Users can create their own wellness exports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'wellness-exports' AND
  auth.uid()::text = (storage.foldername(name))
);

DROP POLICY IF EXISTS "Users can delete their own wellness exports" ON storage.objects;
CREATE POLICY "Users can delete their own wellness exports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'wellness-exports' AND
  auth.uid()::text = (storage.foldername(name))
);

-- Return policy count to verify
SELECT COUNT(*) as total_storage_policies FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
