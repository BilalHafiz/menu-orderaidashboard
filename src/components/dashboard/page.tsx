"use client";

import { useEffect, useState } from "react";
import { FaBook, FaFileAlt, FaTags } from "react-icons/fa";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  totalBlogs: number;
  totalTags: number;
  totalCategories: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBlogs: 0,
    totalTags: 0,
    totalCategories: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch blog posts count
        const { count: blogsCount } = await supabase
          .from("blog_posts")
          .select("*", { count: "exact", head: true });

        // Fetch tags count
        const { count: tagsCount } = await supabase
          .from("tags")
          .select("*", { count: "exact", head: true });

        // Fetch categories count
        const { count: categoriesCount } = await supabase
          .from("categories")
          .select("*", { count: "exact", head: true });

        setStats({
          totalBlogs: blogsCount || 0,
          totalTags: tagsCount || 0,
          totalCategories: categoriesCount || 0,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <FaBook className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Total Blogs</p>
              <p className="text-2xl font-semibold text-black">
                {loading ? "..." : stats.totalBlogs}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FaTags className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Total Tags</p>
              <p className="text-2xl font-semibold text-black">
                {loading ? "..." : stats.totalTags}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FaFileAlt className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-black">Categories</p>
              <p className="text-2xl font-semibold text-black">
                {loading ? "..." : stats.totalCategories}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-black mb-4">
          Recent Activity
        </h3>
        <div className="space-y-3">
          <div className="flex items-center p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-black">
                Welcome to your dashboard!
              </p>
              <p className="text-xs text-black">
                Start by creating your first blog post
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
