import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getR2Client() {
  const accountId = process.env.CF_ACCOUNT_ID;
  const accessKeyId = process.env.CF_ACCESS_KEY_ID;
  const secretAccessKey = process.env.CF_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error("Cloudflare R2 is not configured");
  }

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
}

export async function createUploadUrl(input: { userId: string; filename: string; type: string }) {
  const bucket = process.env.CF_R2_BUCKET;
  if (!bucket) {
    throw new Error("CF_R2_BUCKET is not configured");
  }

  const key = `${input.userId}/${crypto.randomUUID()}-${input.filename}`;
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    ContentType: input.type,
  });
  const url = await getSignedUrl(getR2Client(), command, { expiresIn: 60 * 5 });

  return { key, url };
}
