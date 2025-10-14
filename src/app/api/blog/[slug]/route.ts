import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

interface RouteParams {
  params: { slug: string };
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { slug } = params;
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

    const post = data;
    const category = post.categories
      ? Array.isArray(post.categories)
        ? {
            id: (post.categories as any[])[0]?.id ?? null,
            name: (post.categories as any[])[0]?.name ?? null,
          }
        : {
            id: (post.categories as any)?.id ?? null,
            name: (post.categories as any)?.name ?? null,
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
            .map((rel: any) => {
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
