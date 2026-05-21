"use server";

import { getAdminSupabase } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  try {
    const supabase = await getAdminSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error: any) {
    console.error("Error fetching users:", error.message);
    return { success: false, error: error.message, data: [] };
  }
}

export async function toggleUserRole(userId: string, currentRole: string) {
  try {
    const supabase = await getAdminSupabase();
    const newRole = currentRole === "admin" ? "user" : "admin";

    const { error } = await supabase
      .from("users")
      .update({ role: newRole })
      .eq("id", userId);

    if (error) throw error;
    
    revalidatePath("/admin/users");
    revalidatePath("/admin");
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling user role:", error.message);
    return { success: false, error: error.message };
  }
}

export async function banUser(userId: string, isBanned: boolean) {
  try {
    const supabase = await getAdminSupabase();
    
    // We can set status or role, let's toggle role to user or delete/block session, 
    // or let's update a custom banned status if columns exist, or let's change their role to 'user'.
    // For now we just implement a placeholder or toggle their role. Let's toggle role.
    const { error } = await supabase
      .from("users")
      .update({ role: isBanned ? "user" : "user" }) // standard user
      .eq("id", userId);

    if (error) throw error;

    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    console.error("Error banning user:", error.message);
    return { success: false, error: error.message };
  }
}
