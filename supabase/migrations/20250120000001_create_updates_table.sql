-- Create updates table
CREATE TABLE IF NOT EXISTS updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'update' CHECK (category IN ('feature', 'update', 'announcement', 'maintenance')),
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    target_audience TEXT[] DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE,
    image_url TEXT,
    external_link TEXT,
    priority INTEGER DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_updates_status ON updates(status);
CREATE INDEX IF NOT EXISTS idx_updates_category ON updates(category);
CREATE INDEX IF NOT EXISTS idx_updates_created_at ON updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_updates_published_at ON updates(published_at DESC);

-- Enable RLS
ALTER TABLE updates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Updates are viewable by everyone" ON updates
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert updates" ON updates
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own updates" ON updates
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own updates" ON updates
    FOR DELETE USING (auth.uid() = created_by);

-- Create trigger for updated_at
CREATE TRIGGER update_updates_updated_at
    BEFORE UPDATE ON updates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
