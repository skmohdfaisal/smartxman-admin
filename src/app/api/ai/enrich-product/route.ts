import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { title, category, budget, audience } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!title) {
      return NextResponse.json({ error: "Product title is required for AI enrichment" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API Key missing. Please add NEXT_PUBLIC_GROQ_API_KEY to .env.local" }, { status: 400 });
    }

    const openai = new OpenAI({ 
      apiKey, 
      baseURL: "https://api.groq.com/openai/v1",
    });
    
    const prompt = `You are an expert tech and lifestyle product reviewer. Based on the product name provided, generate a rich set of affiliate marketing metadata. 
Respond ONLY with a valid JSON object. Do not include markdown formatting like \`\`\`json.
    
Product Name: ${title}
Category/Niche: ${category || 'General'}
Target Audience: ${audience || 'General Consumers'}
Budget Tier: ${budget || 'Average'}

Generate the following JSON structure:
{
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
      model: "llama-3.1-8b-instant", // Using an available Groq model
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content?.trim() || "{}";
    const data = JSON.parse(text);
    
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("AI Enrich Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
