"use server";

import { getAdminSupabase } from "@/lib/auth";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const JSON_PATH = path.resolve(process.cwd(), "src/lib/site_settings.json");

const defaultSettings = {
  site_name: "smartXman",
  contact_email: "skmohdfaisal07@gmail.com",
  amazon_associate_tag: "smartxman-21",
  amazon_marketplace: "www.amazon.in",
  footer_disclosure: "smartXman is a participant in the Amazon Services LLC Associates Program, an affiliate advertising program designed to provide a means for sites to earn advertising fees by advertising and linking to Amazon.in."
};

export async function getSiteSettings() {
  try {
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();
      
      if (!error && data) {
        return { success: true, data, source: "supabase" };
      }
    }
  } catch (e) {
    console.warn("Supabase site_settings read failed, using JSON fallback");
  }

  // Fallback to local JSON
  try {
    if (fs.existsSync(JSON_PATH)) {
      const data = fs.readFileSync(JSON_PATH, "utf-8");
      return { success: true, data: JSON.parse(data), source: "local" };
    }
  } catch (err) {
    console.error("Failed to read local site settings:", err);
  }

  return { success: true, data: defaultSettings, source: "default" };
}

export async function saveSiteSettings(settings: any) {
  try {
    const payload = {
      site_name: settings.site_name || defaultSettings.site_name,
      contact_email: settings.contact_email || defaultSettings.contact_email,
      amazon_associate_tag: settings.amazon_associate_tag || defaultSettings.amazon_associate_tag,
      amazon_marketplace: settings.amazon_marketplace || defaultSettings.amazon_marketplace,
      footer_disclosure: settings.footer_disclosure || defaultSettings.footer_disclosure,
      updated_at: new Date().toISOString()
    };

    // Try Supabase first
    try {
      const supabase = await getAdminSupabase().catch(() => null);
      if (supabase) {
        const { error } = await supabase
          .from("site_settings")
          .upsert([payload]);
        
        if (!error) {
          fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), "utf-8");
          revalidatePath("/");
          return { success: true, data: payload, source: "supabase" };
        }
      }
    } catch (e) {
      console.warn("Supabase site_settings write failed, using JSON");
    }

    // Local JSON sync
    fs.writeFileSync(JSON_PATH, JSON.stringify(payload, null, 2), "utf-8");
    revalidatePath("/");
    return { success: true, data: payload, source: "local" };
  } catch (error: any) {
    console.error("Failed to save site settings:", error.message);
    return { success: false, error: error.message };
  }
}
