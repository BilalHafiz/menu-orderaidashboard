-- Add published_at column to blog_posts table if it doesn't exist
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Add updated_at column if it doesn't exist
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have updated_at timestamp
UPDATE blog_posts 
SET updated_at = NOW() 
WHERE updated_at IS NULL;
