import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const groqApiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

if (!supabaseUrl || !supabaseKey || !groqApiKey) {
  console.error("Missing env vars. Make sure NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and NEXT_PUBLIC_GROQ_API_KEY are set.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const openai = new OpenAI({ 
  apiKey: groqApiKey, 
  baseURL: "https://api.groq.com/openai/v1",
});

// Admin credentials
const email = "skmohdfaisal07@gmail.com";
const password = "123456";

const products = [
  {
    title: "STRIFF Multiport Adapter Hub for MacBook",
    url: "https://www.amazon.in/dp/B0CV7RMLWQ",
    asin: "B0CV7RMLWQ"
  },
  {
    title: "Zebronics TA200U Type C to USB Hub Aluminum Design",
    url: "https://www.amazon.in/dp/B0BBV62WMX",
    asin: "B0BBV62WMX"
  },
  {
    title: "Portronics Mport 11 USB C Docking Station",
    url: "https://www.amazon.in/dp/B0F73SVVZH",
    asin: "B0F73SVVZH"
  },
  {
    title: "Portronics Mport 31 4-in-1 USB Hub",
    url: "https://www.amazon.in/dp/B09M869Z5V",
    asin: "B09M869Z5V"
  },
  {
    title: "Amazon Basics USB-C Multiport Adapter Hub",
    url: "https://www.amazon.in/dp/B0CFLT45KH",
    asin: "B0CFLT45KH"
  }
];

async function generateProductData(product) {
  console.log(`Generating data for: ${product.title}`);
  const prompt = `You are an expert tech and lifestyle product reviewer. Based on the product name provided, generate a rich set of affiliate marketing metadata for this USB Hub / Docking Station. 
Respond ONLY with a valid JSON object. Do not include markdown formatting like \`\`\`json.
    
Product Name: ${product.title}
Category/Niche: Tech Accessories
Target Audience: Working Professionals, Students, Creators

Generate the following JSON structure:
{
  "brand": "The brand of the product",
  "description": "A clear, factual, and engaging product description (approx 2 paragraphs)",
  "price_range": "e.g., ₹1,995",
  "rating": 4.5,
  "audience": ["Students", "Gamers", "Creators", "Working Professionals"],
  "use_case": ["Study", "Gaming", "Content Creation", "Productivity", "Desk Setup"],
  "tags": ["wireless", "ergonomic", "productivity", "setup"],
  "budget_range": ["Under ₹3000", "Value Picks"],
  "expert_note": "A 2-sentence punchy expert opinion on why to buy this",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "buying_verdict": "A 1-sentence verdict on who should buy it",
  "smart_score": 8.5,
  "value_score": 9.0,
  "seo_title": "Optimized SEO title under 60 chars",
  "seo_description": "Optimized meta description under 160 chars"
}`;

  const completion = await openai.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.1-8b-instant",
    response_format: { type: "json_object" }
  });

  const text = completion.choices[0].message.content?.trim() || "{}";
  return JSON.parse(text);
}

async function uploadProducts() {
  console.log("Logging in...");
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    console.error("Login failed:", authError.message);
    return;
  }
  console.log("Logged in successfully.");

  for (const product of products) {
    try {
      const enrichedData = await generateProductData(product);
      
      const baseSlug = product.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const slug = `${baseSlug}-${product.asin.toLowerCase()}`;

      const payload = {
        name: product.title,
        slug,
        asin: product.asin,
        affiliate_url: product.url,
        source: 'amazon',
        marketplace: 'www.amazon.in',
        import_source: 'ai_auto',
        approval_status: 'needs_review',
        status: 'draft',
        brand: enrichedData.brand,
        description: enrichedData.description,
        price_range: enrichedData.price_range,
        rating: parseFloat(enrichedData.rating) || 0,
        audience: enrichedData.audience,
        use_case: enrichedData.use_case,
        tags: enrichedData.tags,
        budget_range: enrichedData.budget_range,
        expert_note: enrichedData.expert_note,
        pros: enrichedData.pros,
        cons: enrichedData.cons,
        buying_verdict: enrichedData.buying_verdict,
        smart_score: enrichedData.smart_score,
        value_score: enrichedData.value_score,
        seo_title: enrichedData.seo_title,
        seo_description: enrichedData.seo_description,
      };

      const { error } = await supabase.from('products').insert([payload]);

      if (error) {
        console.error(`Failed to insert ${product.title}:`, error.message);
      } else {
        console.log(`Successfully uploaded: ${product.title}`);
      }
    } catch (e) {
      console.error(`Error processing ${product.title}:`, e);
    }
    
    // Slight delay to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

uploadProducts();
