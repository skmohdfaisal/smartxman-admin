"use client";

import { useState, useEffect } from "react";
import { Search, Save, Loader2, RefreshCw, CheckCircle, HelpCircle, Eye } from "lucide-react";
import { getSeoSettings, saveSeoSettings } from "./actions";

export default function AdminSeo() {
  const [seoMap, setSeoMap] = useState<any>({});
  const [selectedPage, setSelectedPage] = useState<string>("home");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dbSource, setDbSource] = useState("");

  // Form State
  const [fields, setFields] = useState<any>({
    meta_title: "",
    meta_description: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image: "",
    noindex: false
  });

  useEffect(() => {
    loadSeo();
  }, []);

  useEffect(() => {
    if (seoMap[selectedPage]) {
      setFields(seoMap[selectedPage]);
    }
  }, [selectedPage, seoMap]);

  const loadSeo = async () => {
    setLoading(true);
    const res = await getSeoSettings();
    if (res.success && res.data) {
      setSeoMap(res.data);
      setDbSource(res.source || "default");
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFields((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFields((prev: any) => ({ ...prev, [name]: checked }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await saveSeoSettings(selectedPage, fields);
    if (res.success && res.data) {
      setSeoMap(res.data);
      setMessage({ type: "success", text: `SEO settings for /${selectedPage} page successfully saved!` });
      setDbSource(res.source || "local");
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save SEO settings." });
    }
    setSaving(false);
  };

  const pages = [
    { key: "home", label: "Homepage Feed" },
    { key: "products", label: "Products Catalog" },
    { key: "blogs", label: "Blogs & Guides" },
    { key: "deals", label: "Special Deals" }
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Search className="w-8 h-8 text-brand-600" />
            SEO & Metadata Manager
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Optimize pages with rich meta descriptions, canonical roots, and social sharing OpenGraph assets.
          </p>
          {dbSource && (
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 uppercase tracking-wider">
              Source: {dbSource === "supabase" ? "Supabase Sync" : "Local seo_db.json"}
            </span>
          )}
        </div>
        <button
          onClick={loadSeo}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-700 dark:text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />
          Reload
        </button>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-16 text-center text-slate-500">
          <div className="flex items-center justify-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
            <span className="font-bold text-slate-700 dark:text-slate-300">Fetching meta index settings...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Tab Selector */}
          <div className="lg:col-span-3 flex flex-col gap-2">
            <div className="text-xs font-black uppercase tracking-wider text-slate-450 mb-2">
              Select Site Page
            </div>
            {pages.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPage(p.key)}
                className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                  selectedPage === p.key
                    ? "bg-brand-600 text-white shadow-lg shadow-brand-500/10"
                    : "bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Form Content */}
          <div className="lg:col-span-9 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm space-y-6">
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 uppercase tracking-tight text-brand-600">
                /{selectedPage} Meta Tag Sheet
              </h2>

              {message && (
                <div
                  className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-green-50/50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400"
                      : "bg-red-50/50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
                  }`}
                >
                  <CheckCircle className="w-5 h-5 shrink-0" />
                  {message.text}
                </div>
              )}

              {/* Meta Title */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  Meta Title
                  <span className="text-slate-400 text-[10px] lowercase font-medium">
                    (Recommended: 50-60 characters)
                  </span>
                </label>
                <input
                  type="text"
                  name="meta_title"
                  value={fields.meta_title || ""}
                  onChange={handleChange}
                  placeholder="e.g. smartXman | Curated Tech Gear Guides"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  Meta Description
                  <span className="text-slate-400 text-[10px] lowercase font-medium">
                    (Recommended: 120-160 characters)
                  </span>
                </label>
                <textarea
                  name="meta_description"
                  value={fields.meta_description || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Summarize page content for search result cards..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Canonical URL */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Canonical URL
                </label>
                <input
                  type="text"
                  name="canonical_url"
                  value={fields.canonical_url || ""}
                  onChange={handleChange}
                  placeholder="e.g. https://smartxman.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Social OpenGraph Header */}
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 border-t border-slate-100 dark:border-slate-800 pt-6 pb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-slate-400" />
                OpenGraph Settings (Social Sharing)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    OG:Title
                  </label>
                  <input
                    type="text"
                    name="og_title"
                    value={fields.og_title || ""}
                    onChange={handleChange}
                    placeholder="e.g. smartXman | Discover Tech & Gear"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    OG:Image Asset URL
                  </label>
                  <input
                    type="text"
                    name="og_image"
                    value={fields.og_image || ""}
                    onChange={handleChange}
                    placeholder="e.g. /transparent_logo.png"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  OG:Description
                </label>
                <textarea
                  name="og_description"
                  value={fields.og_description || ""}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Provide social banner context snippet..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* No Index Toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl border border-slate-150 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="noindex"
                  name="noindex"
                  checked={!!fields.noindex}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 accent-brand-650 rounded cursor-pointer"
                />
                <div>
                  <label htmlFor="noindex" className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    Apply `noindex` tag
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-50 text-red-650 rounded">
                      indexing block
                    </span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Tells search engines not to index this page in search result feeds.
                  </p>
                </div>
              </div>

              {/* Action */}
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-8 py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-500/10 disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving changes...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      Save SEO Settings
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
