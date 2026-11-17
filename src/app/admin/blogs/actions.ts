"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

// Helper to wrap Supabase calls in a safe timeout (15s)
async function withTimeout<T>(promise: any, timeoutMs: number = 15000): Promise<T> {
  let timeoutId: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Database operation timed out"));
    }, timeoutMs);
  });
  
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId!);
  }
}

export async function getBlogs() {
  try {
    const result = await withTimeout<any>(
      supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false })
    );
    const { data, error } = result;

    if (error) {
      console.error("Supabase getBlogs error:", error);
      return { success: false, error: error.message, data: [], source: "error" };
    }
    return { success: true, data: data || [], source: "supabase" };
  } catch (err: any) {
    console.error("getBlogs exception:", err);
    return { success: false, error: err.message, data: [], source: "error" };
  }
}

export async function getBlogBySlug(slug: string) {
  try {
    const result = await withTimeout<any>(
      supabase
        .from("blogs")
        .select("*")
        .eq("slug", slug)
        .single()
    );
    const { data, error } = result;

    if (error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: true, data, source: "supabase" };
  } catch (err: any) {
    console.error("Supabase single fetch by slug failed:", err.message);
    return { success: false, error: err.message, data: null };
  }
}

export async function getBlogById(id: string) {
  try {
    const result = await withTimeout<any>(
      supabase
        .from("blogs")
        .select("*")
        .eq("id", id)
        .single()
    );
    const { data, error } = result;

    if (error) {
      return { success: false, error: error.message, data: null };
    }
    return { success: true, data, source: "supabase" };
  } catch (err: any) {
    console.error("Supabase single fetch by id failed:", err.message);
    return { success: false, error: err.message, data: null };
  }
}

export async function saveBlog(blogData: any) {
  try {
    if (!blogData.title || !blogData.title.trim()) {
      return { success: false, error: "Title is required to save a blog post." };
    }

    // Ensure slug is clean
    let slug = blogData.slug;
    if (!slug || !slug.trim()) {
      slug = blogData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    } else {
      slug = slug
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }

    // Ensure cover_image fallback
    const finalCoverImage = blogData.cover_image_url || blogData.cover_image || "/categories/tech.png";
    const isNew = !blogData.id;

    // Build clean payload strictly matching Supabase blogs schema (no non-existent columns)
    const payload: any = {
      title: blogData.title.trim(),
      slug: slug,
      cover_image_url: finalCoverImage,
      cover_image: finalCoverImage,
      cover_image_alt: blogData.cover_image_alt || "",
      cover_image_caption: blogData.cover_image_caption || "",
      content: blogData.content || "",
      category: blogData.category || "Buying Guides",
      excerpt: blogData.excerpt || "",
      read_time: blogData.read_time || "5 min read",
      author: blogData.author || "Admin",
      tags: Array.isArray(blogData.tags) ? blogData.tags : [],
      status: blogData.status || "draft",
      visibility: blogData.visibility || "public",
      featured: !!blogData.featured,
      show_on_homepage: !!blogData.show_on_homepage,
      is_popular: !!blogData.is_popular,
      view_count: Number(blogData.view_count) || 0,
      seo_title: blogData.seo_title || "",
      seo_description: blogData.seo_description || "",
      canonical_url: blogData.canonical_url || "",
      og_title: blogData.og_title || blogData.seo_title || blogData.title || "",
      og_description: blogData.og_description || blogData.seo_description || blogData.excerpt || "",
      og_image: blogData.og_image || finalCoverImage,
      focus_keyword: blogData.focus_keyword || "",
      primary_keyword: blogData.primary_keyword || blogData.focus_keyword || "",
      secondary_keywords: blogData.secondary_keywords || "",
      search_intent: blogData.search_intent || "",
      target_audience: blogData.target_audience || "",
      author_bio: blogData.author_bio || "",
      author_image: blogData.author_image || "",
      noindex: !!blogData.noindex,
      faqs: Array.isArray(blogData.faqs) ? blogData.faqs : [],
      product_blocks: Array.isArray(blogData.product_blocks) ? blogData.product_blocks : [],
      updated_at: new Date().toISOString()
    };

    if (isNew) {
      payload.created_at = new Date().toISOString();
    }
    
    if (blogData.status === "published") {
      payload.published_at = blogData.published_at || new Date().toISOString();
    } else {
      payload.published_at = null;
    }

    let result;
    if (isNew) {
      result = await withTimeout<any>(
        supabase.from("blogs").insert([payload]).select()
      );
    } else {
      result = await withTimeout<any>(
        supabase.from("blogs").update(payload).eq("id", blogData.id).select()
      );
    }

    if (result.error) {
      console.error("Supabase blog save failed:", result.error);
      return { success: false, error: result.error.message || "Failed to save blog post to database." };
    }

    const savedBlog = result.data?.[0];

    // Revalidate admin pages
    try {
      revalidatePath("/admin/blogs");
      if (savedBlog?.id) {
        revalidatePath(`/admin/blogs/${savedBlog.id}`);
      }
    } catch (e) {
      // ignore revalidatePath error in non-standard context
    }

    // Ping main site for on-demand ISR cache purge
    try {
      const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://smartxman.com";
      fetch(`${storeUrl}/api/revalidate?path=/blog&secret=${process.env.REVALIDATION_SECRET || "smartxman-revalidate-secret"}`, {
        method: "POST"
      }).catch(() => {});
    } catch (e) {
      // ignore network errors
    }

    return { success: true, data: savedBlog, source: "supabase" };
  } catch (err: any) {
    console.error("Save blog exception:", err);
    return { success: false, error: err.message || "An unexpected error occurred while saving." };
  }
}

export async function deleteBlog(id: string) {
  try {
    const result = await withTimeout<any>(
      supabase.from("blogs").delete().eq("id", id)
    );
    const { error } = result;

    if (error) {
      console.error("Supabase delete blog error:", error);
      return { success: false, error: error.message };
    }

    try {
      revalidatePath("/admin/blogs");
    } catch (e) {}

    // Ping store to revalidate
    try {
      const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://smartxman.com";
      fetch(`${storeUrl}/api/revalidate?path=/blog&secret=${process.env.REVALIDATION_SECRET || "smartxman-revalidate-secret"}`, {
        method: "POST"
      }).catch(() => {});
    } catch (e) {}

    return { success: true, source: "supabase" };
  } catch (err: any) {
    console.error("Supabase delete failed:", err);
    return { success: false, error: err.message };
  }
}

export async function getProductsList() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, images, price_range, current_price, affiliate_link, affiliate_url")
      .eq("status", "published")
      .order("name");
    
    if (error) {
      console.error("Error fetching products list:", error);
      return { success: true, data: [] };
    }

    const formatted = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      image_url: p.images?.[0] || "",
      price: p.price_range || (p.current_price ? `₹${p.current_price}` : ""),
      affiliate_url: p.affiliate_link || p.affiliate_url || ""
    }));

    return { success: true, data: formatted };
  } catch (err: any) {
    console.error("Failed to fetch products for blog builder:", err.message);
    return { success: true, data: [] };
  }
}

export async function generateSeoMetadata(title: string, excerpt: string, keyword: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      const baseTitle = `${title.substring(0, 45)} | smartXman`;
      const baseDesc = excerpt.substring(0, 157) + "...";
      return { success: true, seoTitle: baseTitle, seoDescription: baseDesc };
    }

    const prompt = `You are an expert SEO architect. 
Generate an SEO Title (under 60 chars) and an SEO Meta Description (under 160 chars) for this article.
Target keyword: ${keyword || 'none'}
Article Title: ${title}
Article Excerpt: ${excerpt}
Respond ONLY in JSON format: {"seoTitle": "...", "seoDescription": "..."}`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        temperature: 0.3
      })
    });

    if (!res.ok) {
      throw new Error("Failed to connect to Groq API");
    }

    const data = await res.json();
    const parsed = JSON.parse(data.choices[0].message.content);
    
    return { 
      success: true, 
      seoTitle: parsed.seoTitle || `${title.substring(0, 45)} | smartXman`, 
      seoDescription: parsed.seoDescription || excerpt.substring(0, 157) + "..."
    };

  } catch (err: any) {
    console.error("SEO Generation failed:", err);
    return { 
      success: true, 
      seoTitle: `${title.substring(0, 45)} | smartXman`, 
      seoDescription: excerpt.substring(0, 157) + "..."
    };
  }
}
