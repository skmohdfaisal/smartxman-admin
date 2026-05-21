import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;

    if (!name || !description) {
      return NextResponse.json({ error: "Product name and description are required" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ error: "Groq API Key missing. Please add NEXT_PUBLIC_GROQ_API_KEY to .env.local" }, { status: 400 });
    }

    const openai = new OpenAI({ 
      apiKey, 
      baseURL: "https://api.groq.com/openai/v1",
      dangerouslyAllowBrowser: true 
    });
    
    console.log(`Trying model: llama-3.1-8b-instant for expert note`);
    const prompt = `Based on the following product name and description, write a short, punchy expert note (max 2 sentences) explaining why this product is recommended or its best use case. Do not use quotes around the note.\n\nProduct Name: ${name}\n\nDescription: ${description.substring(0, 3000)}`;
    
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-8b-instant"
    });

    const text = completion.choices[0].message.content?.trim() || "";
    return NextResponse.json({ expertNote: text });

  } catch (error: any) {
    console.error("SDK ERROR:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
