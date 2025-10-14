# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up or log in to your account
3. Click "New Project"
4. Choose your organization
5. Enter project details:
   - Name: `your-project-name`
   - Database Password: (choose a strong password)
   - Region: (choose closest to your users)
6. Click "Create new project"

## 2. Get Your Project Credentials

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## 3. Set Up Environment Variables

Create a `.env.local` file in your project root with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

**Important:** Never commit `.env.local` to version control!

## 4. Set Up Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Copy the contents of `supabase-schema.sql` from this project
3. Paste it into the SQL editor
4. Click "Run" to execute the schema

This will create:
- `categories` table
- `tags` table  
- `blog_posts` table
- `blog_post_tags` junction table
- Sample data
- Row Level Security policies

## 5. Test the Connection

1. Add the test component to any page:
   ```tsx
   import SupabaseTest from '@/components/SupabaseTest';
   
   // In your component
   <SupabaseTest />
   ```

2. Run your development server:
   ```bash
   npm run dev
   ```

3. Check if the connection test shows "Connected" status

## 6. Using Supabase in Your App

### Basic Usage

```tsx
import { supabase } from '@/lib/supabase';

// Fetch data
const { data, error } = await supabase
  .from('categories')
  .select('*');

// Insert data
const { data, error } = await supabase
  .from('categories')
  .insert({ name: 'New Category', slug: 'new-category' });
```

### Using Database Utilities

```tsx
import { getCategories, createCategory } from '@/lib/database';

// Get all categories
const categories = await getCategories();

// Create a new category
const newCategory = await createCategory({
  name: 'New Category',
  slug: 'new-category',
  description: 'Category description'
});
```

## 7. Authentication (Optional)

If you want to add user authentication:

1. Go to **Authentication** → **Settings** in your Supabase dashboard
2. Configure your authentication providers
3. Use Supabase Auth in your app:

```tsx
import { supabase } from '@/lib/supabase';

// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
});
```

## 8. Storage (Optional)

For file uploads (like blog post images):

1. Go to **Storage** in your Supabase dashboard
2. Create a bucket (e.g., `blog-images`)
3. Set up policies for public access or authenticated access
4. Use in your app:

```tsx
// Upload file
const { data, error } = await supabase.storage
  .from('blog-images')
  .upload('filename.jpg', file);

// Get public URL
const { data } = supabase.storage
  .from('blog-images')
  .getPublicUrl('filename.jpg');
```

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check your environment variables are correct
2. **"Table doesn't exist"**: Make sure you ran the SQL schema
3. **"Permission denied"**: Check your Row Level Security policies
4. **CORS errors**: Make sure your domain is added to allowed origins in Supabase settings

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [GitHub Issues](https://github.com/supabase/supabase/issues)
