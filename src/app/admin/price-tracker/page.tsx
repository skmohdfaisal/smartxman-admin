"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  ExternalLink, 
  Check, 
  X, 
  Edit, 
  Copy, 
  Loader2, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  Tag, 
  EyeOff, 
  AlertCircle,
  FolderSync
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PriceUpdateModal } from "@/components/PriceUpdateModal";
import { 
  markCheckedTodayBulk, 
  hidePricesBulk, 
  setNeedsUpdateBulk 
} from "./actions";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function PriceTrackerPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, fresh, needs_update, hidden, missing_price, published
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [freshnessWindow, setFreshnessWindow] = useState(7);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProductsAndSettings();
  }, []);

  const fetchProductsAndSettings = async () => {
    setLoading(true);
    try {
      // Fetch both site settings and products concurrently
      const [settingsRes, productsRes] = await Promise.all([
        supabase
          .from("site_settings")
          .select("price_freshness_window")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("products")
          .select("*, primary_category:categories!products_primary_category_id_fkey(name)")
          .order("name", { ascending: true })
      ]);

      if (settingsRes.data && settingsRes.data.price_freshness_window) {
        setFreshnessWindow(settingsRes.data.price_freshness_window);
      }

      if (productsRes.error) throw productsRes.error;
      setProducts(productsRes.data || []);
    } catch (err) {
      console.error("Error fetching price tracker products:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchProductsAndSettings();
  };

  // Helper: check if price is stale/fresh
  const isStale = (checkedAt: string | null) => {
    if (!checkedAt) return true;
    const diffTime = Math.abs(new Date().getTime() - new Date(checkedAt).getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > freshnessWindow;
  };

  // Get pricing status
  const getProductPriceStatus = (p: any) => {
    if (p.current_price === null || p.current_price === undefined) {
      return { label: "Missing Price", color: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400" };
    }
    if (!p.price_is_fresh) {
      return { label: "Hidden", color: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400" };
    }
    if (isStale(p.last_price_checked_at)) {
      return { label: "Needs Update", color: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400" };
    }
    return { label: "Fresh", color: "bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20 dark:text-emerald-450" };
  };

  const handleCopyLink = (link: string, id: string) => {
    if (link) {
      navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Bulk Actions
  const handleBulkCheckToday = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to mark ${selectedIds.length} selected products as checked today?`)) return;

    setRefreshing(true);
    const res = await markCheckedTodayBulk(selectedIds);
    if (res.success) {
      alert("Successfully marked as checked today!");
      setSelectedIds([]);
      fetchProductsAndSettings();
    } else {
      alert(`Bulk update failed: ${res.error}`);
      setRefreshing(false);
    }
  };

  const handleBulkHidePrices = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to hide prices of ${selectedIds.length} selected products?`)) return;

    setRefreshing(true);
    const res = await hidePricesBulk(selectedIds);
    if (res.success) {
      alert("Prices hidden successfully!");
      setSelectedIds([]);
      fetchProductsAndSettings();
    } else {
      alert(`Bulk hide failed: ${res.error}`);
      setRefreshing(false);
    }
  };

  const handleBulkSetNeedsUpdate = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to mark ${selectedIds.length} selected products as needing update?`)) return;

    setRefreshing(true);
    const res = await setNeedsUpdateBulk(selectedIds);
    if (res.success) {
      alert("Products set to Needs Update successfully!");
      setSelectedIds([]);
      fetchProductsAndSettings();
    } else {
      alert(`Bulk update failed: ${res.error}`);
      setRefreshing(false);
    }
  };

  // Row Quick Actions
  const handleMarkCheckedTodaySingle = async (p: any) => {
    setRefreshing(true);
    const res = await markCheckedTodayBulk([p.id]);
    if (res.success) {
      fetchProductsAndSettings();
    } else {
      alert(`Update failed: ${res.error}`);
      setRefreshing(false);
    }
  };

  const handleHidePriceSingle = async (p: any) => {
    setRefreshing(true);
    const res = await hidePricesBulk([p.id]);
    if (res.success) {
      fetchProductsAndSettings();
    } else {
      alert(`Update failed: ${res.error}`);
      setRefreshing(false);
    }
  };

  // Select Row Toggle
  const handleSelectToggle = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = (filteredProds: any[]) => {
    const filteredIds = filteredProds.map(p => p.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));

    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...filteredIds])));
    }
  };

  // Filter & Search Logic
  const filteredProducts = products.filter(p => {
    // 1. Search Query filter (matches name, brand, ASIN, tag, category)
    const q = search.toLowerCase();
    const matchesSearch = !q || 
      p.name?.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.asin?.toLowerCase().includes(q) ||
      p.primary_category?.name?.toLowerCase().includes(q) ||
      (p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q)));

    if (!matchesSearch) return false;

    // 2. Pricing condition filters
    const isStalePrice = isStale(p.last_price_checked_at);
    const isMissing = p.current_price === null || p.current_price === undefined;

    if (filter === "fresh") {
      return p.price_is_fresh && !isStalePrice && !isMissing;
    }
    if (filter === "needs_update") {
      return !isMissing && (isStalePrice || !p.price_is_fresh);
    }
    if (filter === "hidden") {
      return !p.price_is_fresh && !isMissing;
    }
    if (filter === "missing_price") {
      return isMissing;
    }
    if (filter === "published") {
      return p.status === "published";
    }

    return true;
  });

  const getStatsCounts = () => {
    const stats = { total: 0, fresh: 0, needsUpdate: 0, hidden: 0, missing: 0 };
    products.forEach(p => {
      stats.total++;
      const isMissing = p.current_price === null || p.current_price === undefined;
      const isStalePrice = isStale(p.last_price_checked_at);

      if (isMissing) {
        stats.missing++;
      } else if (!p.price_is_fresh) {
        stats.hidden++;
        stats.needsUpdate++;
      } else if (isStalePrice) {
        stats.needsUpdate++;
      } else {
        stats.fresh++;
      }
    });
    return stats;
  };

  const stats = getStatsCounts();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-500/10">
              <TrendingUp className="w-5 h-5" />
            </div>
            Price Tracker
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1.5 leading-relaxed">
            Verify current Amazon pricing, update manual listings in one click, and check logs safely without PA-API access.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-350 rounded-xl transition-all border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-1.5 font-bold text-xs uppercase"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin text-brand-600" /> : <RefreshCw className="w-4 h-4" />}
            Reload Database
          </button>
          
          <Link
            href="/admin/products/new"
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-brand-500/25"
          >
            Add Product
          </Link>
        </div>
      </div>

      {/* Stats Cards Widget */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <button 
          onClick={() => setFilter("all")} 
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer",
            filter === "all" ? "bg-white dark:bg-slate-900 border-brand-500 ring-2 ring-brand-500/5 shadow-md" : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">All Products</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </button>

        <button 
          onClick={() => setFilter("fresh")} 
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer",
            filter === "fresh" ? "bg-white dark:bg-slate-900 border-emerald-500 ring-2 ring-emerald-500/5 shadow-md" : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Fresh Prices
          </p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-450 mt-1">{stats.fresh}</p>
        </button>

        <button 
          onClick={() => setFilter("needs_update")} 
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer",
            filter === "needs_update" ? "bg-white dark:bg-slate-900 border-amber-500 ring-2 ring-amber-500/5 shadow-md" : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-550 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> Needs Update
          </p>
          <p className="text-2xl font-black text-amber-600 dark:text-amber-450 mt-1">{stats.needsUpdate}</p>
        </button>

        <button 
          onClick={() => setFilter("hidden")} 
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer",
            filter === "hidden" ? "bg-white dark:bg-slate-900 border-slate-500 ring-2 ring-slate-500/5 shadow-md" : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">Hidden Prices</p>
          <p className="text-2xl font-black text-slate-700 dark:text-slate-400 mt-1">{stats.hidden}</p>
        </button>

        <button 
          onClick={() => setFilter("missing_price")} 
          className={cn(
            "p-5 rounded-2xl border text-left transition-all cursor-pointer",
            filter === "missing_price" ? "bg-white dark:bg-slate-900 border-red-500 ring-2 ring-red-500/5 shadow-md" : "bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 hover:border-slate-300"
          )}
        >
          <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450 dark:text-slate-500">Missing Price</p>
          <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.missing}</p>
        </button>
      </div>

      {/* Control Tools bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog, ASIN, tag..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold"
          />
        </div>

        {/* Selected Rows Actions */}
        {selectedIds.length > 0 && (
          <div className="w-full sm:w-auto flex flex-wrap items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800/80 shrink-0">
            <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 px-2 shrink-0">
              {selectedIds.length} SELECTED
            </span>
            <button
              onClick={handleBulkCheckToday}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Checked Today
            </button>
            <button
              onClick={handleBulkHidePrices}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Hide Prices
            </button>
            <button
              onClick={handleBulkSetNeedsUpdate}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
            >
              Set Needs Update
            </button>
            <button 
              onClick={() => setSelectedIds([])}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-850 text-slate-400 hover:text-slate-655 rounded-lg ml-1 shrink-0"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Main Table Grid container */}
      <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {loading ? (
          <div className="p-24 text-center flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
            <p className="text-slate-500 font-bold text-sm">Synchronizing tracking catalog...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-600 dark:text-slate-350">
              <thead className="bg-slate-50/70 dark:bg-slate-950/20 text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-850">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.includes(p.id))}
                      onChange={() => handleSelectAllToggle(filteredProducts)}
                      className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 pl-0">Product Info</th>
                  <th className="p-4">ASIN</th>
                  <th className="p-4">Market Price</th>
                  <th className="p-4">Last Checked</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredProducts.map((p) => {
                  const statusInfo = getProductPriceStatus(p);
                  const isSelected = selectedIds.includes(p.id);

                  return (
                    <tr 
                      key={p.id}
                      className={cn(
                        "hover:bg-slate-50/40 dark:hover:bg-slate-850/5 transition-colors",
                        isSelected ? "bg-brand-50/10 dark:bg-brand-950/5" : ""
                      )}
                    >
                      <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={isSelected}
                          onChange={() => handleSelectToggle(p.id)}
                          className="rounded border-slate-300 dark:border-slate-700 text-brand-600 focus:ring-brand-500 cursor-pointer"
                        />
                      </td>

                      <td className="p-4 pl-0 min-w-[280px]">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1">
                            {p.images && p.images[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-contain" />
                            ) : (
                              <FolderSync className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 dark:text-white leading-snug line-clamp-1">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase">{p.brand || "Generic"}</span>
                              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-700 rounded-full"></span>
                              <span className="text-[10px] font-semibold text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/20 px-2 py-0.5 rounded-full">
                                {p.primary_category?.name || "Tech"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-xs font-bold text-slate-500">
                        {p.asin || "N/A"}
                      </td>

                      <td className="p-4 min-w-[140px]">
                        <div className="flex flex-col">
                          <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {p.current_price !== null ? (mounted ? `₹${Number(p.current_price).toLocaleString('en-IN')}` : "₹...") : "N/A"}
                          </span>
                          {p.old_price && (
                            <span className="text-xs text-slate-400 line-through mt-0.5">
                              {mounted ? `₹${Number(p.old_price).toLocaleString('en-IN')}` : "₹..."}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 min-w-[150px]">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {!mounted ? "Loading..." : p.last_price_checked_at 
                              ? new Date(p.last_price_checked_at).toLocaleDateString()
                              : "Never Checked"}
                          </span>
                        </div>
                      </td>

                      <td className="p-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-black text-[9px] uppercase tracking-wider border ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="p-4 text-right min-w-[200px]">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.original_url && (
                            <a 
                              href={p.original_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-350 rounded-lg border border-slate-200/50 dark:border-slate-750 transition-colors"
                              title="Open original Amazon page"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                          
                          {p.affiliate_link && (
                            <button 
                              onClick={() => handleCopyLink(p.affiliate_link, p.id)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-500 dark:text-slate-350 rounded-lg border border-slate-200/50 dark:border-slate-750 transition-colors"
                              title="Copy custom affiliate link"
                            >
                              {copiedId === p.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                            </button>
                          )}

                          <button 
                            onClick={() => {
                              setSelectedProduct(p);
                              setIsModalOpen(true);
                            }}
                            className="p-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/20 text-brand-600 dark:text-brand-400 rounded-lg border border-brand-100/10 transition-colors"
                            title="Edit manual prices"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => handleMarkCheckedTodaySingle(p)}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 rounded-lg border border-emerald-100/10 transition-colors"
                            title="Mark checked today"
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          {p.price_is_fresh && (
                            <button 
                              onClick={() => handleHidePriceSingle(p)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-400 dark:text-slate-500 hover:text-red-500 rounded-lg border border-slate-200/50 dark:border-slate-750 transition-colors"
                              title="Hide price from website"
                            >
                              <EyeOff className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-24 text-center text-slate-500 flex flex-col items-center gap-3">
            <AlertCircle className="w-8 h-8 text-slate-350" />
            <p className="font-bold text-sm">No products found matching filters.</p>
          </div>
        )}

      </div>

      {/* Modal update handler */}
      <PriceUpdateModal 
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSuccess={fetchProductsAndSettings}
      />

    </div>
  );
}
