"use server";

import { getAdminSupabase } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const JSON_PATH = path.resolve(process.cwd(), "src/lib/seo_db.json");

const defaultSEO = {
  home: {
    page_key: "home",
    meta_title: "smartXman | Curated Tech, Setup Gear & Lifestyle Reviews",
    meta_description: "Confused what to buy? smartXman reviews useful gadgets, students & creator setups, and tech accessories with clear budget guidelines.",
    canonical_url: "https://smartxman.com",
    og_title: "smartXman | Discover Curated Tech & Gear",
    og_description: "Confused what to buy? Find tech, setup, and lifestyle products curated for real value.",
    og_image: "/transparent_logo.png",
    noindex: false
  },
  products: {
    page_key: "products",
    meta_title: "Curated Products & Smart Tech Reviews | smartXman",
    meta_description: "Browse our handpicked catalogs of expert-vetted gear, accessories, and setup items sorted by utility scores and budget caps.",
    canonical_url: "https://smartxman.com/products",
    og_title: "Handpicked Tech Catalogs | smartXman",
    og_description: "Filter and find high utility setup gear, keyboards, desk options, and accessories.",
    og_image: "/categories/tech.png",
    noindex: false
  },
  blogs: {
    page_key: "blogs",
    meta_title: "Smart Desk Setup & Tech Guides | smartXman Blog",
    meta_description: "Read detailed guides, mechanical keyboard switch breakdowns, cable hiding tips, and student study setups.",
    canonical_url: "https://smartxman.com/blog",
    og_title: "Setup & Gear Guides | smartXman Blog",
    og_description: "Detailed, jargon-free guides to build your dream desk workspace setup.",
    og_image: "/blog/wfh-guide.png",
    noindex: false
  },
  deals: {
    page_key: "deals",
    meta_title: "Best Tech Deals & Coupon Codes | smartXman",
    meta_description: "Find active tech coupons, discount percentages, and verified affiliate deals on setup essentials and accessories.",
    canonical_url: "https://smartxman.com/deals",
    og_title: "Active Gadget & Gear Deals | smartXman",
    og_description: "Save big on handpicked verified tech accessory deals.",
    og_image: "/categories/setup.png",
    noindex: false
  }
};

export async function getSeoSettings() {
  try {
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*");
      
      if (!error && data && data.length > 0) {
        // Map list to dictionary indexed by page_key
        const seoMap: any = {};
        data.forEach((row: any) => {
          seoMap[row.page_key] = row;
        });
        return { success: true, data: { ...defaultSEO, ...seoMap }, source: "supabase" };
      }
    }
  } catch (e) {
    console.warn("Supabase seo_settings read failed, using JSON fallback");
  }

  // Fallback to local JSON
  try {
    if (fs.existsSync(JSON_PATH)) {
      const data = fs.readFileSync(JSON_PATH, "utf-8");
      return { success: true, data: { ...defaultSEO, ...JSON.parse(data) }, source: "local" };
    }
  } catch (err) {
    console.error("Failed to read local SEO settings:", err);
  }

  return { success: true, data: defaultSEO, source: "default" };
}

export async function saveSeoSettings(pageKey: string, payload: any) {
  try {
    const record = {
      page_key: pageKey,
      meta_title: payload.meta_title || "",
      meta_description: payload.meta_description || "",
      canonical_url: payload.canonical_url || "",
      og_title: payload.og_title || "",
      og_description: payload.og_description || "",
      og_image: payload.og_image || "",
      noindex: !!payload.noindex,
      updated_at: new Date().toISOString()
    };

    // Load existing full map from local first to preserve other pages
    let fullMap: any = { ...defaultSEO };
    if (fs.existsSync(JSON_PATH)) {
      try {
        fullMap = { ...fullMap, ...JSON.parse(fs.readFileSync(JSON_PATH, "utf-8")) };
      } catch (_) {}
    }
    fullMap[pageKey] = record;

    // Try Supabase upsert
    try {
      const supabase = await getAdminSupabase().catch(() => null);
      if (supabase) {
        const { error } = await supabase
          .from("seo_settings")
          .upsert([record]);
        
        if (!error) {
          fs.writeFileSync(JSON_PATH, JSON.stringify(fullMap, null, 2), "utf-8");
          revalidatePath("/");
          return { success: true, data: fullMap, source: "supabase" };
        }
      }
    } catch (e) {
      console.warn("Supabase seo_settings write failed, using JSON");
    }

    fs.writeFileSync(JSON_PATH, JSON.stringify(fullMap, null, 2), "utf-8");
    revalidatePath("/");
    return { success: true, data: fullMap, source: "local" };
  } catch (error: any) {
    console.error("Failed to save SEO settings:", error.message);
    return { success: false, error: error.message };
  }
}
