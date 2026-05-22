import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Function to extract ASIN from various Amazon URL formats
    const extractASIN = (amazonUrl: string): string | null => {
      // 1. Match standard /dp/ASIN or /gp/product/ASIN or /product-name/dp/ASIN
      const standardRegex = /(?:\/dp\/|\/gp\/product\/|\/exec\/obidos\/asin\/|\/o\/asin\/)([A-Z0-9]{10})(?:[/?]|$)/i;
      const standardMatch = amazonUrl.match(standardRegex);
      if (standardMatch) return standardMatch[1];

      // 2. Match shortened URLs like amzn.in/d/ASIN or amzn.to/ASIN
      // Note: Usually amzn.to/xxxx is a redirect to a full URL.
      // But amzn.in/d/xxxx often contains an ASIN if it's not a shortlink, though usually it's a short hash.
      // For shortlinks, we'd theoretically need to follow the redirect. 
      // For now, let's catch standard ASIN formats in the path.
      const directAsinRegex = /\/([A-Z0-9]{10})(?:[/?]|$)/i;
      const directMatch = amazonUrl.match(directAsinRegex);
      
      // We only return it if it looks like a 10-character alphanumeric ASIN starting with B or numbers
      if (directMatch && /^[B0-9][A-Z0-9]{9}$/i.test(directMatch[1])) {
        return directMatch[1].toUpperCase();
      }

      return null;
    };

    const asin = extractASIN(url);

    if (!asin) {
      return NextResponse.json({ 
        error: "Could not extract ASIN from the provided URL. Please ensure it is a valid Amazon product link." 
      }, { status: 400 });
    }

    // Check if PA-API is configured
    const isConfigured = !!process.env.AMAZON_ACCESS_KEY && !!process.env.AMAZON_SECRET_KEY;

    if (!isConfigured) {
      return NextResponse.json({
        asin,
        status: "not_configured",
        message: "Amazon API is not configured. Please fill product details manually."
      });
    }

    // TODO: Implement actual Amazon PA-API call here when credentials are provided
    // This is where you would use amazon-paapi or a similar library to fetch real data.
    
    return NextResponse.json({
      asin,
      status: "success",
      data: {
        name: "",
        brand: "",
        image: "",
        price: "",
        rating: "",
        availability: ""
      }
    });

  } catch (error: any) {
    console.error("Amazon fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch Amazon data" }, { status: 500 });
  }
}
