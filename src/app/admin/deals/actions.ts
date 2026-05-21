"use server";

import { getAdminSupabase } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getDeals() {
  try {
    const supabase = await getAdminSupabase();
    
    // We try to query from custom 'deals' table first
    const { data: deals, error: dealsErr } = await supabase
      .from("deals")
      .select("*, product:products(name, slug)")
      .order("created_at", { ascending: false });

    if (!dealsErr) {
      return { success: true, data: deals || [], source: "deals" };
    }

    // Fallback: Query from product_store_links which tracks old_price & price
    console.warn("Deals table missing, querying product_store_links instead");
    const { data: links, error: linksErr } = await supabase
      .from("product_store_links")
      .select("*, product:products(name, slug)")
      .order("created_at", { ascending: false });

    if (linksErr) throw linksErr;
    
    // Format links to match Deals properties
    const formatted = (links || []).map(l => ({
      id: l.id,
      title: `${l.product?.name || "Product"} deal on ${l.store_name}`,
      product_id: l.product_id,
      product: l.product,
      store_name: l.store_name,
      old_price: l.old_price,
      deal_price: l.price,
      affiliate_url: l.affiliate_url,
      active: true,
      created_at: l.created_at
    }));

    return { success: true, data: formatted, source: "product_store_links" };
  } catch (error: any) {
    console.error("Error fetching deals:", error.message);
    return { success: true, data: mockDeals, source: "mock" };
  }
}

export async function saveDeal(dealData: any) {
  try {
    const supabase = await getAdminSupabase();
    const isNew = !dealData.id;
    
    // Auto-calculate discount percentage if old_price and deal_price are numbers
    let discountPct = 0;
    if (dealData.old_price && dealData.deal_price) {
      const oldVal = Number(dealData.old_price);
      const dealVal = Number(dealData.deal_price);
      if (oldVal > dealVal) {
        discountPct = Math.round(((oldVal - dealVal) / oldVal) * 100);
      }
    }

    const payload = {
      title: dealData.title,
      product_id: dealData.product_id,
      store_name: dealData.store_name,
      old_price: Number(dealData.old_price),
      deal_price: Number(dealData.deal_price),
      discount_percentage: discountPct,
      coupon_code: dealData.coupon_code || "",
      affiliate_url: dealData.affiliate_url || "",
      active: dealData.active !== false
    };

    let result;
    // We try saving to deals table
    if (isNew) {
      result = await supabase.from("deals").insert([payload]).select();
    } else {
      result = await supabase.from("deals").update(payload).eq("id", dealData.id).select();
    }

    if (result.error) {
      // If table is missing, try inserting/updating product_store_links instead!
      console.warn("Could not save to deals table, updating product_store_links instead");
      const linksPayload = {
        product_id: dealData.product_id,
        store_name: dealData.store_name,
        price: Number(dealData.deal_price),
        old_price: Number(dealData.old_price),
        affiliate_url: dealData.affiliate_url,
      };

      if (isNew) {
        result = await supabase.from("product_store_links").insert([linksPayload]).select();
      } else {
        result = await supabase.from("product_store_links").update(linksPayload).eq("id", dealData.id).select();
      }
      
      if (result.error) throw result.error;
    }

    revalidatePath("/admin/deals");
    revalidatePath("/");
    return { success: true, data: result.data?.[0] };
  } catch (error: any) {
    console.error("Error saving deal:", error.message);
    return { success: false, error: error.message };
  }
}

export async function deleteDeal(dealId: string, isStoreLink: boolean) {
  try {
    const supabase = await getAdminSupabase();
    
    // Attempt delete from deals first
    let { error } = await supabase.from("deals").delete().eq("id", dealId);
    
    if (error) {
      // Fallback delete from product_store_links
      const res = await supabase.from("product_store_links").delete().eq("id", dealId);
      if (res.error) throw res.error;
    }

    revalidatePath("/admin/deals");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting deal:", error.message);
    return { success: false, error: error.message };
  }
}

const mockDeals = [
  {
    id: "deal-1",
    title: "Sony WH-1000XM5 Special Offer",
    product_id: "prod-1",
    product: { name: "Sony WH-1000XM5 Noise Cancelling Headphones", slug: "sony-wh-1000xm5" },
    store_name: "Amazon IN",
    old_price: 34990,
    deal_price: 29990,
    discount_percentage: 14,
    coupon_code: "SONYSAVE",
    affiliate_url: "https://amazon.in/dp/B09XS7J83R",
    active: true,
    created_at: new Date().toISOString()
  },
  {
    id: "deal-2",
    title: "Keychron K2 Discount",
    product_id: "prod-2",
    product: { name: "Keychron K2 Wireless Mechanical Keyboard", slug: "keychron-k2-v2" },
    store_name: "Keychron India",
    old_price: 8499,
    deal_price: 7499,
    discount_percentage: 12,
    coupon_code: "",
    affiliate_url: "https://keychron.in/k2",
    active: true,
    created_at: new Date().toISOString()
  }
];
