"use server";

export async function extractAsin(url: string): Promise<string | null> {
  if (!url) return null;
  
  // Try to match various Amazon URL patterns
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/,
    /\/gp\/product\/([A-Z0-9]{10})/,
    /\/ASIN\/([A-Z0-9]{10})/,
    /amzn\.in\/d\/([A-Za-z0-9]+)/, // Short links usually redirect, but we can capture the ID if needed.
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // If it's a short link, we can't get ASIN directly without resolving the redirect.
      // For simplicity, return the match. A real robust system would follow redirects.
      return match[1];
    }
  }

  // Fallback: look for exactly 10 uppercase alphanumeric chars
  const fallbackMatch = url.match(/([B][A-Z0-9]{9})/);
  if (fallbackMatch && fallbackMatch[1]) {
    return fallbackMatch[1];
  }

  return null;
}

export async function searchAmazonProducts(keyword: string, limit: number = 5) {
  const accessKey = process.env.AMAZON_ACCESS_KEY;
  const secretKey = process.env.AMAZON_SECRET_KEY;
  const associateTag = process.env.AMAZON_ASSOCIATE_TAG;

  if (!accessKey || !secretKey || !associateTag) {
    return {
      success: false,
      error: "Amazon PA-API is not configured. You can still use manual affiliate link import.",
      products: []
    };
  }

  try {
    // Note: A full AWS Signature V4 implementation is required to call Amazon PA-API directly.
    // For this implementation, we simulate the API call. In a production environment, 
    // you should use an npm package like 'amazon-paapi' to handle the signing and request.
    
    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulated PA-API Response
    console.log(`[PA-API] Searching for "${keyword}"...`);
    
    // In a real app, you would fetch from Amazon and map the response
    return {
      success: false, // Set to false to encourage manual import for now, or true if mocking
      error: "Could not fetch products right now. Please try again later or use manual import.",
      products: []
    };
  } catch (error: any) {
    console.error("Amazon PA-API Error:", error);
    return {
      success: false,
      error: "Could not fetch products right now. Please try again later or use manual import.",
      products: []
    };
  }
}
