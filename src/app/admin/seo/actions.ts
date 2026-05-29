"use server";

import { getAdminSupabase } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const JSON_PATH = path.resolve(process.cwd(), "src/lib/seo_db.json");

// ──────────────────────────────────────────────
// Default SEO data for all 16 pages
// ──────────────────────────────────────────────

export interface SeoRecord {
  page_key: string;
  page_name: string;
  meta_title: string;
  meta_description: string;
  focus_keyword: string;
  canonical_url: string;
  og_title: string;
  og_description: string;
  og_image_url: string;
  og_image_alt: string;
  noindex: boolean;
  include_in_sitemap: boolean;
  sitemap_priority: number;
  change_frequency: string;
  updated_at?: string;
  created_at?: string;
}

const defaultSEO: Record<string, SeoRecord> = {
  // ─── Core Pages ─────────────────────────────
  homepage: {
    page_key: "homepage",
    page_name: "Homepage",
    meta_title: "smartXman | Smart Product Picks That Actually Make Sense",
    meta_description: "Discover useful tech, setup, gaming, productivity, and lifestyle products curated for students, creators, gamers, and everyday buyers.",
    focus_keyword: "smart product recommendations",
    canonical_url: "https://smartxman.vercel.app",
    og_title: "smartXman | Smart Product Picks That Actually Make Sense",
    og_description: "Discover useful tech, setup, gaming, productivity, and lifestyle products curated for students, creators, gamers, and everyday buyers.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman - Smart Product Recommendations",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 1.0,
    change_frequency: "daily"
  },
  products: {
    page_key: "products",
    page_name: "Products",
    meta_title: "Smart Product Recommendations for Tech, Setup & Lifestyle | smartXman",
    meta_description: "Explore curated product picks, budget finds, setup gear, creator tools, gaming accessories, and smart gadgets with clear buying guidance.",
    focus_keyword: "tech product recommendations",
    canonical_url: "https://smartxman.vercel.app/products",
    og_title: "Smart Product Recommendations for Tech, Setup & Lifestyle | smartXman",
    og_description: "Explore curated product picks, budget finds, setup gear, creator tools, gaming accessories, and smart gadgets with clear buying guidance.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Products Catalog",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.9,
    change_frequency: "daily"
  },
  categories: {
    page_key: "categories",
    page_name: "Categories",
    meta_title: "Shop by Category | smartXman",
    meta_description: "Browse smart product picks by category, budget, audience, and use case.",
    focus_keyword: "product categories",
    canonical_url: "https://smartxman.vercel.app/categories",
    og_title: "Shop by Category | smartXman",
    og_description: "Browse smart product picks by category, budget, audience, and use case.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Categories",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.8,
    change_frequency: "weekly"
  },
  "build-my-setup": {
    page_key: "build-my-setup",
    page_name: "Build My Setup",
    meta_title: "Build Your Perfect Setup | smartXman",
    meta_description: "Create your dream desk, gaming, or creator workspace with curated product bundles and smart setup recommendations.",
    focus_keyword: "build desk setup",
    canonical_url: "https://smartxman.vercel.app/build-my-setup",
    og_title: "Build Your Perfect Setup | smartXman",
    og_description: "Create your dream desk, gaming, or creator workspace with curated product bundles.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Build My Setup",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.8,
    change_frequency: "weekly"
  },
  "budget-picks": {
    page_key: "budget-picks",
    page_name: "Budget Picks",
    meta_title: "Best Budget-Friendly Tech & Setup Picks | smartXman",
    meta_description: "Find affordable tech, budget-friendly setup accessories, and value-for-money product recommendations under every price range.",
    focus_keyword: "budget tech picks",
    canonical_url: "https://smartxman.vercel.app/budget-picks",
    og_title: "Best Budget-Friendly Tech & Setup Picks | smartXman",
    og_description: "Find affordable tech, budget-friendly setup accessories, and value-for-money product recommendations.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Budget Picks",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.8,
    change_frequency: "weekly"
  },
  deals: {
    page_key: "deals",
    page_name: "Deals",
    meta_title: "Best Tech & Setup Deals Today | smartXman",
    meta_description: "Find smart deals on tech accessories, setup products, gaming gear, creator tools, student essentials, and budget-friendly products.",
    focus_keyword: "tech deals today",
    canonical_url: "https://smartxman.vercel.app/deals",
    og_title: "Best Tech & Setup Deals Today | smartXman",
    og_description: "Find smart deals on tech accessories, setup products, gaming gear, creator tools, student essentials, and budget-friendly products.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Deals",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.8,
    change_frequency: "daily"
  },
  blog: {
    page_key: "blog",
    page_name: "Blog",
    meta_title: "Smart Buying Guides for Tech, Setup & Gadgets | smartXman",
    meta_description: "Read simple buying guides, product comparisons, setup ideas, and budget-friendly tech recommendations for students, creators, gamers, and everyday buyers.",
    focus_keyword: "buying guides tech setup",
    canonical_url: "https://smartxman.vercel.app/blog",
    og_title: "Smart Buying Guides for Tech, Setup & Gadgets | smartXman",
    og_description: "Read simple buying guides, product comparisons, setup ideas, and budget-friendly tech recommendations.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Blog",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.8,
    change_frequency: "weekly"
  },
  about: {
    page_key: "about",
    page_name: "About",
    meta_title: "About smartXman | Our Mission & Story",
    meta_description: "Learn about smartXman — why we started, our mission to simplify product buying decisions, and how we curate the best product recommendations.",
    focus_keyword: "about smartxman",
    canonical_url: "https://smartxman.vercel.app/about",
    og_title: "About smartXman | Our Mission & Story",
    og_description: "Learn about smartXman — our mission to simplify product buying decisions with smart recommendations.",
    og_image_url: "/og-image.png",
    og_image_alt: "About smartXman",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.5,
    change_frequency: "monthly"
  },

  // ─── Dynamic Templates ──────────────────────
  "product-template": {
    page_key: "product-template",
    page_name: "Product Detail Template",
    meta_title: "{product_name} — Honest Review & Best Price | smartXman",
    meta_description: "Read our in-depth review of {product_name}. Compare prices, check specifications, pros & cons, and find the best buying option.",
    focus_keyword: "",
    canonical_url: "",
    og_title: "{product_name} — Honest Review & Best Price | smartXman",
    og_description: "Read our in-depth review of {product_name}. Compare prices, specs, and find the best deal.",
    og_image_url: "",
    og_image_alt: "{product_name} Review",
    noindex: false,
    include_in_sitemap: false,
    sitemap_priority: 0.8,
    change_frequency: "daily"
  },
  "category-template": {
    page_key: "category-template",
    page_name: "Category Detail Template",
    meta_title: "Best {category_name} Products | smartXman",
    meta_description: "Explore the best {category_name} products curated by smartXman with honest reviews, budget picks, and smart buying guidance.",
    focus_keyword: "",
    canonical_url: "",
    og_title: "Best {category_name} Products | smartXman",
    og_description: "Explore the best {category_name} products with honest reviews and smart buying guidance.",
    og_image_url: "",
    og_image_alt: "{category_name} Products",
    noindex: false,
    include_in_sitemap: false,
    sitemap_priority: 0.6,
    change_frequency: "weekly"
  },
  "blog-template": {
    page_key: "blog-template",
    page_name: "Blog Detail Template",
    meta_title: "{blog_title} | smartXman Blog",
    meta_description: "{blog_excerpt}",
    focus_keyword: "",
    canonical_url: "",
    og_title: "{blog_title} | smartXman Blog",
    og_description: "{blog_excerpt}",
    og_image_url: "",
    og_image_alt: "{blog_title}",
    noindex: false,
    include_in_sitemap: false,
    sitemap_priority: 0.7,
    change_frequency: "weekly"
  },
  "deal-template": {
    page_key: "deal-template",
    page_name: "Deal Detail Template",
    meta_title: "{deal_title} — Limited Deal | smartXman",
    meta_description: "Don't miss this deal on {deal_title}. Check the latest price, discount, and availability before it expires.",
    focus_keyword: "",
    canonical_url: "",
    og_title: "{deal_title} — Limited Deal | smartXman",
    og_description: "Don't miss this deal on {deal_title}. Check price and availability.",
    og_image_url: "",
    og_image_alt: "{deal_title} Deal",
    noindex: false,
    include_in_sitemap: false,
    sitemap_priority: 0.7,
    change_frequency: "daily"
  },

  // ─── Legal / Trust Pages ────────────────────
  "affiliate-disclosure": {
    page_key: "affiliate-disclosure",
    page_name: "Affiliate Disclosure",
    meta_title: "Affiliate Disclosure | smartXman",
    meta_description: "Read our affiliate disclosure. smartXman earns a small commission from qualifying purchases through affiliate links at no extra cost to you.",
    focus_keyword: "affiliate disclosure",
    canonical_url: "https://smartxman.vercel.app/affiliate-disclosure",
    og_title: "Affiliate Disclosure | smartXman",
    og_description: "Our affiliate disclosure — how smartXman earns commissions transparently.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Affiliate Disclosure",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.3,
    change_frequency: "yearly"
  },
  "privacy-policy": {
    page_key: "privacy-policy",
    page_name: "Privacy Policy",
    meta_title: "Privacy Policy | smartXman",
    meta_description: "Read smartXman's privacy policy. Learn how we collect, use, and protect your personal information.",
    focus_keyword: "privacy policy",
    canonical_url: "https://smartxman.vercel.app/privacy",
    og_title: "Privacy Policy | smartXman",
    og_description: "How smartXman collects, uses, and protects your personal data.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Privacy Policy",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.3,
    change_frequency: "yearly"
  },
  terms: {
    page_key: "terms",
    page_name: "Terms of Service",
    meta_title: "Terms of Service | smartXman",
    meta_description: "Read the terms of service for using smartXman. By accessing our website, you agree to these terms and conditions.",
    focus_keyword: "terms of service",
    canonical_url: "https://smartxman.vercel.app/terms",
    og_title: "Terms of Service | smartXman",
    og_description: "Terms and conditions for using smartXman.",
    og_image_url: "/og-image.png",
    og_image_alt: "smartXman Terms of Service",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.3,
    change_frequency: "yearly"
  },
  contact: {
    page_key: "contact",
    page_name: "Contact Us",
    meta_title: "Contact Us | smartXman",
    meta_description: "Get in touch with the smartXman team. Have questions, feedback, or business inquiries? We'd love to hear from you.",
    focus_keyword: "contact smartxman",
    canonical_url: "https://smartxman.vercel.app/contact",
    og_title: "Contact Us | smartXman",
    og_description: "Get in touch with the smartXman team for questions, feedback, or business inquiries.",
    og_image_url: "/og-image.png",
    og_image_alt: "Contact smartXman",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.5,
    change_frequency: "monthly"
  }
};

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function readLocalSeo(): Record<string, any> {
  try {
    if (fs.existsSync(JSON_PATH)) {
      const data = fs.readFileSync(JSON_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read local SEO JSON:", err);
  }
  return {};
}

function writeLocalSeo(data: Record<string, any>): void {
  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write local SEO JSON:", err);
  }
}

// Migrate old keys: "home" → "homepage", "blogs" → "blog"
function migrateKeys(map: Record<string, any>): Record<string, any> {
  const migrationMap: Record<string, string> = {
    home: "homepage",
    blogs: "blog"
  };
  const result = { ...map };
  for (const [oldKey, newKey] of Object.entries(migrationMap)) {
    if (result[oldKey] && !result[newKey]) {
      result[newKey] = { ...result[oldKey], page_key: newKey };
      delete result[oldKey];
    }
  }
  return result;
}

// Normalize a DB/JSON record to fill any missing fields from defaults
function normalizeRecord(record: any, pageKey: string): SeoRecord {
  const def = defaultSEO[pageKey] || {
    page_key: pageKey,
    page_name: pageKey,
    meta_title: "",
    meta_description: "",
    focus_keyword: "",
    canonical_url: "",
    og_title: "",
    og_description: "",
    og_image_url: "",
    og_image_alt: "",
    noindex: false,
    include_in_sitemap: true,
    sitemap_priority: 0.5,
    change_frequency: "weekly"
  };

  return {
    page_key: pageKey,
    page_name: record.page_name || def.page_name,
    meta_title: record.meta_title ?? def.meta_title,
    meta_description: record.meta_description ?? def.meta_description,
    focus_keyword: record.focus_keyword ?? def.focus_keyword,
    canonical_url: record.canonical_url ?? def.canonical_url,
    og_title: record.og_title ?? def.og_title,
    og_description: record.og_description ?? def.og_description,
    og_image_url: record.og_image_url ?? record.og_image ?? def.og_image_url,
    og_image_alt: record.og_image_alt ?? def.og_image_alt,
    noindex: record.noindex ?? def.noindex,
    include_in_sitemap: record.include_in_sitemap ?? def.include_in_sitemap,
    sitemap_priority: record.sitemap_priority ?? def.sitemap_priority,
    change_frequency: record.change_frequency ?? def.change_frequency,
    updated_at: record.updated_at,
    created_at: record.created_at
  };
}

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

export async function getSeoSettings() {
  // Build base from defaults
  const baseMap: Record<string, SeoRecord> = {};
  for (const key of Object.keys(defaultSEO)) {
    baseMap[key] = { ...defaultSEO[key] };
  }

  // Try Supabase first
  try {
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*");

      if (!error && data && data.length > 0) {
        const dbMap: Record<string, any> = {};
        data.forEach((row: any) => {
          dbMap[row.page_key] = row;
        });
        const migrated = migrateKeys(dbMap);

        // Merge DB records over defaults
        for (const key of Object.keys(migrated)) {
          baseMap[key] = normalizeRecord(migrated[key], key);
        }
        // Ensure all default keys exist
        for (const key of Object.keys(defaultSEO)) {
          if (!baseMap[key]) {
            baseMap[key] = { ...defaultSEO[key] };
          }
        }

        return { success: true, data: baseMap, source: "supabase" };
      }
    }
  } catch (e) {
    console.warn("Supabase seo_settings read failed, using fallback");
  }

  // Fallback to local JSON
  try {
    const localData = readLocalSeo();
    if (Object.keys(localData).length > 0) {
      const migrated = migrateKeys(localData);
      for (const key of Object.keys(migrated)) {
        baseMap[key] = normalizeRecord(migrated[key], key);
      }
      return { success: true, data: baseMap, source: "local" };
    }
  } catch (err) {
    console.error("Failed to read local SEO settings:", err);
  }

  return { success: true, data: baseMap, source: "default" };
}

export async function saveSeoSettings(pageKey: string, payload: any) {
  try {
    const record: any = {
      page_key: pageKey,
      page_name: payload.page_name || defaultSEO[pageKey]?.page_name || pageKey,
      meta_title: payload.meta_title || "",
      meta_description: payload.meta_description || "",
      focus_keyword: payload.focus_keyword || "",
      canonical_url: payload.canonical_url || "",
      og_title: payload.og_title || "",
      og_description: payload.og_description || "",
      og_image_url: payload.og_image_url || "",
      og_image_alt: payload.og_image_alt || "",
      noindex: !!payload.noindex,
      include_in_sitemap: payload.include_in_sitemap !== false,
      sitemap_priority: parseFloat(payload.sitemap_priority) || 0.5,
      change_frequency: payload.change_frequency || "weekly",
      updated_at: new Date().toISOString()
    };

    // Update local JSON map (always keep in sync)
    const localMap = readLocalSeo();
    const migratedMap = migrateKeys(localMap);
    migratedMap[pageKey] = record;

    // Merge with defaults for full map to return
    const fullMap: Record<string, SeoRecord> = {};
    for (const key of Object.keys(defaultSEO)) {
      fullMap[key] = normalizeRecord(migratedMap[key] || {}, key);
    }
    // Also include any extra keys from local
    for (const key of Object.keys(migratedMap)) {
      if (!fullMap[key]) {
        fullMap[key] = normalizeRecord(migratedMap[key], key);
      }
    }

    // Try Supabase upsert
    try {
      const supabase = await getAdminSupabase().catch(() => null);
      if (supabase) {
        const { error } = await supabase
          .from("seo_settings")
          .upsert([record], { onConflict: "page_key" });

        if (!error) {
          writeLocalSeo(migratedMap);
          revalidatePath("/");
          return { success: true, data: fullMap, source: "supabase" };
        }
      }
    } catch (e) {
      console.warn("Supabase seo_settings write failed, using JSON");
    }

    // Fallback: write to local JSON
    writeLocalSeo(migratedMap);
    revalidatePath("/");
    return { success: true, data: fullMap, source: "local" };
  } catch (error: any) {
    console.error("Failed to save SEO settings:", error.message);
    return { success: false, error: error.message };
  }
}

// Export for the public site to consume
export async function getSeoForPublicPage(pageKey: string): Promise<SeoRecord> {
  const def = defaultSEO[pageKey] || defaultSEO["homepage"];

  try {
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { data, error } = await supabase
        .from("seo_settings")
        .select("*")
        .eq("page_key", pageKey)
        .single();

      if (!error && data) {
        return normalizeRecord(data, pageKey);
      }
    }
  } catch (_) {}

  // Fallback to local
  try {
    const localMap = readLocalSeo();
    const migrated = migrateKeys(localMap);
    if (migrated[pageKey]) {
      return normalizeRecord(migrated[pageKey], pageKey);
    }
  } catch (_) {}

  return { ...def };
}

export { defaultSEO };
