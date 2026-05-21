"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Edit, Trash2, ExternalLink, RotateCcw, EyeOff, Eye } from "lucide-react";

export function ProductRow({ 
  item, 
  deleteAction,
  toggleAction 
}: { 
  item: any, 
  deleteAction: (id: string) => Promise<void>,
  toggleAction: (id: string, isActive: boolean) => Promise<{error?: string}>
}) {
  const [isPendingDelete, setIsPendingDelete] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleDeleteClick = () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsPendingDelete(true);
      timeoutRef.current = setTimeout(() => {
        deleteAction(item.id);
      }, 5000);
    }
  };

  const handleUndo = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsPendingDelete(false);
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    const newStatus = item.is_active === false ? true : false;
    const res = await toggleAction(item.id, newStatus);
    if (res?.error) {
      if (res.error.includes("is_active")) {
        alert("Action failed! Please go to your Supabase Dashboard and add an 'is_active' boolean column (default: true) to your 'products' table.");
      } else {
        alert("Error updating status: " + res.error);
      }
    }
    setIsToggling(false);
  };

  if (isPendingDelete) {
    return (
      <tr className="bg-red-50/50 dark:bg-red-900/10">
        <td colSpan={5} className="px-6 py-4">
          <div className="flex items-center justify-between text-sm text-red-600 dark:text-red-400">
            <span>Product <strong>{item.name}</strong> marked for deletion in 5 seconds...</span>
            <button 
              onClick={handleUndo} 
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-red-200 dark:border-red-800 rounded font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Undo
            </button>
          </div>
        </td>
      </tr>
    );
  }

  const isActive = item.is_active !== false; // defaults to true if undefined

  return (
    <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{item.name}</td>
      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-xs">Tech</span>
      </td>
      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{item.price_range}</td>
      <td className="px-6 py-4">
        {isActive ? (
          <span className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span> Delisted
          </span>
        )}
      </td>
      <td className="px-6 py-4 flex items-center justify-end gap-3">
        <button 
          onClick={handleToggleStatus} 
          disabled={isToggling}
          className={`transition-colors ${isActive ? 'text-slate-400 hover:text-brand-500' : 'text-brand-500 hover:text-brand-600'}`} 
          title={isActive ? "Delist Product (Hide from main site)" : "Relist Product"}
        >
          {isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
        <Link href={`/product/${item.slug}`} className="text-slate-400 hover:text-brand-600 transition-colors" title="View Link">
          <ExternalLink className="w-4 h-4" />
        </Link>
        <Link href={`/admin/products/${item.id}/edit`} className="text-slate-400 hover:text-amber-500 transition-colors" title="Edit">
          <Edit className="w-4 h-4" />
        </Link>
        <button onClick={handleDeleteClick} className="text-slate-400 hover:text-red-500 transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );
}
