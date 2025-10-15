"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  FaImage,
  FaTimes,
  FaSave,
  FaSpinner,
  FaTag,
  FaRocket,
  FaList,
} from "react-icons/fa";
import {
  getCategories,
  getTags,
  createBlogPost,
  setBlogPostTags,
} from "@/lib/database";
import BlogManagement from "./BlogManagement";
import DatabaseTest from "./DatabaseTest";

type ViewType = "create" | "manage" | "test";

export default function BlogPage() {
  const [currentView, setCurrentView] = useState<ViewType>("create");

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("");
  const [author, setAuthor] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState("16");
  const [fontFamily, setFontFamily] = useState("Arial");
  const [textColor, setTextColor] = useState("#000000");
  const [isLargeText, setIsLargeText] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [tags, setTags] = useState<Array<{ id: string; name: string }>>([]);
  const [loading, setLoading] = useState(true);

  // Load categories and tags from database
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [categoriesData, tagsData] = await Promise.all([
        getCategories(),
        getTags(),
      ]);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fontFamilies = [
    "Arial",
    "Helvetica",
    "Times New Roman",
    "Georgia",
    "Verdana",
    "Courier New",
    "Comic Sans MS",
    "Impact",
  ];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    // Auto-generate slug from title
    setSlug(
      newTitle
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
    );
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const insertHeading = (level: number) => {
    const heading = `<h${level}>Heading ${level}</h${level}>\n\n`;
    setContent(content + heading);
  };

  const formatText = (format: string) => {
    const textarea = document.getElementById("content") as HTMLTextAreaElement;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    let formattedText = "";
    switch (format) {
      case "bold":
        formattedText = `<strong>${selectedText || "Bold Text"}</strong>`;
        break;
      case "italic":
        formattedText = `<em>${selectedText || "Italic Text"}</em>`;
        break;
      case "underline":
        formattedText = `<u>${selectedText || "Underlined Text"}</u>`;
        break;
    }

    const newContent =
      content.substring(0, start) + formattedText + content.substring(end);
    setContent(newContent);
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  // Tables feature removed

  const handleSave = async (publish: boolean = false) => {
    if (!title.trim() || !content.trim()) {
      alert("Please fill in title and content");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const blogPostData = {
        title: title.trim(),
        slug: slug.trim(),
        content: content.trim(),
        excerpt: content.substring(0, 200) + "...",
        featured_image: selectedImage,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDescription.trim() || null,
        category_id: category || null,
        author: author.trim() || null,

        status: publish ? ("published" as const) : ("draft" as const),
        published_at: publish ? new Date().toISOString() : null,
      };

      console.log("Sending blog post data:", blogPostData);
      const newBlogPost = await createBlogPost(blogPostData);

      // Add tags to the blog post
      if (selectedTags.length > 0) {
        await setBlogPostTags(newBlogPost.id, selectedTags);
      }

      alert(
        publish
          ? "Blog post published successfully!"
          : "Blog post saved as draft!"
      );

      // Reset form
      setTitle("");
      setSlug("");
      setContent("");
      setCategory("");
      setAuthor("");
      setMetaTitle("");
      setMetaDescription("");
      setSelectedImage(null);
      setSelectedTags([]);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error saving blog post:", {
        message: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        fullError: err,
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <FaSpinner className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show management view
  if (currentView === "manage") {
    return <BlogManagement />;
  }

  // Show database test view
  if (currentView === "test") {
    return <DatabaseTest />;
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* View Toggle */}
      <div className="mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentView("manage")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-colors ${
              (currentView as string) === "manage"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
          >
            <FaList className="w-4 h-4" />
            Manage Posts
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content Area */}
        <div className="flex-1">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-black mb-6">
              Add New Blog Post
            </h2>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                <strong>Error:</strong> {error}
              </div>
            )}

            {/* Title Input */}
            <div className="mb-6">
              <label
                htmlFor="title"
                className="block text-sm font-medium text-black mb-2"
              >
                Blog Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={handleTitleChange}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter blog title..."
              />
            </div>

            {/* Slug Input */}
            <div className="mb-6">
              <label
                htmlFor="slug"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                URL Slug
              </label>
              <input
                type="text"
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="url-slug"
              />
            </div>

            {/* Content Editor */}
            <div className="mb-6">
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Content
              </label>

              {/* Rich Text Toolbar */}
              <div className="border border-gray-300 rounded-t-md bg-gray-50 p-2 flex flex-wrap gap-2">
                {/* Headings */}
                <div className="flex gap-1">
                  <button
                    onClick={() => insertHeading(1)}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    onClick={() => insertHeading(2)}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    onClick={() => insertHeading(3)}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100"
                    title="Heading 3"
                  >
                    H3
                  </button>
                </div>

                {/* Text Formatting */}
                <div className="flex gap-1">
                  <button
                    onClick={() => formatText("bold")}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 font-bold"
                    title="Bold"
                  >
                    B
                  </button>
                  <button
                    onClick={() => formatText("italic")}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 italic"
                    title="Italic"
                  >
                    I
                  </button>
                  <button
                    onClick={() => formatText("underline")}
                    className="px-2 py-1 text-xs bg-white border border-gray-300 rounded hover:bg-gray-100 underline"
                    title="Underline"
                  >
                    U
                  </button>
                </div>

                {/* Font Size */}
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-600">Size:</label>
                  <select
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    className="px-1 py-1 text-xs border border-gray-300 rounded bg-white"
                  >
                    <option value="12">12px</option>
                    <option value="14">14px</option>
                    <option value="16">16px</option>
                    <option value="18">18px</option>
                    <option value="20">20px</option>
                    <option value="24">24px</option>
                    <option value="28">28px</option>
                    <option value="32">32px</option>
                  </select>
                </div>

                {/* Font Family */}
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-600">Font:</label>
                  <select
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                    className="px-1 py-1 text-xs border border-gray-300 rounded bg-white"
                    style={{ fontFamily: fontFamily }}
                  >
                    {fontFamilies.map((font) => (
                      <option
                        key={font}
                        value={font}
                        style={{ fontFamily: font }}
                      >
                        {font}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Text Color */}
                <div className="flex items-center gap-1">
                  <label className="text-xs text-gray-600">Color:</label>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-6 h-6 border border-gray-300 rounded cursor-pointer"
                    title="Text Color"
                  />
                </div>

                {/* Large Text Toggle */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setIsLargeText(!isLargeText)}
                    className={`px-2 py-1 text-xs border border-gray-300 rounded hover:bg-gray-100 ${
                      isLargeText
                        ? "bg-indigo-100 text-indigo-700 border-indigo-300"
                        : "bg-white"
                    }`}
                    title="Large Text for Better Readability"
                  >
                    🔍 Large Text
                  </button>
                </div>
              </div>

              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={20}
                className="w-full px-3 py-2 border text-black border-gray-300 border-t-0 rounded-b-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="Write your blog content here"
                style={{
                  fontSize: isLargeText ? "18px" : `${fontSize}px`,
                  fontFamily: fontFamily,
                  color: textColor,
                  lineHeight: isLargeText ? "1.6" : "1.4",
                }}
              />
            </div>

            {/* Tables feature removed */}

            {/* Meta Title */}
            <div className="mb-6">
              <label
                htmlFor="metaTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Meta Title
              </label>
              <input
                type="text"
                id="metaTitle"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="SEO meta title..."
                maxLength={60}
              />
              <p className="text-xs text-gray-500 mt-1">
                {metaTitle.length}/60 characters
              </p>
            </div>

            {/* Meta Description */}
            <div className="mb-6">
              <label
                htmlFor="metaDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Meta Description
              </label>
              <textarea
                id="metaDescription"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                placeholder="SEO meta description..."
                maxLength={160}
              />
              <p className="text-xs text-gray-500 mt-1">
                {metaDescription.length}/160 characters
              </p>
            </div>

            {/* Save Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => handleSave(false)}
                disabled={saving || !title.trim() || !content.trim()}
                className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaSave className="w-4 h-4" />
                )}
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={() => handleSave(true)}
                disabled={saving || !title.trim() || !content.trim()}
                className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {saving ? (
                  <FaSpinner className="w-4 h-4 animate-spin" />
                ) : (
                  <FaRocket className="w-4 h-4" />
                )}
                {saving ? "Publishing..." : "Publish Post"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Blog Settings
            </h3>

            {/* Author Field */}
            <div className="mb-6">
              <label
                htmlFor="author"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Author Name
              </label>
              <input
                type="text"
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter author name..."
              />
            </div>

            {/* Category Dropdown */}
            <div className="mb-6">
              <label
                htmlFor="category"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border text-black border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2">
                {tags.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No tags available
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center space-x-2 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag.id)}
                          onChange={() => handleTagToggle(tag.id)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 flex items-center gap-1">
                          <FaTag className="w-3 h-3" />
                          {tag.name}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
              {selectedTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-gray-500 mb-1">Selected tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedTags.map((tagId) => {
                      const tag = tags.find((t) => t.id === tagId);
                      return tag ? (
                        <span
                          key={tagId}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                        >
                          <FaTag className="w-2 h-2" />
                          {tag.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Media Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Featured Image
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                {selectedImage ? (
                  <div className="space-y-2">
                    <Image
                      src={selectedImage}
                      alt="Selected"
                      width={400}
                      height={128}
                      className="w-full h-32 object-cover rounded"
                    />
                    <button
                      onClick={() => setSelectedImage(null)}
                      className="text-red-600 text-sm hover:text-red-800 flex items-center gap-1"
                    >
                      <FaTimes className="w-4 h-4" />
                      Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <FaImage className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-2">
                      Upload an image
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
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 cursor-pointer flex items-center gap-2"
                    >
                      Choose Image
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Preview Section */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Preview
              </h4>
              <div className="text-xs text-gray-500 space-y-1">
                <p>
                  <strong>Title:</strong> {title || "No title"}
                </p>
                <p>
                  <strong>Slug:</strong> {slug || "No slug"}
                </p>
                <p>
                  <strong>Author:</strong> {author || "No author"}
                </p>
                <p>
                  <strong>Category:</strong> {category || "No category"}
                </p>
                <p>
                  <strong>Tags:</strong>{" "}
                  {selectedTags.length > 0
                    ? selectedTags
                        .map((tagId) => tags.find((t) => t.id === tagId)?.name)
                        .join(", ")
                    : "No tags"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
