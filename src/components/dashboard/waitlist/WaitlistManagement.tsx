"use client";

import { useState, useEffect } from "react";
import {
  FaUpload,
  FaDownload,
  FaTrash,
  FaSpinner,
  FaCheck,
  FaExclamationTriangle,
  FaFileCsv,
  FaUsers,
  FaEnvelope,
} from "react-icons/fa";
import {
  getWaitlistEntries,
  addBulkWaitlistEntries,
  deleteWaitlistEntry,
} from "@/lib/database";

interface WaitlistEntry {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export default function WaitlistManagement() {
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[]>([]);

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getWaitlistEntries();
      setEntries(data);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error loading waitlist entries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "text/csv") {
      setCsvFile(file);
      parseCSV(file);
    } else {
      setError("Please select a valid CSV file");
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split("\n").filter((line) => line.trim());
      const emails = lines
        .map((line) => line.trim())
        .filter((line) => line.includes("@"));
      setPreviewData(emails.slice(0, 10)); // Show first 10 emails as preview
    };
    reader.readAsText(file);
  };

  const handleBulkUpload = async () => {
    if (!csvFile) {
      setError("Please select a CSV file first");
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter((line) => line.trim());
        const emails = lines
          .map((line) => line.trim())
          .filter((line) => line.includes("@"));

        if (emails.length === 0) {
          setError("No valid email addresses found in the CSV file");
          return;
        }

        const result = await addBulkWaitlistEntries(emails);
        setSuccess(`Successfully added ${result.added} emails to waitlist!`);
        setCsvFile(null);
        setPreviewData([]);
        loadEntries(); // Refresh the list
      };
      reader.readAsText(csvFile);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error uploading CSV:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Are you sure you want to delete this waitlist entry?")) {
      return;
    }

    try {
      await deleteWaitlistEntry(id);
      setSuccess("Waitlist entry deleted successfully!");
      loadEntries(); // Refresh the list
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      console.error("Error deleting entry:", err);
    }
  };

  const downloadCSV = () => {
    const csvContent = [
      "email,created_at",
      ...entries.map((entry) => `"${entry.email}","${entry.created_at}"`),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `waitlist-export-${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-center py-12">
            <FaSpinner className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
            <p className="text-gray-500 text-lg">Loading waitlist entries...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FaUsers className="w-6 h-6 text-indigo-600" />
            Waitlist Management
          </h2>
          <div className="flex gap-3">
            <button
              onClick={downloadCSV}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex items-center gap-2"
            >
              <FaDownload className="w-4 h-4" />
              Export CSV
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg flex items-center gap-2">
            <FaExclamationTriangle className="w-5 h-5" />
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
            <FaCheck className="w-5 h-5" />
            <strong>Success:</strong> {success}
          </div>
        )}

        {/* CSV Upload Section */}
        <div className="mb-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaFileCsv className="w-5 h-5 text-indigo-600" />
            Upload CSV File
          </h3>

          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="csv-upload"
              />
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <FaUpload className="w-12 h-12 text-gray-400" />
                <p className="text-gray-600">
                  Click to select CSV file or drag and drop
                </p>
                <p className="text-sm text-gray-500">
                  CSV should contain email addresses (one per line)
                </p>
              </label>
            </div>

            {csvFile && (
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-medium text-gray-900 mb-2">
                  File: {csvFile.name}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Preview of emails to be uploaded:
                </p>
                <div className="max-h-32 overflow-y-auto bg-gray-50 p-3 rounded">
                  {previewData.map((email, index) => (
                    <div key={index} className="text-sm text-gray-700 py-1">
                      {email}
                    </div>
                  ))}
                  {previewData.length === 10 && (
                    <div className="text-sm text-gray-500 italic">
                      ... and more
                    </div>
                  )}
                </div>
                <button
                  onClick={handleBulkUpload}
                  disabled={uploading}
                  className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 flex items-center gap-2"
                >
                  {uploading ? (
                    <FaSpinner className="w-4 h-4 animate-spin" />
                  ) : (
                    <FaUpload className="w-4 h-4" />
                  )}
                  {uploading ? "Uploading..." : "Upload to Waitlist"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Waitlist Entries */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FaEnvelope className="w-5 h-5 text-indigo-600" />
            Waitlist Entries ({entries.length})
          </h3>

          {entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FaUsers className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No waitlist entries found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {entry.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          className="text-red-600 hover:text-red-800 flex items-center gap-1"
                        >
                          <FaTrash className="w-4 h-4" />
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
