"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { getBlogById, saveBlog } from "../actions";

interface ReferenceLink {
  label: string;
  url: string;
}

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!isNew);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [category, setCategory] = useState("Guides");
  const [readTime, setReadTime] = useState("5 min read");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("published");
  const [referenceLinks, setReferenceLinks] = useState<ReferenceLink[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isNew) {
      loadBlog();
    }
  }, [id]);

  const loadBlog = async () => {
    try {
      const res = await getBlogById(id);
      if (res.success && res.data) {
        const blog = res.data;
        setTitle(blog.title || "");
        setSlug(blog.slug || "");
        setCoverImage(blog.cover_image || "");
        setCategory(blog.category || "Guides");
        setReadTime(blog.read_time || "5 min read");
        setExcerpt(blog.excerpt || "");
        setContent(blog.content || "");
        setStatus(blog.status || "published");
        setReferenceLinks(blog.reference_links || []);
      } else {
        setError("Blog post not found.");
      }
    } catch (err: any) {
      setError("Failed to load blog post: " + err.message);
    } finally {
      setFetching(false);
    }
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) {
      // Auto-generate slug
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "")
      );
    }
  };

  const addReferenceLink = () => {
    setReferenceLinks([...referenceLinks, { label: "", url: "" }]);
  };

  const updateReferenceLink = (index: number, field: keyof ReferenceLink, val: string) => {
    const updated = [...referenceLinks];
    updated[index][field] = val;
    setReferenceLinks(updated);
  };

  const removeReferenceLink = (index: number) => {
    setReferenceLinks(referenceLinks.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        id: isNew ? undefined : id,
        title,
        slug,
        cover_image: coverImage,
        category,
        read_time: readTime,
        excerpt,
        content,
        reference_links: referenceLinks.filter((link) => link.label && link.url),
        status,
      };

      const res = await saveBlog(payload);
      if (res.success) {
        router.push("/admin/blogs");
        router.refresh();
      } else {
        setError(res.error || "Failed to save blog post.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during save.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/blogs"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
              {isNew ? "Create Blog Post" : "Edit Blog Post"}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Publish rich, high-quality guides and articles for your audience.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Article Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="E.g., Mechanical Keyboards: Switches Explained"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                URL Slug
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g., mechanical-keyboards-switches-explained"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              >
                <option value="Guides">Guides</option>
                <option value="Tech">Tech</option>
                <option value="Reviews">Reviews</option>
                <option value="Setup">Setup</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Read Time
              </label>
              <input
                type="text"
                required
                value={readTime}
                onChange={(e) => setReadTime(e.target.value)}
                placeholder="E.g., 5 min read"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Cover Image URL
            </label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="e.g., /blog/wfh-guide.png or external Unsplash URL"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Excerpt (Brief Summary)
            </label>
            <textarea
              rows={2}
              required
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Provide a click-worthy excerpt to show on the feed..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Main Content (Markdown / HTML Supported)</span>
            </label>
            <textarea
              rows={12}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your beautiful article content here..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none font-mono text-sm leading-relaxed"
            />
          </div>
        </div>

        {/* Reference Links Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Reference / Product Links
              </h3>
              <p className="text-sm text-slate-500">
                Link to featured gadgets or buying guide deals on your site.
              </p>
            </div>
            <button
              type="button"
              onClick={addReferenceLink}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold flex items-center gap-1.5 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Add Link
            </button>
          </div>

          {referenceLinks.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">
              No reference links added yet. Click "Add Link" to add.
            </p>
          ) : (
            <div className="space-y-4">
              {referenceLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      value={link.label}
                      onChange={(e) => updateReferenceLink(idx, "label", e.target.value)}
                      placeholder="e.g., Logitech MX Master 3S Mouse"
                      className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                    <input
                      type="text"
                      required
                      value={link.url}
                      onChange={(e) => updateReferenceLink(idx, "url", e.target.value)}
                      placeholder="e.g., /product/logitech-mx-master-3s"
                      className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeReferenceLink(idx)}
                    className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-4 pt-4">
          <Link
            href="/admin/blogs"
            className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-500/20 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? "Saving..." : "Save Post"}
          </button>
        </div>
      </form>
    </div>
  );
}
