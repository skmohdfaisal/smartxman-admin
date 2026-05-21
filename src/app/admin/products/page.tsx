import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { ProductRow } from "./ProductRow";

export default async function AdminProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  async function deleteProductAction(id: string) {
    "use server";
    if (!id) return;
    await supabase.from('products').delete().eq('id', id);
    revalidatePath('/admin/products');
  }

  async function toggleProductStatusAction(id: string, isActive: boolean) {
    "use server";
    if (!id) return {};
    const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', id);
    if (error) return { error: error.message };
    revalidatePath('/admin/products');
    revalidatePath('/products');
    revalidatePath('/');
    return {};
  }

  return (
    <div className="p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Manage Products</h1>
          <p className="text-slate-600 dark:text-slate-400">Add, edit, or remove affiliate products from your site.</p>
        </div>
        <Link href="/admin/products/new" className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
          <Plus className="w-5 h-5" /> Add Product
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products..." 
              className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select className="px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option>All Categories</option>
            <option>Tech</option>
            <option>Setup</option>
            <option>Productivity</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 font-medium">Product Name</th>
                <th className="px-6 py-4 font-medium">Category</th>
                <th className="px-6 py-4 font-medium">Price</th>
                <th className="px-6 py-4 font-medium">Status</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {(products || []).map((item) => (
                <ProductRow 
                  key={item.id} 
                  item={item} 
                  deleteAction={deleteProductAction} 
                  toggleAction={toggleProductStatusAction} 
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
