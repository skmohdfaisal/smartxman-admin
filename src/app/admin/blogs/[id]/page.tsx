"use client";

import { use, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Loader2,
  Sparkles,
  Eye,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  ListOrdered,
  Link2,
  Quote,
  Heading2,
  Heading3,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  Settings,
  ShieldAlert,
  Calendar,
  Lock,
  CheckCircle,
  Search,
  FileText,
  ExternalLink,
  Upload,
  AlertCircle,
  FileCheck,
  Tag,
  X,
  Clock,
  Check
} from "lucide-react";
import { getBlogById, saveBlog, getProductsList } from "../actions";
import { supabase } from "@/lib/supabase";

interface ReferenceLink {
  label: string;
  url: string;
}

interface ProductBlock {
  id?: string;
  name: string;
  image_url: string;
  affiliate_url: string;
  price?: string;
  ratingBadge: string; // Recommended Product, Best Budget Pick, Best Overall, Best for Students, Best for Creators, Alternative Pick
  note: string;
  cta_label: string;
}

interface FAQ {
  question: string;
  answer: string;
}

export default function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = id === "new";

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!isNew);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // DB Products for selection
  const [dbProducts, setDbProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState("");

  // Editor Tabs
  const [editorTab, setEditorTab] = useState<"write" | "preview">("write");

  // Blog states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [category, setCategory] = useState("Buying Guides");
  const [readTime, setReadTime] = useState("5 min read");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("Admin");
  const [status, setStatus] = useState("draft");
  const [visibility, setVisibility] = useState("public");
  const [featured, setFeatured] = useState(false);
  const [showOnHomepage, setShowOnHomepage] = useState(false);

  // Cover image states
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [coverImageAlt, setCoverImageAlt] = useState("");
  const [coverImageCaption, setCoverImageCaption] = useState("");
  const [imageOption, setImageOption] = useState<"url" | "upload">("url");

  // Custom Tag input states
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Rich metadata / SEO states
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [canonicalUrl, setCanonicalUrl] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImageUrl, setOgImageUrl] = useState("");
  const [focusKeyword, setFocusKeyword] = useState("");
  const [noindex, setNoindex] = useState(false);

  // Arrays (Product Blocks & FAQs)
  const [productBlocks, setProductBlocks] = useState<ProductBlock[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);

  // Ref for Content Textarea cursor manipulations
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);

  // Category Options
  const categories = [
    "Buying Guides",
    "Product Reviews",
    "Comparisons",
    "Deals",
    "Tech Accessories",
    "Creator Setup",
    "Gaming Setup",
    "Student Essentials",
    "Productivity",
    "Desk Setup",
    "Lifestyle"
  ];

  // Fetch blog data on edit mount
  useEffect(() => {
    fetchProducts();
    if (!isNew) {
      loadBlog();
    } else {
      // Set defaults for new blog
      setAuthor("Admin");
      setReadTime("5 min read");
      setCategory("Buying Guides");
      setStatus("draft");
      setVisibility("public");
    }
  }, [id]);

  const fetchProducts = async () => {
    try {
      const res = await getProductsList();
      if (res.success) {
        setDbProducts(res.data || []);
      }
    } catch (err) {
      console.error("Failed to load products list:", err);
    }
  };

  const loadBlog = async () => {
    try {
      const res = await getBlogById(id);
      if (res.success && res.data) {
        const blog = res.data;
        setTitle(blog.title || "");
        setSlug(blog.slug || "");
        setCategory(blog.category || "Buying Guides");
        setReadTime(blog.read_time || "5 min read");
        setExcerpt(blog.excerpt || "");
        setContent(blog.content || "");
        setAuthor(blog.author || "Admin");
        setStatus(blog.status || "draft");
        setVisibility(blog.visibility || "public");
        setFeatured(!!blog.featured);
        setShowOnHomepage(!!blog.show_on_homepage);

        // Cover Image mapping
        setCoverImageUrl(blog.cover_image_url || blog.cover_image || "");
        setCoverImageAlt(blog.cover_image_alt || "");
        setCoverImageCaption(blog.cover_image_caption || "");
        if (blog.cover_image_url || blog.cover_image) {
          setImageOption("url"); // Default mode
        }

        // Tags mapping
        setTags(Array.isArray(blog.tags) ? blog.tags : []);

        // SEO parameters
        setSeoTitle(blog.seo_title || "");
        setSeoDescription(blog.seo_description || "");
        setCanonicalUrl(blog.canonical_url || "");
        setFocusKeyword(blog.focus_keyword || "");
        setNoindex(!!blog.noindex);
        setOgTitle(blog.og_title || "");
        setOgDescription(blog.og_description || "");
        setOgImageUrl(blog.og_image || "");

        // Product blocks and FAQs mapping
        setProductBlocks(Array.isArray(blog.product_blocks) ? blog.product_blocks : []);
        setFaqs(Array.isArray(blog.faqs) ? blog.faqs : []);
      } else {
        setError("Blog post not found.");
      }
    } catch (err: any) {
      setError("Failed to load blog post: " + err.message);
    } finally {
      setFetching(false);
    }
  };

  // Title changes auto-generate slug
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (isNew) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setSlug(generated);

      // Auto-populate SEO Title if empty
      if (!seoTitle) {
        setSeoTitle(val.substring(0, 60));
      }
    }
  };

  // Drag and Drop Cover Image handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.add("border-brand-500", "bg-brand-50/50");
    }
  };

  const handleDragLeave = () => {
    if (dragAreaRef.current) {
      dragAreaRef.current.classList.remove("border-brand-500", "bg-brand-50/50");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    handleDragLeave();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await uploadImageFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await uploadImageFile(files[0]);
    }
  };

  const uploadImageFile = async (file: File) => {
    // Accepted formats check
    const validTypes = ["image/png", "image/jpg", "image/jpeg", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Invalid image file format. Supported: PNG, JPG, JPEG, WEBP");
      return;
    }
    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      alert("Image file size exceeds the 5MB maximum limit.");
      return;
    }

    setUploading(true);
    setError("");
    try {
      const sanitizedName = file.name.replace(/[^a-z0-9.]/gi, "_").toLowerCase();
      const fileName = `${Date.now()}_${sanitizedName}`;
      const filePath = `blog-images/${fileName}`;

      // Upload to standard "products" bucket (safe fallback since it always exists with full read/write RLS)
      const { data, error: uploadError } = await supabase.storage
        .from("products")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Get public serving URL
      const { data: { publicUrl } } = supabase.storage.from("products").getPublicUrl(filePath);
      setCoverImageUrl(publicUrl);
      setSuccessMsg("Cover image uploaded successfully.");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      console.error("Cover image upload failed:", err);
      setError("Cover image upload failed: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // Tag helper controls
  const handleAddTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDownTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Editor Markdown insertion helpers
  const insertMarkdown = (syntaxBefore: string, syntaxAfter: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    const replacement = syntaxBefore + (selectedText || "text") + syntaxAfter;

    setContent(text.substring(0, start) + replacement + text.substring(end));

    // Maintain cursor focus
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + syntaxBefore.length,
        start + syntaxBefore.length + (selectedText || "text").length
      );
    }, 50);
  };

  // Visual Product Blocks builder handlers
  const addProductBlock = (prod: any = null) => {
    const newBlock: ProductBlock = {
      name: prod?.name || "",
      image_url: prod?.image_url || "",
      affiliate_url: prod?.affiliate_url || "",
      price: prod?.price || "",
      ratingBadge: "Recommended Product",
      note: "",
      cta_label: "Check Latest Price"
    };
    setProductBlocks([...productBlocks, newBlock]);
  };

  const updateProductBlock = (idx: number, field: keyof ProductBlock, val: string) => {
    const updated = [...productBlocks];
    updated[idx] = {
      ...updated[idx],
      [field]: val
    };
    setProductBlocks(updated);
  };

  const removeProductBlock = (idx: number) => {
    setProductBlocks(productBlocks.filter((_, i) => i !== idx));
  };

  // FAQ builder handlers
  const addFAQ = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const updateFAQ = (idx: number, field: keyof FAQ, val: string) => {
    const updated = [...faqs];
    updated[idx] = {
      ...updated[idx],
      [field]: val
    };
    setFaqs(updated);
  };

  const deleteFAQ = (idx: number) => {
    setFaqs(faqs.filter((_, i) => i !== idx));
  };

  const moveFAQ = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === faqs.length - 1) return;

    const newIndex = direction === "up" ? idx - 1 : idx + 1;
    const updated = [...faqs];
    const temp = updated[idx];
    updated[idx] = updated[newIndex];
    updated[newIndex] = temp;
    setFaqs(updated);
  };

  // Real-time SEO Diagnostic Indicators
  const checkKeywordPresence = (area: "title" | "excerpt" | "content") => {
    if (!focusKeyword) return false;
    const keyword = focusKeyword.toLowerCase();
    if (area === "title") return title.toLowerCase().includes(keyword);
    if (area === "excerpt") return excerpt.toLowerCase().includes(keyword);
    if (area === "content") return content.toLowerCase().includes(keyword);
    return false;
  };

  // Blog health score live calculation
  const calculateHealthScore = () => {
    let score = 0;
    let checkpoints = 0;

    const addCheckpoint = (met: boolean) => {
      checkpoints++;
      if (met) score++;
    };

    addCheckpoint(title.trim().length >= 10);
    addCheckpoint(slug.trim().length > 3);
    addCheckpoint(coverImageUrl.trim().length > 0);
    addCheckpoint(coverImageAlt.trim().length >= 5);
    addCheckpoint(excerpt.trim().length >= 40);
    addCheckpoint(content.trim().length > 300);
    addCheckpoint(seoTitle.trim().length >= 30 && seoTitle.trim().length <= 60);
    addCheckpoint(seoDescription.trim().length >= 120 && seoDescription.trim().length <= 160);
    addCheckpoint(focusKeyword.trim().length > 0);
    addCheckpoint(productBlocks.length > 0);
    addCheckpoint(faqs.length > 0);
    addCheckpoint(status !== "");

    return Math.round((score / checkpoints) * 100);
  };

  const healthScore = calculateHealthScore();

  // Save/Publish payload builder
  const handleSave = async (e: React.FormEvent, forceStatus?: string) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const targetStatus = forceStatus || status;

    try {
      const payload = {
        id: isNew ? undefined : id,
        title,
        slug,
        category,
        read_time: readTime,
        excerpt,
        content,
        author,
        status: targetStatus,
        visibility,
        featured,
        show_on_homepage: showOnHomepage,
        cover_image_url: coverImageUrl,
        cover_image: coverImageUrl, // Legacy compatibility alias
        cover_image_alt: coverImageAlt,
        cover_image_caption: coverImageCaption,
        tags,
        seo_title: seoTitle,
        seo_description: seoDescription,
        canonical_url: canonicalUrl,
        og_title: ogTitle || seoTitle || title,
        og_description: ogDescription || seoDescription || excerpt,
        og_image: ogImageUrl || coverImageUrl,
        focus_keyword: focusKeyword,
        noindex,
        faqs,
        product_blocks: productBlocks,
        published_at: targetStatus === "published" ? new Date().toISOString() : null
      };

      const res = await saveBlog(payload);
      if (res.success) {
        setSuccessMsg("Blog saved successfully!");
        setTimeout(() => {
          router.push("/admin/blogs");
          router.refresh();
        }, 1000);
      } else {
        setError(res.error || "Failed to save blog post.");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during save.");
    } finally {
      setLoading(false);
    }
  };

  // Simple client-side preview rendering helper
  const renderSimplePreview = (markdown: string) => {
    if (!markdown) return <p className="text-slate-400 italic">No content written yet...</p>;

    return markdown.split("\n").map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return <h1 key={idx} className="text-3xl font-extrabold my-4 text-slate-900 dark:text-white">{trimmed.slice(2)}</h1>;
      }
      if (trimmed.startsWith("## ")) {
        return <h2 key={idx} className="text-2xl font-bold my-4 text-slate-900 dark:text-white">{trimmed.slice(3)}</h2>;
      }
      if (trimmed.startsWith("### ")) {
        return <h3 key={idx} className="text-xl font-bold my-3 text-slate-900 dark:text-white">{trimmed.slice(4)}</h3>;
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return <li key={idx} className="ml-6 list-disc my-1 text-slate-700 dark:text-slate-300">{trimmed.slice(2)}</li>;
      }
      if (trimmed.startsWith("> ")) {
        return <blockquote key={idx} className="border-l-4 border-slate-300 pl-4 py-1 italic my-3 text-slate-600 bg-slate-50 dark:bg-slate-800 rounded">{trimmed.slice(2)}</blockquote>;
      }
      return <p key={idx} className="my-2 leading-relaxed text-slate-700 dark:text-slate-300">{trimmed}</p>;
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  // Set color for health indicators
  const healthColor =
    healthScore >= 80
      ? "text-green-500 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20"
      : healthScore >= 50
        ? "text-amber-500 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20"
        : "text-red-500 border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20";

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">

      {/* Header controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/blogs"
            className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl text-slate-500 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {isNew ? "Create Blog Post" : "Edit Blog Post"}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Draft, design, optimize and publish highly engaging setup reviews.
            </p>
          </div>
        </div>

        {/* Action button header */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
          <Link
            href="/admin/blogs"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white rounded-xl font-bold transition-all text-sm"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={(e) => handleSave(e, "draft")}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-white hover:bg-slate-300 rounded-xl font-bold transition-all flex items-center gap-1.5 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
            Save Draft
          </button>
          <button
            type="button"
            onClick={(e) => handleSave(e, "published")}
            disabled={loading}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-brand-500/20 text-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Publish Post
          </button>
        </div>
      </div>

      {/* Message Notifications */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center gap-3 text-sm animate-pulse">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main CMS Layout split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* LEFT COLUMN: Main Cards */}
        <div className="lg:col-span-2 space-y-6">

          {/* CARD 1: Basic Blog Details */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
              Basic Article Details
            </h3>

            <div className="space-y-4">
              {/* Title input */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Article Title <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${title.length >= 50 && title.length <= 60
                      ? "bg-green-500/15 text-green-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                    {title.length} chars (Recommended: 50-60)
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g., Creator Studio Desk Setup: Key Ergonomic Essentials"
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white"
                />
                <p className="text-[10px] text-slate-400">Keep it compelling and clear. Will also default as primary header.</p>
              </div>

              {/* Slug & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    URL Slug <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="creator-studio-desk-setup"
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm font-mono text-slate-700 dark:text-slate-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Read Time, Author, Tags */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Read Time
                  </label>
                  <input
                    type="text"
                    value={readTime}
                    onChange={(e) => setReadTime(e.target.value)}
                    placeholder="e.g., 6 min read"
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Author
                  </label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="e.g., Admin"
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Excerpt / Brief Summary <span className="text-red-500">*</span>
                  </label>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${excerpt.length >= 120 && excerpt.length <= 160
                      ? "bg-green-500/15 text-green-600"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                    }`}>
                    {excerpt.length} chars (Recommended: 120-160)
                  </span>
                </div>
                <textarea
                  rows={2}
                  required
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Provide an optimized brief summary that outlines desk accessories, prices, or gaming setup recommendations..."
                  className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white resize-none"
                />
              </div>

              {/* Tags Selector Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" /> Tags
                </label>
                <div className="flex flex-wrap gap-2 p-2 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2.5 py-1 bg-brand-500/10 text-brand-600 dark:text-brand-400 border border-brand-500/25 rounded-lg text-xs font-bold flex items-center gap-1.5"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleKeyDownTag}
                    placeholder="Type tag & press enter"
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 py-1"
                  />
                </div>
                <p className="text-[10px] text-slate-400">Separate keywords with commas or press Enter.</p>
              </div>
            </div>
          </div>

          {/* CARD 2: Cover Image */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
              Cover Image
            </h3>

            {/* Toggle URL vs Upload */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl w-fit">
              <button
                type="button"
                onClick={() => setImageOption("url")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageOption === "url"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                Paste URL
              </button>
              <button
                type="button"
                onClick={() => setImageOption("upload")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${imageOption === "upload"
                    ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
              >
                Upload File
              </button>
            </div>

            {imageOption === "url" ? (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Cover Image URL</label>
                  <input
                    type="text"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                    placeholder="e.g., https://images.unsplash.com/photo-1593642632823-8f785ba67e45"
                    className="w-full px-4 py-3 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-sm text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {uploading ? (
                  <div className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/30">
                    <Loader2 className="w-8 h-8 animate-spin text-brand-600 mb-2" />
                    <span className="text-xs font-bold text-slate-500">Uploading image to storage...</span>
                  </div>
                ) : (
                  <div
                    ref={dragAreaRef}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 dark:hover:border-brand-700 rounded-2xl bg-slate-50/30 dark:bg-slate-900/10 cursor-pointer transition-all"
                    onClick={() => document.getElementById("cover-file-input")?.click()}
                  >
                    <Upload className="w-10 h-10 text-slate-400 mb-3" />
                    <span className="text-sm font-extrabold text-slate-700 dark:text-slate-300">Drag & Drop Image or Click to Browse</span>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts PNG, JPG, JPEG, WEBP. Max size: 5MB.</p>
                    <input
                      type="file"
                      id="cover-file-input"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Image Preview & SEO details */}
            {coverImageUrl && (
              <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-50">
                  <img src={coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setCoverImageUrl("")}
                    className="absolute top-3 right-3 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow-lg"
                    title="Remove Cover Image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      Alt Text <span className="text-red-500">*</span>
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400 tooltip-trigger" title="Crucial for SEO. Describes the image for search engines." />
                    </label>
                    <input
                      type="text"
                      required
                      value={coverImageAlt}
                      onChange={(e) => setCoverImageAlt(e.target.value)}
                      placeholder="e.g., Clean dual monitor desk setup for developer"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Image Caption (Optional)</label>
                    <input
                      type="text"
                      value={coverImageCaption}
                      onChange={(e) => setCoverImageCaption(e.target.value)}
                      placeholder="e.g., Featuring Keychron K2 keyboard and BenQ light bar"
                      className="w-full px-4 py-2.5 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: Blog Content Editor */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
                Blog Content Editor
              </h3>

              {/* Editor Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setEditorTab("write")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editorTab === "write"
                      ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  Write Markdown
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab("preview")}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${editorTab === "preview"
                      ? "bg-white dark:bg-slate-900 shadow-sm text-slate-900 dark:text-white"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                >
                  Live Preview
                </button>
              </div>
            </div>

            {editorTab === "write" ? (
              <div className="space-y-3">
                {/* Editor Toolbar */}
                <div className="flex flex-wrap items-center gap-1.5 p-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => insertMarkdown("## ")}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all font-semibold flex items-center gap-0.5"
                    title="Insert H2 heading"
                  >
                    <Heading2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("### ")}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all font-semibold flex items-center gap-0.5"
                    title="Insert H3 heading"
                  >
                    <Heading3 className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("**", "**")}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("*", "*")}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("\n- ")}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("\n1. ")}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => insertMarkdown("\n> ")}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Quote Block"
                  >
                    <Quote className="w-4 h-4" />
                  </button>
                  <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Enter standard Link URL:") || "";
                      const text = prompt("Enter Link text label:") || "click here";
                      if (url) insertMarkdown(`[${text}](${url})`);
                    }}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Add Hyperlink"
                  >
                    <Link2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt("Enter Inline Image URL:") || "";
                      const alt = prompt("Enter Image alt text:") || "inline image";
                      if (url) insertMarkdown(`![${alt}](${url})`);
                    }}
                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-all"
                    title="Add Inline Image"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                </div>

                {/* Textarea */}
                <textarea
                  ref={textareaRef}
                  rows={15}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your ultimate buying guide, gaming desk ideas, cable organizers reviews, or setup recommendations here..."
                  className="w-full px-4 py-4 bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all font-mono text-sm text-slate-900 dark:text-white leading-relaxed"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-medium px-2">
                  <span>Words: {content.trim().split(/\s+/).filter(Boolean).length}</span>
                  <span>Supports complete standard Markdown syntax.</span>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200/80 dark:border-slate-800/80 rounded-2xl min-h-[300px] max-h-[500px] overflow-y-auto prose prose-slate dark:prose-invert max-w-none">
                {renderSimplePreview(content)}
              </div>
            )}
          </div>

          {/* CARD 4: Featured Product Blocks */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
                  Featured Product Blocks
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Highlight products with expert review ratings and affiliate checkout commission links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => addProductBlock()}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs"
              >
                <Plus className="w-4 h-4" /> Add Product Block
              </button>
            </div>

            {/* DB Products quick search overlay if blocks added */}
            {productBlocks.length > 0 && dbProducts.length > 0 && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-brand-500" /> Database Product Auto-fill Finder
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Search existing listed products to auto-fill details..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  />
                  {productSearch && (
                    <button
                      type="button"
                      onClick={() => setProductSearch("")}
                      className="text-xs font-bold text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {productSearch && (
                  <div className="max-h-40 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl divide-y divide-slate-100 dark:divide-slate-850">
                    {dbProducts
                      .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                      .map(p => (
                        <div
                          key={p.id}
                          onClick={() => {
                            addProductBlock(p);
                            setProductSearch("");
                          }}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            {p.image_url && <img src={p.image_url} className="w-8 h-8 object-contain rounded" />}
                            <span>{p.name}</span>
                          </div>
                          <span className="text-[10px] font-bold text-brand-600 bg-brand-500/10 px-2 py-0.5 rounded">
                            Select to Add
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {productBlocks.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold">No product recommendation blocks added yet.</p>
                <p className="text-xs text-slate-400 mt-1">Use blocks to review setups or recommend specific accessories.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {productBlocks.map((block, idx) => (
                  <div
                    key={idx}
                    className="p-5 border border-slate-200 dark:border-slate-800 rounded-3xl bg-slate-50/40 dark:bg-slate-900/20 space-y-4 relative animate-in fade-in"
                  >
                    <div className="absolute top-4 right-4 flex gap-1">
                      <button
                        type="button"
                        onClick={() => removeProductBlock(idx)}
                        className="p-2 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded-xl transition-all"
                        title="Delete Product Block"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-slate-500 flex items-center gap-1">
                      <span>Product Block #{idx + 1}</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Product Title */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Title</label>
                        <input
                          type="text"
                          required
                          value={block.name}
                          onChange={(e) => updateProductBlock(idx, "name", e.target.value)}
                          placeholder="e.g., Logitech MX Master 3S Mouse"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs"
                        />
                      </div>

                      {/* Rating / Category badge */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Recommendation Badge</label>
                        <select
                          value={block.ratingBadge}
                          onChange={(e) => updateProductBlock(idx, "ratingBadge", e.target.value)}
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs font-semibold"
                        >
                          <option value="Recommended Product">Recommended Product</option>
                          <option value="Best Overall">Best Overall</option>
                          <option value="Best Budget Pick">Best Budget Pick</option>
                          <option value="Best for Students">Best for Students</option>
                          <option value="Best for Creators">Best for Creators</option>
                          <option value="Alternative Pick">Alternative Pick</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Image URL */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Product Image URL</label>
                        <input
                          type="text"
                          value={block.image_url}
                          onChange={(e) => updateProductBlock(idx, "image_url", e.target.value)}
                          placeholder="e.g., https://m.media-amazon.com/images/..."
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs font-mono"
                        />
                      </div>

                      {/* Affiliate URL */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Affiliate / Target Link URL</label>
                        <input
                          type="text"
                          value={block.affiliate_url}
                          onChange={(e) => updateProductBlock(idx, "affiliate_url", e.target.value)}
                          placeholder="e.g., https://amzn.to/..."
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs font-mono"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Price */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Price Display (Optional)</label>
                        <input
                          type="text"
                          value={block.price || ""}
                          onChange={(e) => updateProductBlock(idx, "price", e.target.value)}
                          placeholder="e.g., $99.99"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs"
                        />
                      </div>

                      {/* CTA label */}
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300">CTA Button Text Label</label>
                        <input
                          type="text"
                          value={block.cta_label}
                          onChange={(e) => updateProductBlock(idx, "cta_label", e.target.value)}
                          placeholder="e.g., Check Latest Price"
                          className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs"
                        />
                      </div>
                    </div>

                    {/* Expert short note */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Expert Review / Short Recommendation Note</label>
                      <textarea
                        rows={2}
                        value={block.note}
                        onChange={(e) => updateProductBlock(idx, "note", e.target.value)}
                        placeholder="Provide a quick expert review snippet, highlighting ergonomics, build quality or sensor accuracy..."
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-500 focus:outline-none transition-all text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 5: FAQ Builder */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-6 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-brand-600 rounded-full"></span>
                  FAQ Builder Section
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Establish collapsible answers. Google-friendly JSON-LD schemas will be generated automatically.
                </p>
              </div>
              <button
                type="button"
                onClick={addFAQ}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs"
              >
                <Plus className="w-4 h-4" /> Add FAQ
              </button>
            </div>

            {faqs.length === 0 ? (
              <div className="p-8 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl text-center text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold">No FAQ items created yet.</p>
                <p className="text-xs text-slate-400 mt-1">Provide answers to reader questions for better search-engine visibility.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {faqs.map((faq, idx) => (
                  <div
                    key={idx}
                    className="p-4 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/10 space-y-3 relative animate-in fade-in"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">FAQ Item #{idx + 1}</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => moveFAQ(idx, "up")}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === faqs.length - 1}
                          onClick={() => moveFAQ(idx, "down")}
                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 disabled:opacity-30"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteFAQ(idx)}
                          className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 rounded"
                          title="Delete FAQ"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <input
                        type="text"
                        required
                        value={faq.question}
                        onChange={(e) => updateFAQ(idx, "question", e.target.value)}
                        placeholder="Q: What is the optimal desk height for an ergonomic standing setup?"
                        className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                      />
                      <textarea
                        rows={2}
                        required
                        value={faq.answer}
                        onChange={(e) => updateFAQ(idx, "answer", e.target.value)}
                        placeholder="A: Generally, a desk height between 28 and 30 inches is optimal when sitting for most adults..."
                        className="w-full px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Sticky Sidebars */}
        <div className="space-y-6 lg:sticky lg:top-6">

          {/* SIDEBAR CARD 1: Publish Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Publish Settings
            </h3>

            <div className="space-y-3 pt-2">
              {/* Status Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Publication Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                >
                  <option value="draft">Draft</option>
                  <option value="needs_review">Needs Review</option>
                  <option value="published">Published</option>
                </select>
              </div>

              {/* Visibility Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Visibility Setting</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                >
                  <option value="public">Public (Show on feeds)</option>
                  <option value="private">Private (Only with links)</option>
                </select>
              </div>

              {/* Boolean Toggles */}
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featured}
                    onChange={(e) => setFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
                  />
                  Featured Article post
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnHomepage}
                    onChange={(e) => setShowOnHomepage(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 focus:ring-offset-0"
                  />
                  Show on Homepage feeds
                </label>
              </div>
            </div>

            {/* Quick Sticky Publish Action */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <button
                type="button"
                onClick={(e) => handleSave(e, "draft")}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 dark:text-white dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-all"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={(e) => handleSave(e, "published")}
                className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-500/15 transition-all"
              >
                Publish Now
              </button>
            </div>
          </div>

          {/* SIDEBAR CARD 2: SEO Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-500" />
              SEO Settings
            </h3>

            <div className="space-y-3.5 pt-2">
              {/* Focus Keyword */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Focus Keyword</label>
                <input
                  type="text"
                  value={focusKeyword}
                  onChange={(e) => setFocusKeyword(e.target.value)}
                  placeholder="e.g., standing desk setup"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              {/* SEO Title */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SEO Meta Title</label>
                  <span className={`text-[9px] font-bold ${seoTitle.length >= 30 && seoTitle.length <= 60 ? "text-green-500" : "text-slate-400"
                    }`}>
                    {seoTitle.length}/60
                  </span>
                </div>
                <input
                  type="text"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  placeholder="Standing desk setup - Best ergonomics 2026"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>

              {/* SEO Description */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">SEO Meta Description</label>
                  <span className={`text-[9px] font-bold ${seoDescription.length >= 120 && seoDescription.length <= 160 ? "text-green-500" : "text-slate-400"
                    }`}>
                    {seoDescription.length}/160
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  placeholder="Discover the best standing desk setups. We compare ergonomics, wire hiders, smart accessories and review pricing..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs resize-none"
                />
              </div>

              {/* Focus Keyword Diagnoses */}
              {focusKeyword && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Keyword presence check:</span>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Article Title</span>
                      {checkKeywordPresence("title") ? (
                        <span className="text-green-500 flex items-center gap-1 font-bold text-[10px]"><Check className="w-3.5 h-3.5" /> Present</span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 text-[10px]"><X className="w-3.5 h-3.5" /> Missing</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Excerpt / Summary</span>
                      {checkKeywordPresence("excerpt") ? (
                        <span className="text-green-500 flex items-center gap-1 font-bold text-[10px]"><Check className="w-3.5 h-3.5" /> Present</span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 text-[10px]"><X className="w-3.5 h-3.5" /> Missing</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Main Content</span>
                      {checkKeywordPresence("content") ? (
                        <span className="text-green-500 flex items-center gap-1 font-bold text-[10px]"><Check className="w-3.5 h-3.5" /> Present</span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 text-[10px]"><X className="w-3.5 h-3.5" /> Missing</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Advanced SEO Toggle */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noindex}
                    onChange={(e) => setNoindex(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500"
                  />
                  Search-engine Noindex (hide from Google)
                </label>
              </div>
            </div>
          </div>

          {/* SIDEBAR CARD 3: Blog Health Score Gauge */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck className="w-4 h-4 text-brand-500" />
              Blog Health Score
            </h3>

            <div className="flex flex-col items-center justify-center py-4 space-y-3">
              {/* Dynamic Health Gauge Circle */}
              <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center transition-all ${healthColor}`}>
                <span className="text-2xl font-black">{healthScore}%</span>
                <span className="text-[9px] font-bold uppercase tracking-wider">Ready</span>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  {healthScore >= 80 ? "SEO Optimized & Complete!" : healthScore >= 50 ? "Almost Ready, check missing inputs" : "Requires more optimization details"}
                </span>
                <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto mt-1">
                  Fill in title, tags, cover description, meta data, and product blocks to maximize your post visibility.
                </p>
              </div>
            </div>
          </div>

          {/* SIDEBAR CARD 4: Live Blog Card Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800/85 p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-brand-500" />
              Feed Card Preview
            </h3>

            {/* Mocked Feed Card */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm group">
              <div className="relative w-full aspect-video bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center text-slate-300">
                {coverImageUrl ? (
                  <img src={coverImageUrl} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8" />
                )}
                <span className="absolute top-2.5 left-2.5 px-2 py-0.5 bg-brand-600 text-white rounded text-[9px] font-bold uppercase tracking-wider">
                  {category}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {readTime}</span>
                  <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <h4 className="font-extrabold text-sm text-slate-800 dark:text-white line-clamp-1 leading-snug">
                  {title || "Untitled Article Post"}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {excerpt || "Provide a summary to display inside search-feeds..."}
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                    By {author}
                  </span>
                  <span className="text-[9px] font-bold text-brand-600 flex items-center gap-0.5">
                    Read More <ArrowLeft className="w-3 h-3 rotate-180" />
                  </span>
                </div>
              </div>
            </div>

            {/* Preview Post Anchor */}
            {!isNew && slug && (
              <a
                href={`http://localhost:3000/blog/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Preview Post in New Tab
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
