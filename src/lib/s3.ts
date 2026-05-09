import { S3Client } from "@aws-sdk/client-s3";

export const s3Client = new S3Client({
  region: process.env.LOK_AWS_REGION || "ap-east-1",
  credentials: {
    accessKeyId: process.env.LOK_AWS_ACCESS_KEY!,
    secretAccessKey: process.env.LOK_AWS_ACCESS_SECRET!,
  },
});

export const S3_BUCKET = process.env.LOK_AWS_S3_BUCKET!;
export const CDN_BASE = process.env.LOK_CDN_BASE;
