import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Memory } from "@/models/Memory";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders() });
}

// GET — single memory
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const memory = await Memory.findById(id).lean();

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    return NextResponse.json(memory, { headers: corsHeaders() });
  } catch (error) {
    console.error("GET /api/memories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch memory" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

// PUT — update a memory
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const memory = await Memory.findByIdAndUpdate(id, body, {
      new: true,
      runValidators: true,
    }).lean();

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    return NextResponse.json(memory, { headers: corsHeaders() });
  } catch (error) {
    console.error("PUT /api/memories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update memory" },
      { status: 500, headers: corsHeaders() },
    );
  }
}

// DELETE — remove a memory
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const { id } = await params;
    const memory = await Memory.findByIdAndDelete(id);

    if (!memory) {
      return NextResponse.json(
        { error: "Memory not found" },
        { status: 404, headers: corsHeaders() },
      );
    }

    return NextResponse.json(
      { message: "Deleted" },
      { headers: corsHeaders() },
    );
  } catch (error) {
    console.error("DELETE /api/memories/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete memory" },
      { status: 500, headers: corsHeaders() },
    );
  }
}
