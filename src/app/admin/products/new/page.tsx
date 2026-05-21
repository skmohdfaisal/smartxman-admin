"use client";

import Link from "next/link";
import { ArrowLeft, Save, Image as ImageIcon, Plus, X, Loader2, Trophy, Sparkles } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function NewProduct() {
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const newImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
        const fileName = `${Date.now()}_${sanitizedName}`;
        const filePath = `product-images/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          if (uploadError.message.includes('Bucket not found')) {
            alert("Error: The Supabase storage bucket 'products' was not found. Please create a bucket named 'products' in your Supabase dashboard and set it to Public.");
            return;
          }
          console.error('Error uploading image:', uploadError);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('products')
          .getPublicUrl(filePath);

        newImages.push(publicUrl);
      }
      setImages(newImages);
    } catch (error) {
      console.error('Error in upload process:', error);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
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

  const handleUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
    setImages(urls);
  };

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [expertNote, setExpertNote] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("0");
  const [category, setCategory] = useState("");
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [isFetchingAi, setIsFetchingAi] = useState(false);
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

  const fetchAiDetails = async () => {
    if (!affiliateLink || !affiliateLink.includes("amazon")) {
      alert("Please paste a valid Amazon link first.");
      return;
    }

    setIsFetchingAi(true);
    try {
      const res = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: affiliateLink })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setName(data.name || name);
      setDescription(data.description || description);
      setExpertNote(data.expert_note || expertNote);
      setPrice(data.price || price);
      
      alert("AI has populated the product details!");
    } catch (error: any) {
      console.error("AI Error:", error);
      alert(`AI Error: ${error.message}. Make sure your Groq API Key is set in .env.local`);
    } finally {
      setIsFetchingAi(false);
    }
  };

  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!name || !category) {
      setSaveError("Please fill in the product name and category.");
      return;
    }

    setIsSaving(true);

    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        setSaveError("Error: You must be logged in as an admin to save products.");
        setIsSaving(false);
        return;
      }

      // Create a URL-friendly slug
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            name,
            slug,
            description,
            expert_note: expertNote,
            affiliate_link: affiliateLink,
            price_range: price,
            rating: parseFloat(rating),
            images,
            featured,
            trending,
            category_id: null
          }
        ]);

      if (error) {
        console.error('Full Supabase error:', error);
        setSaveError(`Database Error: ${error.message} (Code: ${error.code})`);
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (error: any) {
      console.error('Detailed error:', error);
      setSaveError(`Unexpected Error: ${error.message || 'Check console for details'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Add New Product</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">Fill in the details to list a new affiliate product.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saveError && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg animate-in fade-in slide-in-from-top-1">
              {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-lg animate-in fade-in slide-in-from-top-1">
              Product saved successfully!
            </div>
          )}
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isSaving ? "Saving..." : "Save Product"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Basic Information</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Product Name</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Logitech MX Master 3S" 
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Description</label>
              <textarea 
                rows={4} 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detailed product description..." 
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              ></textarea>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Expert Note</label>
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
              <textarea 
                rows={2} 
                value={expertNote}
                onChange={(e) => setExpertNote(e.target.value)}
                placeholder="Short highlight explaining why this product is recommended..." 
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              ></textarea>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Affiliate Details</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Affiliate Link (Amazon/Others)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="Paste Amazon product link here..." 
                  className="flex-1 px-4 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                />
                <button 
                  type="button"
                  onClick={fetchAiDetails}
                  disabled={isFetchingAi}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all flex items-center gap-2 whitespace-nowrap disabled:opacity-50 shadow-sm shadow-purple-500/20"
                >
                  {isFetchingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {isFetchingAi ? "Fetching..." : "AI Fill"}
                </button>
              </div>
              <p className="mt-1.5 text-[10px] text-slate-500 dark:text-slate-400 italic">Paste an Amazon link and click AI Fill to auto-generate details.</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Price Range</label>
                <input 
                  type="text" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="e.g. ₹8,995" 
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Rating (out of 5)</label>
                <input 
                  type="number" 
                  step="0.1" 
                  max="5" 
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  placeholder="e.g. 4.9" 
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Organization</h2>
            
            <div>
              <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Category</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Select a category...</option>
                <option value="Tech">Tech</option>
                <option value="Setup">Setup</option>
                <option value="Productivity">Productivity</option>
              </select>
            </div>
            
            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" 
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as Featured</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={trending}
                  onChange={(e) => setTrending(e.target.checked)}
                  className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" 
                />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Mark as Trending</span>
              </label>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Product Images</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Image URLs (one per line)</label>
                <textarea 
                  rows={3} 
                  value={images.join('\n')}
                  onChange={handleUrlChange}
                  placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg" 
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                ></textarea>
              </div>

              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                accept="image/*" 
                className="hidden" 
              />

              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-brand-500 mx-auto mb-2 animate-spin" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-400 group-hover:text-brand-500 mx-auto mb-2 transition-colors" />
                )}
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {uploading ? "Uploading..." : "Upload multiple images"}
                </p>
                <p className="text-xs text-slate-500">PNG, JPG or WEBP (Max 5MB each)</p>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {images.filter(isValidUrl).map((url, idx) => (
                    <div key={idx} className={cn(
                      "aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg border overflow-hidden relative group",
                      idx === 0 ? "border-brand-500 ring-2 ring-brand-500/20" : "border-slate-200 dark:border-slate-700"
                    )}>
                      <Image 
                        src={url} 
                        alt={`Preview ${idx}`} 
                        fill 
                        className="object-cover" 
                      />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-brand-600 text-white text-[8px] font-bold uppercase rounded shadow-sm z-10">
                          Main
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        {idx !== 0 && (
                          <button 
                            onClick={() => setAsThumbnail(idx)}
                            className="p-1.5 bg-white text-slate-900 rounded-md hover:bg-brand-500 hover:text-white transition-colors"
                            title="Set as Main Thumbnail"
                          >
                            <Trophy className="w-3 h-3" />
                          </button>
                        )}
                        <button 
                          onClick={() => removeImage(idx)}
                          className="p-1.5 bg-white text-red-600 rounded-md hover:bg-red-600 hover:text-white transition-colors"
                          title="Delete"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
