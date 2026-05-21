"use client";

import Link from "next/link";
import { Plus, Search, Edit, Trash2, FileText, Calendar, User, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getBlogs, deleteBlog } from "./actions";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbSource, setDbSource] = useState("");

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      const res = await getBlogs();
      if (res.success) {
        setBlogs(res.data || []);
        setDbSource(res.source);
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) return;
    try {
      const res = await deleteBlog(id);
      if (res.success) {
        setBlogs(blogs.filter(b => b.id !== id));
      } else {
        alert("Failed to delete the post.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    }
  };

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Blogs</h1>
          <p className="text-slate-600 dark:text-slate-400">Write, edit, and manage your setup guides and articles.</p>
          {dbSource && (
            <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
              Database Mode: {dbSource === "supabase" ? "Supabase Cloud" : "Local Fallback JSON"}
            </span>
          )}
        </div>
        <Link href="/admin/blogs/new" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Create Blog Post
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Article Title</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">Loading articles...</td>
                </tr>
              ) : blogs.length > 0 ? (
                blogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-brand-600">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{blog.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <span className="px-2.5 py-1 text-xs font-semibold bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-full">{blog.category || "General"}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs font-medium rounded capitalize">{blog.status || "Published"}</span>
                    </td>
                    <td className="px-6 py-4 flex items-center justify-end gap-3">
                      <Link href={`/admin/blogs/${blog.id}`} className="text-slate-400 hover:text-amber-500 transition-colors" title="Edit">
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => handleDelete(blog.id)} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">No blog posts found. Create your first one!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
