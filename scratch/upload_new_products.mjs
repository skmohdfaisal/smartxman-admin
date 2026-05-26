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
    title: "Happi Planet Multi-Surface Cleaning Liquid",
    url: "https://www.amazon.in/Happi-Planet-Multi-Surface-Cleaning-Bathroom/dp/B0GPN9R146/ref=zg_bs_c_home-improvement_d_sccl_1/522-7730179-6432810?pd_rd_w=B6fMo&content-id=amzn1.sym.b908f532-cbe7-4274-8b24-b671acc58bd2&pf_rd_p=b908f532-cbe7-4274-8b24-b671acc58bd2&pf_rd_r=1BBEN6EG94APYAMG3M8K&pd_rd_wg=onSGQ&pd_rd_r=cb7cac64-d1f2-4f19-bed1-60621f4cae80&pd_rd_i=B0GPN9R146&th=1",
    asin: "B0GPN9R146"
  },
  {
    title: "Casio Vintage Digital Grey Watch A158WA-1Q",
    url: "https://www.amazon.in/Casio-Vintage-Digital-Grey-Watch-A158WA-1Q/dp/B000GAYQJ0/ref=zg_bs_c_watches_d_sccl_2/522-7730179-6432810?pd_rd_w=ec6L0&content-id=amzn1.sym.b908f532-cbe7-4274-8b24-b671acc58bd2&pf_rd_p=b908f532-cbe7-4274-8b24-b671acc58bd2&pf_rd_r=1F32A88H88AA10NHYY61&pd_rd_wg=uetyt&pd_rd_r=6841163c-5ec9-427d-ac25-11265caf15f6&pd_rd_i=B000GAYQJ0&psc=1",
    asin: "B000GAYQJ0"
  },
  {
    title: "Lenovo i5-13450HX Laptop 83DV018MIN",
    url: "https://www.amazon.in/Lenovo-i5-13450HX-Refresh-Windows-83DV018MIN/dp/B0GVD8MRQ2/ref=pd_rhf_ee_s_pd_sbs_rvi_d_sccl_1_6/522-7730179-6432810?pd_rd_w=E38Ap&content-id=amzn1.sym.ed04a9b6-f1e8-467f-8e81-e050db1b5151&pf_rd_p=ed04a9b6-f1e8-467f-8e81-e050db1b5151&pf_rd_r=S5J26S8GDVZXAXQGA6MM&pd_rd_wg=xx6Hj&pd_rd_r=7004361c-63c0-44ae-8689-91548e97a0db&pd_rd_i=B0GVD8MRQ2&psc=1",
    asin: "B0GVD8MRQ2"
  }
];

async function generateProductData(product) {
  console.log(`Generating data for: ${product.title}`);
  const prompt = `You are an expert product reviewer. Based on the product name provided, generate a rich set of affiliate marketing metadata for this product. Make it highly SEO optimized.
Respond ONLY with a valid JSON object. Do not include markdown formatting like \`\`\`json.
    
Product Name: ${product.title}

Generate the following JSON structure:
{
  "brand": "The brand of the product",
  "sub_category": "Comma separated specific sub-categories like 'Cleaning Supplies', 'Digital Watch', or 'Gaming Laptop'",
  "description": "A clear, factual, and engaging product description (approx 2 paragraphs)",
  "price_range": "e.g., ₹1,995",
  "rating": 4.5,
  "audience": ["Students", "Gamers", "Creators", "Working Professionals", "Everyday Buyers"],
  "use_case": ["Study", "Gaming", "Content Creation", "Productivity", "Desk Setup", "Lifestyle", "Home"],
  "tags": ["tag1", "tag2", "tag3"],
  "budget_range": ["Under ₹3000", "Premium", "Value Picks"],
  "expert_note": "A 2-sentence punchy expert opinion on why to buy this",
  "pros": ["Pro 1", "Pro 2", "Pro 3"],
  "cons": ["Con 1", "Con 2"],
  "buying_verdict": "A 1-sentence verdict on who should buy it",
  "smart_score": 8.5,
  "value_score": 9.0,
  "seo_title": "Highly Optimized SEO title under 60 chars",
  "seo_description": "Highly Optimized meta description under 160 chars"
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
        sub_category: enrichedData.sub_category,
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
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

uploadProducts();
