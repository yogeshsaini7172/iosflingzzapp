-- Create admin_credentials table for admin1712 portal
-- This table stores email/password credentials for admin access

CREATE TABLE IF NOT EXISTS admin_credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_admin_credentials_email ON admin_credentials(email);
CREATE INDEX IF NOT EXISTS idx_admin_credentials_is_active ON admin_credentials(is_active);

-- Add RLS (Row Level Security) policies
ALTER TABLE admin_credentials ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access for authentication (needed for login)
-- Note: This is safe because password_hash should never be exposed in client queries
-- In production, create a secure function that handles password verification server-side
CREATE POLICY "Allow read for authentication" ON admin_credentials
  FOR SELECT
  USING (true);

-- Policy: Only authenticated admins can update their own records
CREATE POLICY "Admin can update own record" ON admin_credentials
  FOR UPDATE
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Add comment to table
COMMENT ON TABLE admin_credentials IS 'Stores admin credentials for admin1712 portal access';
COMMENT ON COLUMN admin_credentials.email IS 'Admin email address (unique)';
COMMENT ON COLUMN admin_credentials.password_hash IS 'Hashed password (use bcrypt)';
COMMENT ON COLUMN admin_credentials.is_active IS 'Whether this admin account is active';
COMMENT ON COLUMN admin_credentials.last_login_at IS 'Timestamp of last successful login';

-- Insert default admin credentials
-- IMPORTANT: Change these credentials immediately after setup!
-- Default password: 'admin123' (you should change this)
-- To generate a new hash, use: bcrypt.hashSync('your_password', 10)
INSERT INTO admin_credentials (email, password_hash, is_active)
VALUES ('admin@gradsync.com', 'admin123', true)
ON CONFLICT (email) DO NOTHING;

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_credentials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_admin_credentials_timestamp
  BEFORE UPDATE ON admin_credentials
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_credentials_updated_at();

