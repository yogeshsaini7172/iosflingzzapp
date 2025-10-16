-- Add missing location columns to profiles table
-- Run these commands one by one in Supabase SQL Editor

-- 1. Add latitude column
ALTER TABLE public.profiles ADD COLUMN latitude DECIMAL(10, 8);

-- 2. Add longitude column  
ALTER TABLE public.profiles ADD COLUMN longitude DECIMAL(11, 8);

-- 3. Add city column
ALTER TABLE public.profiles ADD COLUMN city TEXT;

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_location_coords 
ON public.profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_city 
ON public.profiles(city) 
WHERE city IS NOT NULL;

-- 5. Verify all columns are now present
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('location', 'latitude', 'longitude', 'city')
ORDER BY column_name;