import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Memory } from "@/models/Memory";

// CORS helper
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

// OPTIONS — CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// GET — list all memories
export async function GET() {
  try {
    await connectDB();
    const memories = await Memory.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(memories, { headers: corsHeaders() });
  } catch (error) {
    console.error("GET /api/memories error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memories" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

// POST — create a memory
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();

    const { moments, imageUrls, imageAndInspiration } = body;

    const memory = await Memory.create({
      moments: moments || [],
      imageUrls: imageUrls || [],
      imageAndInspiration: imageAndInspiration || [],
    });

    return NextResponse.json(memory, {
      status: 201,
      headers: corsHeaders(),
    });
  } catch (error) {
    console.error("POST /api/memories error:", error);
    return NextResponse.json(
      { error: "Failed to create memory" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
