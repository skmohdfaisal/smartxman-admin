import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // In development, redirect to the local development server
  if (process.env.NODE_ENV === "development") {
    return NextResponse.redirect("http://localhost:3000");
  }

  const primaryUrl = process.env.NEXT_PUBLIC_STORE_URL || "https://smartxman.com";
  const fallbackUrl = "https://smartxman.vercel.app";

  try {
    // Attempt to fetch the primary URL with a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 seconds timeout

    // We use HEAD method to just check if the server responds without downloading the full body
    const response = await fetch(primaryUrl, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return NextResponse.redirect(primaryUrl);
    } else {
      console.warn(`Primary URL ${primaryUrl} responded with status ${response.status}. Falling back to ${fallbackUrl}`);
      return NextResponse.redirect(fallbackUrl);
    }
  } catch (error) {
    console.error(`Error checking primary URL ${primaryUrl}:`, error);
    // If fetch fails (e.g., DNS error, timeout, network error), redirect to fallback
    return NextResponse.redirect(fallbackUrl);
  }
}
