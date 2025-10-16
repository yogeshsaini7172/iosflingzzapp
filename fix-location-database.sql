-- SQL Commands to Fix Location Feature in Supabase
-- Run these commands in your Supabase SQL Editor

-- 1. First, check if the location column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('location', 'latitude', 'longitude', 'city');

-- 2. Add location columns if they don't exist
-- (These commands will only add columns if they don't already exist)

-- Add location JSON column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND table_schema = 'public' 
          AND column_name = 'location'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN location TEXT;
        RAISE NOTICE 'Added location column';
    ELSE
        RAISE NOTICE 'Location column already exists';
    END IF;
END $$;

-- Add latitude column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND table_schema = 'public' 
          AND column_name = 'latitude'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN latitude DECIMAL(10, 8);
        RAISE NOTICE 'Added latitude column';
    ELSE
        RAISE NOTICE 'Latitude column already exists';
    END IF;
END $$;

-- Add longitude column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND table_schema = 'public' 
          AND column_name = 'longitude'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN longitude DECIMAL(11, 8);
        RAISE NOTICE 'Added longitude column';
    ELSE
        RAISE NOTICE 'Longitude column already exists';
    END IF;
END $$;

-- Add city column if missing (might already exist)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
          AND table_schema = 'public' 
          AND column_name = 'city'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN city TEXT;
        RAISE NOTICE 'Added city column';
    ELSE
        RAISE NOTICE 'City column already exists';
    END IF;
END $$;

-- 3. Create indexes for better performance on location queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location_coords 
ON public.profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_city 
ON public.profiles(city) 
WHERE city IS NOT NULL;

-- 4. Verify all columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
  AND column_name IN ('location', 'latitude', 'longitude', 'city')
ORDER BY column_name;

-- 5. Test the location update (replace with a real firebase_uid)
-- UPDATE public.profiles 
-- SET 
--     location = '{"latitude": 40.7128, "longitude": -74.0060, "city": "New York", "country": "USA", "source": "manual"}',
--     latitude = 40.7128,
--     longitude = -74.0060,
--     city = 'New York'
-- WHERE firebase_uid = 'your-test-user-firebase-uid';

-- 6. Create a function to calculate distance between two points (for future use)
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 DECIMAL, lon1 DECIMAL, 
    lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
    RETURN (
        6371 * acos(
            cos(radians(lat1)) * 
            cos(radians(lat2)) * 
            cos(radians(lon2) - radians(lon1)) + 
            sin(radians(lat1)) * 
            sin(radians(lat2))
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Test the distance function (should return ~0 for same coordinates)
-- SELECT calculate_distance(40.7128, -74.0060, 40.7128, -74.0060) as distance_km;

RAISE NOTICE 'Location feature database setup complete!';