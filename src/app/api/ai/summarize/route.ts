import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!url) return NextResponse.json({ error: "URL is required" }, { status: 400 });
    if (!apiKey) return NextResponse.json({ error: "Groq API Key missing. Please add NEXT_PUBLIC_GROQ_API_KEY to .env.local" }, { status: 400 });

    const jinaUrl = `https://r.jina.ai/${url}`;
    let pageContent = "";
    try {
      const jinaRes = await fetch(jinaUrl);
      pageContent = await jinaRes.text();
    } catch (e) { console.error(e); }

    if (!pageContent || pageContent.length < 100) {
      throw new Error("Could not read product page.");
    }

    const openai = new OpenAI({ 
      apiKey, 
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true 
    });
    
    console.log(`Trying model: llama-3.1-8b-instant`);
    const prompt = `Return ONLY a JSON object: { "name": "...", "description": "...", "expert_note": "...", "price": "..." } for this product data: ${pageContent.substring(0, 10000)}`;
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0].message.content || "{}";
    const cleanJson = text.replace(/```json/g, "").replace(/```/g, "").trim();
    return NextResponse.json(JSON.parse(cleanJson));

  } catch (error: any) {
    console.error("SDK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
