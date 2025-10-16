"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaEdit,
  FaTrash,
  FaEye,
  FaRocket,
  FaSpinner,
  FaTag,
  FaCalendar,
  FaUser,
  FaSearch,
  FaFilter,
  FaTimes,
  FaSave,
  FaExternalLinkAlt,
  FaImage,
  FaFolder,
} from "react-icons/fa";
import {
  getBlogPosts,
  updateBlogPost,
  updateBlogPostStatus,
  deleteBlogPost,
  getCategories,
  getTags,
  setBlogPostTags,
} from "@/lib/database";

interface TableData {
  id: string;
  title: string;
  headers: string[];
  rows: string[][];
}

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  meta_title: string | null;
  meta_description: string | null;
  status: "draft" | "published" | "archived";
  published_at: string | null;
  created_at: string;
  updated_at: string;
  category_id: string | null;
  author: string | null;
  categories?: { name: string; slug: string } | null;
  tags_id?: string | null;
  tables?: TableData[] | null;
  blog_post_tags?: Array<{
    tags: { id: string; name: string; color?: string };
  }>;
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "draft" | "published" | "archived"
  >("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);

  // Edit form states
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editMetaTitle, setEditMetaTitle] = useState("");
  const [editMetaDescription, setEditMetaDescription] = useState("");
  const [editStatus, setEditStatus] = useState<
    "draft" | "published" | "archived"
  >("draft");
  const [editTables, setEditTables] = useState<TableData[]>([]);
  const [editSaving, setEditSaving] = useState(false);
  const [editFeaturedImage, setEditFeaturedImage] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editTagIds, setEditTagIds] = useState<string[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Data for dropdowns
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [tags, setTags] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);

  useEffect(() => {
    loadPosts();
    loadCategoriesAndTags();
  }, []);

  const loadCategoriesAndTags = async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        getCategories(),
        getTags(),
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (err) {
      console.error("Error loading categories and tags:", err);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert("Please select a valid image file");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("Image size should be less than 5MB");
        return;
      }

      // Convert file to base64 for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64String = e.target?.result as string;
        setEditFeaturedImage(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const isValidImageUrl = (url: string) => {
    try {
      // Check if it's a base64 string
      if (url.startsWith("data:image/")) {
        return true;
      }

      // Check if it's a valid URL
      const urlObj = new URL(url);
      return (
        urlObj.protocol === "http:" ||
        urlObj.protocol === "https:" ||
        url.startsWith("blob:")
      );
    } catch {
      return false;
    }
  };

  const loadPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getBlogPosts();
      setPosts(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error loading posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (
    postId: string,
    newStatus: "draft" | "published" | "archived"
  ) => {
    try {
      setActionLoading(postId);
      setError(null);

      console.log(
        "Attempting to update post:",
        postId,
        "with status:",
        newStatus
      );

      // Use the simple status update function
      await updateBlogPostStatus(postId, newStatus);

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, status: newStatus } : post
        )
      );

      alert(`Post ${newStatus} successfully!`);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update post status";
      setError(errorMessage);
      console.error("Error updating post status:", err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewPost = (post: BlogPost) => {
    // Open the blog post page in a new tab
    window.open(`/blog/${post.slug}`, "_blank");
  };

  const handleViewInModal = (post: BlogPost) => {
    setSelectedPost(post);
    setShowViewModal(true);
  };

  const handleEditPost = (post: BlogPost) => {
    console.log("Editing post with tables data:", post.tables);
    console.log("Post featured_image:", post.featured_image);
    console.log(
      "Featured image type:",
      post.featured_image?.startsWith("data:") ? "base64" : "URL"
    );

    setSelectedPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditSlug(post.slug);
    setEditMetaTitle(post.meta_title || "");
    setEditMetaDescription(post.meta_description || "");
    setEditStatus(post.status);
    setEditTables(post.tables || []);
    setEditFeaturedImage(post.featured_image || "");
    setImagePreview(post.featured_image || null);
    setEditCategoryId(post.category_id || "");

    // Extract tag IDs from the post's blog_post_tags
    const tagIds =
      post.blog_post_tags
        ?.map((tagRelation) => tagRelation.tags?.id)
        .filter(Boolean) || [];
    setEditTagIds(tagIds);

    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedPost) return;

    try {
      setEditSaving(true);
      setError(null);

      const updates = {
        title: editTitle.trim(),
        content: editContent.trim(),
        slug: editSlug.trim(),
        meta_title: editMetaTitle.trim() || null,
        meta_description: editMetaDescription.trim() || null,
        status: editStatus,
        tables: editTables.length > 0 ? editTables : null,
        featured_image: editFeaturedImage.trim() || null,
        category_id: editCategoryId || null,
      };

      console.log("Saving post with updates:", updates);
      console.log(
        "Featured image type:",
        editFeaturedImage.startsWith("data:") ? "base64" : "URL"
      );
      console.log("Featured image length:", editFeaturedImage.length);

      // Update the blog post
      await updateBlogPost(selectedPost.id, updates);

      // Update tags separately
      await setBlogPostTags(selectedPost.id, editTagIds);

      // Reload posts to get fresh data from database
      await loadPosts();

      alert("Post updated successfully!");
      setShowEditModal(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error updating post:", err);
      alert(`Error: ${errorMessage}`);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (postId: string, title: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setActionLoading(postId);
      setError(null);
      await deleteBlogPost(postId);

      // Update local state
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      alert("Post deleted successfully!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error deleting post:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || post.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: "bg-yellow-100 text-yellow-800",
      published: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status as keyof typeof styles]
        }`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <FaSpinner className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-black text-lg">Loading posts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-black">
              Blog Posts Management
            </h2>
            <div className="text-sm text-black">
              {filteredPosts.length} of {posts.length} posts
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search posts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <FaFilter className="text-gray-400 w-4 h-4" />
              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(
                    e.target.value as "all" | "draft" | "published" | "archived"
                  )
                }
                className="px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Posts List */}
        <div className="divide-y divide-gray-200">
          {filteredPosts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <p className="text-black text-lg">
                {posts.length === 0
                  ? "No blog posts found. Create your first post!"
                  : "No posts match your search criteria."}
              </p>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    {/* Title and Status */}
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-black truncate">
                        {post.title}
                      </h3>
                      {getStatusBadge(post.status)}
                    </div>

                    {/* Meta Information */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-black mb-3">
                      <div className="flex items-center gap-1">
                        <FaCalendar className="w-3 h-3" />
                        Created: {formatDate(post.created_at)}
                      </div>
                      {post.published_at && (
                        <div className="flex items-center gap-1">
                          <FaRocket className="w-3 h-3" />
                          Published: {formatDate(post.published_at)}
                        </div>
                      )}
                      {post.categories && (
                        <div className="flex items-center gap-1">
                          <FaUser className="w-3 h-3" />
                          Category: {post.categories.name}
                        </div>
                      )}
                      {post.author && (
                        <div className="flex items-center gap-1">
                          <FaUser className="w-3 h-3" />
                          Author: {post.author}
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-3">
                      <FaTag className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-black">
                        Tags: {post.tags_id ? post.tags_id : "No tags assigned"}
                      </span>
                    </div>

                    {/* Featured Image Indicator */}
                    {post.featured_image && (
                      <div className="mb-2 flex items-center gap-2">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <FaImage className="w-3 h-3 mr-1" />
                          {post.featured_image.startsWith("data:")
                            ? "Uploaded Image"
                            : "Image URL"}
                        </span>
                        <div className="w-12 h-8 rounded border overflow-hidden">
                          {post.featured_image.startsWith("data:") ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={post.featured_image}
                              alt="Featured image"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <Image
                              src={post.featured_image}
                              alt="Featured image"
                              width={48}
                              height={32}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}
                        </div>
                      </div>
                    )}

                    {/* Excerpt */}
                    <p className="text-black text-sm line-clamp-2">
                      {post.excerpt || post.content.substring(0, 150) + "..."}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-4">
                    {/* View Live Button */}
                    <button
                      onClick={() => handleViewPost(post)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="View Live Post (New Tab)"
                    >
                      <FaExternalLinkAlt className="w-4 h-4" />
                    </button>

                    {/* View in Modal Button */}
                    <button
                      onClick={() => handleViewInModal(post)}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      title="Quick Preview"
                    >
                      <FaEye className="w-4 h-4" />
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleEditPost(post)}
                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                      title="Edit Post"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>

                    {/* Status Actions */}
                    {post.status === "draft" && (
                      <button
                        onClick={() => handleStatusChange(post.id, "published")}
                        disabled={actionLoading === post.id}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                        title="Publish Post"
                      >
                        {actionLoading === post.id ? (
                          <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                          <FaRocket className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {post.status === "published" && (
                      <button
                        onClick={() => handleStatusChange(post.id, "draft")}
                        disabled={actionLoading === post.id}
                        className="p-2 text-gray-400 hover:text-yellow-600 transition-colors disabled:opacity-50"
                        title="Unpublish Post"
                      >
                        {actionLoading === post.id ? (
                          <FaSpinner className="w-4 h-4 animate-spin" />
                        ) : (
                          <FaEdit className="w-4 h-4" />
                        )}
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={() => handleDelete(post.id, post.title)}
                      disabled={actionLoading === post.id}
                      className="p-2 text-gray-400 hover:text-green-600 transition-colors disabled:opacity-50"
                      title="Delete Post"
                    >
                      {actionLoading === post.id ? (
                        <FaSpinner className="w-4 h-4 animate-spin" />
                      ) : (
                        <FaTrash className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View Modal */}
      {showViewModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">View Post</h3>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Title:</strong> {selectedPost.title}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        selectedPost.status === "published"
                          ? "bg-green-100 text-green-800"
                          : selectedPost.status === "draft"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {selectedPost.status}
                    </span>
                  </div>
                  <div>
                    <strong>Slug:</strong> {selectedPost.slug}
                  </div>
                  <div>
                    <strong>Created:</strong>{" "}
                    {formatDate(selectedPost.created_at)}
                  </div>
                  {selectedPost.published_at && (
                    <div>
                      <strong>Published:</strong>{" "}
                      {formatDate(selectedPost.published_at)}
                    </div>
                  )}
                  {selectedPost.categories && (
                    <div>
                      <strong>Category:</strong> {selectedPost.categories.name}
                    </div>
                  )}
                  {selectedPost.author && (
                    <div>
                      <strong>Author:</strong> {selectedPost.author}
                    </div>
                  )}
                </div>
              </div>
              <div className="prose max-w-none">
                <h2 className="text-2xl font-bold mb-4">
                  {selectedPost.title}
                </h2>
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedPost.content }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-xl font-semibold">Edit Post</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-black"
              >
                <FaTimes className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  <strong>Error:</strong> {error}
                </div>
              )}

              <div className="space-y-4">
                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Title
                  </label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Slug
                  </label>
                  <input
                    type="text"
                    value={editSlug}
                    onChange={(e) => setEditSlug(e.target.value)}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) =>
                      setEditStatus(
                        e.target.value as "draft" | "published" | "archived"
                      )
                    }
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                {/* Featured Image */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <FaImage className="inline w-4 h-4 mr-2" />
                    Featured Image
                  </label>

                  {/* File Upload Option */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">
                      Upload from computer:
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {editFeaturedImage.startsWith("data:") && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Image uploaded successfully (will be saved to
                        database)
                      </p>
                    )}
                  </div>

                  {/* URL Input Option */}
                  <div className="mb-3">
                    <label className="block text-sm text-gray-600 mb-1">
                      Or enter image URL:
                    </label>
                    <input
                      type="url"
                      value={
                        editFeaturedImage.startsWith("data:")
                          ? ""
                          : editFeaturedImage
                      }
                      onChange={(e) => {
                        setEditFeaturedImage(e.target.value);
                        if (isValidImageUrl(e.target.value)) {
                          setImagePreview(e.target.value);
                        }
                      }}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {editFeaturedImage &&
                      !editFeaturedImage.startsWith("data:") && (
                        <p className="text-xs text-blue-600 mt-1">
                          ✓ URL image (will be saved to database)
                        </p>
                      )}
                  </div>

                  {/* Image Preview */}
                  {(imagePreview || editFeaturedImage) && (
                    <div className="mt-2">
                      <label className="block text-sm text-gray-600 mb-1">
                        Preview:
                      </label>
                      <div className="relative">
                        {(imagePreview || editFeaturedImage).startsWith(
                          "data:"
                        ) ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imagePreview || editFeaturedImage}
                            alt="Featured image preview"
                            width={200}
                            height={120}
                            className="object-cover rounded border"
                            onLoad={() => {
                              console.log("Base64 image loaded successfully");
                            }}
                            onError={(e) => {
                              console.error("Base64 image failed to load:", e);
                              setImagePreview(null);
                            }}
                          />
                        ) : (
                          <Image
                            src={imagePreview || editFeaturedImage}
                            alt="Featured image preview"
                            width={200}
                            height={120}
                            className="object-cover rounded border"
                            onLoad={() => {
                              console.log("URL image loaded successfully");
                            }}
                            onError={(e) => {
                              console.error("URL image failed to load:", e);
                              console.log(
                                "Failed image src:",
                                imagePreview || editFeaturedImage
                              );
                              setImagePreview(null);
                            }}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditFeaturedImage("");
                            setImagePreview(null);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                          title="Remove image"
                        >
                          ×
                        </button>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Image source:{" "}
                        {(imagePreview || editFeaturedImage).substring(0, 50)}
                        ...
                        <br />
                        <span className="text-green-600">
                          ✓ Image ready for save
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <FaFolder className="inline w-4 h-4 mr-2" />
                    Category
                  </label>
                  <select
                    value={editCategoryId}
                    onChange={(e) => setEditCategoryId(e.target.value)}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    <FaTag className="inline w-4 h-4 mr-2" />
                    Tags
                  </label>
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center space-x-2"
                      >
                        <input
                          type="checkbox"
                          checked={editTagIds.includes(tag.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditTagIds([...editTagIds, tag.id]);
                            } else {
                              setEditTagIds(
                                editTagIds.filter((id) => id !== tag.id)
                              );
                            }
                          }}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-black">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                  {editTagIds.length > 0 && (
                    <div className="mt-2">
                      <span className="text-sm text-gray-600">
                        Selected:{" "}
                        {editTagIds
                          .map((id) => tags.find((t) => t.id === id)?.name)
                          .join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Meta Title */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Meta Title
                  </label>
                  <input
                    type="text"
                    value={editMetaTitle}
                    onChange={(e) => setEditMetaTitle(e.target.value)}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={60}
                  />
                </div>

                {/* Meta Description */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Meta Description
                  </label>
                  <textarea
                    value={editMetaDescription}
                    onChange={(e) => setEditMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2  text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={160}
                  />
                </div>

                {/* Content */}
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Content
                  </label>
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={15}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-black border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={
                    editSaving || !editTitle.trim() || !editContent.trim()
                  }
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {editSaving ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaSave className="w-4 h-4" />
                  )}
                  {editSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
