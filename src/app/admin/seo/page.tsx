"use client";

import { useState, useEffect, useRef } from "react";
import {
  Search,
  Save,
  Loader2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  Globe,
  Share2,
  ShieldCheck,
  FileText,
  BarChart3,
  Image as ImageIcon,
  Upload,
  Trash2,
  ExternalLink,
  Home,
  Package,
  Grid3X3,
  Wrench,
  Wallet,
  Percent,
  BookOpen,
  Info,
  LayoutTemplate,
  Scale,
  Lock,
  Mail,
  MapPin,
  X,
  Check,
  ChevronDown
} from "lucide-react";
import { getSeoSettings, saveSeoSettings } from "./actions";
import { supabase } from "@/lib/supabase";

// ──────────────────────────────────────────────
// Page definitions with groups
// ──────────────────────────────────────────────

interface PageDef {
  key: string;
  label: string;
  icon: any;
}

interface PageGroup {
  title: string;
  pages: PageDef[];
}

const pageGroups: PageGroup[] = [
  {
    title: "Core Pages",
    pages: [
      { key: "homepage", label: "Homepage", icon: Home },
      { key: "products", label: "Products", icon: Package },
      { key: "categories", label: "Categories", icon: Grid3X3 },
      { key: "build-my-setup", label: "Build My Setup", icon: Wrench },
      { key: "budget-picks", label: "Budget Picks", icon: Wallet },
      { key: "deals", label: "Deals", icon: Percent },
      { key: "blog", label: "Blog", icon: BookOpen },
      { key: "about", label: "About", icon: Info },
    ]
  },
  {
    title: "Dynamic Templates",
    pages: [
      { key: "product-template", label: "Product Detail", icon: LayoutTemplate },
      { key: "category-template", label: "Category Detail", icon: LayoutTemplate },
      { key: "blog-template", label: "Blog Detail", icon: LayoutTemplate },
      { key: "deal-template", label: "Deal Detail", icon: LayoutTemplate },
    ]
  },
  {
    title: "Legal / Trust",
    pages: [
      { key: "affiliate-disclosure", label: "Affiliate Disclosure", icon: Scale },
      { key: "privacy-policy", label: "Privacy Policy", icon: Lock },
      { key: "terms", label: "Terms of Service", icon: FileText },
      { key: "contact", label: "Contact", icon: Mail },
    ]
  }
];

const allPageKeys = pageGroups.flatMap(g => g.pages.map(p => p.key));

const changeFreqOptions = [
  "always", "hourly", "daily", "weekly", "monthly", "yearly", "never"
];

// ──────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────

export default function AdminSeo() {
  const [seoMap, setSeoMap] = useState<any>({});
  const [selectedPage, setSelectedPage] = useState<string>("homepage");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dbSource, setDbSource] = useState("");

  // Original snapshot for reset
  const [originalFields, setOriginalFields] = useState<any>({});

  // Form State — extended
  const [fields, setFields] = useState<any>({
    page_name: "",
    meta_title: "",
    meta_description: "",
    focus_keyword: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    og_image_alt: "",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.7,
    change_frequency: "weekly"
  });

  // ─── Effects ────────────────────────────────
  useEffect(() => {
    loadSeo();
  }, []);

  useEffect(() => {
    if (seoMap[selectedPage]) {
      const loaded = {
        page_name: seoMap[selectedPage].page_name || "",
        meta_title: seoMap[selectedPage].meta_title || "",
        meta_description: seoMap[selectedPage].meta_description || "",
        focus_keyword: seoMap[selectedPage].focus_keyword || "",
        canonical_url: seoMap[selectedPage].canonical_url || "",
        og_title: seoMap[selectedPage].og_title || "",
        og_description: seoMap[selectedPage].og_description || "",
        og_image_url: seoMap[selectedPage].og_image_url || seoMap[selectedPage].og_image || "",
        og_image_alt: seoMap[selectedPage].og_image_alt || "",
        noindex: !!seoMap[selectedPage].noindex,
        include_in_sitemap: seoMap[selectedPage].include_in_sitemap !== false,
        sitemap_priority: seoMap[selectedPage].sitemap_priority ?? 0.7,
        change_frequency: seoMap[selectedPage].change_frequency || "weekly"
      };
      setFields(loaded);
      setOriginalFields(loaded);
    }
  }, [selectedPage, seoMap]);

  // ─── Handlers ───────────────────────────────
  const loadSeo = async () => {
    setLoading(true);
    setMessage(null);
    const res = await getSeoSettings();
    if (res.success && res.data) {
      setSeoMap(res.data);
      setDbSource(res.source || "default");
    }
    setLoading(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFields((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFields((prev: any) => ({ ...prev, [name]: checked }));
  };

  const handlePriorityChange = (value: string) => {
    const num = Math.min(1, Math.max(0, parseFloat(value) || 0));
    setFields((prev: any) => ({ ...prev, sitemap_priority: num }));
  };

  const handleReset = () => {
    setFields({ ...originalFields });
    setMessage(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await saveSeoSettings(selectedPage, fields);
    if (res.success && res.data) {
      setSeoMap(res.data);
      setOriginalFields({ ...fields });
      setMessage({ type: "success", text: "SEO settings saved successfully." });
      setDbSource(res.source || "local");
      setTimeout(() => setMessage(null), 4000);
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save SEO settings." });
    }
    setSaving(false);
  };

  // OG image upload
  const handleOgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: "error", text: "Invalid image format. Use PNG, JPG, JPEG, or WEBP." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "Image exceeds 5MB limit." });
      return;
    }

    setUploading(true);
    try {
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
      const fileName = `${Date.now()}_${sanitizedName}`;
      const filePath = `seo-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) throw new Error(uploadError.message);

      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
      setFields((prev: any) => ({ ...prev, og_image_url: publicUrl }));
      setMessage({ type: "success", text: "OG image uploaded successfully." });
      setTimeout(() => setMessage(null), 3000);
    } catch (err: any) {
      setMessage({ type: "error", text: "Upload failed: " + err.message });
    } finally {
      setUploading(false);
    }
  };

  // ─── SEO Health Score ───────────────────────
  const calculateHealthScore = () => {
    let score = 0;
    let total = 0;

    const add = (met: boolean) => { total++; if (met) score++; };

    add(fields.meta_title.trim().length > 0);
    add(fields.meta_title.trim().length >= 50 && fields.meta_title.trim().length <= 60);
    add(fields.meta_description.trim().length > 0);
    add(fields.meta_description.trim().length >= 140 && fields.meta_description.trim().length <= 160);
    add(fields.focus_keyword.trim().length > 0);
    add(fields.focus_keyword.trim().length > 0 && fields.meta_title.toLowerCase().includes(fields.focus_keyword.toLowerCase()));
    add(fields.focus_keyword.trim().length > 0 && fields.meta_description.toLowerCase().includes(fields.focus_keyword.toLowerCase()));
    add(fields.canonical_url.trim().length > 0);
    add(fields.og_title.trim().length > 0);
    add(fields.og_description.trim().length > 0);
    add(fields.og_image_url.trim().length > 0);
    add(!fields.noindex);
    add(fields.include_in_sitemap);

    return Math.round((score / total) * 100);
  };

  const healthScore = loading ? 0 : calculateHealthScore();

  // ─── Helper: char counter status ────────────
  const charStatus = (len: number, min: number, max: number) => {
    if (len === 0) return { label: "Empty", color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800" };
    if (len < min) return { label: "Too short", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/20" };
    if (len > max) return { label: "Too long", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/20" };
    return { label: "Good", color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/20" };
  };

  const titleStatus = charStatus(fields.meta_title.length, 50, 60);
  const descStatus = charStatus(fields.meta_description.length, 140, 160);

  // ─── Render ─────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          <span className="font-bold text-sm text-slate-600 dark:text-slate-400">Loading SEO settings...</span>
        </div>
      </div>
    );
  }

  const healthColor =
    healthScore >= 80
      ? "text-green-500 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
      : healthScore >= 50
      ? "text-amber-500 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
      : "text-red-500 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20";

  // Find current page label
  const currentPageDef = pageGroups.flatMap(g => g.pages).find(p => p.key === selectedPage);

  return (
    <div className="p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* ─── Header ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
              <Search className="w-5 h-5" />
            </div>
            SEO & Metadata Manager
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 max-w-xl">
            Manage search engine optimization, social sharing metadata, and sitemap settings for all smartXman pages.
          </p>
          {dbSource && (
            <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 uppercase tracking-wider">
              <span className={`w-1.5 h-1.5 rounded-full ${dbSource === "supabase" ? "bg-green-500" : dbSource === "local" ? "bg-amber-500" : "bg-slate-400"}`}></span>
              {dbSource === "supabase" ? "Supabase Sync" : dbSource === "local" ? "Local JSON" : "Defaults"}
            </span>
          )}
        </div>
        <button
          onClick={loadSeo}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-bold text-slate-600 dark:text-slate-300"
        >
          <RefreshCw className="w-4 h-4" />
          Reload
        </button>
      </div>

      {/* ─── Message Toast ──────────────────── */}
      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-2.5 transition-all ${
            message.type === "success"
              ? "bg-green-50/80 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-900/40 dark:text-green-400"
              : "bg-red-50/80 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/40 dark:text-red-400"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto p-0.5 hover:opacity-60 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ─── Main Layout ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ─── LEFT: Page Selector ──────────── */}
        <div className="lg:col-span-3 space-y-1">
          {pageGroups.map((group, gIdx) => (
            <div key={gIdx} className="mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 px-3 mb-2">
                {group.title}
              </p>
              <div className="space-y-1">
                {group.pages.map((page) => {
                  const Icon = page.icon;
                  const isActive = selectedPage === page.key;
                  return (
                    <button
                      key={page.key}
                      onClick={() => { setSelectedPage(page.key); setMessage(null); }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2.5 ${
                        isActive
                          ? "bg-brand-600 text-white shadow-lg shadow-brand-500/15"
                          : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/60 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:border-slate-200 dark:hover:border-slate-700"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isActive ? "text-white/80" : "text-slate-400"}`} />
                      {page.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* ─── CENTER: Main Form ────────────── */}
        <div className="lg:col-span-6 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">

            {/* Card header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
                  {currentPageDef?.label || selectedPage}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">/{selectedPage}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Reset Changes
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-brand-500/15 disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Settings
                </button>
              </div>
            </div>

            {/* ─── CARD: Basic SEO ──────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Globe className="w-4 h-4 text-brand-500" />
                Basic SEO
              </h3>

              {/* Meta Title */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Meta Title <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${titleStatus.bg} ${titleStatus.color}`}>
                    {fields.meta_title.length} chars · {titleStatus.label}
                  </span>
                </div>
                <input
                  type="text"
                  name="meta_title"
                  value={fields.meta_title}
                  onChange={handleChange}
                  placeholder="e.g., smartXman | Smart Product Picks That Actually Make Sense"
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">Recommended: 50–60 characters. This appears as the clickable headline in search results.</p>
              </div>

              {/* Meta Description */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Meta Description <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${descStatus.bg} ${descStatus.color}`}>
                    {fields.meta_description.length} chars · {descStatus.label}
                  </span>
                </div>
                <textarea
                  name="meta_description"
                  value={fields.meta_description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Summarize this page's content for search engine result cards..."
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white resize-none"
                />
                <p className="text-[10px] text-slate-400">Recommended: 140–160 characters. Use clear keywords naturally. Do not stuff keywords.</p>
              </div>

              {/* Focus Keyword */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Focus Keyword</label>
                <input
                  type="text"
                  name="focus_keyword"
                  value={fields.focus_keyword}
                  onChange={handleChange}
                  placeholder="e.g., smart product recommendations"
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white"
                />
                {fields.focus_keyword.trim() && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      fields.meta_title.toLowerCase().includes(fields.focus_keyword.toLowerCase())
                        ? "bg-green-50 dark:bg-green-950/20 text-green-600" : "bg-red-50 dark:bg-red-950/20 text-red-500"
                    }`}>
                      {fields.meta_title.toLowerCase().includes(fields.focus_keyword.toLowerCase())
                        ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      In Title
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                      fields.meta_description.toLowerCase().includes(fields.focus_keyword.toLowerCase())
                        ? "bg-green-50 dark:bg-green-950/20 text-green-600" : "bg-red-50 dark:bg-red-950/20 text-red-500"
                    }`}>
                      {fields.meta_description.toLowerCase().includes(fields.focus_keyword.toLowerCase())
                        ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                      In Description
                    </span>
                  </div>
                )}
              </div>

              {/* Canonical URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Canonical URL</label>
                <input
                  type="text"
                  name="canonical_url"
                  value={fields.canonical_url}
                  onChange={handleChange}
                  placeholder="e.g., https://smartxman.vercel.app/products"
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white font-mono text-xs"
                />
              </div>

              {/* Noindex toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="noindex"
                  name="noindex"
                  checked={!!fields.noindex}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
                />
                <div>
                  <label htmlFor="noindex" className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 cursor-pointer">
                    Apply noindex tag
                    {fields.noindex && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded">
                        Blocked
                      </span>
                    )}
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Tells search engines not to index this page in search results.
                  </p>
                </div>
              </div>
            </div>

            {/* ─── CARD: Open Graph ─────────── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-brand-500" />
                Open Graph (Social Sharing)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">OG Title</label>
                  <input
                    type="text"
                    name="og_title"
                    value={fields.og_title}
                    onChange={handleChange}
                    placeholder="Title shown on social shares"
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">OG Image Alt Text</label>
                  <input
                    type="text"
                    name="og_image_alt"
                    value={fields.og_image_alt}
                    onChange={handleChange}
                    placeholder="Describe the OG image for accessibility"
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">OG Description</label>
                <textarea
                  name="og_description"
                  value={fields.og_description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Description shown when shared on social platforms..."
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* OG Image URL + Upload */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">OG Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="og_image_url"
                    value={fields.og_image_url}
                    onChange={handleChange}
                    placeholder="https://... or /og-image.png"
                    className="flex-1 px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white font-mono text-xs"
                  />
                  <label className="px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Upload
                    <input type="file" className="hidden" accept="image/*" onChange={handleOgImageUpload} />
                  </label>
                </div>
                <p className="text-[10px] text-slate-400">Recommended size: 1200 × 630 px. Paste a URL or upload an image.</p>

                {/* OG Image Preview */}
                {fields.og_image_url && (
                  <div className="relative w-full max-w-md aspect-[1200/630] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                    <img
                      src={fields.og_image_url}
                      alt={fields.og_image_alt || "OG Image Preview"}
                      className="w-full h-full object-cover"
                      onError={(e: any) => { e.target.style.display = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setFields((prev: any) => ({ ...prev, og_image_url: "" }))}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ─── CARD: Sitemap Settings ───── */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-6 shadow-sm space-y-5">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-500" />
                Sitemap Settings
              </h3>

              {/* Include in sitemap toggle */}
              <div className="flex items-center gap-3 p-4 bg-slate-50/50 dark:bg-slate-800/20 rounded-xl border border-slate-100 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="include_in_sitemap"
                  name="include_in_sitemap"
                  checked={!!fields.include_in_sitemap}
                  onChange={handleCheckboxChange}
                  className="w-5 h-5 accent-brand-600 rounded cursor-pointer"
                />
                <div>
                  <label htmlFor="include_in_sitemap" className="text-sm font-bold text-slate-800 dark:text-white cursor-pointer flex items-center gap-1.5">
                    Include in Sitemap
                    {fields.include_in_sitemap && (
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-green-100 dark:bg-green-950/30 text-green-600 dark:text-green-400 rounded">
                        Active
                      </span>
                    )}
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Enable to include this page in the XML sitemap submitted to search engines.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sitemap Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Sitemap Priority</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={fields.sitemap_priority}
                      onChange={(e) => handlePriorityChange(e.target.value)}
                      className="flex-1 accent-brand-600"
                    />
                    <span className="text-sm font-black text-brand-600 w-10 text-center">{fields.sitemap_priority.toFixed(1)}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">0.0 (lowest) to 1.0 (highest). Homepage should be 1.0.</p>
                </div>

                {/* Change Frequency */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Change Frequency</label>
                  <select
                    name="change_frequency"
                    value={fields.change_frequency}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    {changeFreqOptions.map(opt => (
                      <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400">How often you expect this page content to change.</p>
                </div>
              </div>
            </div>

            {/* ─── Bottom Save Bar ──────────── */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-5 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all"
              >
                Reset Changes
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black text-sm transition-all flex items-center gap-2 shadow-lg shadow-brand-500/15 disabled:opacity-60"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save SEO Settings
              </button>
            </div>
          </form>
        </div>

        {/* ─── RIGHT: Sidebar ───────────────── */}
        <div className="lg:col-span-3 space-y-6 lg:sticky lg:top-6">

          {/* ─── SEO Health Score ────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-brand-500" />
              SEO Health Score
            </h3>

            <div className="flex flex-col items-center py-3 space-y-3">
              <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${healthColor}`}>
                <span className="text-2xl font-black">{healthScore}%</span>
                <span className="text-[8px] font-bold uppercase tracking-wider">
                  {healthScore >= 80 ? "Ready" : healthScore >= 50 ? "Review" : "Low"}
                </span>
              </div>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 text-center">
                {healthScore >= 80 ? "SEO optimized & ready!" : healthScore >= 50 ? "Almost ready — fill missing fields" : "Needs more optimization"}
              </p>
            </div>

            {/* Checklist */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              {[
                { label: "Meta title added", met: fields.meta_title.trim().length > 0 },
                { label: "Title length (50-60)", met: fields.meta_title.length >= 50 && fields.meta_title.length <= 60 },
                { label: "Description added", met: fields.meta_description.trim().length > 0 },
                { label: "Description length (140-160)", met: fields.meta_description.length >= 140 && fields.meta_description.length <= 160 },
                { label: "Focus keyword set", met: fields.focus_keyword.trim().length > 0 },
                { label: "Keyword in title", met: fields.focus_keyword.trim().length > 0 && fields.meta_title.toLowerCase().includes(fields.focus_keyword.toLowerCase()) },
                { label: "Keyword in description", met: fields.focus_keyword.trim().length > 0 && fields.meta_description.toLowerCase().includes(fields.focus_keyword.toLowerCase()) },
                { label: "Canonical URL set", met: fields.canonical_url.trim().length > 0 },
                { label: "OG title added", met: fields.og_title.trim().length > 0 },
                { label: "OG description added", met: fields.og_description.trim().length > 0 },
                { label: "OG image added", met: fields.og_image_url.trim().length > 0 },
                { label: "Page is indexed", met: !fields.noindex },
                { label: "In sitemap", met: !!fields.include_in_sitemap },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 dark:text-slate-400">{item.label}</span>
                  {item.met ? (
                    <Check className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <X className="w-3.5 h-3.5 text-red-400" />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Google Search Preview ──────── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Search className="w-4 h-4 text-brand-500" />
              Google Preview
            </h3>

            <div className="p-4 bg-white dark:bg-slate-950 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
              {/* Google-style title */}
              <h4 className="text-[15px] font-medium text-[#1a0dab] dark:text-blue-400 leading-snug line-clamp-1 cursor-pointer hover:underline" style={{ fontFamily: "Arial, sans-serif" }}>
                {fields.meta_title || "Page Title — smartXman"}
              </h4>
              {/* Google-style URL */}
              <p className="text-[12px] text-[#006621] dark:text-green-400 truncate" style={{ fontFamily: "Arial, sans-serif" }}>
                {fields.canonical_url || "https://smartxman.vercel.app"}
              </p>
              {/* Google-style description */}
              <p className="text-[13px] text-[#545454] dark:text-slate-400 line-clamp-2 leading-relaxed" style={{ fontFamily: "Arial, sans-serif" }}>
                {fields.meta_description || "No meta description set. Search engines will auto-generate a snippet."}
              </p>
            </div>
          </div>

          {/* ─── Social Share Preview ───────── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/80 p-5 shadow-sm space-y-3">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-500" />
              Social Preview
            </h3>

            <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950">
              {/* OG Image area */}
              <div className="w-full aspect-[1200/630] bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {fields.og_image_url ? (
                  <img
                    src={fields.og_image_url}
                    alt={fields.og_image_alt || "Social preview"}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-300 dark:text-slate-600">
                    <ImageIcon className="w-8 h-8" />
                    <span className="text-[10px] font-bold">No OG Image</span>
                  </div>
                )}
              </div>
              {/* OG text */}
              <div className="p-3 space-y-1 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold truncate">
                  {(fields.canonical_url || "smartxman.vercel.app").replace(/^https?:\/\//, "").split("/")[0]}
                </p>
                <h4 className="text-sm font-bold text-slate-800 dark:text-white line-clamp-2 leading-snug">
                  {fields.og_title || fields.meta_title || "OG Title"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {fields.og_description || fields.meta_description || "OG Description will appear here when shared."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
