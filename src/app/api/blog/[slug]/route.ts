import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

interface Category {
  id: string;
  name: string;
}

interface Tag {
  id: string;
  name: string;
  slug: string;
  color: string;
}

interface BlogPostTag {
  tags: Tag | Tag[];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  author: string | null;
  categories: Category | Category[] | null;
  blog_post_tags: BlogPostTag[];
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = await params;
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        `
        id,
        title,
        slug,
        content,
        excerpt,
        featured_image,
        meta_title,
        meta_description,
        status,
        published_at,
        created_at,
        updated_at,
        category_id,
        author,
        categories(name, id),
        blog_post_tags(
          tags!inner(id, name, color, slug)
        )
      `
      )
      .eq("slug", slug)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to load blog post" },
        { status: error.code === "PGRST116" ? 404 : 500 }
      );
    }

    const post = data as BlogPost;
    const category = post.categories
      ? Array.isArray(post.categories)
        ? {
            id: (post.categories as Category[])[0]?.id ?? null,
            name: (post.categories as Category[])[0]?.name ?? null,
          }
        : {
            id: (post.categories as Category)?.id ?? null,
            name: (post.categories as Category)?.name ?? null,
          }
      : null;
    const transformed = {
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      publishedAt: post.published_at,
      author: post.author ? { id: null, name: post.author } : null,
      category,
      featuredImage: post.featured_image
        ? { url: post.featured_image as string }
        : null,
      tags: Array.isArray(post.blog_post_tags)
        ? post.blog_post_tags
            .map((rel: BlogPostTag) => {
              const t = Array.isArray(rel.tags) ? rel.tags[0] : rel.tags;
              return t
                ? { id: t.id, name: t.name, slug: t.slug, color: t.color }
                : null;
            })
            .filter(Boolean)
        : [],
    };

    return NextResponse.json({ post: transformed });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
