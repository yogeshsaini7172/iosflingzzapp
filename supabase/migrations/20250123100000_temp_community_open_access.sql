-- =====================================================
-- TEMPORARY: Open Community Access to All Authenticated Users
-- =====================================================
-- This is a TEMPORARY migration to allow all authenticated users
-- to access community features while the proper role-based admin
-- system is being developed.
--
-- TODO: REVERT THIS when proper admin/role system is implemented
-- See: TEMP_COMMUNITY_ACCESS.md for revert instructions
-- =====================================================

-- Step 1: Backup current policies (commented for reference)
-- We're keeping the admin-only policies but adding permissive ones

-- =====================================================
-- CAMPAIGNS - Temporary Open Access
-- =====================================================

-- Drop restrictive user policies temporarily
DROP POLICY IF EXISTS "Users can view active campaigns" ON campaigns;

-- Create permissive policies for all authenticated users
-- TODO: Replace with role-based policies when admin system is ready
CREATE POLICY "TEMP: Authenticated users can view all campaigns" ON campaigns
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can create campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can update campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can delete campaigns" ON campaigns
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- UPDATES - Temporary Open Access
-- =====================================================

DROP POLICY IF EXISTS "Users can view published updates" ON updates;

CREATE POLICY "TEMP: Authenticated users can view all updates" ON updates
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can create updates" ON updates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can update updates" ON updates
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can delete updates" ON updates
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- NEWS - Temporary Open Access
-- =====================================================

DROP POLICY IF EXISTS "Users can view published news" ON news;

CREATE POLICY "TEMP: Authenticated users can view all news" ON news
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can create news" ON news
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can update news" ON news
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "TEMP: Authenticated users can delete news" ON news
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- NOTES FOR FUTURE IMPLEMENTATION
-- =====================================================

-- When implementing proper admin system, replace above policies with:
-- 
-- For Super Admins:
--   - Full CRUD access to all tables
--   - Can invite/remove other admins
--   - Can view audit logs
--
-- For Community Admins:
--   - Full CRUD access to campaigns, updates, news
--   - Can respond to consulting requests
--   - Cannot manage other admins
--
-- For Regular Users:
--   - View published content only
--   - Submit consulting requests
--   - No edit/delete access
--
-- Example future policy structure:
-- CREATE POLICY "Super admins full access" ON campaigns
--     FOR ALL USING (
--         EXISTS (
--             SELECT 1 FROM profiles 
--             WHERE profiles.firebase_uid = auth.uid()::text 
--             AND profiles.role = 'super_admin'
--         )
--     );

COMMENT ON TABLE campaigns IS 'Community campaigns - TEMP: Open to all authenticated users. TODO: Implement role-based access';
COMMENT ON TABLE updates IS 'Platform updates - TEMP: Open to all authenticated users. TODO: Implement role-based access';
COMMENT ON TABLE news IS 'News articles - TEMP: Open to all authenticated users. TODO: Implement role-based access';

