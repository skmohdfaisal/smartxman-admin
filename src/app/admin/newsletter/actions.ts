"use server";

import { getAdminSupabase } from "@/lib/auth";
import fs from "fs";
import path from "path";

const JSON_PATH = path.resolve(process.cwd(), "src/lib/newsletter_subscribers.json");

const defaultSubscribers = [
  { id: "1", email: "skmohdfaisal07@gmail.com", source: "home_hero", created_at: "2026-05-20T10:00:00Z" },
  { id: "2", email: "buyer_test@smartxman.com", source: "footer", created_at: "2026-05-21T09:12:00Z" }
];

function readLocalSubscribers(): any[] {
  try {
    if (fs.existsSync(JSON_PATH)) {
      const data = fs.readFileSync(JSON_PATH, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Failed to read local subscribers:", err);
  }
  return defaultSubscribers;
}

function writeLocalSubscribers(subs: any[]) {
  try {
    fs.writeFileSync(JSON_PATH, JSON.stringify(subs, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to write local subscribers:", err);
    return false;
  }
}

export async function getSubscribers() {
  try {
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        return { success: true, data, source: "supabase" };
      }
    }
  } catch (e) {
    console.warn("Supabase newsletter_subscribers read failed, using JSON fallback");
  }

  return { success: true, data: readLocalSubscribers(), source: "local" };
}

export async function addSubscriber(email: string, source: string = "unknown") {
  if (!email || !email.includes("@")) {
    return { success: false, error: "Please enter a valid email address" };
  }

  const newSub = {
    email,
    source,
    created_at: new Date().toISOString()
  };

  try {
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .insert([newSub])
        .select();
      
      if (!error && data) {
        // Synchronize with local JSON
        const local = readLocalSubscribers();
        local.unshift(data[0]);
        writeLocalSubscribers(local);
        return { success: true, data: data[0], source: "supabase" };
      }
    }
  } catch (e) {
    console.warn("Supabase subscriber add failed, performing local insert");
  }

  const local = readLocalSubscribers();
  // Check duplicates
  if (local.some((s) => s.email.toLowerCase() === email.toLowerCase())) {
    return { success: true, message: "Already subscribed!", source: "local" };
  }

  const inserted = {
    id: String(local.length + 1),
    ...newSub
  };

  local.unshift(inserted);
  writeLocalSubscribers(local);
  return { success: true, data: inserted, source: "local" };
}

export async function deleteSubscriber(id: string) {
  try {
    const supabase = await getAdminSupabase().catch(() => null);
    if (supabase) {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .delete()
        .eq("id", id);
      
      if (!error) {
        const local = readLocalSubscribers();
        const filtered = local.filter((s) => s.id !== id && s.email !== id);
        writeLocalSubscribers(filtered);
        return { success: true, source: "supabase" };
      }
    }
  } catch (e) {
    console.warn("Supabase subscriber delete failed, using local fallback");
  }

  const local = readLocalSubscribers();
  const filtered = local.filter((s) => s.id !== id && s.email !== id);
  writeLocalSubscribers(filtered);
  return { success: true, source: "local" };
}
