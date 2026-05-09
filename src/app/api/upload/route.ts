import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { NextRequest, NextResponse } from "next/server";
import { s3Client, S3_BUCKET, CDN_BASE } from "@/lib/s3";

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const key = `uploads/${Date.now()}-${safeFileName}`;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: S3_BUCKET,
      Key: key,
      Conditions: [
        ["content-length-range", 0, 100 * 1024 * 1024], // 100MB max
      ],
      Fields: {
        "Content-Type": fileType,
      },
      Expires: 300, // 5 minutes
    });

    const cdnUrl = CDN_BASE ? `${CDN_BASE}/${key}` : undefined;

    return NextResponse.json({ url, fields, key, cdnUrl });
  } catch (error) {
    console.error("Presigned POST error:", error);
    return NextResponse.json(
      { error: "Failed to generate upload URL" },
      { status: 500 }
    );
  }
}
