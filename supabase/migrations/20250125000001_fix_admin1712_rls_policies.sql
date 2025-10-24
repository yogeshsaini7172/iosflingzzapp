-- Fix RLS policies for admin1712 portal
-- Allow authenticated users to manage campaigns, updates, and news

-- =====================================================
-- CAMPAIGNS - Allow authenticated users full access
-- =====================================================

-- Drop all existing campaign policies to avoid conflicts
DROP POLICY IF EXISTS "Campaigns are viewable by everyone" ON campaigns;
DROP POLICY IF EXISTS "Only authenticated users can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view active campaigns" ON campaigns;
DROP POLICY IF EXISTS "Creators can view their own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can view all campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Admins can update any campaign" ON campaigns;
DROP POLICY IF EXISTS "Admins can delete any campaign" ON campaigns;
DROP POLICY IF EXISTS "TEMP: Authenticated users can view all campaigns" ON campaigns;
DROP POLICY IF EXISTS "TEMP: Authenticated users can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "TEMP: Authenticated users can update campaigns" ON campaigns;
DROP POLICY IF EXISTS "TEMP: Authenticated users can delete campaigns" ON campaigns;

-- Create simple policies for authenticated users
CREATE POLICY "Authenticated users can view all campaigns" ON campaigns
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create campaigns" ON campaigns
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update campaigns" ON campaigns
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete campaigns" ON campaigns
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- UPDATES - Allow authenticated users full access
-- =====================================================

-- Drop all existing update policies
DROP POLICY IF EXISTS "Updates are viewable by everyone" ON updates;
DROP POLICY IF EXISTS "Only authenticated users can insert updates" ON updates;
DROP POLICY IF EXISTS "Users can update their own updates" ON updates;
DROP POLICY IF EXISTS "Users can delete their own updates" ON updates;
DROP POLICY IF EXISTS "Users can view published updates" ON updates;
DROP POLICY IF EXISTS "Creators can view their own updates" ON updates;
DROP POLICY IF EXISTS "Admins can view all updates" ON updates;
DROP POLICY IF EXISTS "Admins can insert updates" ON updates;
DROP POLICY IF EXISTS "Admins can update any update" ON updates;
DROP POLICY IF EXISTS "Admins can delete any update" ON updates;
DROP POLICY IF EXISTS "TEMP: Authenticated users can view all updates" ON updates;
DROP POLICY IF EXISTS "TEMP: Authenticated users can create updates" ON updates;
DROP POLICY IF EXISTS "TEMP: Authenticated users can update updates" ON updates;
DROP POLICY IF EXISTS "TEMP: Authenticated users can delete updates" ON updates;

-- Create simple policies for authenticated users
CREATE POLICY "Authenticated users can view all updates" ON updates
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create updates" ON updates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update updates" ON updates
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete updates" ON updates
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- NEWS - Allow authenticated users full access
-- =====================================================

-- Drop all existing news policies
DROP POLICY IF EXISTS "News are viewable by everyone" ON news;
DROP POLICY IF EXISTS "Only authenticated users can insert news" ON news;
DROP POLICY IF EXISTS "Users can update their own news" ON news;
DROP POLICY IF EXISTS "Users can delete their own news" ON news;
DROP POLICY IF EXISTS "Users can view published news" ON news;
DROP POLICY IF EXISTS "Creators can view their own news" ON news;
DROP POLICY IF EXISTS "Admins can view all news" ON news;
DROP POLICY IF EXISTS "Admins can insert news" ON news;
DROP POLICY IF EXISTS "Admins can update any news" ON news;
DROP POLICY IF EXISTS "Admins can delete any news" ON news;
DROP POLICY IF EXISTS "TEMP: Authenticated users can view all news" ON news;
DROP POLICY IF EXISTS "TEMP: Authenticated users can create news" ON news;
DROP POLICY IF EXISTS "TEMP: Authenticated users can update news" ON news;
DROP POLICY IF EXISTS "TEMP: Authenticated users can delete news" ON news;

-- Create simple policies for authenticated users
CREATE POLICY "Authenticated users can view all news" ON news
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create news" ON news
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update news" ON news
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete news" ON news
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- CONSULTING REQUESTS - Ensure proper access
-- =====================================================

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own consulting requests" ON consulting_requests;
DROP POLICY IF EXISTS "Users can create consulting requests" ON consulting_requests;
DROP POLICY IF EXISTS "Admins can view all consulting requests" ON consulting_requests;

-- Create policies for consulting requests
CREATE POLICY "Authenticated users can view all consulting requests" ON consulting_requests
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create consulting requests" ON consulting_requests
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update consulting requests" ON consulting_requests
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete consulting requests" ON consulting_requests
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- NOTES
-- =====================================================

-- These policies allow any authenticated user to manage community content.
-- This is suitable for the admin1712 portal where authenticated users are trusted admins.
-- 
-- For production with role-based access:
-- 1. Add proper role checking in profiles table
-- 2. Replace these policies with role-specific ones
-- 3. Implement fine-grained permissions

