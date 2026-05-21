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
  if (!blogData.cover_image) {
    blogData.cover_image = "/categories/tech.png";
  }

  try {
    const isNew = !blogData.id;
    const payload = {
      title: blogData.title,
      slug: blogData.slug,
      cover_image: blogData.cover_image,
      content: blogData.content,
      category: blogData.category || "General",
      excerpt: blogData.excerpt || "",
      read_time: blogData.read_time || "5 min read",
      reference_links: blogData.reference_links || [],
      status: blogData.status || "published",
    };

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
            created_at: new Date().toISOString(),
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
    const payload = {
      title: blogData.title,
      slug: blogData.slug,
      cover_image: blogData.cover_image,
      content: blogData.content,
      category: blogData.category || "General",
      excerpt: blogData.excerpt || "",
      read_time: blogData.read_time || "5 min read",
      reference_links: blogData.reference_links || [],
      status: blogData.status || "published",
    };

    if (isNew) {
      const newBlog = {
        ...payload,
        id: String(local.length + 1),
        created_at: new Date().toISOString(),
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
