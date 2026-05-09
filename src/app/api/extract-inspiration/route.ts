import { NextRequest, NextResponse } from "next/server";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-4-26b-a4b-it";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

interface ImageInspiration {
  imageUrl: string;
  description: string;
  inspiration: string;
}

export async function POST(req: NextRequest) {
  try {
    const { imageUrls } = await req.json();

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { error: "imageUrls array is required" },
        { status: 400, headers: corsHeaders() },
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENROUTER_API_KEY not configured" },
        { status: 500, headers: corsHeaders() },
      );
    }

    const results: ImageInspiration[] = [];

    // Process each image sequentially for reliability
    for (const imageUrl of imageUrls) {
      try {
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
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "image_url",
                    image_url: { url: imageUrl },
                  },
                  {
                    type: "text",
                    text: `You are creating a memory book for an elderly person. Look at this photo carefully.

Respond ONLY with valid JSON in this exact format (no markdown, no code fences):
{
  "description": "A factual description of who and what is in the photo, the setting, clothing, objects, and what is visibly happening. 2-4 sentences.",
  "inspiration": "A warm, reflective insight inspired by this moment — what it teaches us about life, love, family, time, or human connection. Written as a short poetic reflection from the elderly person's perspective. 2-3 sentences."
}`,
                  },
                ],
              },
            ],
            max_tokens: 500,
            temperature: 0.7,
            response_format: { type: "json_object" },
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`OpenRouter error for image ${imageUrl}:`, errText);
          // Add a fallback entry rather than failing everything
          results.push({
            imageUrl,
            description: "",
            inspiration: "",
          });
          continue;
        }

        const data = await response.json();
        const rawContent: string =
          data.choices?.[0]?.message?.content || "{}";

        // Parse JSON from response (handle potential markdown wrapping)
        let parsed: { description?: string; inspiration?: string };
        try {
          const jsonStr = rawContent
            .replace(/```json\s*/gi, "")
            .replace(/```\s*/g, "")
            .trim();
          parsed = JSON.parse(jsonStr);
        } catch {
          // Fallback: try to extract from raw text
          const descMatch = rawContent.match(/"description"\s*:\s*"([^"]*)"/);
          const inspMatch = rawContent.match(/"inspiration"\s*:\s*"([^"]*)"/);
          parsed = {
            description: descMatch?.[1] || "",
            inspiration: inspMatch?.[1] || "",
          };
        }

        results.push({
          imageUrl,
          description: parsed.description || "",
          inspiration: parsed.inspiration || "",
        });
      } catch (err) {
        console.error(`Error processing image ${imageUrl}:`, err);
        results.push({
          imageUrl,
          description: "",
          inspiration: "",
        });
      }
    }

    return NextResponse.json(
      { imageAndInspiration: results },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("Extract inspiration error:", error);
    return NextResponse.json(
      { error: "Failed to extract inspiration" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
