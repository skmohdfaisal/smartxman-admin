import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function checkAdmin() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            // Ignore in Server Components
          }
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect("/auth");
  }

  // Auto-promote the owner to admin to prevent lockout
  const ownerEmail = "skmohdfaisal07@gmail.com";
  if (session.user.email === ownerEmail) {
    const { data: currentProfile } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!currentProfile || currentProfile.role !== "admin") {
      console.log(`[Auth] Auto-promoting ${ownerEmail} to admin`);
      await supabase
        .from("users")
        .update({ role: "admin" })
        .eq("id", session.user.id);
    }
  }

  const { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (error || !profile || profile.role !== "admin") {
    redirect("/admin/access-denied");
  }

  return { supabase, session, user: session.user };
}

export async function getAdminSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (e) {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
