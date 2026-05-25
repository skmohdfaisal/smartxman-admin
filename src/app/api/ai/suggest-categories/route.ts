import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!name) {
      return NextResponse.json({ error: "Product name is required" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API Key missing. Please add NEXT_PUBLIC_GROQ_API_KEY to .env.local" }, { status: 400 });
    }

    const openai = new OpenAI({ 
      apiKey, 
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true 
    });
    
    const prompt = `Based on the following product name and description, recommend up to 2 Main Categories and up to 5 Sub Categories for an e-commerce website.
    
Available Main Categories: "Laptop Accessories", "Desk Setup / Productivity", "Tech Accessories", "Creator Setup", "Mobile Accessories", "Audio Gear", "Gaming Setup", "Student Essentials", "Work From Home", "Home Office", "Smart Gadgets / Lifestyle", "Travel Tech", "Budget Finds", "Daily Use Products"

Product Name: ${name}
Description: ${(description || "").substring(0, 2000)}

Output ONLY valid JSON in the exact following format:
{
  "mainCategories": ["string"],
  "subCategories": ["string"]
}`;
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content?.trim() || "{}";
    const data = JSON.parse(text);
    return NextResponse.json(data);

  } catch (error: any) {
    console.error("AI CATEGORY API ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
