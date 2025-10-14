import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    console.log("Starting blog API request...");

    // First, test basic connection
    const { data, error } = await supabase
      .from("blog_posts")
      .select("id, title, slug, status, created_at")
      .order("created_at", { ascending: false })
      .limit(10);

    console.log("Supabase response:", { data, error });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to load blog posts" },
        { status: 500 }
      );
    }

    // Simple transformation for now
    interface Post {
      id: string;
      slug: string;
      title: string;
      status: string;
    }

    const transformed = (data || []).map((post: Post) => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      status: post.status,
      createdAt: post.createdAt,
    }));

    console.log("Transformed data:", transformed);

    return NextResponse.json({ posts: transformed });
  } catch (err: unknown) {
    console.error("API error:", err);
    const message =
      err instanceof Error ? err.message : "Unexpected server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
