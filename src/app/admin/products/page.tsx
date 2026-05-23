"use client";

import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit, 
  Copy, 
  Archive, 
  Trash2, 
  Eye, 
  Loader2, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  FileX,
  Star,
  Trophy,
  ArrowUpDown,
  RefreshCw,
  FolderOpen
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function AdminProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedBadge, setSelectedBadge] = useState("all");
  const [selectedBudget, setSelectedBudget] = useState("all");
  const [minScore, setMinScore] = useState("all");
  const [missingDataFilter, setMissingDataFilter] = useState("all");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      // 1. Fetch categories
      const { data: cats } = await supabase.from('categories').select('*').order('name');
      if (cats) setCategories(cats);

      // 2. Fetch products
      const { data: prods, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(prods || []);
    } catch (err) {
      console.error("Error loading products:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Actions: Delete Product
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter(p => p.id !== id));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Actions: Duplicate Product
  const handleDuplicate = async (product: any) => {
    try {
      const { id: _, created_at: __, slug: ___, name: originalName, ...rest } = product;
      const copyName = `Copy of ${originalName}`;
      const copySlug = copyName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${Date.now().toString().slice(-4)}`;
      
      const payload = {
        ...rest,
        name: copyName,
        slug: copySlug,
        status: "draft"
      };

      const { data, error } = await supabase.from('products').insert([payload]).select().single();
      if (error) throw error;
      if (data) {
        setProducts([data, ...products]);
        alert("Product duplicated successfully as Draft!");
      }
    } catch (err: any) {
      alert(`Duplicate failed: ${err.message}`);
    }
  };

  // Actions: Toggle Archive
  const handleArchiveToggle = async (product: any) => {
    const nextStatus = product.status === "archived" ? "draft" : "archived";
    try {
      const { error } = await supabase.from('products').update({ status: nextStatus }).eq('id', product.id);
      if (error) throw error;
      setProducts(products.map(p => p.id === product.id ? { ...p, status: nextStatus } : p));
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  // Calculate Product Health Score for inline listing diagnostics
  const getProductHealth = (p: any) => {
    const checks = [
      !!p.name,
      !!p.affiliate_link,
      p.images && p.images.length > 0,
      !!p.price_range,
      Number(p.rating) > 0,
      !!p.primary_category_id,
      !!p.expert_note,
      p.pros && p.pros.length > 0,
      p.cons && p.cons.length > 0,
      !!p.seo_title,
      !!p.seo_description
    ];
    const passed = checks.filter(Boolean).length;
    return Math.round((passed / checks.length) * 100);
  };

  // Parse price ranges to numbers for custom filtering
  const parsePrice = (priceStr: string | null | undefined) => {
    if (!priceStr) return 0;
    return parseInt(priceStr.replace(/[^0-9]/g, "")) || 0;
  };

  // Filter Logic
  const filteredProducts = products.filter(p => {
    // 1. Search filter (Name, brand, description, tags)
    if (search) {
      const q = search.toLowerCase();
      const matchName = p.name?.toLowerCase().includes(q);
      const matchBrand = p.brand?.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchTags = p.tags && p.tags.some((t: string) => t.toLowerCase().includes(q));
      if (!matchName && !matchBrand && !matchDesc && !matchTags) return false;
    }

    // 2. Category filter
    if (selectedCategory !== "all") {
      if (p.primary_category_id !== selectedCategory) return false;
    }

    // 3. Status filter
    if (selectedStatus !== "all") {
      if (p.status !== selectedStatus) return false;
    }

    // 4. Badge filter (Featured, Trending, Budget, Deal)
    if (selectedBadge !== "all") {
      if (selectedBadge === "featured" && !p.featured) return false;
      if (selectedBadge === "trending" && !p.trending) return false;
      if (selectedBadge === "is_budget_pick" && !p.is_budget_pick) return false;
      if (selectedBadge === "is_best_deal" && !p.is_best_deal) return false;
    }

    // 5. Budget filter
    if (selectedBudget !== "all") {
      const priceVal = parsePrice(p.price_range);
      if (selectedBudget === "under_500" && priceVal >= 500) return false;
      if (selectedBudget === "under_1000" && priceVal >= 1000) return false;
      if (selectedBudget === "under_3000" && priceVal >= 3000) return false;
      if (selectedBudget === "under_5000" && priceVal >= 5000) return false;
      if (selectedBudget === "under_10000" && priceVal >= 10000) return false;
      if (selectedBudget === "premium" && priceVal < 10000) return false;
    }

    // 6. Score filter
    if (minScore !== "all") {
      const score = Number(minScore);
      if (Number(p.smart_score || 0) < score && Number(p.value_score || 0) < score) return false;
    }

    // 7. Missing Data Diagnostic Filters
    if (missingDataFilter !== "all") {
      if (missingDataFilter === "missing_image" && p.images && p.images.length > 0) return false;
      if (missingDataFilter === "missing_link" && p.affiliate_link) return false;
      if (missingDataFilter === "missing_expert" && p.expert_note) return false;
      if (missingDataFilter === "missing_pros_cons" && p.pros && p.pros.length > 0 && p.cons && p.cons.length > 0) return false;
      if (missingDataFilter === "missing_seo" && p.seo_title && p.seo_description) return false;
      if (missingDataFilter === "draft_only" && p.status !== "draft") return false;
      if (missingDataFilter === "low_score" && Number(p.smart_score || 0) >= 7.0) return false;
    }

    return true;
  });

  return (
    <div className="p-8 min-h-screen">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Product Listing Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Review, filter, diagnostic check, and build affiliate products.</p>
        </div>
        
        <div className="flex gap-2">
          <button 
            type="button" 
            onClick={fetchData} 
            disabled={refreshing}
            className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 shadow-sm transition-all"
          >
            <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
          </button>
          
          <Link href="/admin/products/new" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-md shadow-brand-500/25">
            <Plus className="w-5 h-5" /> Add Product
          </Link>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-4 mb-8">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <Filter className="w-4 h-4 text-brand-600" />
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-850 dark:text-white">Advanced Filter Engine</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {/* Search */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, brands, tags..." 
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 focus:outline-none"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <select 
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="needs_review">Review</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Badges */}
          <div className="space-y-1">
            <select 
              value={selectedBadge}
              onChange={(e) => setSelectedBadge(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 focus:outline-none"
            >
              <option value="all">All Badges</option>
              <option value="featured">Featured Product</option>
              <option value="trending">Trending Now</option>
              <option value="is_budget_pick">Budget Pick</option>
              <option value="is_best_deal">Best Deal</option>
            </select>
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <select 
              value={selectedBudget}
              onChange={(e) => setSelectedBudget(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 focus:outline-none"
            >
              <option value="all">All Budgets</option>
              <option value="under_500">Under ₹500</option>
              <option value="under_1000">Under ₹1000</option>
              <option value="under_3000">Under ₹3000</option>
              <option value="under_5000">Under ₹5000</option>
              <option value="under_10000">Under ₹10000</option>
              <option value="premium">Premium (₹10000+)</option>
            </select>
          </div>

          {/* Min score */}
          <div className="space-y-1">
            <select 
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 focus:outline-none"
            >
              <option value="all">All Scores</option>
              <option value="9.0">Score &gt;= 9.0</option>
              <option value="8.0">Score &gt;= 8.0</option>
              <option value="7.0">Score &gt;= 7.0</option>
            </select>
          </div>
        </div>

        {/* Diagnostic filter */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-850">
          <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 mr-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-brand-500" /> Database Diagnostics:
          </span>
          {[
            { id: "all", label: "No Issue Filter" },
            { id: "missing_image", label: "Missing Images" },
            { id: "missing_link", label: "Missing Affiliate Links" },
            { id: "missing_expert", label: "Missing Expert Notes" },
            { id: "missing_pros_cons", label: "Missing Pros/Cons" },
            { id: "missing_seo", label: "Missing SEO Metadata" },
            { id: "draft_only", label: "Draft Products" },
            { id: "low_score", label: "Score &lt; 7.0" },
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => setMissingDataFilter(opt.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                missingDataFilter === opt.id 
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                  : "bg-slate-50 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/85 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <Loader2 className="w-9 h-9 text-brand-600 animate-spin" />
            <p className="text-slate-500 font-bold text-sm">Synchronizing products database...</p>
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-850/50 text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-slate-800/80 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-6 py-4">Image</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Main Category</th>
                  <th className="px-6 py-4">Sub Category</th>
                  <th className="px-6 py-4">Price</th>
                  <th className="px-6 py-4">Health</th>
                  <th className="px-6 py-4 text-center">Smart</th>
                  <th className="px-6 py-4 text-center">VFM</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Visibility</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 dark:divide-slate-800/60 font-semibold text-slate-705 dark:text-slate-300">
                {filteredProducts.map((p) => {
                  const categoryName = categories.find(c => c.id === p.primary_category_id)?.name || "Uncategorized";
                  const healthScore = getProductHealth(p);
                  
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="px-6 py-3.5">
                        <div className="w-11 h-11 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-150 dark:border-slate-700 overflow-hidden relative shadow-inner">
                          {p.images && p.images[0] ? (
                            <Image src={p.images[0]} alt={p.name} fill className="object-contain p-1" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400 m-3" />
                          )}
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="px-6 py-3.5 max-w-[240px] truncate">
                        <div>
                          <p className="font-extrabold text-slate-900 dark:text-white truncate" title={p.name}>{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5 tracking-tighter truncate">ID: {p.id}</p>
                        </div>
                      </td>

                      {/* Main Category */}
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-1 bg-brand-50/50 dark:bg-brand-950/20 text-brand-650 dark:text-brand-400 text-xs font-bold rounded-lg border border-brand-100/10">
                          {categoryName}
                        </span>
                      </td>

                      {/* Sub Category */}
                      <td className="px-6 py-3.5 text-xs text-slate-500 dark:text-slate-400">
                        {p.sub_category || <span className="italic text-slate-350 dark:text-slate-650">None</span>}
                      </td>

                      {/* Price Range */}
                      <td className="px-6 py-3.5 text-xs font-black text-slate-900 dark:text-white">
                        {p.price_range || <span className="italic text-slate-350 dark:text-slate-650">N/A</span>}
                      </td>

                      {/* Health Indicator */}
                      <td className="px-6 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div 
                              className={cn(
                                "h-full rounded-full transition-all duration-300",
                                healthScore >= 80 ? "bg-emerald-500" : healthScore >= 50 ? "bg-amber-500" : "bg-red-500"
                              )} 
                              style={{ width: `${healthScore}%` }} 
                            />
                          </div>
                          <span className="text-[10px] font-black text-slate-500">{healthScore}%</span>
                        </div>
                      </td>

                      {/* Smart Score */}
                      <td className="px-6 py-3.5 text-center font-black text-brand-650 dark:text-brand-405 text-sm">
                        {p.smart_score || "0.0"}
                      </td>

                      {/* Value Score */}
                      <td className="px-6 py-3.5 text-center font-black text-emerald-600 dark:text-emerald-455 text-sm">
                        {p.value_score || "0.0"}
                      </td>

                      {/* Publication Status */}
                      <td className="px-6 py-3.5">
                        <span className={cn(
                          "px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg shadow-sm border",
                          p.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-900 dark:text-emerald-400" :
                          p.status === "needs_review" ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900 dark:text-amber-400" :
                          p.status === "archived" ? "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/40 dark:border-slate-700 dark:text-slate-400" :
                          "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400"
                        )}>
                          {p.status || 'Draft'}
                        </span>
                      </td>

                      {/* Visibility Overlay Badges */}
                      <td className="px-6 py-3.5">
                        <div className="flex gap-1">
                          {p.featured && <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-800 dark:bg-yellow-950/20 dark:text-yellow-400 text-[8px] font-black rounded uppercase">Featured</span>}
                          {p.trending && <span className="px-1.5 py-0.5 bg-brand-50 text-brand-650 dark:bg-brand-950/20 dark:text-brand-400 text-[8px] font-black rounded uppercase">Trending</span>}
                          {p.is_budget_pick && <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 text-[8px] font-black rounded uppercase">Budget</span>}
                          {p.is_best_deal && <span className="px-1.5 py-0.5 bg-rose-100 text-rose-850 dark:bg-rose-950/20 dark:text-rose-450 text-[8px] font-black rounded uppercase">Deal</span>}
                        </div>
                      </td>

                      {/* Actions Buttons */}
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link 
                            href={`/admin/products/${p.id}/edit`} 
                            className="p-2 bg-slate-50 hover:bg-brand-50 hover:text-brand-650 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-all"
                            title="Edit product"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          
                          <button 
                            type="button" 
                            onClick={() => handleDuplicate(p)}
                            className="p-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-650 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-all"
                            title="Duplicate product"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          
                          <button 
                            type="button" 
                            onClick={() => handleArchiveToggle(p)}
                            className={cn(
                              "p-2 rounded-lg transition-all",
                              p.status === "archived" 
                                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                                : "bg-slate-50 hover:bg-amber-50 hover:text-amber-600 dark:bg-slate-855 dark:hover:bg-slate-800 text-slate-500"
                            )}
                            title={p.status === "archived" ? "Unarchive (revert to Draft)" : "Archive product"}
                          >
                            <Archive className="w-4 h-4" />
                          </button>

                          <button 
                            type="button" 
                            onClick={() => handleDelete(p.id)}
                            className="p-2 bg-slate-50 hover:bg-red-50 hover:text-red-650 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-500 rounded-lg transition-all"
                            title="Delete product"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-850 rounded-full flex items-center justify-center text-slate-400 shadow-inner">
              <FileX className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">No products found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm">No items match your active search filters or diagnostics parameters. Reset filters to explore again.</p>
          </div>
        )}
      </div>
    </div>
  );
}
