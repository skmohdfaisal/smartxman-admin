"use server";

import { supabase } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const JSON_DB_PATH = path.resolve(process.cwd(), "src/lib/blogs_db.json");

// Helper to read local JSON fallback
function readLocalBlogs(): any[] {
  try {
    if (fs.existsSync(JSON_DB_PATH)) {
      const data = fs.readFileSync(JSON_DB_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read local blogs fallback:", err);
  }
  return [];
}

// Helper to write local JSON fallback
function writeLocalBlogs(blogs: any[]): boolean {
  try {
    fs.writeFileSync(JSON_DB_PATH, JSON.stringify(blogs, null, 2), "utf-8");
    
    // Also write to sibling path for public app to remain completely synchronized
    try {
      const siblingPath = path.resolve(process.cwd(), "../smartxman/src/lib/blogs_db.json");
      if (fs.existsSync(path.dirname(siblingPath))) {
        fs.writeFileSync(siblingPath, JSON.stringify(blogs, null, 2), "utf-8");
      }
    } catch (siblingErr) {
      console.warn("Failed to write to sibling blog JSON database:", siblingErr);
    }
    
    return true;
  } catch (err) {
    console.error("Failed to write local blogs fallback:", err);
    return false;
  }
}

// Helper to wrap Supabase calls in a timeout
async function withTimeout<T>(promise: any, timeoutMs: number = 3000): Promise<T> {
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
      // If table missing, fallback to JSON
      if (error.code === "PGRST205" || error.message.includes("relation \"public.blogs\" does not exist")) {
        console.warn("Supabase blogs table missing, falling back to local database.");
        return { success: true, data: readLocalBlogs(), source: "local" };
      }
      throw error;
    }
    return { success: true, data: data || [], source: "supabase" };
  } catch (err: any) {
    console.error("Supabase fetch failed, falling back to local:", err.message);
    return { success: true, data: readLocalBlogs(), source: "local" };
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
      if (error.code === "PGRST205" || error.message.includes("relation \"public.blogs\" does not exist")) {
        const local = readLocalBlogs();
        const found = local.find((b) => b.slug === slug);
        return { success: !!found, data: found || null, source: "local" };
      }
      throw error;
    }
    return { success: true, data, source: "supabase" };
  } catch (err: any) {
    console.error("Supabase single fetch failed, trying local:", err.message);
    const local = readLocalBlogs();
    const found = local.find((b) => b.slug === slug);
    return { success: !!found, data: found || null, source: "local" };
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
      if (error.code === "PGRST205" || error.message.includes("relation \"public.blogs\" does not exist")) {
        const local = readLocalBlogs();
        const found = local.find((b) => b.id === id);
        return { success: !!found, data: found || null, source: "local" };
      }
      throw error;
    }
    return { success: true, data, source: "supabase" };
  } catch (err: any) {
    console.error("Supabase single fetch failed, trying local:", err.message);
    const local = readLocalBlogs();
    const found = local.find((b) => b.id === id);
    return { success: !!found, data: found || null, source: "local" };
  }
}

export async function saveBlog(blogData: any) {
  // Ensure slug is clean
  if (blogData.title && !blogData.slug) {
    blogData.slug = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }

  // Ensure cover_image fallback
  const finalCoverImage = blogData.cover_image_url || blogData.cover_image || "/categories/tech.png";

  try {
    const isNew = !blogData.id;
    const payload: any = {
      title: blogData.title,
      slug: blogData.slug,
      cover_image_url: finalCoverImage,
      cover_image: finalCoverImage, // compatibility legacy alias
      cover_image_alt: blogData.cover_image_alt || "",
      cover_image_caption: blogData.cover_image_caption || "",
      content: blogData.content,
      category: blogData.category || "Buying Guides",
      excerpt: blogData.excerpt || "",
      read_time: blogData.read_time || "5 min read",
      author: blogData.author || "Admin",
      tags: blogData.tags || [],
      status: blogData.status || "draft",
      visibility: blogData.visibility || "public",
      featured: !!blogData.featured,
      show_on_homepage: !!blogData.show_on_homepage,
      is_popular: !!blogData.is_popular,
      view_count: blogData.view_count || 0,
      seo_title: blogData.seo_title || "",
      seo_description: blogData.seo_description || "",
      canonical_url: blogData.canonical_url || "",
      og_title: blogData.og_title || "",
      og_description: blogData.og_description || "",
      og_image: blogData.og_image || "",
      focus_keyword: blogData.focus_keyword || "",
      primary_keyword: blogData.primary_keyword || blogData.focus_keyword || "",
      secondary_keywords: blogData.secondary_keywords || "",
      search_intent: blogData.search_intent || "",
      target_audience: blogData.target_audience || "",
      author_bio: blogData.author_bio || "",
      author_image: blogData.author_image || "",
      noindex: !!blogData.noindex,
      faqs: blogData.faqs || [],
      product_blocks: blogData.product_blocks || [],
      reference_links: blogData.reference_links || [], // legacy
      updated_at: new Date().toISOString()
    };

    if (isNew) {
      payload.created_at = new Date().toISOString();
    }
    
    if (blogData.status === "published") {
      payload.published_at = blogData.published_at || new Date().toISOString();
    } else {
      payload.published_at = blogData.published_at || null;
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
      if (result.error.code === "PGRST205" || result.error.message.includes("relation \"public.blogs\" does not exist")) {
        console.warn("Supabase insert/update failed, performing fallback save.");
        const local = readLocalBlogs();
        if (isNew) {
          const newBlog = {
            ...payload,
            id: String(local.length + 1),
          };
          local.push(newBlog);
          writeLocalBlogs(local);
          return { success: true, data: newBlog, source: "local" };
        } else {
          const index = local.findIndex((b) => b.id === blogData.id);
          if (index !== -1) {
            const updatedBlog = {
              ...local[index],
              ...payload,
            };
            local[index] = updatedBlog;
            writeLocalBlogs(local);
            return { success: true, data: updatedBlog, source: "local" };
          }
          throw new Error("Local blog not found to update");
        }
      }
      throw result.error;
    }

    return { success: true, data: result.data?.[0], source: "supabase" };
  } catch (err: any) {
    console.error("Save blog operation failed, falling back to local:", err.message);
    const local = readLocalBlogs();
    const isNew = !blogData.id;
    const payload: any = {
      title: blogData.title,
      slug: blogData.slug,
      cover_image_url: finalCoverImage,
      cover_image: finalCoverImage,
      cover_image_alt: blogData.cover_image_alt || "",
      cover_image_caption: blogData.cover_image_caption || "",
      content: blogData.content,
      category: blogData.category || "Buying Guides",
      excerpt: blogData.excerpt || "",
      read_time: blogData.read_time || "5 min read",
      author: blogData.author || "Admin",
      tags: blogData.tags || [],
      status: blogData.status || "draft",
      visibility: blogData.visibility || "public",
      featured: !!blogData.featured,
      show_on_homepage: !!blogData.show_on_homepage,
      is_popular: !!blogData.is_popular,
      view_count: blogData.view_count || 0,
      seo_title: blogData.seo_title || "",
      seo_description: blogData.seo_description || "",
      canonical_url: blogData.canonical_url || "",
      og_title: blogData.og_title || "",
      og_description: blogData.og_description || "",
      og_image: blogData.og_image || "",
      focus_keyword: blogData.focus_keyword || "",
      primary_keyword: blogData.primary_keyword || blogData.focus_keyword || "",
      secondary_keywords: blogData.secondary_keywords || "",
      search_intent: blogData.search_intent || "",
      target_audience: blogData.target_audience || "",
      author_bio: blogData.author_bio || "",
      author_image: blogData.author_image || "",
      noindex: !!blogData.noindex,
      faqs: blogData.faqs || [],
      product_blocks: blogData.product_blocks || [],
      reference_links: blogData.reference_links || [],
      updated_at: new Date().toISOString()
    };

    if (isNew) {
      payload.created_at = new Date().toISOString();
    }
    
    if (blogData.status === "published") {
      payload.published_at = blogData.published_at || new Date().toISOString();
    } else {
      payload.published_at = blogData.published_at || null;
    }

    if (isNew) {
      const newBlog = {
        ...payload,
        id: String(local.length + 1),
      };
      local.push(newBlog);
      writeLocalBlogs(local);
      return { success: true, data: newBlog, source: "local" };
    } else {
      const index = local.findIndex((b) => b.id === blogData.id);
      if (index !== -1) {
        const updatedBlog = {
          ...local[index],
          ...payload,
        };
        local[index] = updatedBlog;
        writeLocalBlogs(local);
        return { success: true, data: updatedBlog, source: "local" };
      }
      return { success: false, error: "Blog not found in local db" };
    }
  }
}

export async function deleteBlog(id: string) {
  try {
    const result = await withTimeout<any>(
      supabase.from("blogs").delete().eq("id", id)
    );
    const { error } = result;

    if (error) {
      if (error.code === "PGRST205" || error.message.includes("relation \"public.blogs\" does not exist")) {
        const local = readLocalBlogs();
        const filtered = local.filter((b) => b.id !== id);
        writeLocalBlogs(filtered);
        return { success: true, source: "local" };
      }
      throw error;
    }
    return { success: true, source: "supabase" };
  } catch (err: any) {
    console.error("Supabase delete failed, using local:", err.message);
    const local = readLocalBlogs();
    const filtered = local.filter((b) => b.id !== id);
    writeLocalBlogs(filtered);
    return { success: true, source: "local" };
  }
}

export async function getProductsList() {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("id, name, image_url, affiliate_url, price")
      .order("name");
    
    if (error) {
      if (error.code === "PGRST205" || error.message.includes("relation \"public.products\" does not exist")) {
        return { success: true, data: [] };
      }
      throw error;
    }
    return { success: true, data: data || [] };
  } catch (err: any) {
    console.error("Failed to fetch products for blog builder:", err.message);
    return { success: true, data: [] };
  }
}

export async function generateSeoMetadata(title: string, excerpt: string, keyword: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    if (!apiKey) {
      // Fallback heuristic if no API key
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

