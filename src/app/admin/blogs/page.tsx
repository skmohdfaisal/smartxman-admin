"use client";

import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  FileText, 
  Calendar, 
  User, 
  Clock, 
  Eye, 
  Copy, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  Check, 
  X,
  FileCheck,
  TrendingUp,
  SlidersHorizontal,
  Bookmark
} from "lucide-react";
import { useState, useEffect } from "react";
import { getBlogs, saveBlog, deleteBlog } from "./actions";

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbSource, setDbSource] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all"); // all, published, draft, needs_review, featured
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
      console.error("Error fetching blogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this blog post? This action is irreversible.")) return;
    try {
      setActionLoadingId(id);
      const res = await deleteBlog(id);
      if (res.success) {
        setBlogs(blogs.filter(b => b.id !== id));
      } else {
        alert("Failed to delete the post.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTogglePublish = async (blog: any) => {
    try {
      setActionLoadingId(blog.id);
      const newStatus = blog.status === "published" ? "draft" : "published";
      const payload = {
        ...blog,
        status: newStatus,
        published_at: newStatus === "published" ? new Date().toISOString() : null
      };
      
      const res = await saveBlog(payload);
      if (res.success) {
        setBlogs(blogs.map(b => b.id === blog.id ? { ...b, status: newStatus, published_at: payload.published_at } : b));
      } else {
        alert("Failed to update post status.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during save.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (blog: any) => {
    try {
      setActionLoadingId(`dup-${blog.id}`);
      const baseSlug = blog.slug || blog.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const payload = {
        ...blog,
        id: undefined, // Create new record
        title: `${blog.title} (Copy)`,
        slug: `${baseSlug}-copy-${Math.floor(1000 + Math.random() * 9000)}`,
        status: "draft",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: null
      };

      const res = await saveBlog(payload);
      if (res.success) {
        await fetchBlogs(); // Reload to show the new duplicate
      } else {
        alert("Failed to duplicate blog post: " + (res.error || ""));
      }
    } catch (err: any) {
      console.error(err);
      alert("An error occurred during duplication: " + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // SEO Health Score calculator
  const calculateSEOHealth = (blog: any) => {
    let score = 0;
    let checks = 0;
    
    const addCheck = (cond: boolean) => {
      checks++;
      if (cond) score++;
    };
    
    addCheck(!!blog.title && blog.title.length >= 10);
    addCheck(!!blog.slug);
    addCheck(!!blog.cover_image_url || !!blog.cover_image);
    addCheck(!!blog.cover_image_alt);
    addCheck(!!blog.excerpt && blog.excerpt.length >= 30);
    addCheck(!!blog.content && blog.content.length > 200);
    addCheck(!!blog.seo_title && blog.seo_title.length >= 25);
    addCheck(!!blog.seo_description && blog.seo_description.length >= 80);
    addCheck(!!blog.focus_keyword);
    addCheck(!!blog.faqs && Array.isArray(blog.faqs) && blog.faqs.length > 0);
    addCheck(!!blog.product_blocks && Array.isArray(blog.product_blocks) && blog.product_blocks.length > 0);
    
    return Math.round((score / checks) * 100);
  };

  // Category options
  const categories = [
    "All",
    "Buying Guides",
    "Product Reviews",
    "Comparisons",
    "Deals",
    "Tech Accessories",
    "Creator Setup",
    "Gaming Setup",
    "Student Essentials",
    "Productivity",
    "Desk Setup",
    "Lifestyle"
  ];

  // Filtering blogs
  const filteredBlogs = blogs.filter(blog => {
    // Search query matches title, slug, category, excerpt or focus keyword
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      (blog.title || "").toLowerCase().includes(query) ||
      (blog.slug || "").toLowerCase().includes(query) ||
      (blog.category || "").toLowerCase().includes(query) ||
      (blog.excerpt || "").toLowerCase().includes(query) ||
      (blog.focus_keyword || "").toLowerCase().includes(query) ||
      (Array.isArray(blog.tags) && blog.tags.some((t: string) => t.toLowerCase().includes(query)));

    // Category filter
    const matchesCategory = selectedCategory === "All" || blog.category === selectedCategory;

    // Tab filter
    let matchesTab = true;
    if (selectedTab === "published") matchesTab = blog.status === "published";
    else if (selectedTab === "draft") matchesTab = blog.status === "draft" || !blog.status;
    else if (selectedTab === "needs_review") matchesTab = blog.status === "needs_review";
    else if (selectedTab === "featured") matchesTab = !!blog.featured;

    return matchesSearch && matchesCategory && matchesTab;
  });

  // Calculate high-level counters
  const totalCount = blogs.length;
  const publishedCount = blogs.filter(b => b.status === "published").length;
  const draftCount = blogs.filter(b => b.status === "draft" || !b.status).length;
  const reviewCount = blogs.filter(b => b.status === "needs_review").length;
  const featuredCount = blogs.filter(b => b.featured).length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 dark:border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">CMS Blogs</h1>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-500/20">
              CMS v2.0
            </span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Write, optimize, and publish search-friendly buying guides and desk setup reviews.
          </p>
          {dbSource && (
            <span className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-slate-800/60 rounded-lg text-slate-500 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50">
              <span className={`w-2 h-2 rounded-full ${dbSource === "supabase" ? "bg-green-500" : "bg-purple-500 animate-pulse"}`}></span>
              Database Mode: {dbSource === "supabase" ? "Supabase Cloud Sync" : "Local Fallback JSON"}
            </span>
          )}
        </div>
        <Link 
          href="/admin/blogs/new" 
          className="px-5 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-brand-500/15 flex items-center gap-2 group"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" /> Create Blog Post
        </Link>
      </div>

      {/* Metrics Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div 
          onClick={() => setSelectedTab("all")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === "all" 
              ? "bg-brand-50/50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Articles</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-slate-800 dark:text-white">{totalCount}</span>
            <FileText className="w-5 h-5 text-slate-400" />
          </div>
        </div>

        <div 
          onClick={() => setSelectedTab("published")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === "published" 
              ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-900/60 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Published</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-green-600 dark:text-green-400">{publishedCount}</span>
            <FileCheck className="w-5 h-5 text-green-500" />
          </div>
        </div>

        <div 
          onClick={() => setSelectedTab("draft")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === "draft" 
              ? "bg-amber-50/50 dark:bg-amber-950/10 border-amber-200 dark:border-amber-900/60 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Drafts</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400">{draftCount}</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        <div 
          onClick={() => setSelectedTab("needs_review")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === "needs_review" 
              ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900/60 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Needs Review</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-red-600 dark:text-red-400">{reviewCount}</span>
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
        </div>

        <div 
          onClick={() => setSelectedTab("featured")}
          className={`p-5 rounded-2xl border transition-all cursor-pointer ${
            selectedTab === "featured" 
              ? "bg-indigo-50/50 dark:bg-indigo-950/10 border-indigo-200 dark:border-indigo-900/60 shadow-sm" 
              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
          }`}
        >
          <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Featured</p>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">{featuredCount}</span>
            <Bookmark className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
      </div>

      {/* Control panel and filters */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, slug, category, keywords..." 
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Dropdown */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl">
              <SlidersHorizontal className="w-4 h-4 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-sm font-semibold text-slate-700 dark:text-slate-300 focus:outline-none border-none outline-none pr-1"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200">
                    {cat === "All" ? "All Categories" : cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick reset */}
            {(searchQuery || selectedCategory !== "All" || selectedTab !== "all") && (
              <button 
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All");
                  setSelectedTab("all");
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl"
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Tab-styled filters */}
        <div className="flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800/60 pb-1 overflow-x-auto no-scrollbar">
          {[
            { id: "all", label: `All Posts (${totalCount})` },
            { id: "published", label: `Published (${publishedCount})` },
            { id: "draft", label: `Drafts (${draftCount})` },
            { id: "needs_review", label: `Needs Review (${reviewCount})` },
            { id: "featured", label: `Featured (${featuredCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold rounded-t-xl border-b-2 transition-all whitespace-nowrap -mb-1 ${
                selectedTab === tab.id
                  ? "border-brand-600 text-brand-600 dark:border-brand-400 dark:text-brand-400 bg-brand-500/5"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/30"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table content */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/60 dark:border-slate-800/80">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 dark:bg-slate-800/30 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider">Article Info</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Category</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Author</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider">Dates</th>
                <th className="px-5 py-4 font-bold text-xs uppercase tracking-wider text-center">SEO Score</th>
                <th className="px-6 py-4 font-bold text-xs uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/80 bg-white dark:bg-slate-900/40">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                      <span className="text-sm font-semibold text-slate-500">Loading articles...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredBlogs.length > 0 ? (
                filteredBlogs.map((blog) => {
                  const seoScore = calculateSEOHealth(blog);
                  const isActionLoading = actionLoadingId === blog.id || actionLoadingId === `dup-${blog.id}`;
                  
                  return (
                    <tr 
                      key={blog.id} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all ${
                        blog.featured ? "bg-indigo-50/10 dark:bg-indigo-950/5" : ""
                      }`}
                    >
                      {/* Title & Cover info */}
                      <td className="px-6 py-4.5 max-w-sm">
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400 group">
                            {blog.cover_image || blog.cover_image_url ? (
                              <img 
                                src={blog.cover_image || blog.cover_image_url} 
                                alt={blog.title} 
                                className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-300"
                                onError={(e) => {
                                  // fallback image icon if broken link
                                  (e.target as HTMLElement).style.display = "none";
                                }}
                              />
                            ) : (
                              <FileText className="w-5 h-5 text-brand-500/70" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 dark:text-white line-clamp-1 text-sm group-hover:text-brand-600 transition-colors">
                              {blog.title}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 line-clamp-1">
                                /{blog.slug}
                              </span>
                              {blog.featured && (
                                <span className="px-1.5 py-0.5 text-[8px] font-bold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 rounded">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-5 py-4.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <span className="px-2.5 py-1 text-xs font-semibold bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full border border-brand-500/20">
                          {blog.category || "Buying Guides"}
                        </span>
                      </td>

                      {/* Author & Read Time */}
                      <td className="px-5 py-4.5 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" /> {blog.author || "Admin"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" /> {blog.read_time || "5 min read"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4.5 whitespace-nowrap">
                        {isActionLoading ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-400">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-500" /> Updating...
                          </div>
                        ) : (
                          <button
                            onClick={() => handleTogglePublish(blog)}
                            title={`Click to ${blog.status === "published" ? "Unpublish" : "Publish"}`}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all ${
                              blog.status === "published"
                                ? "bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400"
                                : blog.status === "needs_review"
                                ? "bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400"
                                : "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:text-slate-400 hover:bg-slate-500/20"
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              blog.status === "published" ? "bg-green-500" : blog.status === "needs_review" ? "bg-red-500" : "bg-slate-400"
                            }`} />
                            <span className="capitalize">{blog.status === "needs_review" ? "Needs Review" : (blog.status || "Draft")}</span>
                          </button>
                        )}
                      </td>

                      {/* Dates */}
                      <td className="px-5 py-4.5 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        <div className="flex flex-col gap-0.5 text-xs font-medium">
                          <span className="flex items-center gap-1">
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-8">Cre:</span>
                            {new Date(blog.created_at || Date.now()).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                          </span>
                          {blog.published_at && (
                            <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-8">Pub:</span>
                              {new Date(blog.published_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" })}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SEO Score Circle */}
                      <td className="px-5 py-4.5 whitespace-nowrap text-center">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs border ${
                          seoScore >= 80
                            ? "bg-green-500/10 text-green-600 border-green-500/25 dark:text-green-400"
                            : seoScore >= 50
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/25 dark:text-amber-400"
                            : "bg-red-500/10 text-red-600 border-red-500/25 dark:text-red-400"
                        }`} title={`SEO Health Score: ${seoScore}%`}>
                          {seoScore}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4.5 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link 
                            href={`/admin/blogs/${blog.id}`} 
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-xl transition-all" 
                            title="Edit Post"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </Link>
                          
                          <a 
                            href={`http://localhost:3000/blog/${blog.slug}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-green-500 dark:hover:text-green-400 rounded-xl transition-all" 
                            title="Live Preview on Site"
                          >
                            <Eye className="w-4.5 h-4.5" />
                          </a>

                          <button 
                            disabled={isActionLoading}
                            onClick={() => handleDuplicate(blog)} 
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl transition-all disabled:opacity-50" 
                            title="Duplicate Post"
                          >
                            {actionLoadingId === `dup-${blog.id}` ? (
                              <Loader2 className="w-4.5 h-4.5 animate-spin" />
                            ) : (
                              <Copy className="w-4.5 h-4.5" />
                            )}
                          </button>

                          <button 
                            disabled={isActionLoading}
                            onClick={() => handleDelete(blog.id)} 
                            className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-xl transition-all" 
                            title="Delete Post"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2 py-4">
                      <HelpCircle className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                      <span className="text-base font-semibold text-slate-600 dark:text-slate-400">No blog posts found.</span>
                      <p className="text-xs text-slate-400 max-w-xs">
                        Try adjusting your search criteria or create your first optimized buying guide article now.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Counter indicator footer */}
        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-2 pt-2">
          <span>Showing {filteredBlogs.length} of {blogs.length} articles</span>
          <span>Last synchronized: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>
    </div>
  );
}
