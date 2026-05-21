"use server";

import { getAdminSupabase } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const JSON_PATH = path.resolve(process.cwd(), "src/lib/homepage_db.json");

const defaultSettings = {
  hero_badge: "500+ Curated Picks for Smarter Buying",
  hero_title_accent: "what to buy?",
  hero_title_fallback: "Confused",
  hero_title_subtitle: "Find picks that make sense.",
  hero_description: "Smartxman helps students, creators, gamers, and everyday buyers discover useful tech, setup gear, and lifestyle products based on your budget and real value.",
  primary_cta_text: "Find My Smart Picks",
  primary_cta_link: "/products",
  why_smartxman_title: "Why Smartxman?",
  why_smartxman_desc: "We review tech and gear without bias, focusing entirely on value and your workflow."
};

export async function getHomepageSettings() {
  try {
    // Try supabase first
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { data, error } = await supabase
        .from("homepage_settings")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();
      
      if (!error && data) {
        return { success: true, data, source: "supabase" };
      }
    }
  } catch (e) {
    console.warn("Supabase homepage_settings read failed, using JSON fallback");
  }

  // Fallback to JSON
  try {
    if (fs.existsSync(JSON_PATH)) {
      const data = fs.readFileSync(JSON_PATH, "utf-8");
      return { success: true, data: JSON.parse(data), source: "local" };
    }
  } catch (err) {
    console.error("Failed to read local homepage settings:", err);
  }

  return { success: true, data: defaultSettings, source: "default" };
}

export async function saveHomepageSettings(settings: any) {
  try {
    const payload = {
      hero_badge: settings.hero_badge || defaultSettings.hero_badge,
      hero_title_accent: settings.hero_title_accent || defaultSettings.hero_title_accent,
      hero_title_fallback: settings.hero_title_fallback || defaultSettings.hero_title_fallback,
      hero_title_subtitle: settings.hero_title_subtitle || defaultSettings.hero_title_subtitle,
      hero_description: settings.hero_description || defaultSettings.hero_description,
      primary_cta_text: settings.primary_cta_text || defaultSettings.primary_cta_text,
      primary_cta_link: settings.primary_cta_link || defaultSettings.primary_cta_link,
      why_smartxman_title: settings.why_smartxman_title || defaultSettings.why_smartxman_title,
      why_smartxman_desc: settings.why_smartxman_desc || defaultSettings.why_smartxman_desc,
      updated_at: new Date().toISOString()
    };

    // Try saving to Supabase
    try {
      const supabase = await getAdminSupabase().catch(() => null);
      if (supabase) {
        const { error } = await supabase
          .from("homepage_settings")
          .upsert([payload]);
        
        if (!error) {
          // Also sync to local JSON
          fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), "utf-8");
          revalidatePath("/");
          return { success: true, data: payload, source: "supabase" };
        }
      }
    } catch (e) {
      console.warn("Supabase upsert failed, using JSON instead");
    }

    // JSON write
    fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), "utf-8");
    revalidatePath("/");
    return { success: true, data: payload, source: "local" };
  } catch (error: any) {
    console.error("Error saving homepage settings:", error.message);
    return { success: false, error: error.message };
  }
}
