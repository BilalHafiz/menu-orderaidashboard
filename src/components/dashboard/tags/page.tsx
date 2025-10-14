"use client";

import { useState, useEffect } from "react";
import {
  FaPlus,
  FaFileAlt,
  FaTrash,
  FaCopy,
  FaSpinner,
  FaEdit,
} from "react-icons/fa";
import { getTags, createTag, updateTag, deleteTag } from "@/lib/database";

interface TagItem {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export default function TagPage() {
  const [newTag, setNewTag] = useState("");

  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTag, setEditingTag] = useState<TagItem | null>(null);
  const [editForm, setEditForm] = useState({ name: "" });

  // Load tags from database
  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getTags();
      setTags(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error loading tags:", err);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleAddTag = async () => {
    if (!newTag.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const tagData = { name: newTag.trim(), slug: generateSlug(newTag) };
      const newTagData = await createTag(tagData);
      setTags([newTagData, ...tags]);
      setNewTag("");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error creating tag:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tag?")) return;

    try {
      setSaving(true);
      setError(null);
      await deleteTag(id);
      setTags(tags.filter((tag) => tag.id !== id));
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error deleting tag:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTag = (tag: TagItem) => {
    setEditingTag(tag);
    setEditForm({ name: tag.name });
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editForm.name.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        name: editForm.name.trim(),
        slug: generateSlug(editForm.name),
      };

      const updatedTag = await updateTag(editingTag.id, updateData);
      setTags(tags.map((tag) => (tag.id === editingTag.id ? updatedTag : tag)));
      setEditingTag(null);
      setEditForm({ name: "" });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error updating tag:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-black mb-6">Tag Management</h2>

        {error && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Add Tag Input */}
        <div className="mb-8">
          <label
            htmlFor="newTag"
            className="block text-sm font-medium text-black mb-2"
          >
            Add New Tag
          </label>
          <div className="flex gap-3">
            <input
              id="newTag"
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1 px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your tag here... (Press Enter to add)"
            />
            <button
              onClick={handleAddTag}
              disabled={!newTag.trim() || saving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? (
                <FaSpinner className="w-4 h-4 animate-spin" />
              ) : (
                <FaPlus className="w-4 h-4" />
              )}
              {saving ? "Adding..." : "Add Tag"}
            </button>
          </div>
        </div>

        {/* Tags Container */}
        <div>
          <h3 className="text-lg font-semibold text-black mb-4">
            All Tags ({tags.length})
          </h3>

          {loading ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaSpinner className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
              <p className="text-black text-lg">Loading tags...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FaFileAlt className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-black text-lg">No tags added yet</p>
              <p className="text-gray-400 text-sm">
                Add your first tag using the input above
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTag(tag)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1"
                      >
                        <FaEdit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-green-500 hover:text-green-700 text-sm flex items-center gap-1"
                      >
                        <FaTrash className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-black">
                    <p>
                      Slug:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {tag.slug}
                      </code>
                    </p>
                    <p>ID: {tag.id}</p>
                    <p>
                      Created:{" "}
                      {new Date(tag.created_at).toLocaleDateString("en-US")}
                    </p>
                    <p>
                      Updated:{" "}
                      {new Date(tag.updated_at).toLocaleDateString("en-US")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Actions */}
        {tags.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const allTags = tags.map((t) => t.name).join(", ");
                  navigator.clipboard.writeText(allTags);
                  alert("All tags copied to clipboard!");
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 flex items-center gap-2"
              >
                <FaCopy className="w-4 h-4" />
                Copy All
              </button>
            </div>
          </div>
        )}

        {/* Edit Tag Modal */}
        {editingTag && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-black">Edit Tag</h3>
                  <button
                    onClick={() => setEditingTag(null)}
                    className="text-gray-400 hover:text-black"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="editTagName"
                      className="block text-sm font-medium text-black mb-2"
                    >
                      Tag Name
                    </label>
                    <input
                      type="text"
                      id="editTagName"
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({ ...editForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Enter tag name..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setEditingTag(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={!editForm.name.trim() || saving}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <FaSpinner className="w-4 h-4 animate-spin" />
                    ) : (
                      <FaEdit className="w-4 h-4" />
                    )}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
