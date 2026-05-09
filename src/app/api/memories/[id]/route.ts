import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { Memory } from "@/models/Memory";
import { S3Client, DeleteObjectsCommand } from "@aws-sdk/client-s3";

function getS3Client() {
  return new S3Client({
    region: process.env.LOK_AWS_REGION || "ap-east-1",
    credentials: {
      accessKeyId: process.env.LOK_AWS_ACCESS_KEY!,
      secretAccessKey: process.env.LOK_AWS_ACCESS_SECRET!,
    },
  });
}

function extractS3Key(url: string): string | null {
  try {
    const u = new URL(url);
    // Path starts with "/" — strip it for S3 key
    return u.pathname.slice(1);
  } catch {
    return null;
  }
}

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

// DELETE — remove a memory and its S3 objects
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

    // Collect all image URLs and extract S3 keys
    const allUrls = [
      ...(memory.imageUrls || []),
      ...(memory.imageAndInspiration || []).map((i) => i.imageUrl),
    ];

    const keys = allUrls
      .map(extractS3Key)
      .filter((k): k is string => k !== null && k.length > 0);

    // Batch delete from S3 (fire-and-forget — don't block the response)
    if (keys.length > 0) {
      const s3 = getS3Client();
      s3.send(
        new DeleteObjectsCommand({
          Bucket: process.env.LOK_AWS_S3_BUCKET!,
          Delete: { Objects: keys.map((Key) => ({ Key })), Quiet: true },
        }),
      ).catch((err) => {
        console.error("S3 delete error (non-fatal):", err);
      });
    }

    return NextResponse.json(
      { message: "Deleted", s3KeysRemoved: keys.length },
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
