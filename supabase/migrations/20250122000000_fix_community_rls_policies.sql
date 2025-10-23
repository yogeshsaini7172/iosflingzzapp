-- Fix RLS policies for community tables to only show published content to regular users
-- This migration updates the SELECT policies to filter by status

-- Drop old policies
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
DROP POLICY IF EXISTS "Updates are viewable by everyone" ON updates;
DROP POLICY IF EXISTS "News are viewable by everyone" ON news;

-- Create new policies for campaigns
-- Regular users can only see active campaigns
CREATE POLICY "Users can view active campaigns" ON campaigns
    FOR SELECT USING (status = 'active');

-- Admins can see all campaigns (you'll need to add admin role check later)
-- For now, creators can see their own campaigns regardless of status
CREATE POLICY "Creators can view their own campaigns" ON campaigns
    FOR SELECT USING (auth.uid() = created_by);

-- Create new policies for updates
-- Regular users can only see published updates
CREATE POLICY "Users can view published updates" ON updates
    FOR SELECT USING (status = 'published');

-- Creators can see their own updates regardless of status
CREATE POLICY "Creators can view their own updates" ON updates
    FOR SELECT USING (auth.uid() = created_by);

-- Create new policies for news
-- Regular users can only see published news
CREATE POLICY "Users can view published news" ON news
    FOR SELECT USING (status = 'published');

-- Creators can see their own news regardless of status
CREATE POLICY "Creators can view their own news" ON news
    FOR SELECT USING (auth.uid() = created_by);

-- Note: For full admin access, you should:
-- 1. Add an 'admin_users' table or 'is_admin' column in profiles
-- 2. Create admin-specific policies like:
--    CREATE POLICY "Admins can view all campaigns" ON campaigns
--        FOR SELECT USING (
--            EXISTS (
--                SELECT 1 FROM profiles 
--                WHERE profiles.firebase_uid = auth.uid()::text 
--                AND profiles.is_admin = true
--            )
--        );

