import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-4-26b-a4b-it";

export async function POST(req: NextRequest) {
  try {
    const { imageUrls } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "imageUrls array is required" },
        { status: 400 },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500 },
      );
    }

    const content: Array<Record<string, unknown>> = [
      {
        type: "text",
        text: `You are a compassionate memory keeper. Look at these photos and extract the memories they hold.

For each photo, write one or more memory moments. A "moment" is a short, vivid recollection — like a paragraph in a memory book.

Your response MUST use this exact format:

MOMENTS:
[First moment — describe who/what/where, the emotions, and the story in 2-4 sentences. Write from the perspective of the elderly person reminiscing.]
---
[Second moment — another distinct memory from the photos]
---
[Continue for each moment...]

FULL NARRATIVE:
[Combine all moments into a flowing narrative, also in first-person. This is the complete memory text for the book.]

Rules:
- Write in first-person as the elderly person ("I remember when...", "This was the day we...")
- Each moment should be a distinct, standalone memory
- Be warm, specific, and human — focus on feelings and relationships
- Do NOT say "Here are the memories" or similar preambles`,
      },
    ];

    for (const url of imageUrls) {
      content.push({
        type: "image_url",
        image_url: { url },
      });
    }

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "Life Book",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content }],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter error:", err);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 502 },
      );
    }

    const data = await response.json();
    const rawText: string = data.choices?.[0]?.message?.content || "";

    // Parse moments and narrative from the response
    const momentsMatch = rawText.match(/MOMENTS:\s*([\s\S]*?)(?=FULL NARRATIVE:|$)/i);
    const narrativeMatch = rawText.match(/FULL NARRATIVE:\s*([\s\S]*)/i);

    const moments = momentsMatch
      ? momentsMatch[1]
          .split("---")
          .map((s) => s.trim())
          .filter(Boolean)
      : rawText
          .split("\n\n")
          .filter((s) => s.trim().length > 20);

    const narrative = narrativeMatch
      ? narrativeMatch[1].trim()
      : rawText.trim();

    return NextResponse.json({ moments, narrative });
  } catch (error) {
    console.error("Extract memories error:", error);
    return NextResponse.json(
      { error: "Failed to extract memories" },
      { status: 500 },
    );
  }
}
