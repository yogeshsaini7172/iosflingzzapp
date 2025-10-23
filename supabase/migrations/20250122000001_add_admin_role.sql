-- Add admin role support to profiles table

-- Add is_admin column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Update RLS policies to allow admins full access to community content

-- Admins can view ALL campaigns
CREATE POLICY "Admins can view all campaigns" ON campaigns
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

-- Admins can insert any campaign
CREATE POLICY "Admins can insert campaigns" ON campaigns
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

-- Admins can update any campaign
CREATE POLICY "Admins can update any campaign" ON campaigns
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

-- Admins can delete any campaign
CREATE POLICY "Admins can delete any campaign" ON campaigns
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

-- Repeat for updates table
CREATE POLICY "Admins can view all updates" ON updates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can insert updates" ON updates
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update any update" ON updates
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can delete any update" ON updates
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

-- Repeat for news table
CREATE POLICY "Admins can view all news" ON news
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can insert news" ON news
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can update any news" ON news
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

CREATE POLICY "Admins can delete any news" ON news
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.firebase_uid = auth.uid()::text 
            AND profiles.is_admin = true
        )
    );

-- Create a helper function to check if a user is admin
CREATE OR REPLACE FUNCTION is_admin_user(user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE firebase_uid = user_id 
        AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN profiles.is_admin IS 'Indicates if user has admin privileges for community management';
COMMENT ON FUNCTION is_admin_user IS 'Helper function to check if a user has admin privileges';

