-- Ensure public bucket exists for profile images
insert into storage.buckets (id, name, public)
values ('profile-images', 'profile-images', true)
on conflict (id) do update set public = true;

-- Allow public read of profile images (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public can read profile-images'
  ) THEN
    CREATE POLICY "Public can read profile-images"
    ON storage.objects
    FOR SELECT
    USING (bucket_id = 'profile-images');
  END IF;
END $$;

-- Allow anonymous uploads to profile-images (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Anon can upload profile-images'
  ) THEN
    CREATE POLICY "Anon can upload profile-images"
    ON storage.objects
    FOR INSERT TO anon
    WITH CHECK (bucket_id = 'profile-images');
  END IF;
END $$;

-- Allow authenticated uploads to profile-images (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Auth can upload profile-images'
  ) THEN
    CREATE POLICY "Auth can upload profile-images"
    ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'profile-images');
  END IF;
END $$;
