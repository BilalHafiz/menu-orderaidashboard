-- Quick test to verify featured_image functionality
-- Run this in Supabase SQL editor to test

-- Test 1: Try to update an existing post with a featured image
UPDATE blog_posts 
SET featured_image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
WHERE id = '37b22db7-9418-4db1-ae77-fb87d4f1a774'
RETURNING id, title, featured_image, LENGTH(featured_image) as image_length;

-- Test 2: Check if the update worked
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
WHERE id = '37b22db7-9418-4db1-ae77-fb87d4f1a774';

-- Test 3: Reset the test value
UPDATE blog_posts 
SET featured_image = NULL 
WHERE id = '37b22db7-9418-4db1-ae77-fb87d4f1a774';
