"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Check, Copy, Loader2, DollarSign, Calendar } from "lucide-react";
import { updateProductPrice } from "@/app/admin/price-tracker/actions";

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    images?: string[];
    current_price?: number;
    old_price?: number;
    currency?: string;
    original_url?: string;
    affiliate_link?: string;
    last_price_checked_at?: string;
  } | null;
  onSuccess?: () => void;
}

export function PriceUpdateModal({ isOpen, onClose, product, onSuccess }: PriceUpdateModalProps) {
  const [currentPriceInput, setCurrentPriceInput] = useState("");
  const [oldPriceInput, setOldPriceInput] = useState("");
  const [usePreviousAsOld, setUsePreviousAsOld] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    if (product) {
      setCurrentPriceInput(product.current_price !== null && product.current_price !== undefined ? product.current_price.toString() : "");
      setOldPriceInput(product.old_price !== null && product.old_price !== undefined ? product.old_price.toString() : "");
      setUsePreviousAsOld(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const handleCopyLink = () => {
    if (product.affiliate_link) {
      navigator.clipboard.writeText(product.affiliate_link);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const priceVal = currentPriceInput.trim() ? parseFloat(currentPriceInput) : null;
    const oldPriceVal = oldPriceInput.trim() ? parseFloat(oldPriceInput) : null;

    const res = await updateProductPrice(product.id, priceVal, oldPriceVal, usePreviousAsOld);

    if (res.success) {
      alert("Price updated successfully!");
      if (onSuccess) onSuccess();
      onClose();
    } else {
      alert(`Failed to save price: ${res.error}`);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all duration-300">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/20">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Update Product Price</h3>
            <p className="text-xs text-slate-500 mt-0.5">Edit manual pricing values & checked status</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl transition-all border border-transparent hover:border-slate-200/50 dark:hover:border-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Product Overview Card */}
          <div className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shrink-0 flex items-center justify-center p-1.5">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">No Image</div>
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-0.5">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate">{product.name}</h4>
              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 font-bold">
                <span>Current: <span className="text-brand-600 dark:text-brand-400 font-black">{product.current_price ? `₹${Number(product.current_price).toLocaleString('en-IN')}` : "N/A"}</span></span>
                <span>Old: <span>{product.old_price ? `₹${Number(product.old_price).toLocaleString('en-IN')}` : "N/A"}</span></span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-450 dark:text-slate-500 font-semibold pt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Last Checked: {product.last_price_checked_at ? new Date(product.last_price_checked_at).toLocaleDateString() : "Never"}</span>
              </div>
            </div>
          </div>

          {/* Quick Admin Actions Grid */}
          <div className="grid grid-cols-2 gap-3.5">
            {product.original_url ? (
              <a 
                href={product.original_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Open Amazon Page
              </a>
            ) : (
              <button
                type="button"
                disabled
                className="w-full py-3 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-xl font-bold text-xs uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-not-allowed opacity-50"
              >
                <ExternalLink className="w-3.5 h-3.5" /> No Amazon URL
              </button>
            )}
            
            <button
              type="button"
              onClick={handleCopyLink}
              disabled={!product.affiliate_link}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-750 dark:text-slate-200 rounded-xl font-bold text-xs uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1.5 border border-slate-200 dark:border-slate-750 cursor-pointer"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedLink ? "Copied Link!" : "Copy Affiliate Link"}
            </button>
          </div>

          {/* Numeric Price Inputs */}
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-400">New Current Price ({product.currency || "INR"})</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  type="number" 
                  value={currentPriceInput}
                  onChange={(e) => setCurrentPriceInput(e.target.value)}
                  placeholder="Enter numeric current price" 
                  className="w-full pl-9 pr-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-black text-brand-600 dark:text-brand-400" 
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-black uppercase tracking-widest text-slate-400">New Old Price (Strike-through)</label>
                <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-bold cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={usePreviousAsOld}
                    onChange={(e) => {
                      setUsePreviousAsOld(e.target.checked);
                      if (e.target.checked && product.current_price !== undefined) {
                        setOldPriceInput(product.current_price.toString());
                      }
                    }}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  Use previous current price as old price
                </label>
              </div>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                <input 
                  type="number" 
                  value={oldPriceInput}
                  onChange={(e) => setOldPriceInput(e.target.value)}
                  placeholder="Enter numeric old price (optional)" 
                  className="w-full pl-9 pr-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                  disabled={usePreviousAsOld}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition-all border border-slate-200 dark:border-slate-700"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={saving}
              className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-md shadow-brand-500/25 disabled:opacity-75 cursor-pointer"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {saving ? "Saving Price..." : "Save Product Price"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
