"use client";

import { useState, useEffect } from "react";
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
  FaPlus,
} from "react-icons/fa";
import {
  getBlogPosts,
  updateBlogPost,
  updateBlogPostStatus,
  deleteBlogPost,
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

  useEffect(() => {
    loadPosts();
  }, []);

  // Table management functions
  const addTable = () => {
    const newTable = {
      id: Date.now().toString(),
      title: "",
      headers: ["Column 1", "Column 2"],
      rows: [["", ""]],
    };
    setEditTables([...editTables, newTable]);
  };

  const removeTable = (tableId: string) => {
    setEditTables(editTables.filter((table) => table.id !== tableId));
  };

  const updateTable = (tableId: string, updates: Partial<TableData>) => {
    setEditTables(
      editTables.map((table) =>
        table.id === tableId ? { ...table, ...updates } : table
      )
    );
  };

  const addTableRow = (tableId: string) => {
    const table = editTables.find((t) => t.id === tableId);
    if (table) {
      updateTable(tableId, {
        rows: [...table.rows, ["", ""]],
      });
    }
  };

  const removeTableRow = (tableId: string, rowIndex: number) => {
    const table = editTables.find((t) => t.id === tableId);
    if (table && table.rows.length > 1) {
      updateTable(tableId, {
        rows: table.rows.filter((_, index: number) => index !== rowIndex),
      });
    }
  };

  const updateTableRow = (
    tableId: string,
    rowIndex: number,
    colIndex: number,
    value: string
  ) => {
    const table = editTables.find((t) => t.id === tableId);
    if (table) {
      const newRows = [...table.rows];
      newRows[rowIndex][colIndex] = value;
      updateTable(tableId, { rows: newRows });
    }
  };

  const addTableColumn = (tableId: string) => {
    const table = editTables.find((t) => t.id === tableId);
    if (table) {
      const newHeaders = [
        ...table.headers,
        `Column ${table.headers.length + 1}`,
      ];
      const newRows = table.rows.map((row: string[]) => [...row, ""]);
      updateTable(tableId, { headers: newHeaders, rows: newRows });
    }
  };

  const removeTableColumn = (tableId: string, colIndex: number) => {
    const table = editTables.find((t) => t.id === tableId);
    if (table && table.headers.length > 1) {
      const newHeaders = table.headers.filter(
        (_, index: number) => index !== colIndex
      );
      const newRows = table.rows.map((row: string[]) =>
        row.filter((_, index) => index !== colIndex)
      );
      updateTable(tableId, { headers: newHeaders, rows: newRows });
    }
  };

  const updateTableHeader = (
    tableId: string,
    colIndex: number,
    value: string
  ) => {
    const table = editTables.find((t) => t.id === tableId);
    if (table) {
      const newHeaders = [...table.headers];
      newHeaders[colIndex] = value;
      updateTable(tableId, { headers: newHeaders });
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
    setSelectedPost(post);
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditSlug(post.slug);
    setEditMetaTitle(post.meta_title || "");
    setEditMetaDescription(post.meta_description || "");
    setEditStatus(post.status);
    setEditTables(post.tables || []);
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
      };

      await updateBlogPost(selectedPost.id, updates);

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === selectedPost.id ? { ...post, ...updates } : post
        )
      );

      alert("Post updated successfully!");
      setShowEditModal(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error updating post:", err);
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
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
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
