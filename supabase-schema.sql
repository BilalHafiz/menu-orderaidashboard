-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    meta_title VARCHAR(500),
    meta_description TEXT,
    featured_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create tags table
CREATE TABLE IF NOT EXISTS tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7),
    featured_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);



-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    content TEXT NOT NULL,
    excerpt TEXT,
    featured_image TEXT,
    meta_title VARCHAR(500),
    meta_description TEXT,
    author VARCHAR(255),
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure author column exists (in case table was created without it)
ALTER TABLE IF EXISTS blog_posts
    ADD COLUMN IF NOT EXISTS author VARCHAR(255);

-- Ensure new columns exist even if tables were created previously
ALTER TABLE IF EXISTS categories
    ADD COLUMN IF NOT EXISTS meta_title VARCHAR(500),
    ADD COLUMN IF NOT EXISTS meta_description TEXT,
    ADD COLUMN IF NOT EXISTS featured_image TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE IF EXISTS tags
    ADD COLUMN IF NOT EXISTS featured_image TEXT,
    ADD COLUMN IF NOT EXISTS color TEXT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create blog_post_tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    blog_post_id UUID NOT NULL REFERENCES blog_posts(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(blog_post_id, tag_id)
);



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
ON CONFLICT (slug) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category_id ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);
CREATE INDEX IF NOT EXISTS idx_tags_slug ON tags(slug);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_blog_post_id ON blog_post_tags(blog_post_id);
CREATE INDEX IF NOT EXISTS idx_blog_post_tags_tag_id ON blog_post_tags(tag_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (with IF NOT EXISTS)
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

-- Create policies for all operations (no authentication required for testing)
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
