-- Add author column to blog_posts table
-- Run this script in your Supabase SQL editor

-- Add author column if it doesn't exist
ALTER TABLE blog_posts 
ADD COLUMN IF NOT EXISTS author VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name = 'author';

-- Test the column by updating a sample blog post (optional)
-- UPDATE blog_posts 
-- SET author = 'Sample Author' 
-- WHERE id = (SELECT id FROM blog_posts LIMIT 1);

SELECT 'Author column added successfully!' as status;
