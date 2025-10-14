"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  FaTachometerAlt,
  FaEdit,
  FaFileAlt,
  FaTags,
  FaChevronLeft,
  FaChevronRight,
  FaSignOutAlt,
} from "react-icons/fa";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { signOut, user } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  const menuItems = [
    { name: "Dashboard", href: "/dashboard", icon: FaTachometerAlt },
    { name: "Add Blog", href: "/dashboard/blog", icon: FaEdit },
    { name: "Add Tag", href: "/dashboard/tags", icon: FaTags },
    { name: "Categories", href: "/dashboard/categories", icon: FaFileAlt },
  ];

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? "w-64" : "w-16"
          } bg-white shadow-lg transition-all duration-300`}
        >
          <div className="p-4">
            <div className="flex items-center justify-between">
              {sidebarOpen && (
                <h1 className="text-xl font-bold text-gray-800">Dashboard</h1>
              )}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                {sidebarOpen ? (
                  <FaChevronLeft className="w-5 h-5" />
                ) : (
                  <FaChevronRight className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <nav className="mt-4">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100 transition-colors ${
                    pathname === item.href
                      ? "bg-indigo-50 text-indigo-700 border-r-2 border-indigo-700"
                      : ""
                  }`}
                >
                  <IconComponent className="w-5 h-5 mr-3" />
                  {sidebarOpen && (
                    <span className="font-medium">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">
                  {menuItems.find((item) => item.href === pathname)?.name ||
                    "Dashboard"}
                </h2>
                {user && (
                  <p className="text-sm text-gray-500">Welcome, {user.email}</p>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
              >
                <FaSignOutAlt className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
