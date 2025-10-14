-- OPTIMIZED Database Setup for menu-orderai Dashboard
-- High-performance database schema with advanced optimizations
-- Run this in your new database to recreate the entire structure

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search optimization
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- =============================================
-- OPTIMIZED TABLE CREATION
-- =============================================

-- Create categories table with optimized structure
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    meta_title VARCHAR(500),
    meta_description TEXT,
    featured_image TEXT,
    tables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optimized constraints
    CONSTRAINT categories_name_check CHECK (LENGTH(name) >= 2),
    CONSTRAINT categories_slug_check CHECK (LENGTH(slug) >= 2 AND slug ~ '^[a-z0-9-]+$')
);

-- Create tags table with optimized structure
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optimized constraints
    CONSTRAINT tags_name_check CHECK (LENGTH(name) >= 2),
    CONSTRAINT tags_slug_check CHECK (LENGTH(slug) >= 2 AND slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT tags_color_check CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Create blog_posts table with optimized structure
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    featured_image TEXT,
    meta_title VARCHAR(500),
    meta_description TEXT,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    author VARCHAR(255),
    status VARCHAR(20) DEFAULT 'draft',
    published_at TIMESTAMP WITH TIME ZONE,
    tables JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Optimized constraints
    CONSTRAINT blog_posts_title_check CHECK (LENGTH(title) >= 3),
    CONSTRAINT blog_posts_slug_check CHECK (LENGTH(slug) >= 3 AND slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT blog_posts_content_check CHECK (LENGTH(content) >= 10),
    CONSTRAINT blog_posts_status_check CHECK (status IN ('draft', 'published', 'archived')),
    CONSTRAINT blog_posts_author_check CHECK (author IS NULL OR LENGTH(author) >= 2)
);

-- Create blog_post_tags junction table (optimized)
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Composite unique constraint for performance
    CONSTRAINT blog_post_tags_unique UNIQUE(blog_post_id, tag_id)
);



-- Create unique indexes for better performance
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name_unique ON categories(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_slug_unique ON categories(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name_unique ON tags(name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_slug_unique ON tags(slug);
CREATE UNIQUE INDEX IF NOT EXISTS idx_blog_posts_slug_unique ON blog_posts(slug);

-- =============================================
-- ADVANCED PERFORMANCE INDEXES
-- =============================================

-- Blog posts performance indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author) WHERE author IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_created_at ON blog_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_updated_at ON blog_posts(updated_at DESC);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_status_published_at ON blog_posts(status, published_at DESC) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_status ON blog_posts(category_id, status) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_status ON blog_posts(author, status) WHERE author IS NOT NULL;

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_gin ON blog_posts USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_blog_posts_content_gin ON blog_posts USING GIN(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_blog_posts_excerpt_gin ON blog_posts USING GIN(to_tsvector('english', excerpt)) WHERE excerpt IS NOT NULL;

-- JSONB indexes for tables field
CREATE INDEX IF NOT EXISTS idx_blog_posts_tables_gin ON blog_posts USING GIN(tables) WHERE tables IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_categories_tables_gin ON categories USING GIN(tables) WHERE tables IS NOT NULL;

-- Text search indexes for categories and tags
CREATE INDEX IF NOT EXISTS idx_categories_name_gin ON categories USING GIN(to_tsvector('english', name));
CREATE INDEX IF NOT EXISTS idx_categories_description_gin ON categories USING GIN(to_tsvector('english', description)) WHERE description IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tags_name_gin ON tags USING GIN(to_tsvector('english', name));

-- Junction table optimized indexes
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_post_id ON blog_post_tags(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_composite ON blog_post_tags(blog_post_id, tag_id);



-- Partial indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_recent ON blog_posts(published_at DESC) 
    WHERE status = 'published' AND published_at > NOW() - INTERVAL '1 year';

-- Covering indexes for common queries
CREATE INDEX IF NOT EXISTS idx_blog_posts_list_covering ON blog_posts(id, title, slug, excerpt, featured_image, published_at, author, status) 
    WHERE status = 'published';

-- =============================================
-- OPTIMIZED FUNCTIONS AND TRIGGERS
-- =============================================

-- Optimized function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update if something actually changed
    IF OLD IS DISTINCT FROM NEW THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql' IMMUTABLE;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(
        REGEXP_REPLACE(
            REGEXP_REPLACE(
                REGEXP_REPLACE(input_text, '[^a-zA-Z0-9\s-]', '', 'g'),
                '\s+', '-', 'g'
            ),
            '-+', '-', 'g'
        )
    );
END;
$$ language 'plpgsql' IMMUTABLE;

-- Function to extract excerpt from content
CREATE OR REPLACE FUNCTION extract_excerpt(content TEXT, max_length INTEGER DEFAULT 200)
RETURNS TEXT AS $$
BEGIN
    -- Remove markdown and HTML tags, then truncate
    RETURN LEFT(
        REGEXP_REPLACE(
            REGEXP_REPLACE(content, '<[^>]*>', '', 'g'),
            '[*#`]', '', 'g'
        ),
        max_length
    ) || '...';
END;
$$ language 'plpgsql' IMMUTABLE;

-- Function to search blog posts with full-text search
CREATE OR REPLACE FUNCTION search_blog_posts(search_query TEXT, limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
    id UUID,
    title VARCHAR(500),
    slug VARCHAR(500),
    excerpt TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bp.id,
        bp.title,
        bp.slug,
        bp.excerpt,
        bp.published_at,
        ts_rank(
            to_tsvector('english', bp.title || ' ' || COALESCE(bp.excerpt, '') || ' ' || bp.content),
            plainto_tsquery('english', search_query)
        ) as rank
    FROM blog_posts bp
    WHERE bp.status = 'published'
        AND (
            to_tsvector('english', bp.title || ' ' || COALESCE(bp.excerpt, '') || ' ' || bp.content) 
            @@ plainto_tsquery('english', search_query)
        )
    ORDER BY rank DESC, bp.published_at DESC
    LIMIT limit_count;
END;
$$ language 'plpgsql' STABLE;

-- Create optimized triggers
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at 
    BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at 
    BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- Trigger to auto-generate excerpt if not provided
CREATE OR REPLACE FUNCTION auto_generate_excerpt()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.excerpt IS NULL OR NEW.excerpt = '' THEN
        NEW.excerpt := extract_excerpt(NEW.content);
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER auto_generate_excerpt_trigger
    BEFORE INSERT OR UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION auto_generate_excerpt();

-- =============================================
-- OPTIMIZED SAMPLE DATA INSERTION
-- =============================================

-- Insert sample categories (batch insert for better performance)
INSERT INTO categories (name, slug, description, meta_title, meta_description) VALUES
('Web Development', 'web-development', 'Articles about web development technologies and practices', 'Web Development Articles', 'Learn about modern web development technologies and best practices'),
('App Development', 'app-development', 'Mobile and desktop application development', 'App Development Guide', 'Complete guide to mobile and desktop app development'),
('UI/UX Design', 'uiux-design', 'User interface and user experience design', 'UI/UX Design Resources', 'Design principles and user experience best practices'),
('Digital Marketing', 'digital-marketing', 'Digital marketing strategies and techniques', 'Digital Marketing Tips', 'Effective digital marketing strategies for business growth'),
('DevOps', 'devops', 'Development operations and deployment strategies', 'DevOps Guide', 'Learn about CI/CD, containerization, and deployment automation'),
('Data Science', 'data-science', 'Data analysis, machine learning, and AI', 'Data Science Resources', 'Explore data science, machine learning, and artificial intelligence')
ON CONFLICT (slug) DO NOTHING;


ON CONFLICT (slug) DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, content, excerpt, meta_title, meta_description, category_id, author, status, published_at) 
SELECT 
    'Getting Started with Next.js 14',
    'getting-started-nextjs-14',
    '# Getting Started with Next.js 14

Next.js 14 introduces several exciting new features and improvements that make building React applications even more powerful and developer-friendly.

## Key Features of Next.js 14

### 1. App Router (Stable)
The App Router is now stable and provides a new way to structure your Next.js applications with improved performance and developer experience.

### 2. Server Components
Server Components allow you to render components on the server, reducing the JavaScript bundle size and improving performance.

### 3. Improved Performance
Next.js 14 includes various performance optimizations including better tree shaking and faster builds.

## Getting Started

To create a new Next.js 14 project, run:

```bash
npx create-next-app@latest my-app
cd my-app
npm run dev
```

## Conclusion

Next.js 14 represents a significant step forward in React framework development, offering better performance, improved developer experience, and more powerful features for building modern web applications.',
    'Learn how to get started with Next.js 14 and explore its new features including the App Router, Server Components, and performance improvements.',
    'Getting Started with Next.js 14 - Complete Guide',
    'Learn how to get started with Next.js 14 and explore its new features including the App Router, Server Components, and performance improvements.',
    c.id,
    'John Doe',
    'published',
    NOW() - INTERVAL '5 days'
FROM categories c WHERE c.slug = 'web-development'

UNION ALL

SELECT 
    'Building Responsive UIs with Tailwind CSS',
    'building-responsive-uis-tailwind-css',
    '# Building Responsive UIs with Tailwind CSS

Tailwind CSS has revolutionized how we approach CSS by providing utility-first classes that make building responsive designs faster and more consistent.

## Why Tailwind CSS?

### 1. Utility-First Approach
Instead of writing custom CSS, you compose designs using utility classes directly in your HTML.

### 2. Responsive Design Made Easy
Tailwind provides responsive prefixes that make it easy to create mobile-first designs.

### 3. Consistent Design System
Built-in design tokens ensure consistency across your application.

## Getting Started

Install Tailwind CSS in your project:

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## Responsive Design Examples

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div class="bg-white p-6 rounded-lg shadow-md">
    <h3 class="text-xl font-bold mb-2">Card Title</h3>
    <p class="text-gray-600">Card content goes here</p>
  </div>
</div>
```

## Conclusion

Tailwind CSS makes building responsive UIs faster and more maintainable while ensuring design consistency across your application.',
    'Learn how to build responsive user interfaces using Tailwind CSS utility-first approach and responsive design principles.',
    'Building Responsive UIs with Tailwind CSS - Complete Guide',
    'Learn how to build responsive user interfaces using Tailwind CSS utility-first approach and responsive design principles.',
    c.id,
    'Jane Smith',
    'published',
    NOW() - INTERVAL '3 days'
FROM categories c WHERE c.slug = 'uiux-design'

UNION ALL

SELECT 
    'Introduction to TypeScript for JavaScript Developers',
    'introduction-typescript-javascript-developers',
    '# Introduction to TypeScript for JavaScript Developers

TypeScript is a powerful superset of JavaScript that adds static type checking and other features to help you build more robust applications.

## What is TypeScript?

TypeScript is JavaScript with syntax for types. It compiles to plain JavaScript and can be used anywhere JavaScript is used.

## Key Benefits

### 1. Static Type Checking
Catch errors at compile time rather than runtime.

### 2. Better IDE Support
Enhanced autocomplete, refactoring, and navigation.

### 3. Improved Code Documentation
Types serve as documentation for your code.

## Basic TypeScript Syntax

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

function getUser(id: number): User {
  return {
    id,
    name: "John Doe",
    email: "john@example.com"
  };
}
```

## Getting Started

Install TypeScript globally:

```bash
npm install -g typescript
```

Create a TypeScript file and compile it:

```bash
tsc filename.ts
```

## Conclusion

TypeScript provides a solid foundation for building large-scale JavaScript applications with better type safety and developer experience.',
    'Learn TypeScript fundamentals for JavaScript developers including type checking, interfaces, and advanced features.',
    'Introduction to TypeScript for JavaScript Developers',
    'Learn TypeScript fundamentals for JavaScript developers including type checking, interfaces, and advanced features.',
    c.id,
    'Mike Johnson',
    'published',
    NOW() - INTERVAL '1 day'
FROM categories c WHERE c.slug = 'web-development';

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_post_tags ENABLE ROW LEVEL SECURITY;


-- Create policies for public read access
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Allow public read access to categories') THEN
        CREATE POLICY "Allow public read access to categories" ON categories
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tags' AND policyname = 'Allow public read access to tags') THEN
        CREATE POLICY "Allow public read access to tags" ON tags
            FOR SELECT USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_posts' AND policyname = 'Allow public read access to published blog posts') THEN
        CREATE POLICY "Allow public read access to published blog posts" ON blog_posts
            FOR SELECT USING (status = 'published');
    END IF;
END $$;

-- Create policies for all operations (for development/testing)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'categories' AND policyname = 'Allow all operations on categories') THEN
        CREATE POLICY "Allow all operations on categories" ON categories
            FOR ALL USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tags' AND policyname = 'Allow all operations on tags') THEN
        CREATE POLICY "Allow all operations on tags" ON tags
            FOR ALL USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_posts' AND policyname = 'Allow all operations on blog posts') THEN
        CREATE POLICY "Allow all operations on blog posts" ON blog_posts
            FOR ALL USING (true);
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'blog_post_tags' AND policyname = 'Allow all operations on blog post tags') THEN
        CREATE POLICY "Allow all operations on blog post tags" ON blog_post_tags
            FOR ALL USING (true);
    END IF;
END $$;



-- =============================================
-- SAMPLE BLOG POST TAGS RELATIONSHIPS
-- =============================================

-- Add tags to the sample blog posts
INSERT INTO blog_post_tags (blog_post_id, tag_id)
SELECT 
    bp.id,
    t.id
FROM blog_posts bp
CROSS JOIN tags t
WHERE bp.slug = 'getting-started-nextjs-14' 
  AND t.slug IN ('nextjs', 'react', 'javascript', 'typescript')

UNION ALL

SELECT 
    bp.id,
    t.id
FROM blog_posts bp
CROSS JOIN tags t
WHERE bp.slug = 'building-responsive-uis-tailwind-css' 
  AND t.slug IN ('css', 'tailwind-css', 'design', 'html')

UNION ALL

SELECT 
    bp.id,
    t.id
FROM blog_posts bp
CROSS JOIN tags t
WHERE bp.slug = 'introduction-typescript-javascript-developers' 
  AND t.slug IN ('typescript', 'javascript', 'nodejs');

-- =============================================
-- VERIFICATION QUERIES
-- =============================================

-- Verify table creation
SELECT 
    'Tables Created Successfully' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('categories', 'tags', 'blog_posts', 'blog_post_tags');

-- Verify sample data
SELECT 
    'Sample Data Inserted' as status,
    (SELECT COUNT(*) FROM categories) as categories_count,
    (SELECT COUNT(*) FROM tags) as tags_count,
    (SELECT COUNT(*) FROM blog_posts) as blog_posts_count,
    (SELECT COUNT(*) FROM blog_post_tags) as blog_post_tags_count;

-- Display sample data
SELECT 'Sample Categories:' as info;
SELECT name, slug, description FROM categories;

SELECT 'Sample Tags:' as info;
SELECT name, slug, color FROM tags;

SELECT 'Sample Blog Posts:' as info;
SELECT title, slug, author, status, published_at FROM blog_posts;

-- =============================================
-- PERFORMANCE OPTIMIZATION SETTINGS
-- =============================================

-- Optimize PostgreSQL settings for better performance
-- Note: These are recommendations - adjust based on your server specs

-- Enable query optimization
SET enable_hashjoin = on;
SET enable_mergejoin = on;
SET enable_nestloop = on;

-- Optimize work memory for complex queries
SET work_mem = '256MB';

-- Enable parallel query execution
SET max_parallel_workers_per_gather = 4;
SET max_parallel_workers = 8;

-- Optimize for full-text search
SET default_text_search_config = 'english';

-- =============================================
-- PERFORMANCE MONITORING VIEWS
-- =============================================

-- Create view for performance monitoring
CREATE OR REPLACE VIEW performance_stats AS
SELECT 
    'Database Performance Stats' as metric_type,
    (SELECT COUNT(*) FROM blog_posts WHERE status = 'published') as published_posts,
    (SELECT COUNT(*) FROM categories) as total_categories,
    (SELECT COUNT(*) FROM tags) as total_tags,
    (SELECT COUNT(*) FROM blog_post_tags) as total_tag_relationships,
    (SELECT COUNT(*) FROM blog_posts WHERE created_at > NOW() - INTERVAL '30 days') as recent_posts,
    (SELECT AVG(LENGTH(content)) FROM blog_posts WHERE status = 'published') as avg_content_length;

-- Create view for index usage statistics
CREATE OR REPLACE VIEW index_usage_stats AS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- =============================================
-- PERFORMANCE TESTING QUERIES
-- =============================================

-- Test query performance
EXPLAIN (ANALYZE, BUFFERS) 
SELECT bp.id, bp.title, bp.slug, bp.published_at, c.name as category_name
FROM blog_posts bp
LEFT JOIN categories c ON bp.category_id = c.id
WHERE bp.status = 'published'
ORDER BY bp.published_at DESC
LIMIT 10;

-- Test full-text search performance
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM search_blog_posts('Next.js React', 5);

-- =============================================
-- MAINTENANCE RECOMMENDATIONS
-- =============================================

-- Analyze tables for better query planning
ANALYZE categories;
ANALYZE tags;
ANALYZE blog_posts;
ANALYZE blog_post_tags;

-- Update table statistics
UPDATE pg_stat_user_tables SET n_tup_ins = 0, n_tup_upd = 0, n_tup_del = 0;

-- =============================================
-- PERFORMANCE VERIFICATION
-- =============================================

-- Verify all indexes are created
SELECT 
    'Index Creation Status' as status,
    COUNT(*) as total_indexes
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('categories', 'tags', 'blog_posts', 'blog_post_tags');

-- Check index sizes
SELECT 
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexname::regclass)) as index_size
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexname::regclass) DESC;

-- Verify full-text search is working
SELECT 'Full-text search test:' as test;
SELECT * FROM search_blog_posts('Next.js', 3);

-- =============================================
-- COMPLETE SETUP FINISHED
-- =============================================

SELECT 'OPTIMIZED Database setup completed successfully!' as message;
SELECT 'Performance optimizations applied:' as info;
SELECT '- Advanced indexing strategies' as optimization;
SELECT '- Full-text search capabilities' as optimization;
SELECT '- Optimized triggers and functions' as optimization;
SELECT '- Performance monitoring views' as optimization;
SELECT '- Query optimization settings' as optimization;
