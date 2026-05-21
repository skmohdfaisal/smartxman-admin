"use client";

import Link from "next/link";
import { ArrowLeft, Save, Image as ImageIcon, Plus, X, Loader2, Trophy, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [expertNote, setExpertNote] = useState("");
  const [rating, setRating] = useState("4.5");
  const [images, setImages] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingNote, setIsGeneratingNote] = useState(false);

  const generateExpertNote = async () => {
    if (!name || !description) {
      alert("Please provide a product name and description first.");
      return;
    }

    setIsGeneratingNote(true);
    try {
      const res = await fetch("/api/ai/generate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setExpertNote(data.expertNote || expertNote);
    } catch (error: any) {
      console.error("AI Error:", error);
      alert(`AI Error: ${error.message}. Make sure your Groq API Key is set in .env.local`);
    } finally {
      setIsGeneratingNote(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const fetchProduct = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      setName(data.name || "");
      setDescription(data.description || "");
      setPrice(data.price_range || "");
      setCategory("Tech"); // For now
      setAffiliateLink(data.affiliate_link || "");
      setExpertNote(data.expert_note || "");
      setRating(data.rating?.toString() || "4.5");
      setImages(data.images || []);
      setFeatured(data.featured || false);
      setTrending(data.trending || false);
    } catch (error: any) {
      console.error('Error fetching product:', error);
      setSaveError(`Error loading product: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsSaving(true);
    const newImageUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `product-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        newImageUrls.push(publicUrl);
      }
      setImages([...images, ...newImageUrls]);
    } catch (error: any) {
      alert(`Error uploading image: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const setAsThumbnail = (index: number) => {
    const newImages = [...images];
    const [selectedImage] = newImages.splice(index, 1);
    newImages.unshift(selectedImage);
    setImages(newImages);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!name) {
      setSaveError("Please fill in the product name.");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('products')
        .update({
          name,
          description,
          expert_note: expertNote,
          affiliate_link: affiliateLink,
          price_range: price,
          rating: parseFloat(rating),
          images,
          featured,
          trending
        })
        .eq('id', id);

      if (error) throw error;

      setSaveSuccess(true);
      setTimeout(() => router.push("/admin/products"), 2000);
    } catch (error: any) {
      console.error('Error updating product:', error);
      setSaveError(`Database Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading product data...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Product</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Update the details for this product.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveError && <div className="px-4 py-2 bg-red-50 text-red-600 text-sm rounded-lg">{saveError}</div>}
          {saveSuccess && <div className="px-4 py-2 bg-green-50 text-green-600 text-sm rounded-lg">Updated successfully!</div>}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Update Product"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">Basic Information</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Product Name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
              <textarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500"></textarea>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Expert Note (Our Take)</label>
                <button 
                  type="button"
                  onClick={generateExpertNote}
                  disabled={isGeneratingNote || !name || !description}
                  className="text-[11px] flex items-center gap-1.5 text-brand-600 hover:text-brand-700 font-bold transition-colors disabled:opacity-50 tracking-wide"
                >
                  {isGeneratingNote ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  {isGeneratingNote ? "GENERATING..." : "GENERATE AI NOTE"}
                </button>
              </div>
              <textarea rows={2} value={expertNote} onChange={(e) => setExpertNote(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500 italic"></textarea>
            </div>
          </section>

          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">Product Images</h2>
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {images.map((url, idx) => (
                  <div key={idx} className={cn("aspect-square rounded-xl border relative group overflow-hidden", idx === 0 ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-200")}>
                    <Image src={url} alt={`Product ${idx}`} fill className="object-cover" />
                    {idx === 0 && <span className="absolute top-1 left-1 px-1 py-0.5 bg-brand-600 text-white text-[8px] font-bold uppercase rounded">Main</span>}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      {idx !== 0 && <button onClick={() => setAsThumbnail(idx)} className="p-1.5 bg-white rounded-md"><Trophy className="w-3 h-3 text-brand-600" /></button>}
                      <button onClick={() => removeImage(idx)} className="p-1.5 bg-white rounded-md"><X className="w-3 h-3 text-red-600" /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-500 hover:bg-brand-50 transition-all flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-600">
                  <Plus className="w-6 h-6" />
                  <span className="text-xs font-medium">Add Image</span>
                </button>
              </div>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
            </div>
          </section>
        </div>

        <div className="space-y-8">
          <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="font-bold text-lg border-b border-slate-100 dark:border-slate-800 pb-3">Pricing & Links</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Display Price (e.g. ₹7,499)</label>
              <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Affiliate Link (Amazon/Others)</label>
              <input type="text" value={affiliateLink} onChange={(e) => setAffiliateLink(e.target.value)} className="w-full px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
