"use client";

import { useState, useEffect } from "react";
import { getHomepageSettings, saveHomepageSettings } from "./actions";
import { supabase } from "@/lib/supabase";
import { Sparkles, Home, Save, Loader2, RefreshCw, CheckCircle2, Monitor, Package, X, GripVertical, Search } from "lucide-react";
import Image from "next/image";

export default function AdminHomepage() {
  const [settings, setSettings] = useState<any>({
    hero_badge: "",
    hero_title_accent: "",
    hero_title_fallback: "",
    hero_title_subtitle: "",
    hero_description: "",
    primary_cta_text: "",
    primary_cta_link: "",
    why_smartxman_title: "",
    why_smartxman_desc: "",
    hero_showcase_slugs: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dbSource, setDbSource] = useState("");

  // Product picker state
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showcaseSlugs, setShowcaseSlugs] = useState<string[]>([]);

  useEffect(() => {
    loadSettings();
    loadProducts();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    const res = await getHomepageSettings();
    if (res.success && res.data) {
      setSettings(res.data);
      setDbSource(res.source || "default");
      setShowcaseSlugs(Array.isArray(res.data.hero_showcase_slugs) ? res.data.hero_showcase_slugs : []);
    }
    setLoading(false);
  };

  const loadProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, images, price_range, brand, status, is_active, featured, primary_category:categories!products_primary_category_id_fkey(name)")
      .eq("status", "published")
      .order("name", { ascending: true });
    setAllProducts((data || []).filter((p: any) => p.is_active !== false));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const payload = { ...settings, hero_showcase_slugs: showcaseSlugs };
    const res = await saveHomepageSettings(payload);
    if (res.success) {
      setMessage({ type: "success", text: "Homepage settings saved! Hero showcase updated." });
      setDbSource(res.source || "local");
    } else {
      setMessage({ type: "error", text: res.error || "Failed to save settings." });
    }
    setSaving(false);
  };

  const toggleShowcaseProduct = (slug: string) => {
    setShowcaseSlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= 3) return prev; // Max 3
      return [...prev, slug];
    });
  };

  const removeShowcaseSlug = (slug: string) => {
    setShowcaseSlugs((prev) => prev.filter((s) => s !== slug));
  };

  const filteredProducts = allProducts.filter(
    (p) =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand?.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug?.toLowerCase().includes(productSearch.toLowerCase())
  );

  const showcaseProducts = showcaseSlugs
    .map((slug) => allProducts.find((p) => p.slug === slug))
    .filter(Boolean);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Home className="w-8 h-8 text-brand-600" />
            Homepage Manager
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
            Update hero headlines, CTAs, badge tags, and why-smartxman information dynamically.
          </p>
          {dbSource && (
            <span className="inline-block mt-2 text-xs font-semibold px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 uppercase tracking-wider">
              Mode: {dbSource === "supabase" ? "Supabase Sync" : "Local JSON Fallback"}
            </span>
          )}
        </div>
        <button
          onClick={loadSettings}
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
            <span className="font-bold text-slate-700 dark:text-slate-300">Fetching homepage configuration...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Edit Form */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 md:p-8 shadow-sm">
            <form onSubmit={handleSave} className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
                Hero Section Editor
              </h2>

              {message && (
                <div
                  className={`p-4 rounded-xl border text-sm font-semibold flex items-center gap-2 ${
                    message.type === "success"
                      ? "bg-green-50/50 border-green-200 text-green-700 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-400"
                      : "bg-red-50/50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5 shrink-0" />
                  {message.text}
                </div>
              )}

              {/* Badge Text */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hero Badge Notification Text
                </label>
                <input
                  type="text"
                  name="hero_badge"
                  value={settings.hero_badge || ""}
                  onChange={handleChange}
                  placeholder="e.g. 500+ Curated Picks for Smarter Buying"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Title Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Hero Title Fallback (Bold Black text)
                  </label>
                  <input
                    type="text"
                    name="hero_title_fallback"
                    value={settings.hero_title_fallback || ""}
                    onChange={handleChange}
                    placeholder="e.g. Confused"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Hero Title Accent (Purple text)
                  </label>
                  <input
                    type="text"
                    name="hero_title_accent"
                    value={settings.hero_title_accent || ""}
                    onChange={handleChange}
                    placeholder="e.g. what to buy?"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Subheading */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hero Subtitle Line
                </label>
                <input
                  type="text"
                  name="hero_title_subtitle"
                  value={settings.hero_title_subtitle || ""}
                  onChange={handleChange}
                  placeholder="e.g. Find picks that make sense."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hero Detailed Description
                </label>
                <textarea
                  name="hero_description"
                  value={settings.hero_description || ""}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Introduce smartXman value prop here..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* CTAs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Primary CTA Label
                  </label>
                  <input
                    type="text"
                    name="primary_cta_text"
                    value={settings.primary_cta_text || ""}
                    onChange={handleChange}
                    placeholder="e.g. Find My Smart Picks"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Primary CTA Action Link
                  </label>
                  <input
                    type="text"
                    name="primary_cta_link"
                    value={settings.primary_cta_link || ""}
                    onChange={handleChange}
                    placeholder="e.g. /products"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              {/* Why smartXman details */}
              <h2 className="text-xl font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 pt-6">
                Why smartXman CMS Block
              </h2>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Section Headline
                </label>
                <input
                  type="text"
                  name="why_smartxman_title"
                  value={settings.why_smartxman_title || ""}
                  onChange={handleChange}
                  placeholder="e.g. Why Smartxman?"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Description Paragraph
                </label>
                <textarea
                  name="why_smartxman_desc"
                  value={settings.why_smartxman_desc || ""}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Outline bias-free reviews value proposition..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              {/* ── Hero Showcase Product Picker ── */}
              <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                <h2 className="text-xl font-black text-slate-900 dark:text-white pb-1 flex items-center gap-2">
                  <Package className="w-5 h-5 text-brand-600" />
                  Hero Showcase Products
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                  Pick up to <strong>3 real products</strong> from your catalog to show in the hero section. If none selected, the system auto-picks your top Featured products.
                </p>

                {/* Current showcase slot display */}
                <div className="flex flex-wrap gap-2 mb-4 min-h-[2.5rem]">
                  {showcaseSlugs.length === 0 ? (
                    <span className="text-xs text-slate-400 italic px-3 py-2 bg-slate-50 dark:bg-slate-900 rounded-lg border border-dashed border-slate-200 dark:border-slate-800">
                      No products pinned — auto-picks your featured products
                    </span>
                  ) : (
                    showcaseSlugs.map((slug, idx) => {
                      const p = allProducts.find((x) => x.slug === slug);
                      return (
                        <div key={slug} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-800/60 rounded-lg text-xs font-bold text-brand-700 dark:text-brand-300">
                          <span className="text-brand-400 font-black">#{idx + 1}</span>
                          {p?.images?.[0] && (
                            <Image src={p.images[0]} alt={p.name} width={20} height={20} className="rounded object-contain" />
                          )}
                          <span className="truncate max-w-[140px]">{p?.name || slug}</span>
                          <button type="button" onClick={() => removeShowcaseSlug(slug)} className="text-brand-400 hover:text-red-500 transition-colors ml-1">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Product search + list */}
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search products by name or brand…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div className="max-h-64 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-xs text-slate-400 text-center">No published products found</div>
                  ) : (
                    filteredProducts.map((p) => {
                      const isSelected = showcaseSlugs.includes(p.slug);
                      const isDisabled = !isSelected && showcaseSlugs.length >= 3;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleShowcaseProduct(p.slug)}
                          disabled={isDisabled}
                          className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? "bg-brand-50 dark:bg-brand-950/20"
                              : isDisabled
                              ? "opacity-40 cursor-not-allowed bg-white dark:bg-slate-900"
                              : "hover:bg-slate-50 dark:hover:bg-slate-900/60 bg-white dark:bg-slate-900"
                          }`}
                        >
                          <div className="relative w-10 h-10 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 shrink-0 overflow-hidden">
                            {p.images?.[0] ? (
                              <Image src={p.images[0]} alt={p.name} fill sizes="40px" style={{ objectFit: "contain" }} className="p-1" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Package className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.name}</div>
                            <div className="text-xs text-slate-400 flex items-center gap-2">
                              <span>{p.primary_category?.name || "Tech"}</span>
                              {p.price_range && <span className="font-semibold text-brand-600 dark:text-brand-400">{p.price_range}</span>}
                              {p.featured && <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 rounded text-[9px] font-black uppercase tracking-wide">Featured</span>}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? "bg-brand-600 border-brand-600" : "border-slate-300 dark:border-slate-700"}`}>
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {showcaseSlugs.length}/3 slots used · Save below to apply changes to the live homepage
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-black uppercase tracking-wider text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-brand-500/10 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving changes...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Homepage Settings
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Mockup Preview */}
          <div className="lg:col-span-5 flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-sm">
              <Monitor className="w-4 h-4" />
              Live Visual Preview Mockup
            </div>

            <div className="bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm overflow-hidden flex flex-col justify-between aspect-[4/5] relative">
              {/* Mesh style bg grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#6366f1_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

              <div className="space-y-6 relative z-10">
                {/* Simulated Badge */}
                {settings.hero_badge && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-[10px] font-black uppercase tracking-wider border border-brand-100 dark:border-brand-800/30">
                    <Sparkles className="w-3 h-3 text-brand-600" />
                    {settings.hero_badge}
                  </div>
                )}

                {/* Simulated Title */}
                <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-950 dark:text-white leading-[1.1]">
                  {settings.hero_title_fallback}{" "}
                  <span className="text-brand-600">{settings.hero_title_accent}</span>
                  <br />
                  <span className="text-slate-400 dark:text-slate-600 text-2xl md:text-3xl font-black block mt-2">
                    {settings.hero_title_subtitle}
                  </span>
                </h1>

                {/* Simulated Description */}
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                  {settings.hero_description || "Start describing your gear recommendation dashboard details here..."}
                </p>

                {/* Simulated Search Selector mockup */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-150 dark:border-slate-800 shadow-sm space-y-3">
                  <div className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Goal Suggestion Selector
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <span className="px-2 py-1.5 rounded-lg border border-brand-200 bg-brand-50/50 text-[10px] font-bold text-center text-brand-600 dark:bg-brand-950/20 dark:border-brand-900/30">
                      Student Setup
                    </span>
                    <span className="px-2 py-1.5 rounded-lg border border-slate-100 bg-slate-50/30 text-[10px] font-bold text-center text-slate-400">
                      Gaming Setup
                    </span>
                  </div>
                </div>
              </div>

              {/* simulated footer action */}
              <div className="relative z-10 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col space-y-3">
                <button className="w-full py-3 bg-brand-600 text-white rounded-xl font-black text-xs uppercase tracking-wider text-center">
                  {settings.primary_cta_text || "Find My Smart Picks"}
                </button>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-150 dark:border-slate-800 shadow-sm space-y-1">
                  <div className="text-[10px] font-black text-slate-800 dark:text-white uppercase">
                    {settings.why_smartxman_title || "Why smartXman?"}
                  </div>
                  <div className="text-[9px] text-slate-400 dark:text-slate-500 font-semibold leading-relaxed">
                    {settings.why_smartxman_desc || "Explanation..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
