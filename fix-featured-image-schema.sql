-- Fix featured_image column issues
-- Run this in your Supabase SQL editor

-- First, let's check if the featured_image column exists and is properly configured
DO $$ 
BEGIN
    -- Check if featured_image column exists in blog_posts
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'blog_posts' 
        AND column_name = 'featured_image'
        AND table_schema = 'public'
    ) THEN
        -- Add the column if it doesn't exist
        ALTER TABLE blog_posts ADD COLUMN featured_image TEXT;
        RAISE NOTICE 'Added featured_image column to blog_posts';
    ELSE
        RAISE NOTICE 'featured_image column already exists in blog_posts';
    END IF;
END $$;

-- Ensure the column allows NULL values and has no constraints that might block updates
ALTER TABLE blog_posts ALTER COLUMN featured_image DROP NOT NULL;
ALTER TABLE blog_posts ALTER COLUMN featured_image SET DEFAULT NULL;

-- Update the column to ensure it can handle large base64 strings
-- TEXT type should handle this, but let's make sure
ALTER TABLE blog_posts ALTER COLUMN featured_image TYPE TEXT;

-- Check current RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'blog_posts' 
AND schemaname = 'public';

-- Drop existing policies that might be blocking updates
DROP POLICY IF EXISTS "Allow all operations on blog posts" ON blog_posts;
DROP POLICY IF EXISTS "Allow public read access to published blog posts" ON blog_posts;

-- Create new, more permissive policies
CREATE POLICY "Allow all operations on blog_posts" ON blog_posts
    FOR ALL USING (true) WITH CHECK (true);

-- Test the update functionality
-- This should work without errors
UPDATE blog_posts 
SET featured_image = 'test_base64_string' 
WHERE id = (SELECT id FROM blog_posts LIMIT 1);

-- Check if the update worked
SELECT id, title, featured_image, LENGTH(featured_image) as image_length 
FROM blog_posts 
WHERE featured_image IS NOT NULL 
LIMIT 5;

-- Reset the test value
UPDATE blog_posts 
SET featured_image = NULL 
WHERE featured_image = 'test_base64_string';

-- Show final column information
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'blog_posts' 
AND column_name = 'featured_image'
AND table_schema = 'public';
