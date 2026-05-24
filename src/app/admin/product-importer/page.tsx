"use client";

import { useState } from "react";
import { Bot, Package, Search, Link as LinkIcon, AlertCircle, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { extractAsin, searchAmazonProducts } from "../actions";
import { supabase } from "@/lib/supabase";

export default function ProductImporterPage() {
  const [mode, setMode] = useState<"manual" | "ai">("manual");
  
  // Manual form state
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [budget, setBudget] = useState("");
  const [audience, setAudience] = useState("");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState("");
  
  // AI Auto-Import state
  const [aiUrl, setAiUrl] = useState("");
  const [aiTitle, setAiTitle] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const handleManualImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const asin = await extractAsin(url);
      if (!asin) {
        setMessage({ type: "error", text: "Could not extract ASIN from URL. Please check the Amazon link." });
        setLoading(false);
        return;
      }

      // Check auth for admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Generate a slug based on title + asin to ensure uniqueness
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${asin.toLowerCase()}`;

      // Insert product as draft
      const { data, error } = await supabase.from("products").insert([{
        name: title,
        slug,
        asin,
        affiliate_url: url,
        source: 'amazon',
        marketplace: 'www.amazon.in',
        import_source: 'manual',
        approval_status: 'draft',
        expert_note: note,
        best_for: audience,
        price_range: budget, // Using price_range field to store budget text
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      }]);

      if (error) {
        throw error;
      }

      setMessage({ type: "success", text: `Product imported as draft! ASIN: ${asin}` });
      // Reset form
      setUrl(""); setTitle(""); setCategory(""); setBudget(""); setAudience(""); setNote(""); setTags("");
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to import product." });
    } finally {
      setLoading(false);
    }
  };

  const handleAiImport = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const asin = await extractAsin(aiUrl);
      if (!asin) {
        setMessage({ type: "error", text: "Could not extract ASIN from URL. Please check the Amazon link." });
        setLoading(false);
        return;
      }

      // Check auth for admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      setMessage({ type: "success", text: "Generating rich AI metadata..." });

      // Call AI Enrich Endpoint
      const res = await fetch("/api/ai/enrich-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: aiTitle })
      });
      
      const enrichedData = await res.json();
      if (!res.ok) throw new Error(enrichedData.error || "AI Enrichment failed.");

      const baseSlug = aiTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${asin.toLowerCase()}`;

      // Insert product as needs_review
      const { data, error } = await supabase.from("products").insert([{
        name: aiTitle,
        slug,
        asin,
        affiliate_url: aiUrl,
        source: 'amazon',
        marketplace: 'www.amazon.in',
        import_source: 'ai_auto',
        approval_status: 'needs_review',
        brand: enrichedData.brand,
        description: enrichedData.description,
        price_range: enrichedData.price_range,
        rating: parseFloat(enrichedData.rating) || 0,
        audience: enrichedData.audience,
        use_case: enrichedData.use_case,
        tags: enrichedData.tags,
        budget_range: enrichedData.budget_range,
        expert_note: enrichedData.expert_note,
        pros: enrichedData.pros,
        cons: enrichedData.cons,
        buying_verdict: enrichedData.buying_verdict,
        smart_score: enrichedData.smart_score,
        value_score: enrichedData.value_score,
        seo_title: enrichedData.seo_title,
        seo_description: enrichedData.seo_description,
      }]);

      if (error) {
        throw error;
      }

      setMessage({ type: "success", text: `Product fully enriched & imported! Sent to Review Queue.` });
      setAiUrl(""); 
      setAiTitle("");
    } catch (err: any) {
      console.error(err);
      setMessage({ type: "error", text: err.message || "Failed to auto-import product." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <Package className="w-8 h-8 text-brand-600" />
          Product Importer
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Safely import Amazon affiliate products. Imported products are saved as drafts and require manual review.</p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 mb-8 shadow-sm">
        <div className="flex gap-4 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
          <button 
            onClick={() => setMode("manual")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${mode === "manual" ? "bg-brand-600 text-white shadow-md shadow-brand-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
          >
            Manual Link Import
          </button>
          <button 
            onClick={() => setMode("ai")}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${mode === "ai" ? "bg-gradient-to-r from-purple-600 to-brand-600 text-white shadow-md shadow-purple-500/20" : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"}`}
          >
            <Sparkles className="w-4 h-4" /> AI Auto-Import
          </button>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-xl flex items-start gap-3 ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {message.type === "success" ? <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <p className="font-medium">{message.text}</p>
          </div>
        )}

        {mode === "manual" ? (
          <form onSubmit={handleManualImport} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Amazon Product URL</label>
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="url" 
                  required
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.amazon.in/dp/BXXXXXXXXX"
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="E.g., Logitech MX Master 3S"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Category Name/ID</label>
                <input 
                  type="text" 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Tech, Setup, etc."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Target Audience (Best For)</label>
                <input 
                  type="text" 
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="Programmers, Gamers..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Budget Range</label>
                <input 
                  type="text" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  placeholder="e.g., Premium, Budget, ₹5,000"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tags (comma separated)</label>
              <input 
                type="text" 
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="wireless, ergonomic, usb-c"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Expert Note</label>
              <textarea 
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Brief note on why we recommend this..."
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none resize-none"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Package className="w-5 h-5" />}
              {loading ? "Importing..." : "Save as Draft"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleAiImport} className="space-y-6">
            <div className="p-6 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/50 rounded-2xl flex gap-4 text-purple-800 dark:text-purple-300">
              <Bot className="w-6 h-6 flex-shrink-0" />
              <div>
                <h4 className="font-bold text-lg mb-1">Groq AI Enrichment</h4>
                <p className="text-sm leading-relaxed">Provide the Amazon URL and the Product Name. Our AI will automatically generate expert notes, pros, cons, and smart scores, then send the product straight to your Import Review queue!</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Amazon Product URL</label>
                <div className="relative">
                  <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    type="url" 
                    required
                    value={aiUrl}
                    onChange={(e) => setAiUrl(e.target.value)}
                    placeholder="https://www.amazon.in/dp/BXXXXXXXXX"
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Product Name</label>
                <input 
                  type="text" 
                  required
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  placeholder="e.g., Logitech MX Master 3S Wireless Mouse"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-brand-600 hover:from-purple-700 hover:to-brand-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              {loading ? "AI is generating details..." : "Auto-Enrich & Import to Review Queue"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
