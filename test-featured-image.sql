-- Simple test to verify featured_image functionality
-- Run this in Supabase SQL editor

-- Test 1: Check if we can insert a base64 string
INSERT INTO blog_posts (
    title, 
    slug, 
    content, 
    featured_image
) VALUES (
    'Test Post with Image',
    'test-post-with-image-' || EXTRACT(EPOCH FROM NOW()),
    'This is a test post to verify featured_image functionality.',
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
) RETURNING id, title, featured_image, LENGTH(featured_image) as image_length;

-- Test 2: Check if we can update an existing post
UPDATE blog_posts 
SET featured_image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
WHERE title = 'Test Post with Image'
RETURNING id, title, featured_image, LENGTH(featured_image) as image_length;

-- Test 3: Check current posts with featured_image
SELECT 
    id, 
    title, 
    CASE 
        WHEN featured_image IS NULL THEN 'NULL'
        WHEN featured_image = '' THEN 'EMPTY STRING'
        WHEN featured_image LIKE 'data:%' THEN 'BASE64 (' || LENGTH(featured_image) || ' chars)'
        ELSE 'URL (' || LENGTH(featured_image) || ' chars)'
    END as image_status,
    LENGTH(featured_image) as image_length
FROM blog_posts 
ORDER BY updated_at DESC 
LIMIT 10;

-- Clean up test data
DELETE FROM blog_posts WHERE title = 'Test Post with Image';
