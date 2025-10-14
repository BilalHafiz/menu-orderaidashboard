-- Database Updates and Fixes
-- Run this script in your Supabase SQL editor to fix schema issues

-- =============================================
-- FIX MISSING COLUMNS
-- =============================================

-- Fix missing author column in blog_posts
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'author'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN author VARCHAR(255);
        RAISE NOTICE 'Author column added to blog_posts table';
    ELSE
        RAISE NOTICE 'Author column already exists in blog_posts table';
    END IF;
END $$;

-- Fix missing excerpt column in blog_posts if needed
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'blog_posts' 
        AND column_name = 'excerpt'
    ) THEN
        ALTER TABLE blog_posts ADD COLUMN excerpt TEXT;
        RAISE NOTICE 'Excerpt column added to blog_posts table';
    ELSE
        RAISE NOTICE 'Excerpt column already exists in blog_posts table';
    END IF;
END $$;

-- =============================================
-- VERIFY TABLE STRUCTURE
-- =============================================

-- Check blog_posts table structure
SELECT 
    'blog_posts table structure:' as info,
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'blog_posts' 
ORDER BY ordinal_position;

-- =============================================
-- TEST DATABASE CONNECTIVITY
-- =============================================

-- Test basic operations
SELECT 'Database connectivity test:' as test;

-- Test blog_posts table access
SELECT COUNT(*) as total_blog_posts FROM blog_posts;

-- Test categories table access  
SELECT COUNT(*) as total_categories FROM categories;

-- Test tags table access
SELECT COUNT(*) as total_tags FROM tags;

-- =============================================
-- VERIFY SAMPLE DATA
-- =============================================

-- Check if we have sample data
SELECT 'Sample data verification:' as info;

SELECT 
    'Categories:' as table_name,
    COUNT(*) as count
FROM categories
UNION ALL
SELECT 
    'Tags:' as table_name,
    COUNT(*) as count
FROM tags
UNION ALL
SELECT 
    'Blog Posts:' as table_name,
    COUNT(*) as count
FROM blog_posts;

-- =============================================
-- PERFORMANCE CHECK
-- =============================================

-- Check if indexes exist
SELECT 
    'Index verification:' as info,
    indexname,
    tablename
FROM pg_indexes 
WHERE schemaname = 'public' 
AND tablename IN ('blog_posts', 'categories', 'tags', 'blog_post_tags')
ORDER BY tablename, indexname;

-- =============================================
-- FINAL STATUS
-- =============================================

SELECT 'Database update completed successfully!' as status;
SELECT 'All required columns should now be present in the blog_posts table.' as message;