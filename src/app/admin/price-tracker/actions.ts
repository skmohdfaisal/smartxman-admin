"use server";

import { getAdminSupabase } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * Update product price manually, and record price history.
 */
export async function updateProductPrice(
  productId: string,
  currentPrice: number | null,
  oldPrice: number | null,
  usePreviousAsOld: boolean
) {
  try {
    const supabase = await getAdminSupabase();

    // 1. Get the current product price
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("current_price, currency")
      .eq("id", productId)
      .single();

    if (fetchError) throw fetchError;

    const previousPrice = product.current_price !== null ? Number(product.current_price) : null;
    const finalOldPrice = usePreviousAsOld ? previousPrice : oldPrice;

    // 2. Perform the update
    const { error: updateError } = await supabase
      .from("products")
      .update({
        current_price: currentPrice,
        old_price: finalOldPrice,
        price_is_fresh: true,
        last_price_checked_at: new Date().toISOString(),
        price_source: "manual"
      })
      .eq("id", productId);

    if (updateError) throw updateError;

    // 3. Write to price history
    const { error: historyError } = await supabase
      .from("price_history")
      .insert([
        {
          product_id: productId,
          old_price: previousPrice,
          new_price: currentPrice || 0,
          currency: product.currency || "INR",
          source: "manual",
          note: "Price manually updated via tracker modal"
        }
      ]);

    if (historyError) {
      console.warn("Failed to write price history:", historyError.message);
    }

    revalidatePath("/admin/price-tracker");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating price:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk action: Mark selected products as checked today.
 */
export async function markCheckedTodayBulk(productIds: string[]) {
  try {
    const supabase = await getAdminSupabase();

    // 1. Select currently saved pricing details for history mapping
    const { data: products } = await supabase
      .from("products")
      .select("id, current_price, currency")
      .in("id", productIds);

    // 2. Update products table
    const { error: updateError } = await supabase
      .from("products")
      .update({
        price_is_fresh: true,
        last_price_checked_at: new Date().toISOString(),
        price_source: "manual"
      })
      .in("id", productIds);

    if (updateError) throw updateError;

    // 3. Write to history for products that already had pricing values
    if (products && products.length > 0) {
      const historyRows = products
        .filter(p => p.current_price !== null && p.current_price !== undefined)
        .map(p => ({
          product_id: p.id,
          old_price: Number(p.current_price),
          new_price: Number(p.current_price),
          currency: p.currency || "INR",
          source: "manual",
          note: "Marked checked today via tracker bulk action"
        }));

      if (historyRows.length > 0) {
        await supabase.from("price_history").insert(historyRows);
      }
    }

    revalidatePath("/admin/price-tracker");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Bulk mark checked error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk action: Hide selected prices.
 */
export async function hidePricesBulk(productIds: string[]) {
  try {
    const supabase = await getAdminSupabase();

    const { error } = await supabase
      .from("products")
      .update({ price_is_fresh: false })
      .in("id", productIds);

    if (error) throw error;

    revalidatePath("/admin/price-tracker");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Bulk hide price error:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Bulk action: Set selected products as needs update.
 */
export async function setNeedsUpdateBulk(productIds: string[]) {
  try {
    const supabase = await getAdminSupabase();

    // Resetting price_is_fresh to false or clearing last_price_checked_at makes it need update
    const { error } = await supabase
      .from("products")
      .update({
        last_price_checked_at: null,
        price_is_fresh: false
      })
      .in("id", productIds);

    if (error) throw error;

    revalidatePath("/admin/price-tracker");
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    console.error("Bulk set needs update error:", error);
    return { success: false, error: error.message };
  }
}
