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

  // Fetch profile once safely
  let { data: profile, error } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle();

  // Auto-promote the owner to admin to prevent lockout
  const ownerEmail = "skmohdfaisal07@gmail.com";
  if (session.user.email === ownerEmail) {
    if (!profile || profile.role !== "admin") {
      console.log(`[Auth] Auto-promoting ${ownerEmail} to admin`);
      await supabase
        .from("users")
        .upsert({ 
          id: session.user.id, 
          email: session.user.email, 
          role: "admin",
          updated_at: new Date().toISOString()
        });
      
      profile = { role: "admin" };
      error = null;
    }
  }

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
