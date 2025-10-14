"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaPlus,
  FaTags,
  FaEdit,
  FaImage,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { getCategories, createCategory, updateCategory } from "@/lib/database";

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  featured_image?: string | null;
  created_at: string;
  updated_at: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newCategory, setNewCategory] = useState({
    name: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    imageUrl: "",
  });
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    imageUrl: "",
  });

  // Load categories from database
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCategories();
      setCategories(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error loading categories:", err);
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
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewCategory({
          ...newCategory,
          imageUrl: event.target?.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return;

    let categoryData: {
      name: string;
      slug: string;
      description?: string | null;
      meta_title?: string | null;
      meta_description?: string | null;
      featured_image?: string | null;
    } | null = null;
    try {
      setSaving(true);
      setError(null);

      categoryData = {
        name: newCategory.name.trim(),
        slug: generateSlug(newCategory.name),
        description: newCategory.description.trim() || null,
        meta_title: newCategory.metaTitle.trim() || null,
        meta_description: newCategory.metaDescription.trim() || null,
        featured_image: newCategory.imageUrl || null,
      };

      const newCategoryData = await createCategory(categoryData);
      setCategories([newCategoryData, ...categories]);
      setNewCategory({
        name: "",
        description: "",
        metaTitle: "",
        metaDescription: "",
        imageUrl: "",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error creating category:", {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        fullError: err,
        categoryData: categoryData,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditForm({
      name: category.name,
      description: category.description || "",
      metaTitle: category.meta_title || "",
      metaDescription: category.meta_description || "",
      imageUrl: category.featured_image || "",
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingCategory || !editForm.name.trim()) return;

    try {
      setSaving(true);
      setError(null);

      const updateData = {
        name: editForm.name.trim(),
        slug: generateSlug(editForm.name),
        description: editForm.description.trim() || null,
        meta_title: editForm.metaTitle.trim() || null,
        meta_description: editForm.metaDescription.trim() || null,
        featured_image: editForm.imageUrl.trim() || null,
      };

      const updatedCategory = await updateCategory(
        editingCategory.id,
        updateData
      );
      setCategories(
        categories.map((cat) =>
          cat.id === editingCategory.id ? updatedCategory : cat
        )
      );
      setIsEditModalOpen(false);
      setEditingCategory(null);
      setEditForm({
        name: "",
        description: "",
        metaTitle: "",
        metaDescription: "",
        imageUrl: "",
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error updating category:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditModalOpen(false);
    setEditingCategory(null);
    setEditForm({
      name: "",
      description: "",
      metaTitle: "",
      metaDescription: "",
      imageUrl: "",
    });
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-black mb-6">
          Categories Management
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Add Category Form */}
        <div className="mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Form Fields (2/3 width) */}
              <div className="lg:col-span-2 space-y-4">
                {/* Category Name */}
                <div>
                  <label
                    htmlFor="categoryName"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Category Name *
                  </label>
                  <input
                    type="text"
                    id="categoryName"
                    value={newCategory.name}
                    onChange={(e) =>
                      setNewCategory({ ...newCategory, name: e.target.value })
                    }
                    className="w-full px-3 py-2 text-black border  border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter category name..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="categoryDescription"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Description
                  </label>
                  <textarea
                    id="categoryDescription"
                    value={newCategory.description}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        description: e.target.value,
                      })
                    }
                    rows={6}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="Enter detailed description of the category..."
                  />
                  <p className="text-xs text-black mt-1">
                    {newCategory.description.length} characters
                  </p>
                </div>

                {/* Meta Title */}
                <div>
                  <label
                    htmlFor="metaTitle"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    value={newCategory.metaTitle}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        metaTitle: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2  text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="SEO meta title..."
                    maxLength={60}
                  />
                  <p className="text-xs text-black mt-1">
                    {newCategory.metaTitle.length}/60 characters
                  </p>
                </div>

                {/* Meta Description */}
                <div>
                  <label
                    htmlFor="metaDescription"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    value={newCategory.metaDescription}
                    onChange={(e) =>
                      setNewCategory({
                        ...newCategory,
                        metaDescription: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 text-black border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="SEO meta description..."
                    maxLength={160}
                  />
                  <p className="text-xs text-black mt-1">
                    {newCategory.metaDescription.length}/160 characters
                  </p>
                </div>
              </div>

              {/* Right Column - Media (1/3 width) */}
              <div className="lg:col-span-1">
                <div>
                  <label className="block text-sm font-medium text-black mb-2">
                    Featured Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                    {newCategory.imageUrl ? (
                      <div className="space-y-3">
                        <Image
                          src={newCategory.imageUrl}
                          alt="Selected"
                          width={400}
                          height={160}
                          className="w-full h-40 object-cover rounded-lg mx-auto"
                        />
                        <button
                          onClick={() =>
                            setNewCategory({ ...newCategory, imageUrl: "" })
                          }
                          className="text-green-600 text-sm hover:text-green-800 flex items-center gap-1 mx-auto"
                        >
                          <FaTimes className="w-4 h-4" />
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div className="py-4">
                        <FaImage className="w-16 h-16 text-gray-400 mx-auto mb-3" />
                        <p className="text-sm text-black mb-3">
                          Upload a featured image
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label
                          htmlFor="image-upload"
                          className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 cursor-pointer flex items-center gap-2 mx-auto"
                        >
                          Choose Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleAddCategory}
                disabled={!newCategory.name.trim() || saving}
                className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-medium"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaPlus className="w-4 h-4" />
                )}
                {saving ? "Adding Category..." : "Add Category"}
              </button>
            </div>
          </div>
        </div>

        {/* Categories List */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-black flex items-center gap-2">
              <FaTags className="w-5 h-5 text-indigo-600" />
              All Categories ({categories.length})
            </h3>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <FaSpinner className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
                <p className="text-black text-lg">Loading categories...</p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-12">
                <FaTags className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-black text-lg">No categories created yet</p>
                <p className="text-gray-400 text-sm">
                  Add your first category using the form above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg p-5 hover:shadow-lg transition-all duration-200 hover:border-indigo-300"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-semibold text-black text-lg">
                        {category.name}
                      </h4>
                      <button
                        onClick={() => handleEditCategory(category)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1 px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                      >
                        <FaEdit className="w-4 h-4" />
                        Edit
                      </button>
                    </div>

                    {category.featured_image && (
                      <div className="mb-3">
                        <Image
                          src={category.featured_image}
                          alt={category.name}
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {category.description && (
                      <p className="text-sm text-black mb-3 line-clamp-2">
                        {category.description}
                      </p>
                    )}

                    {(category.meta_title || category.meta_description) && (
                      <div className="text-xs text-black mb-3 p-2 bg-gray-50 rounded">
                        {category.meta_title && (
                          <p className="mb-1">
                            <span className="font-semibold text-black">
                              Meta Title:
                            </span>
                            <span className="ml-1">{category.meta_title}</span>
                          </p>
                        )}
                        {category.meta_description && (
                          <p>
                            <span className="font-semibold text-black">
                              Meta Description:
                            </span>
                            <span className="ml-1 line-clamp-2">
                              {category.meta_description}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    <div className="text-xs text-black space-y-1 pt-2 border-t border-gray-100">
                      <p>
                        <span className="font-medium">Slug:</span>{" "}
                        <code className="bg-gray-100 px-1 rounded text-xs">
                          {category.slug}
                        </code>
                      </p>
                      <p>
                        <span className="font-medium">Created:</span>{" "}
                        {new Date(category.created_at).toLocaleDateString(
                          "en-US"
                        )}
                      </p>
                      <p>
                        <span className="font-medium">Updated:</span>{" "}
                        {new Date(category.updated_at).toLocaleDateString(
                          "en-US"
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Category Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-black">
                  Edit Category
                </h3>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-black"
                >
                  <FaTimes className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Category Name */}
                <div>
                  <label
                    htmlFor="editCategoryName"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Category Name
                  </label>
                  <input
                    type="text"
                    id="editCategoryName"
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter category name..."
                  />
                </div>

                {/* Description */}
                <div>
                  <label
                    htmlFor="editCategoryDescription"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Description
                  </label>
                  <input
                    type="text"
                    id="editCategoryDescription"
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter description..."
                  />
                </div>

                {/* Meta Title */}
                <div className="mb-6">
                  <label
                    htmlFor="metaTitle"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Meta Title
                  </label>
                  <input
                    type="text"
                    id="metaTitle"
                    value={editForm.metaTitle}
                    onChange={(e) =>
                      setEditForm({ ...editForm, metaTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="SEO meta title..."
                    maxLength={60}
                  />
                  <p className="text-xs text-black mt-1">
                    {editForm.metaTitle.length}/60 characters
                  </p>
                </div>

                {/* Meta Description */}
                <div className="mb-6">
                  <label
                    htmlFor="metaDescription"
                    className="block text-sm font-medium text-black mb-2"
                  >
                    Meta Description
                  </label>
                  <textarea
                    id="metaDescription"
                    value={editForm.metaDescription}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        metaDescription: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    placeholder="SEO meta description..."
                    maxLength={160}
                  />
                  <p className="text-xs text-black mt-1">
                    {editForm.metaDescription.length}/160 characters
                  </p>
                </div>

                {/* Media Section */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-black mb-2">
                    Featured Image
                  </label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    {editForm.imageUrl ? (
                      <div className="space-y-2">
                        <Image
                          src={editForm.imageUrl}
                          alt="Selected"
                          width={400}
                          height={128}
                          className="w-full h-32 object-cover rounded"
                        />
                        <button
                          onClick={() =>
                            setEditForm({ ...editForm, imageUrl: "" })
                          }
                          className="text-green-600 text-sm hover:text-green-800 flex items-center gap-1"
                        >
                          <FaTimes className="w-4 h-4" />
                          Remove Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <FaImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-black mb-2">
                          Upload an image
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                setEditForm({
                                  ...editForm,
                                  imageUrl: event.target?.result as string,
                                });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="hidden"
                          id="edit-image-upload"
                        />
                        <label
                          htmlFor="edit-image-upload"
                          className="inline-block px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 cursor-pointer flex items-center gap-2"
                        >
                          Choose Image
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleCancelEdit}
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
  );
}
