import { supabase } from "./supabase";

// Categories
export const getCategories = async () => {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) {
    console.error("getCategories error:", error);
    throw new Error(
      error.message || error.details || "Failed to load categories"
    );
  }
  return data;
};

interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

export const createCategory = async (category: {
  name: string;
  slug: string;
  description?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image?: string | null;
}) => {
  try {
    console.log("Creating category:", category);

    const { data, error } = await supabase
      .from("categories")
      .insert(category)
      .select()
      .single();

    if (error) {
      console.error("Category creation error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
      });
      throw new Error(
        `Failed to create category: ${
          error.message || error.details || "Unknown database error"
        }`
      );
    }

    console.log("Category created successfully:", data);
    return data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("createCategory error details:", {
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      fullError: err,
    });
    throw new Error(`Category creation failed: ${errorMessage}`);
  }
};

export const updateCategory = async (
  id: string,
  updates: {
    name?: string;
    slug?: string;
    description?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    featured_image?: string | null;
  }
) => {
  try {
    console.log("Updating category:", id, updates);

    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Category update error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error,
      });
      throw new Error(
        `Failed to update category: ${
          error.message || error.details || "Unknown database error"
        }`
      );
    }

    console.log("Category updated successfully:", data);
    return data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("updateCategory error details:", {
      message: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      fullError: err,
    });
    throw new Error(`Category update failed: ${errorMessage}`);
  }
};

export const deleteCategory = async (id: string) => {
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) throw error;
};

// Tags
export const getTags = async () => {
  const { data, error } = await supabase.from("tags").select("*").order("name");

  if (error) {
    console.error("getTags error:", error);
    throw new Error(error.message || error.details || "Failed to load tags");
  }
  return data;
};

export const createTag = async (tag: {
  name: string;
  slug: string;
  color?: string | null;
}) => {
  const { data, error } = await supabase
    .from("tags")
    .insert(tag)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateTag = async (
  id: string,
  updates: { name?: string; slug?: string; color?: string | null }
) => {
  const { data, error } = await supabase
    .from("tags")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteTag = async (id: string) => {
  const { error } = await supabase.from("tags").delete().eq("id", id);

  if (error) throw error;
};

// Blog Posts
export const getBlogPosts = async () => {
  try {
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
        categories(name, slug),
        blog_post_tags(
          tags!inner(name, color)
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Transform the data to include tags_id for backward compatibility and fix categories structure
    const transformedData =
      data?.map((post) => {
        console.log("Blog post data from database:", {
          id: post.id,
          title: post.title,
        });
        return {
          ...post,
          tags_id:
            post.blog_post_tags
              ?.map(
                (tag: { tags: { name: string; color: string }[] }) =>
                  tag.tags?.[0]?.name
              )
              .filter(Boolean)
              .join(", ") || null,
          categories: Array.isArray(post.categories)
            ? post.categories[0]
            : post.categories,
          blog_post_tags:
            post.blog_post_tags?.map((tagRelation: { tags: unknown }) => ({
              tags: Array.isArray(tagRelation.tags)
                ? tagRelation.tags[0]
                : tagRelation.tags,
            })) || [],
        };
      }) || [];

    return transformedData;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("getBlogPosts error:", err);
    throw new Error(`Failed to load blog posts: ${errorMessage}`);
  }
};

export const getBlogPost = async (slug: string) => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(
      `
      *,
      categories(name),
      blog_post_tags(
        tags(name, color)
      )
    `
    )
    .eq("slug", slug)
    .single();

  if (error) throw error;
  return data;
};

export const createBlogPost = async (post: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string | null;
  featured_image?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  category_id?: string | null;
  author?: string | null;
  status?: "draft" | "published" | "archived";
  published_at?: string | null;
}) => {
  try {
    console.log("Creating blog post with data:", {
      title: post.title,
      slug: post.slug,
      contentLength: post.content?.length,
      author: post.author,
      category_id: post.category_id,
      status: post.status,
    });

    // Create minimal post data first - only essential fields
    const minimalPost = {
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt || post.content.substring(0, 200) + "...",
      status: post.status || "draft",
    };

    console.log("Inserting minimal post data:", minimalPost);

    const { data: initialData, error } = await supabase
      .from("blog_posts")
      .insert(minimalPost)
      .select()
      .single();

    let data = initialData;

    if (error) {
      console.error("Minimal post creation failed:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(`Failed to create blog post: ${error.message}`);
    }

    console.log("Minimal post created successfully:", data);

    // Now update optional fields one by one so missing columns won't break the flow
    const optionalFieldUpdates: Array<{ key: string; value: unknown }> = [];
    if (post.featured_image)
      optionalFieldUpdates.push({
        key: "featured_image",
        value: post.featured_image,
      });
    if (post.meta_title)
      optionalFieldUpdates.push({ key: "meta_title", value: post.meta_title });
    if (post.meta_description)
      optionalFieldUpdates.push({
        key: "meta_description",
        value: post.meta_description,
      });
    if (post.category_id)
      optionalFieldUpdates.push({
        key: "category_id",
        value: post.category_id,
      });
    if (post.author)
      optionalFieldUpdates.push({ key: "author", value: post.author });
    if (post.published_at)
      optionalFieldUpdates.push({
        key: "published_at",
        value: post.published_at,
      });

    for (const { key, value } of optionalFieldUpdates) {
      try {
        const { data: updatedData, error: fieldError } = await supabase
          .from("blog_posts")
          .update({ [key]: value })
          .eq("id", data.id)
          .select()
          .single();

        if (fieldError) {
          continue;
        }

        if (updatedData) {
          data = updatedData;
        }
      } catch (e) {
        console.error(`Unexpected error updating field ${key}:`, e);
        // continue with next field
      }
    }

    // Finally, update with tables if present
    return data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("createBlogPost error:", err);
    throw new Error(`Database error: ${errorMessage}`);
  }
};

export const updateBlogPost = async (
  id: string,
  updates: {
    title?: string;
    slug?: string;
    content?: string;
    excerpt?: string | null;
    featured_image?: string | null;
    meta_title?: string | null;
    meta_description?: string | null;
    category_id?: string | null;
    author?: string | null;
    tables?: TableData[] | null;
    status?: "draft" | "published" | "archived";
    published_at?: string | null;
  }
) => {
  try {
    console.log("Updating blog post:", id, updates);

    // For status-only updates, use a simple approach
    if (updates.status && Object.keys(updates).length === 1) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update({ status: updates.status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Status update error:", error);
        throw new Error(`Status update failed: ${error.message}`);
      }

      console.log("Status update successful:", data);
      return data;
    }

    // For other updates, use the full approach
    const cleanUpdates: Record<string, unknown> = {};

    if (updates.title !== undefined) cleanUpdates.title = updates.title;
    if (updates.slug !== undefined) cleanUpdates.slug = updates.slug;
    if (updates.content !== undefined) cleanUpdates.content = updates.content;
    if (updates.excerpt !== undefined) cleanUpdates.excerpt = updates.excerpt;
    if (updates.featured_image !== undefined) {
      console.log("Setting featured_image:", updates.featured_image);
      console.log("Featured image type:", typeof updates.featured_image);
      console.log("Featured image length:", updates.featured_image?.length);
      cleanUpdates.featured_image = updates.featured_image;
    }
    if (updates.meta_title !== undefined)
      cleanUpdates.meta_title = updates.meta_title;
    if (updates.meta_description !== undefined)
      cleanUpdates.meta_description = updates.meta_description;
    if (updates.category_id !== undefined)
      cleanUpdates.category_id = updates.category_id;
    if (updates.author !== undefined) cleanUpdates.author = updates.author;
    if (updates.tables !== undefined) cleanUpdates.tables = updates.tables;
    if (updates.published_at !== undefined)
      cleanUpdates.published_at = updates.published_at;

    console.log("Clean updates:", cleanUpdates);
    console.log(
      "Number of fields to update:",
      Object.keys(cleanUpdates).length
    );
    console.log(
      "Featured image in clean updates:",
      cleanUpdates.featured_image ? "PRESENT" : "MISSING"
    );

    const { data, error } = await supabase
      .from("blog_posts")
      .update(cleanUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      console.error("Error details:", {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      throw new Error(`Update failed: ${error.message}`);
    }

    console.log("Update successful:", data);
    console.log("Returned featured_image:", data.featured_image);
    return data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("updateBlogPost error:", err);
    throw new Error(`Failed to update blog post: ${errorMessage}`);
  }
};

export const updateBlogPostStatus = async (
  id: string,
  status: "draft" | "published" | "archived"
) => {
  try {
    console.log("Updating post status:", id, status);

    const { data, error } = await supabase
      .from("blog_posts")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Status update error:", error);
      throw new Error(`Failed to update status: ${error.message}`);
    }

    console.log("Status updated successfully:", data);
    return data;
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("updateBlogPostStatus error:", err);
    throw new Error(`Status update failed: ${errorMessage}`);
  }
};

export const deleteBlogPost = async (id: string) => {
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) throw error;
};

// Blog Post Tags Management
export const addTagToBlogPost = async (blogPostId: string, tagId: string) => {
  const { data, error } = await supabase
    .from("blog_post_tags")
    .insert({ blog_post_id: blogPostId, tag_id: tagId })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const removeTagFromBlogPost = async (
  blogPostId: string,
  tagId: string
) => {
  const { error } = await supabase
    .from("blog_post_tags")
    .delete()
    .eq("blog_post_id", blogPostId)
    .eq("tag_id", tagId);

  if (error) throw error;
};

export const setBlogPostTags = async (blogPostId: string, tagIds: string[]) => {
  try {
    // First, remove all existing tags
    const { error: deleteError } = await supabase
      .from("blog_post_tags")
      .delete()
      .eq("blog_post_id", blogPostId);

    if (deleteError) {
      console.error("Error deleting existing tags:", deleteError);
      throw new Error(`Failed to remove existing tags: ${deleteError.message}`);
    }

    // Then add new tags
    if (tagIds.length > 0) {
      const tagRelations = tagIds.map((tagId) => ({
        blog_post_id: blogPostId,
        tag_id: tagId,
      }));

      const { data, error } = await supabase
        .from("blog_post_tags")
        .insert(tagRelations)
        .select();

      if (error) {
        console.error("Error adding tags:", error);
        throw new Error(`Failed to add tags: ${error.message}`);
      }
      return data;
    }

    return [];
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("setBlogPostTags error:", err);
    throw new Error(`Tag assignment error: ${errorMessage}`);
  }
};

export const getBlogPostTags = async (blogPostId: string) => {
  const { data, error } = await supabase
    .from("blog_post_tags")
    .select(
      `
      *,
      tags(*)
    `
    )
    .eq("blog_post_id", blogPostId);

  if (error) throw error;
  return data;
};
