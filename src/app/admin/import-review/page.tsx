"use client";

import { useState, useEffect } from "react";
import { FileText, Check, X, Eye, Edit, Globe, Loader2, Package } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";

export default function ImportReviewPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const fetchProducts = async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("approval_status", filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setProducts(data);
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase
      .from("products")
      .update({ approval_status: status })
      .eq("id", id);
      
    if (!error) {
      // Optimistic update
      setProducts(products.map(p => p.id === id ? { ...p, approval_status: status } : p));
    } else {
      alert("Error updating status");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-brand-600" />
            Import Review Queue
          </h1>
          <p className="text-slate-500 mt-2">Manage, approve, or reject imported affiliate products.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {['all', 'draft', 'needs_review', 'approved', 'rejected', 'published'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors ${
                filter === status 
                  ? "bg-brand-600 text-white" 
                  : "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            No products found for this filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Product</th>
                  <th className="p-4 font-bold text-slate-700 dark:text-slate-300">ASIN</th>
                  <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Status</th>
                  <th className="p-4 font-bold text-slate-700 dark:text-slate-300 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-lg relative overflow-hidden flex-shrink-0">
                           {product.images?.[0] ? (
                              <Image src={product.images[0]} alt={product.name} fill className="object-cover" />
                           ) : (
                              <Package className="w-6 h-6 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" />
                           )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">{product.name}</p>
                          <p className="text-xs text-slate-500">{product.category_id || "No Category"} • {product.import_source || "Manual"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-slate-600 dark:text-slate-400 font-mono text-sm">
                      {product.asin || "-"}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full capitalize ${
                        product.approval_status === 'published' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                        product.approval_status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                        product.approval_status === 'approved' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {product.approval_status || "draft"}
                      </span>
                    </td>
                    <td className="p-4 flex items-center justify-end gap-2">
                      <Link href={`/product/${product.slug}`} target="_blank" className="p-2 text-slate-400 hover:text-brand-600 transition-colors tooltip-trigger" title="View Preview">
                        <Eye className="w-5 h-5" />
                      </Link>
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Edit (Coming soon)">
                        <Edit className="w-5 h-5" />
                      </button>
                      
                      {product.approval_status !== 'published' && (
                        <button onClick={() => updateStatus(product.id, 'published')} className="p-2 text-slate-400 hover:text-green-600 transition-colors" title="Publish">
                          <Globe className="w-5 h-5" />
                        </button>
                      )}
                      {product.approval_status !== 'approved' && product.approval_status !== 'published' && (
                        <button onClick={() => updateStatus(product.id, 'approved')} className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="Approve">
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                      {product.approval_status !== 'rejected' && (
                        <button onClick={() => updateStatus(product.id, 'rejected')} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Reject">
                          <X className="w-5 h-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
