"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Tag, Search, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setIsAdding(true);

    try {
      const slug = newCategory.toLowerCase().replace(/\s+/g, '-');
      const { data, error } = await supabase
        .from('categories')
        .insert([{ name: newCategory, slug }])
        .select();

      if (error) throw error;
      
      setCategories([...categories, data[0]]);
      setNewCategory("");
    } catch (error: any) {
      alert(`Error adding category: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Manage Categories</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Organize your products with custom categories.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Add Category Form */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm sticky top-8">
            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Add New Category</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Category Name</label>
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Mechanical Keyboards" 
                  className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              <button 
                onClick={handleAddCategory}
                disabled={isAdding || !newCategory.trim()}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Category
              </button>
            </div>
          </div>
        </div>

        {/* Category List */}
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search categories..." 
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {loading ? (
                <div className="p-8 text-center text-slate-500">Loading categories...</div>
              ) : categories.length > 0 ? (
                categories.map((cat) => (
                  <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center text-brand-600">
                        <Tag className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{cat.name}</p>
                        <p className="text-xs text-slate-500 font-mono">/{cat.slug}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-2 text-slate-400 hover:text-amber-500 transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">No categories found.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
