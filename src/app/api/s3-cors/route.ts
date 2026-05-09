import { NextResponse } from "next/server";
import {
  S3Client,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";

// One-time endpoint to apply CORS configuration to the S3 bucket.
// Call: POST /api/s3-cors
// This allows browsers to display images from S3 without CORS errors.

export async function POST() {
  try {
    const s3 = new S3Client({
      region: process.env.LOK_AWS_REGION || "ap-east-1",
      credentials: {
        accessKeyId: process.env.LOK_AWS_ACCESS_KEY!,
        secretAccessKey: process.env.LOK_AWS_ACCESS_SECRET!,
      },
    });

    const command = new PutBucketCorsCommand({
      Bucket: process.env.LOK_AWS_S3_BUCKET!,
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT", "POST"],
            AllowedOrigins: ["*"],
            ExposeHeaders: ["ETag"],
            MaxAgeSeconds: 3600,
          },
        ],
      },
    });

    await s3.send(command);

    return NextResponse.json({ success: true, message: "S3 CORS configured" });
  } catch (error) {
    console.error("S3 CORS error:", error);
    return NextResponse.json(
      { error: "Failed to configure S3 CORS" },
      { status: 500 },
    );
  }
}
