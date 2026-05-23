"use client";

import Link from "next/link";
import { ArrowLeft, Save, Image as ImageIcon, Plus, X, Loader2, Trophy, Sparkles, ExternalLink, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useState, useRef, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // States: Loading
  const [loading, setLoading] = useState(true);
  
  // States: Amazon Import
  const [originalAmazonUrl, setOriginalAmazonUrl] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [detectedAsin, setDetectedAsin] = useState("");
  const [isFetchingAmazon, setIsFetchingAmazon] = useState(false);
  const [amazonFetchMessage, setAmazonFetchMessage] = useState<{type: 'error' | 'success' | 'info', text: string} | null>(null);

  // States: Basic Info
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [expertNote, setExpertNote] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("0");
  const [category, setCategory] = useState("");
  const [additionalCategories, setAdditionalCategories] = useState<string[]>([]);
  const [audience, setAudience] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<string[]>([]);
  const [useCase, setUseCase] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  
  // States: Categories Data
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) {
        setDbCategories(data);
      }
    }
    fetchCategories();
  }, []);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_categories(category_id)')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setName(data.name || "");
        setBrand(data.brand || "");
        setDescription(data.description || "");
        setExpertNote(data.expert_note || "");
        setOriginalAmazonUrl(data.original_url || "");
        setAffiliateLink(data.affiliate_link || "");
        setPrice(data.price_range || "");
        setRating(data.rating?.toString() || "0");
        setCategory(data.primary_category_id || "");
        setAudience(data.audience || []);
        setBudgetRange(data.budget_range || []);
        setUseCase(data.use_case || []);
        setTags(data.tags?.join(', ') || "");
        setBestFor(data.best_for || "");
        setWhoShouldBuy(data.who_should_buy || "");
        setWhoShouldAvoid(data.who_should_avoid || "");
        setPros(data.pros?.length ? data.pros : [""]);
        setCons(data.cons?.length ? data.cons : [""]);
        setBuyingVerdict(data.buying_verdict || "");
        setSmartScore(data.smart_score?.toString() || "0");
        setValueScore(data.value_score?.toString() || "0");
        setStatus(data.status || "draft");
        setFeatured(data.featured || false);
        setTrending(data.trending || false);
        setIsBudgetPick(data.is_budget_pick || false);
        setIsBestDeal(data.is_best_deal || false);
        setImages(data.images || []);
        
        if (data.product_categories) {
          setAdditionalCategories(data.product_categories.map((pc: any) => pc.category_id).filter((cid: string) => cid !== data.primary_category_id));
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [id]);
  
  // States: SmartXman Recommendations
  const [bestFor, setBestFor] = useState("");
  const [whoShouldBuy, setWhoShouldBuy] = useState("");
  const [whoShouldAvoid, setWhoShouldAvoid] = useState("");
  const [buyingVerdict, setBuyingVerdict] = useState("");
  const [smartScore, setSmartScore] = useState("8.5");
  const [valueScore, setValueScore] = useState("8.0");
  
  // Dynamic Arrays for Pros/Cons
  const [pros, setPros] = useState<string[]>([""]);
  const [cons, setCons] = useState<string[]>([""]);

  const handleArrayChange = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number, value: string) => {
    setter(prev => {
      const newArr = [...prev];
      newArr[index] = value;
      return newArr;
    });
  };
  const addArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>) => setter(prev => [...prev, ""]);
  const removeArrayItem = (setter: React.Dispatch<React.SetStateAction<string[]>>, index: number) => {
    setter(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : [""]);
  };

  const handleMultiSelect = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  // States: Status and Visibility
  const [status, setStatus] = useState("draft");
  const [featured, setFeatured] = useState(false);
  const [trending, setTrending] = useState(false);
  const [isBudgetPick, setIsBudgetPick] = useState(false);
  const [isBestDeal, setIsBestDeal] = useState(false);

  // States: Images
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States: Saving
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingAiNote, setIsGeneratingAiNote] = useState(false);

  // Handlers: Amazon Import
  const handleFetchAmazon = async () => {
    if (!originalAmazonUrl && !affiliateLink) {
      setAmazonFetchMessage({ type: 'error', text: "Please provide an Amazon URL first." });
      return;
    }
    
    setIsFetchingAmazon(true);
    setAmazonFetchMessage(null);
    
    try {
      const urlToFetch = originalAmazonUrl || affiliateLink;
      const res = await fetch("/api/amazon/fetch-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlToFetch })
      });

      const data = await res.json();
      
      if (data.error) throw new Error(data.error);

      if (data.asin) {
        setDetectedAsin(data.asin);
      }

      if (data.status === "not_configured") {
        setAmazonFetchMessage({ type: 'info', text: data.message });
        // Automatically generate an affiliate link if we have the associate tag in env (this would happen server side, but since we don't have it, we just leave it blank if empty)
      } else if (data.status === "success") {
        setAmazonFetchMessage({ type: 'success', text: "Product details extracted successfully." });
        if (data.data.name) setName(data.data.name);
        if (data.data.brand) setBrand(data.data.brand);
        if (data.data.price) setPrice(data.data.price);
        if (data.data.rating) setRating(data.data.rating);
        if (data.data.image && images.length === 0) setImages([data.data.image]);
      }
    } catch (error: any) {
      console.error("Amazon fetch error:", error);
      setAmazonFetchMessage({ type: 'error', text: error.message });
    } finally {
      setIsFetchingAmazon(false);
    }
  };

  // Handlers: AI Note Generation
  const handleGenerateAiNote = async () => {
    if (!name || !description) return;
    setIsGeneratingAiNote(true);
    try {
      const res = await fetch("/api/ai/generate-note", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.expertNote) {
        setExpertNote(data.expertNote);
      }
    } catch (error: any) {
      console.error("AI Generation error:", error);
      alert(`AI Generation failed: ${error.message}`);
    } finally {
      setIsGeneratingAiNote(false);
    }
  };

  // Handlers: Images
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

        const { error: uploadError } = await supabase.storage
          .from("products")
          .upload(filePath, file, { cacheControl: '3600', upsert: false });

        if (uploadError) {
          console.error("Upload Error Details:", uploadError);
          alert(`Upload Failed: ${uploadError.message}. Make sure the 'products' storage bucket exists and is public in Supabase.`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
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

  const removeImage = (index: number) => setImages(images.filter((_, i) => i !== index));
  const setAsThumbnail = (index: number) => {
    const newImgs = [...images];
    const [selected] = newImgs.splice(index, 1);
    newImgs.unshift(selected);
    setImages(newImgs);
  };
  const handleUrlChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const urls = e.target.value.split('\n').filter(url => url.trim() !== '');
    setImages(urls);
  };

  // Handlers: Save
  const handleSave = async () => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!name || !category) {
      setSaveError("Please fill in the product name and category.");
      return;
    }

    setIsSaving(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("You must be logged in as an admin to save products.");
      }

      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const filteredPros = pros.filter(p => p.trim() !== '');
      const filteredCons = cons.filter(c => c.trim() !== '');

      const payload = {
        name,
        slug,
        brand,
        description,
        expert_note: expertNote,
        original_url: originalAmazonUrl,
        affiliate_link: affiliateLink,
        price_range: price,
        rating: parseFloat(rating) || 0,
        images,
        primary_category_id: category || null,
        audience,
        budget_range: budgetRange,
        use_case: useCase,
        tags: tags.split(',').map(t => t.trim()).filter(t => t),
        best_for: bestFor,
        who_should_buy: whoShouldBuy,
        who_should_avoid: whoShouldAvoid,
        pros: filteredPros,
        cons: filteredCons,
        buying_verdict: buyingVerdict,
        smart_score: parseFloat(smartScore) || 0,
        value_score: parseFloat(valueScore) || 0,
        status,
        featured,
        trending,
        is_budget_pick: isBudgetPick,
        is_best_deal: isBestDeal
      };

      const { error } = await supabase.from('products').update(payload).eq('id', id);

      if (error) {
        throw new Error(`Database Error: ${error.message}`);
      }

      // Handle product categories linkage
      await supabase.from('product_categories').delete().eq('product_id', id);
      const productCategories = [];
      // Add primary category
      if (category) {
        productCategories.push({ product_id: id, category_id: category });
      }
      // Add additional categories
      additionalCategories.forEach(catId => {
        if (catId !== category) {
          productCategories.push({ product_id: id, category_id: catId });
        }
      });
      
      if (productCategories.length > 0) {
        await supabase.from('product_categories').insert(productCategories);
      }

      setSaveSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Optional: Redirect after save
      // setTimeout(() => router.push("/admin/products"), 2000);
      
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveError(error.message || 'Unexpected Error');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  if (loading) {
    return <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
        <p className="text-slate-500 font-medium">Loading product data...</p>
      </div>
    </div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Edit Product</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">SmartXman affiliate product builder</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {saveError && (
            <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-600 dark:text-green-400 text-sm rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Product saved successfully!
            </div>
          )}
          
          <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1 shadow-sm">
            <button onClick={() => setStatus("draft")} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", status === "draft" ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "text-slate-500 hover:text-slate-900 dark:hover:text-white")}>Draft</button>
            <button onClick={() => setStatus("needs_review")} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", status === "needs_review" ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400" : "text-slate-500 hover:text-amber-600 dark:hover:text-amber-400")}>Review</button>
            <button onClick={() => setStatus("published")} className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", status === "published" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400" : "text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400")}>Publish</button>
          </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - FORM */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* Section 1: Amazon Import */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Amazon Product Import</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Original Amazon URL</label>
                <input 
                  type="text" 
                  value={originalAmazonUrl}
                  onChange={(e) => setOriginalAmazonUrl(e.target.value)}
                  placeholder="Paste original Amazon product link here..." 
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" 
                />
                <p className="text-[10px] text-slate-500 mt-1">Used only for detecting product details.</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Custom Affiliate URL <span className="text-brand-500">*</span></label>
                <input 
                  type="text" 
                  value={affiliateLink}
                  onChange={(e) => setAffiliateLink(e.target.value)}
                  placeholder="Paste your Amazon affiliate link here..." 
                  className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-brand-200 dark:border-brand-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" 
                />
                <p className="text-[10px] text-slate-500 mt-1">This is the exact link public users will click.</p>
              </div>
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button 
                type="button"
                onClick={handleFetchAmazon}
                disabled={isFetchingAmazon || (!originalAmazonUrl && !affiliateLink)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-lg font-medium transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isFetchingAmazon ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                Fetch Product Details
              </button>
              
              {detectedAsin && (
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-md text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400">ASIN</span> {detectedAsin}
                </div>
              )}
            </div>

            {amazonFetchMessage && (
              <div className={cn(
                "p-3 rounded-lg border text-sm flex items-start gap-2",
                amazonFetchMessage.type === 'error' ? "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400" :
                amazonFetchMessage.type === 'info' ? "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800/50 dark:text-blue-400" :
                "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400"
              )}>
                {amazonFetchMessage.type === 'error' && <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                {amazonFetchMessage.type === 'info' && <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
                {amazonFetchMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />}
                {amazonFetchMessage.text}
              </div>
            )}
          </div>

          {/* Section 2: Basic Information */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Product Name <span className="text-red-500">*</span></label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Logitech MX Master 3S Wireless Mouse" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Brand</label>
                <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="e.g. Logitech" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Category & Discovery</label>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Primary Category <span className="text-red-500">*</span></label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500">
                      {dbCategories.length > 0 ? (
                        dbCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      ) : (
                        <option value="">Loading categories...</option>
                      )}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Additional Categories</label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {dbCategories.filter(c => c.id !== category).map(cat => (
                        <label key={cat.id} className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 cursor-pointer hover:border-brand-300 transition-colors">
                          <input type="checkbox" checked={additionalCategories.includes(cat.id)} onChange={() => handleMultiSelect(setAdditionalCategories, cat.id)} className="w-3.5 h-3.5 text-brand-600 rounded border-slate-300" />
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Audience</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['Students', 'Creators', 'Gamers', 'Working Professionals', 'Setup Lovers', 'Everyday Buyers'].map(aud => (
                          <label key={aud} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={audience.includes(aud)} onChange={() => handleMultiSelect(setAudience, aud)} className="text-brand-600 rounded border-slate-300" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{aud}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Use Case</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['Study', 'Gaming', 'Content Creation', 'Desk Setup', 'Productivity', 'Work From Home', 'Travel', 'Lifestyle'].map(uc => (
                          <label key={uc} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={useCase.includes(uc)} onChange={() => handleMultiSelect(setUseCase, uc)} className="text-brand-600 rounded border-slate-300" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{uc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Budget Range</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['Under ₹500', 'Under ₹1000', 'Under ₹3000', 'Under ₹5000', 'Under ₹10000', 'Premium'].map(br => (
                          <label key={br} className="flex items-center gap-1.5 cursor-pointer">
                            <input type="checkbox" checked={budgetRange.includes(br)} onChange={() => handleMultiSelect(setBudgetRange, br)} className="text-brand-600 rounded border-slate-300" />
                            <span className="text-xs text-slate-600 dark:text-slate-400">{br}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold mb-1 text-slate-500 uppercase">Tags</label>
                      <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="tech, gadget, wireless (comma separated)" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Product Description</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Objective, factual description of the product..." className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"></textarea>
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Expert Note (The Hook)</label>
                  <button
                    type="button"
                    onClick={handleGenerateAiNote}
                    disabled={isGeneratingAiNote || !name || !description}
                    className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-350 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isGeneratingAiNote ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                        Generate with AI
                      </>
                    )}
                  </button>
                </div>
                <textarea rows={2} value={expertNote} onChange={(e) => setExpertNote(e.target.value)} placeholder="Best for students who need a budget-friendly product for daily use..." className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-brand-200 dark:border-brand-900/50 focus:outline-none focus:ring-2 focus:ring-brand-500"></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Price Range</label>
                <input type="text" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="e.g. ₹8,995" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Rating (out of 5)</label>
                <input type="number" step="0.1" max="5" value={rating} onChange={(e) => setRating(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              </div>
            </div>
          </div>

          {/* Section 3: SmartXman Recommendations */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg">
                <Trophy className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">SmartXman Recommendations</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Best For</label>
                  <input type="text" value={bestFor} onChange={(e) => setBestFor(e.target.value)} placeholder="e.g. Productivity, Ergonomics" className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Who Should Buy</label>
                  <textarea rows={2} value={whoShouldBuy} onChange={(e) => setWhoShouldBuy(e.target.value)} placeholder="Mac users looking for comfort..." className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Who Should Avoid</label>
                  <textarea rows={2} value={whoShouldAvoid} onChange={(e) => setWhoShouldAvoid(e.target.value)} placeholder="Competitive gamers..." className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"></textarea>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-between text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                    <span>Pros <span className="text-emerald-500">(+)</span></span>
                    <button type="button" onClick={() => addArrayItem(setPros)} className="text-emerald-600 hover:text-emerald-700 text-xs flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button>
                  </label>
                  <div className="space-y-2">
                    {pros.map((pro, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" value={pro} onChange={(e) => handleArrayChange(setPros, idx, e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" placeholder="e.g. Excellent build quality" />
                        <button type="button" onClick={() => removeArrayItem(setPros, idx)} className="p-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="flex items-center justify-between text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">
                    <span>Cons <span className="text-red-500">(-)</span></span>
                    <button type="button" onClick={() => addArrayItem(setCons)} className="text-red-600 hover:text-red-700 text-xs flex items-center gap-1"><Plus className="w-3 h-3"/> Add</button>
                  </label>
                  <div className="space-y-2">
                    {cons.map((con, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input type="text" value={con} onChange={(e) => handleArrayChange(setCons, idx, e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm" placeholder="e.g. Expensive" />
                        <button type="button" onClick={() => removeArrayItem(setCons, idx)} className="p-2 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-5 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-1.5 text-slate-700 dark:text-slate-300">Final Buying Verdict</label>
                  <textarea rows={2} value={buyingVerdict} onChange={(e) => setBuyingVerdict(e.target.value)} placeholder="The ultimate mouse for creators, though pricey..." className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-brand-700 dark:text-brand-400">Smart Score (out of 10)</label>
                  <input type="number" step="0.1" max="10" value={smartScore} onChange={(e) => setSmartScore(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-brand-50 dark:bg-brand-900/10 border border-brand-200 dark:border-brand-800/50 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xl font-black text-brand-600 dark:text-brand-400 text-center" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-emerald-700 dark:text-emerald-400">Value Score (out of 10)</label>
                  <input type="number" step="0.1" max="10" value={valueScore} onChange={(e) => setValueScore(e.target.value)} className="w-full px-4 py-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/50 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xl font-black text-emerald-600 dark:text-emerald-400 text-center" />
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Organization and Product Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Visibility Badges</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Featured Product</p>
                    <p className="text-[10px] text-slate-500">Shows on homepage carousel</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <input type="checkbox" checked={trending} onChange={(e) => setTrending(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Trending Now</p>
                    <p className="text-[10px] text-slate-500">Adds 'Trending' badge</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <input type="checkbox" checked={isBudgetPick} onChange={(e) => setIsBudgetPick(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Budget Pick</p>
                    <p className="text-[10px] text-slate-500">Adds green 'Budget' badge</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                  <input type="checkbox" checked={isBestDeal} onChange={(e) => setIsBestDeal(e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Best Deal</p>
                    <p className="text-[10px] text-slate-500">Shows in Deals section</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">Product Images</h2>
              
              <div className="flex-1 flex flex-col gap-4">
                <textarea rows={2} value={images.join('\n')} onChange={handleUrlChange} placeholder="https://amazon.com/image.jpg..." className="w-full px-4 py-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"></textarea>
                
                <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group flex-1 flex flex-col justify-center">
                  {uploading ? <Loader2 className="w-6 h-6 text-brand-500 mx-auto mb-2 animate-spin" /> : <ImageIcon className="w-6 h-6 text-slate-400 group-hover:text-brand-500 mx-auto mb-2 transition-colors" />}
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{uploading ? "Uploading..." : "Upload Images"}</p>
                </div>

                {images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.filter(isValidUrl).slice(0, 4).map((url, idx) => (
                      <div key={idx} className={cn("aspect-square bg-slate-100 dark:bg-slate-800 rounded-lg border overflow-hidden relative group", idx === 0 ? "border-brand-500" : "border-slate-200 dark:border-slate-700")}>
                        <Image src={url} alt={`Preview ${idx}`} fill className="object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx !== 0 && <button onClick={() => setAsThumbnail(idx)} className="p-1 bg-white text-slate-900 rounded"><Trophy className="w-3 h-3" /></button>}
                          <button onClick={() => removeImage(idx)} className="p-1 bg-white text-red-600 rounded"><X className="w-3 h-3" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN - LIVE PREVIEW */}
        <div className="xl:col-span-1">
          <div className="sticky top-24 space-y-4">
            <h3 className="font-bold text-slate-400 uppercase tracking-widest text-xs ml-2">Live Preview</h3>
            
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none flex flex-col">
              {/* Preview Image */}
              <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-800 relative w-full flex items-center justify-center p-6">
                {images.length > 0 && isValidUrl(images[0]) ? (
                  <Image src={images[0]} alt="Product preview" fill className="object-contain p-4 drop-shadow-xl" />
                ) : (
                  <ImageIcon className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                )}
                
                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                  {isBestDeal && <span className="bg-rose-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-sm">Best Deal</span>}
                  {isBudgetPick && <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-sm">Budget Pick</span>}
                  {trending && <span className="bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded-md shadow-sm">Trending</span>}
                </div>
                
                {/* Score */}
                {parseFloat(smartScore) > 0 && (
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md dark:bg-slate-900/90 text-brand-600 dark:text-brand-400 font-black text-sm px-2.5 py-1.5 rounded-xl border border-white/20 shadow-sm flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5" /> {smartScore}
                  </div>
                )}
              </div>

              {/* Preview Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-brand-600 uppercase tracking-widest bg-brand-50 dark:bg-brand-900/30 px-2 py-0.5 rounded text-brand-600 dark:text-brand-400">{category || 'Category'}</span>
                  {brand && <span className="text-xs font-medium text-slate-500">{brand}</span>}
                </div>
                
                <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight mb-3 line-clamp-2">
                  {name || "Awesome Tech Product Name"}
                </h3>
                
                {expertNote ? (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 mb-4">
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{expertNote}"</p>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 border-dashed mb-4">
                    <p className="text-sm text-slate-400 italic">Expert note will appear here...</p>
                  </div>
                )}

                <div className="flex items-end justify-between mb-6 mt-auto">
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5 font-medium">Price Range</p>
                    <p className="text-2xl font-black text-slate-900 dark:text-white">{price || "---"}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg">
                    <span className="text-amber-500">★</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{rating || "0"}</span>
                  </div>
                </div>

                <a 
                  href={affiliateLink || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={cn(
                    "w-full py-3.5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm",
                    affiliateLink ? "bg-amber-400 hover:bg-amber-500 text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                  )}
                >
                  Check Latest Price on Amazon <ExternalLink className="w-4 h-4" />
                </a>
                
                <p className="text-[9px] text-center text-slate-400 mt-3 leading-tight px-4">
                  smartXman may earn a small commission when you buy through this link.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
