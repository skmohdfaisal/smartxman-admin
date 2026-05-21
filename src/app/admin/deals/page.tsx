"use client";

import { Percent, Plus, Trash2, Edit, Loader2, Tag, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { getDeals, saveDeal, deleteDeal } from "./actions";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function AdminDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dbSource, setDbSource] = useState("");

  // Form State
  const [title, setTitle] = useState("");
  const [productId, setProductId] = useState("");
  const [storeName, setStoreName] = useState("");
  const [oldPrice, setOldPrice] = useState("");
  const [dealPrice, setDealPrice] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [affiliateUrl, setAffiliateUrl] = useState("");
  const [active, setActive] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    // Fetch deals
    const res = await getDeals();
    if (res.success) {
      setDeals(res.data);
      setDbSource(res.source || "");
    }

    // Fetch products list for dropdown
    try {
      const { data } = await supabase.from("products").select("id, name").order("name");
      setProducts(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !dealPrice || !storeName) {
      alert("Product, Deal Price and Store Name are required.");
      return;
    }

    setSaving(true);
    const dealPayload = {
      id: editingId || undefined,
      title: title || `${products.find(p => p.id === productId)?.name || "Product"} deal`,
      product_id: productId,
      store_name: storeName,
      old_price: oldPrice,
      deal_price: dealPrice,
      coupon_code: couponCode,
      affiliate_url: affiliateUrl,
      active
    };

    const res = await saveDeal(dealPayload);
    if (res.success) {
      // Reload deals
      const dealsRes = await getDeals();
      if (dealsRes.success) setDeals(dealsRes.data);
      
      // Reset form
      setTitle("");
      setProductId("");
      setStoreName("");
      setOldPrice("");
      setDealPrice("");
      setCouponCode("");
      setAffiliateUrl("");
      setActive(true);
      setEditingId(null);
    } else {
      alert("Failed to save deal: " + res.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    const res = await deleteDeal(id, dbSource === "product_store_links");
    if (res.success) {
      setDeals(deals.filter(d => d.id !== id));
    } else {
      alert("Failed to delete deal: " + res.error);
    }
  };

  const handleEdit = (deal: any) => {
    setEditingId(deal.id);
    setTitle(deal.title || "");
    setProductId(deal.product_id || "");
    setStoreName(deal.store_name || "");
    setOldPrice(deal.old_price ? String(deal.old_price) : "");
    setDealPrice(deal.deal_price ? String(deal.deal_price) : "");
    setCouponCode(deal.coupon_code || "");
    setAffiliateUrl(deal.affiliate_url || "");
    setActive(deal.active !== false);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setTitle("");
    setProductId("");
    setStoreName("");
    setOldPrice("");
    setDealPrice("");
    setCouponCode("");
    setAffiliateUrl("");
    setActive(true);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Deals & Coupons</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage limited time product discounts and coupon promotional offers.</p>
          {dbSource && (
            <span className="inline-block mt-2 text-xs font-semibold px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500">
              Target Source: {dbSource === "deals" ? "Deals Table" : dbSource === "product_store_links" ? "Product Store Links Table" : "Mock Data"}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Save Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 sticky top-8">
            <h3 className="font-black text-slate-950 dark:text-white text-base">
              {editingId ? "Edit Deal Details" : "Create New Discount Deal"}
            </h3>
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Deal Title (Optional)</label>
              <input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                placeholder="e.g. 15% Off Keychron Keyboard"
                className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Select Product *</label>
              <select 
                required
                value={productId} 
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">-- Choose Product --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Store / Retailer Name *</label>
              <input 
                required
                type="text" 
                value={storeName} 
                onChange={(e) => setStoreName(e.target.value)} 
                placeholder="e.g. Amazon, Keychron, HeadphoneZone"
                className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Old Price (INR)</label>
                <input 
                  type="number" 
                  value={oldPrice} 
                  onChange={(e) => setOldPrice(e.target.value)} 
                  placeholder="34990"
                  className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Deal Price (INR) *</label>
                <input 
                  required
                  type="number" 
                  value={dealPrice} 
                  onChange={(e) => setDealPrice(e.target.value)} 
                  placeholder="29990"
                  className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Coupon Promo Code (Optional)</label>
              <input 
                type="text" 
                value={couponCode} 
                onChange={(e) => setCouponCode(e.target.value)} 
                placeholder="e.g. KEYS10"
                className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Affiliate Direct URL</label>
              <input 
                type="url" 
                value={affiliateUrl} 
                onChange={(e) => setAffiliateUrl(e.target.value)} 
                placeholder="https://amazon.in/dp/..."
                className="w-full px-4 py-2 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 py-2">
              <input 
                type="checkbox" 
                id="active" 
                checked={active} 
                onChange={(e) => setActive(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <label htmlFor="active" className="text-xs font-bold text-slate-600 dark:text-slate-300 select-none cursor-pointer">Deal Active (Show on Homepage)</label>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="submit" 
                disabled={saving}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Update Deal" : "Publish Deal"}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  onClick={handleCancelEdit}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Deals Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Deal Details</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Store / Code</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Prices</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                          <span>Loading active deals...</span>
                        </div>
                      </td>
                    </tr>
                  ) : deals.length > 0 ? (
                    deals.map((deal) => {
                      const discount = deal.discount_percentage || (deal.old_price && deal.deal_price ? Math.round(((deal.old_price - deal.deal_price) / deal.old_price) * 100) : 0);
                      
                      return (
                        <tr key={deal.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white">{deal.title}</p>
                              <p className="text-[11px] text-slate-400 font-semibold mt-0.5">{deal.product?.name || "Linked Product missing"}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-xs font-bold">{deal.store_name}</span>
                            {deal.coupon_code && (
                              <p className="text-[10px] text-brand-600 dark:text-brand-400 font-black uppercase mt-1">Code: {deal.coupon_code}</p>
                            )}
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">
                            <span className="text-slate-900 dark:text-white font-extrabold">₹{Number(deal.deal_price || 0).toLocaleString()}</span>
                            {deal.old_price && (
                              <span className="text-xs text-slate-400 line-through ml-2">₹{Number(deal.old_price).toLocaleString()}</span>
                            )}
                            {discount > 0 && (
                              <span className="text-[10px] text-green-600 dark:text-green-400 font-black ml-2 uppercase bg-green-50 dark:bg-green-950/20 px-1.5 py-0.5 rounded">{discount}% OFF</span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {deal.active !== false ? (
                              <span className="px-2 py-0.5 bg-green-50 text-green-600 dark:bg-green-950/20 text-xs font-bold rounded-full">Active</span>
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800 text-xs font-bold rounded-full">Inactive</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              <button 
                                onClick={() => handleEdit(deal)}
                                className="p-1.5 text-slate-400 hover:text-amber-500 transition-colors"
                                title="Edit Deal"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleDelete(deal.id)}
                                className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                title="Delete Deal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">No product deals registered yet. Create one!</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
