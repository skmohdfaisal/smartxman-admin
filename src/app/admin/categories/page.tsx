"use client";

import Link from "next/link";
import { ArrowLeft, Plus, Edit, Trash2, Tag, Search, Loader2, Save, RefreshCw, FolderOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Form States
  const [newCategory, setNewCategory] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  
  // Actions states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // 1. Fetch categories
      const { data: cats, error: catErr } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (catErr) throw catErr;

      // 2. Fetch products category references to count products client-side
      const { data: prods, error: prodErr } = await supabase
        .from('products')
        .select('primary_category_id');

      const counts: Record<string, number> = {};
      if (prods) {
        prods.forEach((p: any) => {
          if (p.primary_category_id) {
            counts[p.primary_category_id] = (counts[p.primary_category_id] || 0) + 1;
          }
        });
      }

      setProductCounts(counts);
      setCategories(cats || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add Category Handler
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;
    setIsAdding(true);

    try {
      const slug = newCategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const { data, error } = await supabase
        .from('categories')
        .insert([{ 
           name: newCategory, 
           slug,
           description: newDescription,
           icon: newIcon || "Tag",
           image_url: newImageUrl
        }])
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("No category inserted. This usually means database Row Level Security (RLS) policies are blocking your insert request. Please make sure you are logged in as an authorized admin.");
      }
      
      setCategories(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCategory("");
      setNewDescription("");
      setNewIcon("");
      setNewImageUrl("");
      alert("Category added successfully!");
    } catch (error: any) {
      alert(`Error adding category: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  // Edit Mode Handlers
  const handleEditClick = (cat: any) => {
    setEditingId(cat.id);
    setNewCategory(cat.name || "");
    setNewDescription(cat.description || "");
    setNewIcon(cat.icon || "");
    setNewImageUrl(cat.image_url || "");
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setNewCategory("");
    setNewDescription("");
    setNewIcon("");
    setNewImageUrl("");
  };

  const handleUpdateCategory = async () => {
    if (!editingId || !newCategory.trim()) return;
    setIsAdding(true);

    try {
      const slug = newCategory.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const payload = {
        name: newCategory,
        slug,
        description: newDescription,
        icon: newIcon || "Tag",
        image_url: newImageUrl
      };

      const { data, error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', editingId)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
        throw new Error("No category updated. This usually means database Row Level Security (RLS) policies are blocking your update request. Please make sure you are logged in as an authorized admin.");
      }
      
      setCategories(categories.map(c => c.id === editingId ? data[0] : c));
      handleCancelEdit();
      alert("Category updated successfully!");
    } catch (error: any) {
      alert(`Error updating category: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  // Delete Category with Safe Product Remapping
  const handleDeleteCategory = async (catId: string) => {
    const catName = categories.find(c => c.id === catId)?.name || "this category";
    const prodCount = productCounts[catId] || 0;

    let warningMsg = `Are you sure you want to permanently delete "${catName}"?`;
    if (prodCount > 0) {
      warningMsg += `\n\n⚠️ IMPORTANT: There are ${prodCount} products currently assigned to this category. They will be automatically re-mapped to "Tech Accessories" to keep references clean.`;
    } else {
      warningMsg += `\nNo products are assigned to this category.`;
    }

    if (!confirm(warningMsg)) return;
    
    setLoading(true);
    try {
      // Find or seed "Tech Accessories" fallback category
      let fallbackId = categories.find(c => c.slug === 'tech-accessories')?.id;
      
      if (!fallbackId) {
        const { data: seedTech, error: seedErr } = await supabase
          .from('categories')
          .insert([{ id: "c0000000-0000-0000-0000-000000000003", name: "Tech Accessories", slug: "tech-accessories", icon: "MonitorSmartphone", description: "Essential tech accessories" }])
          .select();
        
        if (seedErr) throw seedErr;
        
        if (seedTech && seedTech[0]) {
          fallbackId = seedTech[0].id;
          setCategories(prev => [...prev, seedTech[0]].sort((a, b) => a.name.localeCompare(b.name)));
        }
      }

      if (fallbackId && fallbackId !== catId && prodCount > 0) {
        // Safe database re-linking of products to fallback
        const { error: prodUpdateErr } = await supabase.from('products').update({ primary_category_id: fallbackId }).eq('primary_category_id', catId);
        if (prodUpdateErr) throw prodUpdateErr;

        const { error: linkUpdateErr } = await supabase.from('product_categories').update({ category_id: fallbackId }).eq('category_id', catId);
        if (linkUpdateErr) throw linkUpdateErr;

        // Update local count cache
        setProductCounts(prev => {
          const next = { ...prev };
          next[fallbackId!] = (next[fallbackId!] || 0) + prodCount;
          delete next[catId];
          return next;
        });
      }

      // Perform deletion and verify it actually removed the row (RLS policy check)
      const { data, error } = await supabase.from('categories').delete().eq('id', catId).select();
      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("No categories deleted. This usually means database Row Level Security (RLS) policies are blocking your delete request. Please make sure you are logged in as an authorized admin.");
      }

      setCategories(categories.filter(c => c.id !== catId));
      alert("Category deleted successfully!");
    } catch (error: any) {
      alert(`Error deleting category: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // One-Click Curated Seeding of default 16 Categories
  const seedDefaultCategories = async () => {
    setIsAdding(true);
    try {
      const coreCategories = [
        { id: "c0000000-0000-0000-0000-000000000021", name: "Laptops", slug: "laptops", icon: "Laptop", description: "Top-rated work, gaming, and student laptops" },
        { id: "c0000000-0000-0000-0000-000000000022", name: "Smartphones", slug: "smartphones", icon: "Smartphone", description: "High-performance smartphones and mobile devices" },
        { id: "c0000000-0000-0000-0000-000000000023", name: "Headphones & Earbuds", slug: "headphones-earbuds", icon: "Headphones", description: "Premium wireless earbuds and over-ear headphones" },
        { id: "c0000000-0000-0000-0000-000000000024", name: "Smartwatches & Wearables", slug: "smartwatches-wearables", icon: "Watch", description: "Fitness trackers, smartwatches, and active wearables" },
        { id: "c0000000-0000-0000-0000-000000000025", name: "Computer Components & Storage", slug: "computer-components-storage", icon: "Cpu", description: "SSDs, external hard drives, RAM, and internal upgrades" },
        { id: "c0000000-0000-0000-0000-000000000001", name: "Laptop Accessories", slug: "laptop-accessories", icon: "Laptop", description: "Essential gear for your laptop comfort and productivity" },
        { id: "c0000000-0000-0000-0000-000000000002", name: "Desk Setup / Productivity", slug: "desk-setup-productivity", icon: "Briefcase", description: "Ergonomics, organizers, and mats for a clean workspace" },
        { id: "c0000000-0000-0000-0000-000000000003", name: "Tech Accessories", slug: "tech-accessories", icon: "MonitorSmartphone", description: "Essential daily tech items and accessories" },
        { id: "c0000000-0000-0000-0000-000000000004", name: "Creator Setup", slug: "creator-setup", icon: "Video", description: "Microphones, tripods, lighting, and gear for creators" },
        { id: "c0000000-0000-0000-0000-000000000005", name: "Mobile Accessories", slug: "mobile-accessories", icon: "Smartphone", description: "Power banks, chargers, cases, and phone holders" },
        { id: "c0000000-0000-0000-0000-000000000006", name: "Audio Gear", slug: "audio-gear", icon: "Headphones", description: "Headphones, earbuds, speakers, and audio gear" },
        { id: "c0000000-0000-0000-0000-000000000007", name: "Gaming Setup", slug: "gaming-setup", icon: "Gamepad2", description: "Gaming keyboards, mice, headsets, and controllers" },
        { id: "c0000000-0000-0000-0000-000000000008", name: "Student Essentials", slug: "student-essentials", icon: "GraduationCap", description: "Dorm study essentials, bags, and budget accessories" },
        { id: "c0000000-0000-0000-0000-000000000010", name: "Work From Home", slug: "work-from-home", icon: "Home", description: "Ergonomics and connectivity for remote working professionals" },
        { id: "c0000000-0000-0000-0000-000000000011", name: "Home Office", slug: "home-office", icon: "Building", description: "Desk setups and furniture upgrades for your home office" },
        { id: "c0000000-0000-0000-0000-000000000012", name: "Smart Gadgets / Lifestyle", slug: "smart-gadgets-lifestyle", icon: "Cpu", description: "Smart home assistants, plugs, bulbs, and displays" },
        { id: "c0000000-0000-0000-0000-000000000013", name: "Travel Tech", slug: "travel-tech", icon: "Compass", description: "Travel adapters, portable chargers, and tech organizers" },
        { id: "c0000000-0000-0000-0000-000000000015", name: "Budget Finds", slug: "budget-finds", icon: "DollarSign", description: "High value products and accessories under ₹1000" },
        { id: "c0000000-0000-0000-0000-000000000016", name: "Daily Use Products", slug: "daily-use-products", icon: "Heart", description: "Everyday carry items, keychains, and cleaning products" }
      ];

      const { data: existing, error: fetchErr } = await supabase.from('categories').select('*');
      if (fetchErr) throw fetchErr;

      let finalCats = existing || [];

      // Seed missing core categories
      const missing = coreCategories.filter(cc => !finalCats.some(ec => ec.slug === cc.slug));
      if (missing.length > 0) {
        const { data: inserted, error: insertErr } = await supabase
          .from('categories')
          .insert(missing)
          .select();
        
        if (insertErr) throw insertErr;
        if (!inserted || inserted.length === 0) {
          throw new Error("Insert permission blocked by database security policies.");
        }
        finalCats = [...finalCats, ...inserted];
      }

      // Safe migration/remapping of older categories
      const weakSlugs = ["gaming", "youtuber", "gaming-accessories", "creator-gear", "desk-setup", "productivity-tools", "smart-gadgets", "lifestyle-gear"];
      const oldCats = finalCats.filter(ec => weakSlugs.includes(ec.slug));
      
      if (oldCats.length > 0) {
        const gamingAccId = finalCats.find(c => c.slug === 'gaming-setup')?.id;
        const creatorGearId = finalCats.find(c => c.slug === 'creator-setup')?.id;
        const deskSetupId = finalCats.find(c => c.slug === 'desk-setup-productivity')?.id;
        const smartGadgetsId = finalCats.find(c => c.slug === 'smart-gadgets-lifestyle')?.id;
        
        for (const oldCat of oldCats) {
          let newId = null;
          if (oldCat.slug.includes("gaming")) newId = gamingAccId;
          else if (oldCat.slug.includes("creator") || oldCat.slug.includes("youtuber")) newId = creatorGearId;
          else if (oldCat.slug.includes("desk-setup") || oldCat.slug.includes("productivity")) newId = deskSetupId;
          else if (oldCat.slug.includes("smart") || oldCat.slug.includes("lifestyle")) newId = smartGadgetsId;
          
          if (newId) {
            await supabase.from('products').update({ primary_category_id: newId }).eq('primary_category_id', oldCat.id);
            await supabase.from('product_categories').update({ category_id: newId }).eq('category_id', oldCat.id);
          }
          await supabase.from('categories').delete().eq('id', oldCat.id);
        }
        finalCats = finalCats.filter(ec => !weakSlugs.includes(ec.slug));
      }

      // Refresh product counts after re-mapping
      const { data: prods } = await supabase.from('products').select('primary_category_id');
      const counts: Record<string, number> = {};
      if (prods) {
        prods.forEach((p: any) => {
          if (p.primary_category_id) {
            counts[p.primary_category_id] = (counts[p.primary_category_id] || 0) + 1;
          }
        });
      }
      setProductCounts(counts);

      setCategories(finalCats.sort((a, b) => a.name.localeCompare(b.name)));
      alert("Success! Core 16 Categories successfully seeded and re-mapped in your database!");
    } catch (err: any) {
      alert(`Synchronizing failed: ${err.message}`);
    } finally {
      setIsAdding(false);
    }
  };

  const filteredCategories = categories.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.slug?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-5xl mx-auto min-h-screen">
      {/* Header section with seeder action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Manage Categories</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Organize and manage your product categories.</p>
          </div>
        </div>
        
        <button
          onClick={seedDefaultCategories}
          disabled={isAdding}
          className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-md shadow-brand-500/25"
        >
          {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Sync Core 19 Categories
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Add / Edit Category Form */}
        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/85 dark:border-slate-800 shadow-sm sticky top-8 space-y-4">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg border-b border-slate-100 dark:border-slate-800 pb-2">
              {editingId ? "Edit Category" : "Add New Category"}
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Category Name <span className="text-brand-500">*</span></label>
                <input 
                  type="text" 
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g. Laptop Accessories" 
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Essential tools and gear..." 
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 leading-relaxed" 
                  rows={3}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Icon Class Name</label>
                <input 
                  type="text" 
                  value={newIcon}
                  onChange={(e) => setNewIcon(e.target.value)}
                  placeholder="e.g. Laptop, Briefcase, Video" 
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Image URL</label>
                <input 
                  type="text" 
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..." 
                  className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              
              <div className="space-y-2 pt-2">
                <button 
                  onClick={editingId ? handleUpdateCategory : handleAddCategory}
                  disabled={isAdding || !newCategory.trim()}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-md shadow-brand-500/25 text-sm uppercase tracking-wider"
                >
                  {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  {editingId ? "Update Category" : "Add Category"}
                </button>
                
                {editingId && (
                  <button 
                    onClick={handleCancelEdit}
                    type="button"
                    className="w-full py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all text-sm uppercase tracking-wider"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Category Explorer list */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-250/20 dark:border-slate-800/50 relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories catalog..." 
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
              />
            </div>
            
            <div className="divide-y divide-slate-150 dark:divide-slate-800/50">
              {loading ? (
                <div className="p-16 text-center flex flex-col items-center gap-3">
                  <Loader2 className="w-7 h-7 text-brand-600 animate-spin" />
                  <p className="text-slate-500 font-bold text-sm">Loading categories directory...</p>
                </div>
              ) : filteredCategories.length > 0 ? (
                filteredCategories.map((cat) => {
                  const prodCount = productCounts[cat.id] || 0;
                  return (
                    <div key={cat.id} className="p-4 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-850/10 transition-colors gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-brand-50/50 dark:bg-brand-950/20 flex items-center justify-center text-brand-600 dark:text-brand-400 border border-brand-100/10 shrink-0">
                          <Tag className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-slate-900 dark:text-white leading-tight truncate">{cat.name}</p>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase shrink-0 tracking-wider",
                              prodCount > 0 
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-100/20" 
                                : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                            )}>
                              {prodCount} {prodCount === 1 ? 'product' : 'products'}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Slug: /{cat.slug}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Manage Products Link Button */}
                        <Link 
                          href={`/admin/products?category=${cat.id}`}
                          className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 rounded-lg border border-slate-200/60 dark:border-slate-750 transition-all text-xs font-bold flex items-center gap-1.5"
                          title="Manage products in this category"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Manage</span>
                        </Link>

                        <button 
                          onClick={() => handleEditClick(cat)}
                          className={cn(
                            "p-2 rounded-lg transition-colors border",
                            editingId === cat.id 
                              ? "bg-slate-900 border-slate-900 text-white dark:bg-white dark:border-white dark:text-slate-900" 
                              : "text-slate-500 border-slate-200/60 dark:border-slate-800 hover:text-amber-500 hover:bg-amber-50/20"
                          )}
                          title="Edit category"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        
                        <button 
                          onClick={() => handleDeleteCategory(cat.id)}
                          className="p-2 text-slate-500 border border-slate-200/60 dark:border-slate-800 hover:text-red-500 hover:bg-red-50/20 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-20 text-center text-slate-500 font-bold">No categories exist in search criteria.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
