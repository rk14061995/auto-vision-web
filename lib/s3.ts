import "server-only"

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { randomUUID } from "crypto"

const s3 = new S3Client({
  region: process.env.AWS_REGION ?? "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  },
})

const BUCKET = process.env.AWS_S3_BUCKET ?? ""

export async function uploadVideoToS3(
  buffer: Buffer,
  originalName: string,
  mimeType: string,
): Promise<string> {
  if (!BUCKET) throw new Error("AWS_S3_BUCKET not configured")

  const ext = originalName.split(".").pop() ?? "mp4"
  const key = `ads/videos/${randomUUID()}.${ext}`

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
      CacheControl: "public, max-age=31536000",
    }),
  )

  return `https://${BUCKET}.s3.${process.env.AWS_REGION ?? "ap-south-1"}.amazonaws.com/${key}`
}
