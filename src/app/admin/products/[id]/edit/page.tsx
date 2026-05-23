"use client";

import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Image as ImageIcon, 
  Plus, 
  X, 
  Loader2, 
  Trophy, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2,
  FileText,
  Sliders,
  ShieldCheck,
  CheckSquare,
  HelpCircle,
  TrendingUp,
  Tag,
  Users,
  Compass,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkle
} from "lucide-react";
import { useState, useRef, useEffect, use } from "react";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  
  // Step navigation state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  
  const stepsList = [
    { number: 1, label: "Import", icon: Compass },
    { number: 2, label: "Details", icon: FileText },
    { number: 3, label: "Targeting", icon: Tag },
    { number: 4, label: "Recommendation", icon: Trophy },
    { number: 5, label: "Publish", icon: ShieldCheck },
  ];

  // States: Amazon Import
  const [originalAmazonUrl, setOriginalAmazonUrl] = useState("");
  const [affiliateLink, setAffiliateLink] = useState("");
  const [detectedAsin, setDetectedAsin] = useState("");
  const [isFetchingAmazon, setIsFetchingAmazon] = useState(false);
  const [amazonFetchMessage, setAmazonFetchMessage] = useState<{type: 'error' | 'success' | 'info', text: string} | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<{
    name: string;
    brand: string;
    price: string;
    rating: string;
    image: string;
  } | null>(null);

  // States: Basic Info
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [rating, setRating] = useState("0");
  
  // States: Targeting
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [additionalCategories, setAdditionalCategories] = useState<string[]>([]);
  const [audience, setAudience] = useState<string[]>([]);
  const [useCase, setUseCase] = useState<string[]>([]);
  const [budgetRange, setBudgetRange] = useState<string[]>([]);
  const [tags, setTags] = useState("");
  const [dbCategories, setDbCategories] = useState<any[]>([]);

  // States: Recommendations
  const [expertNote, setExpertNote] = useState(""); // Short Buying Advice
  const [bestFor, setBestFor] = useState(""); // Best Used For
  const [whoShouldBuy, setWhoShouldBuy] = useState(""); // Recommended For
  const [whoShouldAvoid, setWhoShouldAvoid] = useState(""); // Not Recommended For
  const [buyingVerdict, setBuyingVerdict] = useState(""); // Final Recommendation
  const [smartScore, setSmartScore] = useState("8.5"); // Overall Smart Score
  const [valueScore, setValueScore] = useState("8.0"); // Value for Money Score
  const [pros, setPros] = useState<string[]>([""]);
  const [cons, setCons] = useState<string[]>([""]);

  // States: Visibility & Publishing
  const [featured, setFeatured] = useState(false); // Show on Homepage
  const [trending, setTrending] = useState(false); // Trending Now
  const [isBudgetPick, setIsBudgetPick] = useState(false); // Budget Pick
  const [isBestDeal, setIsBestDeal] = useState(false); // Best Deal
  const [showInDeals, setShowInDeals] = useState(false); // Show in Deals Section
  const [status, setStatus] = useState("draft"); // Publish Status: draft, needs_review, published, archived
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [slug, setSlug] = useState("");

  // States: Images
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States: Actions & AI
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isGeneratingAiNote, setIsGeneratingAiNote] = useState(false);

  // Load Categories on Mount
  useEffect(() => {
    async function fetchCategories() {
      const { data } = await supabase.from('categories').select('*').order('name');
      if (data) {
        setDbCategories(data);
      }
    }
    fetchCategories();
  }, []);

  // Load Existing Product Data
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
        setSubCategory(data.sub_category || "");
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
        setShowInDeals(data.show_in_deals || false);
        setImages(data.images || []);
        setSeoTitle(data.seo_title || "");
        setSeoDescription(data.seo_description || "");
        setSlug(data.slug || "");
        
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

  // Auto-generate slug from name
  const handleGenerateSlug = () => {
    if (!name) return;
    const autoSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    setSlug(autoSlug);
  };

  // Handlers: Amazon Import
  const handleFetchAmazon = async () => {
    if (!originalAmazonUrl && !affiliateLink) {
      setAmazonFetchMessage({ type: 'error', text: "Please provide an Amazon URL first." });
      return;
    }
    
    setIsFetchingAmazon(true);
    setAmazonFetchMessage(null);
    setDetectedProduct(null);
    
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

      if (data.status === "success") {
        setAmazonFetchMessage({ type: 'success', text: "Product details extracted successfully." });
        
        const extracted = {
          name: data.data.name || "",
          brand: data.data.brand || "",
          price: data.data.price || "",
          rating: data.data.rating || "0",
          image: data.data.image || "",
        };

        setDetectedProduct(extracted);
        
        // Auto fill states
        if (extracted.name) setName(extracted.name);
        if (extracted.brand) setBrand(extracted.brand);
        if (extracted.price) setPrice(extracted.price);
        if (extracted.rating) setRating(extracted.rating);
        if (extracted.image && images.length === 0) setImages([extracted.image]);
      } else {
        setAmazonFetchMessage({ type: 'info', text: data.message || "Failed to extract structured product details, but ASIN detected." });
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

  // Handlers: Repeatable Arrays (Pros/Cons)
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

  // Handlers: File Upload
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
          alert(`Upload Failed: ${uploadError.message}`);
          continue;
        }

        const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(filePath);
        newImages.push(publicUrl);
      }
      setImages(newImages);
    } catch (error) {
      console.error('Upload error:', error);
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

  // Calculate Product Health Score
  const healthChecklist = [
    { name: "Product name added", checked: !!name },
    { name: "Affiliate link added", checked: !!affiliateLink },
    { name: "Product image added", checked: images.length > 0 },
    { name: "Price added", checked: !!price },
    { name: "Rating added", checked: parseFloat(rating) > 0 },
    { name: "Main category selected", checked: !!category },
    { name: "Short buying advice added", checked: !!expertNote },
    { name: "Pros and cons added", checked: pros.some(p => p.trim()) && cons.some(c => c.trim()) },
    { name: "Final recommendation added", checked: !!buyingVerdict },
    { name: "SEO title added", checked: !!seoTitle },
    { name: "SEO description added", checked: !!seoDescription },
  ];
  
  const completedChecks = healthChecklist.filter(item => item.checked).length;
  const healthPercent = Math.round((completedChecks / healthChecklist.length) * 100);

  // Handlers: Save/Publish
  const handleSave = async (overrideStatus?: string) => {
    setSaveError(null);
    setSaveSuccess(false);

    if (!name || !category) {
      setSaveError("Please enter at least a Product Name and select a Main Category.");
      setStep(2); // Jump to Details step
      return;
    }

    setIsSaving(true);
    const saveStatus = overrideStatus || status;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("You must be logged in as an admin to save products.");
      }

      const activeSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const filteredPros = pros.filter(p => p.trim() !== '');
      const filteredCons = cons.filter(c => c.trim() !== '');

      const payload = {
        name,
        slug: activeSlug,
        brand,
        description,
        expert_note: expertNote,
        original_url: originalAmazonUrl,
        affiliate_link: affiliateLink,
        price_range: price,
        rating: parseFloat(rating) || 0,
        images,
        primary_category_id: category || null,
        sub_category: subCategory,
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
        status: saveStatus,
        featured,
        trending,
        is_budget_pick: isBudgetPick,
        is_best_deal: isBestDeal,
        show_on_homepage: featured,
        show_in_deals: showInDeals,
        seo_title: seoTitle || `${name} - SmartXMan Recommendation`,
        seo_description: seoDescription || expertNote || description.substring(0, 155),
      };

      const { error } = await supabase.from('products').update(payload).eq('id', id);

      if (error) {
        throw new Error(`Database Error: ${error.message}`);
      }

      // Handle categories linkage
      await supabase.from('product_categories').delete().eq('product_id', id);
      const productCategories = [];
      if (category) {
        productCategories.push({ product_id: id, category_id: category });
      }
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
      
      setTimeout(() => {
        router.push("/admin/products");
      }, 1500);
      
    } catch (error: any) {
      console.error('Save error:', error);
      setSaveError(error.message || 'Unexpected Error occurred while saving');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSaving(false);
    }
  };

  const isValidUrl = (url: string) => {
    try { new URL(url); return true; } catch { return false; }
  };

  const currentCategoryName = dbCategories.find(c => c.id === category)?.name || "";

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-brand-600 animate-spin" />
          <p className="text-slate-500 font-bold">Loading product details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </Link>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Edit Product</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Sleek step-based affiliate product editor</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {saveError && (
            <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-sm rounded-xl flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0" /> {saveError}
            </div>
          )}
          {saveSuccess && (
            <div className="px-4 py-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/40 text-green-600 dark:text-green-400 text-sm rounded-xl flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0" /> Product updated successfully!
            </div>
          )}
        </div>
      </div>

      {/* Progress Navigation Tracker */}
      <div className="mb-10 bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
        <div className="grid grid-cols-5 gap-2">
          {stepsList.map(s => {
            const Icon = s.icon;
            const isCompleted = step > s.number;
            const isActive = step === s.number;
            return (
              <button
                key={s.number}
                type="button"
                onClick={() => setStep(s.number)}
                className={cn(
                  "flex flex-col md:flex-row items-center gap-3 py-3 px-4 rounded-xl text-center md:text-left transition-all font-bold text-xs uppercase tracking-wider relative overflow-hidden",
                  isActive 
                    ? "bg-brand-600 text-white shadow-md shadow-brand-500/25" 
                    : isCompleted 
                    ? "bg-slate-50 dark:bg-slate-800/40 text-brand-600 dark:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800/70"
                    : "text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/20"
                )}
              >
                <div className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center font-black",
                  isActive ? "bg-white/20 text-white" : isCompleted ? "bg-brand-100 dark:bg-brand-950 text-brand-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                )}>
                  {isCompleted ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <div className="hidden md:block">
                  <p className="text-[10px] opacity-75 font-semibold leading-none">Step 0{s.number}</p>
                  <p className="text-xs font-black mt-0.5">{s.label}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN - FORM STEP SELECTOR */}
        <div className="xl:col-span-2 space-y-6">
          
          {/* STEP 1: IMPORT PRODUCT */}
          {step === 1 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Import from Amazon</h2>
                  <p className="text-xs text-slate-500">Provide an Amazon URL to automatically pull basic product details.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Original Amazon URL</label>
                  <input 
                    type="text" 
                    value={originalAmazonUrl}
                    onChange={(e) => setOriginalAmazonUrl(e.target.value)}
                    placeholder="https://www.amazon.in/dp/B08DFX... (optional)" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Custom Affiliate URL <span className="text-brand-500">*</span></label>
                  <input 
                    type="text" 
                    value={affiliateLink}
                    onChange={(e) => setAffiliateLink(e.target.value)}
                    placeholder="https://amzn.to/4dZMlje (Required)" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-brand-200 dark:border-brand-900/40 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <button 
                  type="button"
                  onClick={handleFetchAmazon}
                  disabled={isFetchingAmazon || (!originalAmazonUrl && !affiliateLink)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 text-white rounded-xl font-bold transition-all flex items-center gap-2 text-sm disabled:opacity-50"
                >
                  {isFetchingAmazon ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  Fetch Product Details
                </button>
                
                {detectedAsin && (
                  <div className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 flex items-center gap-2 font-bold">
                    <span className="text-[9px] uppercase font-black text-slate-400">ASIN</span> {detectedAsin}
                  </div>
                )}
              </div>

              {amazonFetchMessage && (
                <div className={cn(
                  "p-4 rounded-xl border text-sm flex items-start gap-3",
                  amazonFetchMessage.type === 'error' ? "bg-red-50/50 border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400" :
                  amazonFetchMessage.type === 'info' ? "bg-blue-50/50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-900/30 dark:text-blue-400" :
                  "bg-emerald-50/50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                )}>
                  {amazonFetchMessage.type === 'error' && <AlertCircle className="w-5 h-5 shrink-0" />}
                  {amazonFetchMessage.type === 'info' && <AlertCircle className="w-5 h-5 shrink-0" />}
                  {amazonFetchMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 shrink-0" />}
                  <span className="leading-relaxed">{amazonFetchMessage.text}</span>
                </div>
              )}

              {/* Detected summary card */}
              {detectedProduct && (
                <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex gap-6 items-center animate-in zoom-in-95 duration-200">
                  <div className="w-24 h-24 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden relative shrink-0">
                    {detectedProduct.image ? (
                      <Image src={detectedProduct.image} alt={detectedProduct.name} fill className="object-contain p-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-slate-400 m-8" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-bold uppercase text-[9px] tracking-wider rounded">Status: Success</span>
                    <h4 className="font-extrabold text-slate-900 dark:text-white leading-tight text-lg line-clamp-1">{detectedProduct.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">Brand: <span className="text-slate-700 dark:text-slate-300 font-bold">{detectedProduct.brand || 'Generic'}</span></p>
                    <div className="flex items-center gap-4 pt-1">
                      <p className="text-sm font-black text-slate-900 dark:text-white">Price: {detectedProduct.price || "Check Price"}</p>
                      <p className="text-xs text-slate-500 font-bold">Rating: ★ {detectedProduct.rating || "0"}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-500/25"
                >
                  Continue to Product Details <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PRODUCT DETAILS */}
          {step === 2 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Product Details</h2>
                  <p className="text-xs text-slate-500">Provide basic specifications, pricing, and upload public imagery.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Product Name <span className="text-brand-500">*</span></label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="e.g. Logitech MX Master 3S Wireless Mouse" 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Brand</label>
                    <input 
                      type="text" 
                      value={brand} 
                      onChange={(e) => setBrand(e.target.value)} 
                      placeholder="e.g. Logitech" 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Price Range</label>
                    <input 
                      type="text" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      placeholder="e.g. ₹8,995" 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Rating (out of 5)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      max="5" 
                      value={rating} 
                      onChange={(e) => setRating(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-bold text-slate-700 dark:text-slate-300" 
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Product Description</label>
                  <textarea 
                    rows={4} 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Write a clear and factual product description..." 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Product Images</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Raw Image URLs (One per line)</p>
                      <textarea 
                        rows={4} 
                        value={images.join('\n')} 
                        onChange={handleUrlChange} 
                        placeholder="https://amazon.com/image1.jpg&#10;https://amazon.com/image2.jpg" 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-xs"
                      />
                    </div>
                    
                    <div className="flex flex-col justify-between">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Or Upload Local Media</p>
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} multiple accept="image/*" className="hidden" />
                      <div 
                        onClick={() => fileInputRef.current?.click()} 
                        className="border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-500 rounded-2xl p-6 text-center hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer group flex-1 flex flex-col justify-center items-center"
                      >
                        {uploading ? <Loader2 className="w-7 h-7 text-brand-500 mb-2 animate-spin" /> : <ImageIcon className="w-7 h-7 text-slate-400 group-hover:text-brand-500 mb-2 transition-all" />}
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{uploading ? "Uploading file..." : "Browse Local Files"}</p>
                        <p className="text-[10px] text-slate-400 mt-1">Accepts PNG, JPG up to 10MB</p>
                      </div>
                    </div>
                  </div>

                  {images.length > 0 && (
                    <div className="pt-2">
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-3">Uploaded Thumbnails ({images.length})</p>
                      <div className="grid grid-cols-6 gap-3">
                        {images.filter(isValidUrl).map((url, idx) => (
                          <div key={idx} className={cn("aspect-square bg-slate-50 dark:bg-slate-800/50 rounded-xl border overflow-hidden relative group", idx === 0 ? "border-brand-500 ring-2 ring-brand-500/10" : "border-slate-200 dark:border-slate-800")}>
                            <Image src={url} alt={`Preview ${idx}`} fill className="object-cover" />
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-1.5">
                              {idx !== 0 && (
                                <button type="button" onClick={() => setAsThumbnail(idx)} className="p-1 bg-white hover:bg-brand-50 text-slate-900 rounded-lg shadow-sm transition-all" title="Set as thumbnail">
                                  <Trophy className="w-3.5 h-3.5 text-brand-600" />
                                </button>
                              )}
                              <button type="button" onClick={() => removeImage(idx)} className="p-1 bg-white hover:bg-red-50 text-red-600 rounded-lg shadow-sm transition-all" title="Remove image">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {idx === 0 && <span className="absolute bottom-1 right-1 bg-brand-500 text-white font-black uppercase text-[8px] px-1 py-0.5 rounded shadow-sm">Main</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-5 py-3 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Import
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={!name}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-500/25 disabled:opacity-50"
                >
                  Continue to Targeting <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: PRODUCT TARGETING */}
          {step === 3 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Product Targeting</h2>
                  <p className="text-xs text-slate-500">Configure search parameters, discovery filters, categories, and tags.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Main Category <span className="text-brand-500">*</span></label>
                    <select 
                      value={category} 
                      onChange={(e) => setCategory(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
                    >
                      {dbCategories.length > 0 ? (
                        dbCategories.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))
                      ) : (
                        <option value="">Loading categories...</option>
                      )}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Sub Category / Related Category</label>
                    <input 
                      type="text" 
                      value={subCategory} 
                      onChange={(e) => setSubCategory(e.target.value)} 
                      placeholder="e.g. Laptop Stand, Keyboard, Mechanical Keyboard" 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold" 
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-5">
                  <div className="space-y-2">
                    <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">Related Categories (Additional Exposure)</label>
                    <div className="flex flex-wrap gap-2">
                      {dbCategories.filter(c => c.id !== category).map(cat => (
                        <label key={cat.id} className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                          additionalCategories.includes(cat.id) 
                            ? "bg-brand-50/50 dark:bg-brand-950 border-brand-350 dark:border-brand-800 text-brand-650 dark:text-brand-400"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-350 hover:bg-slate-50/80 text-slate-700 dark:text-slate-300"
                        )}>
                          <input 
                            type="checkbox" 
                            checked={additionalCategories.includes(cat.id)} 
                            onChange={() => handleMultiSelect(setAdditionalCategories, cat.id)} 
                            className="hidden" 
                          />
                          <span>{cat.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">Audience</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Students', 'Creators', 'Gamers', 'Working Professionals', 'Setup Lovers', 'Everyday Buyers'].map(aud => (
                          <label key={aud} className={cn(
                            "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                            audience.includes(aud)
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-350 text-slate-650 dark:text-slate-350"
                          )}>
                            <input type="checkbox" checked={audience.includes(aud)} onChange={() => handleMultiSelect(setAudience, aud)} className="hidden" />
                            <span>{aud}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">Use Case</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['Study', 'Gaming', 'Content Creation', 'Desk Setup', 'Productivity', 'Work From Home', 'Travel', 'Lifestyle'].map(uc => (
                          <label key={uc} className={cn(
                            "flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-all",
                            useCase.includes(uc)
                              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white shadow-sm"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-350 text-slate-650 dark:text-slate-350"
                          )}>
                            <input type="checkbox" checked={useCase.includes(uc)} onChange={() => handleMultiSelect(setUseCase, uc)} className="hidden" />
                            <span>{uc}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-200/50 dark:border-slate-800">
                    <div className="space-y-2">
                      <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">Budget Range</label>
                      <div className="flex flex-wrap gap-2">
                        {['Under ₹500', 'Under ₹1000', 'Under ₹3000', 'Under ₹5000', 'Under ₹10000', 'Premium'].map(br => (
                          <label key={br} className={cn(
                            "flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold cursor-pointer transition-all",
                            budgetRange.includes(br)
                              ? "bg-emerald-600 text-white border-emerald-600 dark:bg-emerald-500 dark:border-emerald-500"
                              : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 hover:border-slate-350 text-slate-650 dark:text-slate-350"
                          )}>
                            <input type="checkbox" checked={budgetRange.includes(br)} onChange={() => handleMultiSelect(setBudgetRange, br)} className="hidden" />
                            <span>{br}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-black uppercase text-slate-400 tracking-widest">Tags (Comma Separated)</label>
                      <input 
                        type="text" 
                        value={tags} 
                        onChange={(e) => setTags(e.target.value)} 
                        placeholder="laptop stand, desk setup, productivity, student setup" 
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-5 py-3 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Details
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-500/25"
                >
                  Continue to Recommendation <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: SMARTXMAN RECOMMENDATION */}
          {step === 4 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">SmartXMan Recommendation</h2>
                  <p className="text-xs text-slate-500">Provide expert evaluations, overall scores, and robust repeatable pros/cons.</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Short Buying Advice (The Hook)</label>
                    <button
                      type="button"
                      onClick={handleGenerateAiNote}
                      disabled={isGeneratingAiNote || !name || !description}
                      className="text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-350 text-xs font-black flex items-center gap-1 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {isGeneratingAiNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
                      {isGeneratingAiNote ? "Generating Hook..." : "Generate with AI"}
                    </button>
                  </div>
                  <textarea 
                    rows={2} 
                    value={expertNote} 
                    onChange={(e) => setExpertNote(e.target.value)} 
                    placeholder="A practical budget product for users who want better value without spending much..." 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-brand-200 dark:border-brand-900/40 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed" 
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Best Used For</label>
                    <input 
                      type="text" 
                      value={bestFor} 
                      onChange={(e) => setBestFor(e.target.value)} 
                      placeholder="e.g. Ergonomics, Study" 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Overall Smart Score (out of 10)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      max="10" 
                      value={smartScore} 
                      onChange={(e) => setSmartScore(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl bg-brand-50 dark:bg-brand-950/20 border border-brand-200 dark:border-brand-900/40 focus:outline-none focus:ring-2 focus:ring-brand-500 text-lg font-black text-brand-600 dark:text-brand-400 text-center" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Value for Money Score (out of 10)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      max="10" 
                      value={valueScore} 
                      onChange={(e) => setValueScore(e.target.value)} 
                      className="w-full px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-250 dark:border-emerald-900/40 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-black text-emerald-600 dark:text-emerald-400 text-center" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Recommended For</label>
                    <textarea 
                      rows={2} 
                      value={whoShouldBuy} 
                      onChange={(e) => setWhoShouldBuy(e.target.value)} 
                      placeholder="e.g. Daily laptop users wanting a posture upgrade..." 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Not Recommended For</label>
                    <textarea 
                      rows={2} 
                      value={whoShouldAvoid} 
                      onChange={(e) => setWhoShouldAvoid(e.target.value)} 
                      placeholder="e.g. Users with extremely heavy studio keyboards..." 
                      className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-3 bg-emerald-50/20 dark:bg-emerald-950/10 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-950">
                    <div className="flex items-center justify-between border-b border-emerald-100/50 dark:border-emerald-900 pb-2">
                      <span className="font-bold text-emerald-700 dark:text-emerald-450 text-sm flex items-center gap-1.5">Pros (+)</span>
                      <button type="button" onClick={() => addArrayItem(setPros)} className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 text-xs font-black flex items-center gap-1"><Plus className="w-3 h-3"/> Add Pro</button>
                    </div>
                    <div className="space-y-2">
                      {pros.map((pro, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={pro} 
                            onChange={(e) => handleArrayChange(setPros, idx, e.target.value)} 
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm" 
                            placeholder="e.g. Excellent sturdiness" 
                          />
                          <button type="button" onClick={() => removeArrayItem(setPros, idx)} className="p-1.5 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3 bg-red-50/20 dark:bg-red-950/10 p-5 rounded-2xl border border-red-100 dark:border-red-950">
                    <div className="flex items-center justify-between border-b border-red-100/50 dark:border-red-900 pb-2">
                      <span className="font-bold text-red-700 dark:text-red-450 text-sm flex items-center gap-1.5">Cons (-)</span>
                      <button type="button" onClick={() => addArrayItem(setCons)} className="text-red-600 hover:text-red-700 dark:text-red-400 text-xs font-black flex items-center gap-1"><Plus className="w-3 h-3"/> Add Con</button>
                    </div>
                    <div className="space-y-2">
                      {cons.map((con, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={con} 
                            onChange={(e) => handleArrayChange(setCons, idx, e.target.value)} 
                            className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm" 
                            placeholder="e.g. Not easily height-adjustable" 
                          />
                          <button type="button" onClick={() => removeArrayItem(setCons, idx)} className="p-1.5 text-slate-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Final Recommendation</label>
                  <textarea 
                    rows={2} 
                    value={buyingVerdict} 
                    onChange={(e) => setBuyingVerdict(e.target.value)} 
                    placeholder="Worth considering if you need a simple, useful, and value-for-money product for daily use." 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm leading-relaxed" 
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-5 py-3 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Targeting
                </button>
                
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-500/25"
                >
                  Continue to Publish <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: VISIBILITY & PUBLISHING */}
          {step === 5 && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/85 dark:border-slate-800 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-xl">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 dark:text-white">Product Visibility & Publishing</h2>
                  <p className="text-xs text-slate-500">Configure homepage placement, deals visibility, and write final search engines details.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Product Visibility</h3>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Show on Homepage</p>
                        <p className="text-[10px] text-slate-500 font-medium">Render inside homepage suggestions card</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={featured} 
                        onChange={(e) => setFeatured(e.target.checked)} 
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 checked:bg-brand-500 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all shadow-inner border border-transparent" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Featured Product</p>
                        <p className="text-[10px] text-slate-500 font-medium">Adds premium gold layout highlighting</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={featured} 
                        onChange={(e) => setFeatured(e.target.checked)} 
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 checked:bg-brand-500 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all shadow-inner border border-transparent" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Trending Now</p>
                        <p className="text-[10px] text-slate-500 font-medium">Puts dynamic 'Trending' badges in layout</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={trending} 
                        onChange={(e) => setTrending(e.target.checked)} 
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 checked:bg-brand-500 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all shadow-inner border border-transparent" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Budget Pick</p>
                        <p className="text-[10px] text-slate-500 font-medium">Mark as optimal green budget-friendly value</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isBudgetPick} 
                        onChange={(e) => setIsBudgetPick(e.target.checked)} 
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 checked:bg-brand-500 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all shadow-inner border border-transparent" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Best Deal</p>
                        <p className="text-[10px] text-slate-500 font-medium">Renders in dynamic Deals filter lists</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={isBestDeal} 
                        onChange={(e) => setIsBestDeal(e.target.checked)} 
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 checked:bg-brand-500 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all shadow-inner border border-transparent" 
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/60">
                      <div>
                        <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Show in Deals Section</p>
                        <p className="text-[10px] text-slate-500 font-medium">Exposes the product to Deals hub lists</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={showInDeals} 
                        onChange={(e) => setShowInDeals(e.target.checked)} 
                        className="w-9 h-5 rounded-full bg-slate-200 dark:bg-slate-700 checked:bg-brand-500 cursor-pointer appearance-none relative before:content-[''] before:absolute before:w-4 before:h-4 before:rounded-full before:bg-white before:top-0.5 before:left-0.5 checked:before:translate-x-4 before:transition-all shadow-inner border border-transparent" 
                      />
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Publishing Status</h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Publication Status</label>
                      <select 
                        value={status} 
                        onChange={(e) => setStatus(e.target.value)} 
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 font-bold"
                      >
                        <option value="draft">Draft (Private)</option>
                        <option value="needs_review">Needs Review</option>
                        <option value="published">Published (Live to Site)</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>

                    <div className="space-y-3 pt-2">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">Search Engine Optimization</h3>
                      
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Slug URL String</label>
                          <button type="button" onClick={handleGenerateSlug} className="text-brand-600 hover:text-brand-700 text-xs font-black">Generate from Name</button>
                        </div>
                        <input 
                          type="text" 
                          value={slug} 
                          onChange={(e) => setSlug(e.target.value)} 
                          placeholder="e.g. logitech-mx-master-3s" 
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm font-semibold font-mono" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">SEO Custom Title</label>
                        <input 
                          type="text" 
                          value={seoTitle} 
                          onChange={(e) => setSeoTitle(e.target.value)} 
                          placeholder={`${name || "Product Name"} - Curated expert analysis`} 
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">SEO Meta Description</label>
                        <textarea 
                          rows={2}
                          value={seoDescription} 
                          onChange={(e) => setSeoDescription(e.target.value)} 
                          placeholder={expertNote || "A factual description of the product and our buying verdict..."} 
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="px-5 py-3 border border-slate-250 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm flex items-center gap-2 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" /> Back to Recommendation
                </button>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleSave("draft")}
                    disabled={isSaving}
                    className="px-5 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-350 font-bold rounded-xl text-sm transition-all"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave("published")}
                    disabled={isSaving}
                    className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-md shadow-brand-500/25 disabled:opacity-50"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Update Product
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN - LIVE STICKY PREVIEW CARD */}
        <div className="xl:col-span-1 space-y-6">
          <div className="sticky top-8 space-y-6">
            
            {/* Health Score System Widget */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-black text-sm text-slate-850 dark:text-slate-100 flex items-center gap-1.5">
                  <CheckSquare className="w-4 h-4 text-brand-600" /> Product Health Score
                </h3>
                <span className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-black uppercase shadow-inner",
                  healthPercent >= 80 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-450" : 
                  healthPercent >= 50 ? "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-450" : 
                  "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-450"
                )}>
                  {healthPercent}% Ready
                </span>
              </div>

              {/* Progress visual bar */}
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    healthPercent >= 80 ? "bg-emerald-500" : healthPercent >= 50 ? "bg-amber-500" : "bg-red-500"
                  )}
                  style={{ width: `${healthPercent}%` }} 
                />
              </div>

              {/* Collapsible/Scrollable criteria check */}
              <div className="max-h-[160px] overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                {healthChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs font-semibold text-slate-550 dark:text-slate-400">
                    <span className="truncate">{item.name}</span>
                    {item.checked ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-0.5">✅ Yes</span>
                    ) : (
                      <span className="text-red-500 font-bold flex items-center gap-0.5">❌ No</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview Card */}
            <div>
              <h3 className="font-bold text-slate-400 uppercase tracking-widest text-[10px] ml-2 mb-3">Sticky Live Preview</h3>
              
              <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xl shadow-slate-250/20 dark:shadow-none flex flex-col min-h-[440px]">
                {/* Image panel */}
                <div className="aspect-[4/3] bg-slate-50 dark:bg-slate-855 relative w-full flex items-center justify-center p-6 border-b border-slate-100 dark:border-slate-800">
                  {images.length > 0 && isValidUrl(images[0]) ? (
                    <Image src={images[0]} alt="Product preview" fill className="object-contain p-4 drop-shadow-lg" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-350 dark:text-slate-600">
                      <ImageIcon className="w-14 h-14" />
                      <span className="text-[10px] uppercase font-black tracking-widest">No Image uploaded</span>
                    </div>
                  )}
                  
                  {/* Badge tags overlay */}
                  <div className="absolute top-4 left-4 flex flex-col gap-1.5">
                    {isBestDeal && <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Best Deal</span>}
                    {isBudgetPick && <span className="bg-emerald-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Budget Pick</span>}
                    {trending && <span className="bg-amber-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm">Trending</span>}
                  </div>
                  
                  {/* Smart score badge overlay */}
                  {parseFloat(smartScore) > 0 && (
                    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md dark:bg-slate-900/90 text-brand-600 dark:text-brand-450 font-black text-xs px-2.5 py-1.5 rounded-xl border border-white/20 shadow-sm flex items-center gap-1">
                      <Trophy className="w-3.5 h-3.5 text-brand-500" /> {smartScore}
                    </div>
                  )}
                </div>

                {/* Content body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-brand-600 uppercase tracking-widest bg-brand-50/50 dark:bg-brand-950 px-2 py-0.5 rounded text-brand-600 dark:text-brand-400 border border-brand-100/10">
                        {currentCategoryName || "No Category"}
                      </span>
                      {brand && <span className="text-xs font-semibold text-slate-400">{brand}</span>}
                    </div>
                    
                    <h3 className="text-lg font-black text-slate-900 dark:text-white leading-snug line-clamp-2">
                      {name || "Zebronics NS1500 Laptop Stand"}
                    </h3>
                    
                    {expertNote ? (
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 italic leading-relaxed">
                        <p className="text-xs text-slate-650 dark:text-slate-350">"{expertNote}"</p>
                      </div>
                    ) : (
                      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-150 dark:border-slate-800 border-dashed italic leading-relaxed">
                        <p className="text-xs text-slate-400">A short buying advice summary will appear here...</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between mt-6">
                    <div>
                      <p className="text-[9px] text-slate-450 uppercase font-black tracking-wider">Current Price</p>
                      <p className="text-xl font-black text-slate-900 dark:text-white leading-none mt-0.5">{price || "₹---"}</p>
                    </div>
                    
                    <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200/40">
                      <span className="text-amber-500 font-bold text-xs">★</span>
                      <span className="text-xs font-black text-slate-700 dark:text-slate-300">{rating || "0.0"}</span>
                    </div>
                  </div>

                  <button 
                    type="button"
                    disabled
                    className={cn(
                      "w-full py-3 mt-5 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm border border-transparent",
                      affiliateLink ? "bg-amber-400 text-slate-900" : "bg-slate-100 dark:bg-slate-800 text-slate-450"
                    )}
                  >
                    Check Latest Price on Amazon <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  
                  <p className="text-[8px] text-center text-slate-400 mt-2.5 font-semibold">
                    SmartXMan may earn a small commission when you buy through this link.
                  </p>
                </div>
              </div>
            </div>
            
          </div>
        </div>

      </div>
    </div>
  );
}
