-- =====================================================
-- REVERT: Restore Proper Admin-Only Access to Community Features
-- =====================================================
-- This migration reverts the temporary open access and restores
-- proper role-based admin controls.
--
-- RUN THIS when the proper admin/role system is implemented
-- =====================================================

-- =====================================================
-- STEP 1: Drop Temporary Policies
-- =====================================================

-- CAMPAIGNS
DROP POLICY IF EXISTS "TEMP: Authenticated users can view all campaigns" ON campaigns;
DROP POLICY IF EXISTS "TEMP: Authenticated users can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "TEMP: Authenticated users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "TEMP: Authenticated users can delete campaigns" ON campaigns;

-- UPDATES
DROP POLICY IF EXISTS "TEMP: Authenticated users can view all updates" ON updates;
DROP POLICY IF EXISTS "TEMP: Authenticated users can create updates" ON updates;
DROP POLICY IF EXISTS "TEMP: Authenticated users can update updates" ON updates;
DROP POLICY IF EXISTS "TEMP: Authenticated users can delete updates" ON updates;

-- NEWS
DROP POLICY IF EXISTS "TEMP: Authenticated users can view all news" ON news;
DROP POLICY IF EXISTS "TEMP: Authenticated users can create news" ON news;
DROP POLICY IF EXISTS "TEMP: Authenticated users can update news" ON news;
DROP POLICY IF EXISTS "TEMP: Authenticated users can delete news" ON news;

-- =====================================================
-- STEP 2: Add 'role' Column to Profiles (if not exists)
-- =====================================================

-- Create role enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('super_admin', 'community_admin', 'moderator', 'user');
    END IF;
END $$;

-- Add role column
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
    END IF;
END $$;

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- =====================================================
-- STEP 3: Migrate Existing is_admin to role
-- =====================================================

-- Convert is_admin = true to appropriate role
-- NOTE: Manually review and adjust roles as needed
UPDATE profiles
SET role = 'community_admin'
WHERE is_admin = true AND (role IS NULL OR role = 'user');

-- Manually set super admins (update these emails to your actual super admins)
-- UPDATE profiles SET role = 'super_admin' WHERE email IN ('your-super-admin@email.com');

-- =====================================================
-- STEP 4: Create Role-Based Policies
-- =====================================================

-- Helper function to check if user has admin role
CREATE OR REPLACE FUNCTION has_admin_role(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE firebase_uid = user_id 
        AND role IN ('super_admin', 'community_admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE firebase_uid = user_id 
        AND role = 'super_admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CAMPAIGNS - Role-Based Policies
-- =====================================================

-- Regular users can view active campaigns
CREATE POLICY "Users can view active campaigns" ON campaigns
    FOR SELECT USING (
        status = 'active' 
        OR has_admin_role(auth.uid()::text)
    );

-- Admins can view all campaigns
CREATE POLICY "Admins can view all campaigns" ON campaigns
    FOR SELECT USING (has_admin_role(auth.uid()::text));

-- Admins can create campaigns
CREATE POLICY "Admins can create campaigns" ON campaigns
    FOR INSERT WITH CHECK (has_admin_role(auth.uid()::text));

-- Admins can update campaigns
CREATE POLICY "Admins can update campaigns" ON campaigns
    FOR UPDATE USING (has_admin_role(auth.uid()::text));

-- Admins can delete campaigns
CREATE POLICY "Admins can delete campaigns" ON campaigns
    FOR DELETE USING (has_admin_role(auth.uid()::text));

-- =====================================================
-- UPDATES - Role-Based Policies
-- =====================================================

-- Regular users can view published updates
CREATE POLICY "Users can view published updates" ON updates
    FOR SELECT USING (
        status = 'published'
        OR has_admin_role(auth.uid()::text)
    );

-- Admins can view all updates
CREATE POLICY "Admins can view all updates" ON updates
    FOR SELECT USING (has_admin_role(auth.uid()::text));

-- Admins can create updates
CREATE POLICY "Admins can create updates" ON updates
    FOR INSERT WITH CHECK (has_admin_role(auth.uid()::text));

-- Admins can update updates
CREATE POLICY "Admins can update updates" ON updates
    FOR UPDATE USING (has_admin_role(auth.uid()::text));

-- Admins can delete updates
CREATE POLICY "Admins can delete updates" ON updates
    FOR DELETE USING (has_admin_role(auth.uid()::text));

-- =====================================================
-- NEWS - Role-Based Policies
-- =====================================================

-- Regular users can view published news
CREATE POLICY "Users can view published news" ON news
    FOR SELECT USING (
        status = 'published'
        OR has_admin_role(auth.uid()::text)
    );

-- Admins can view all news
CREATE POLICY "Admins can view all news" ON news
    FOR SELECT USING (has_admin_role(auth.uid()::text));

-- Admins can create news
CREATE POLICY "Admins can create news" ON news
    FOR INSERT WITH CHECK (has_admin_role(auth.uid()::text));

-- Admins can update news
CREATE POLICY "Admins can update news" ON news
    FOR UPDATE USING (has_admin_role(auth.uid()::text));

-- Admins can delete news
CREATE POLICY "Admins can delete news" ON news
    FOR DELETE USING (has_admin_role(auth.uid()::text));

-- =====================================================
-- STEP 5: Update Table Comments
-- =====================================================

COMMENT ON TABLE campaigns IS 'Community campaigns - Role-based access implemented';
COMMENT ON TABLE updates IS 'Platform updates - Role-based access implemented';
COMMENT ON TABLE news IS 'News articles - Role-based access implemented';

COMMENT ON FUNCTION has_admin_role IS 'Check if user has admin privileges (super_admin or community_admin)';
COMMENT ON FUNCTION is_super_admin IS 'Check if user is a super admin';

-- =====================================================
-- STEP 6: Verify Setup
-- =====================================================

-- Check role column exists
SELECT 'role column' AS check_name, 
       CASE WHEN EXISTS (
           SELECT 1 FROM information_schema.columns 
           WHERE table_name = 'profiles' AND column_name = 'role'
       ) THEN '✅ EXISTS' ELSE '❌ MISSING' END AS status;

-- Count admins by role
SELECT 
    'Admin Users' AS check_name,
    role,
    COUNT(*) as count
FROM profiles
WHERE role IN ('super_admin', 'community_admin', 'moderator')
GROUP BY role;

-- Count policies
SELECT 'RLS Policies' AS check_name,
       COUNT(*)::text || ' policies created' AS status
FROM pg_policies 
WHERE tablename IN ('campaigns', 'updates', 'news')
AND policyname NOT LIKE 'TEMP:%';

-- =====================================================
-- MIGRATION COMPLETE!
-- =====================================================
-- 
-- Next Steps:
-- 1. Verify all admins have correct roles
-- 2. Test access with different user roles
-- 3. Update AdminRoute.tsx (uncomment role check logic)
-- 4. Remove dev banner from CommunityDashboard.tsx
-- 5. Delete TEMP_COMMUNITY_ACCESS.md
-- 
-- =====================================================

