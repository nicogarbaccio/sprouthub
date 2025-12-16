-- Enable RLS on storage.objects (it is already enabled, but good practice to be explicit or ensure)
-- alter table storage.objects enable row level security;

-- Policy for public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'plant-images' );

-- Policy for authenticated uploads
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'plant-images' );

